import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "vibe2026-media";
export const R2_PUBLIC_DEV_URL =
  process.env.R2_PUBLIC_DEV_URL || "https://pub-e9103c967e9241e0bfb1c3a609d92723.r2.dev";
export const STORAGE_BUCKET = R2_BUCKET;

export interface SignedUploadUrlResult {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  token?: string;
}

export function getMediaPublicUrl(objectKey: string): string {
  const cleanKey = objectKey.replace(/^\/+/, "");
  return `${R2_PUBLIC_DEV_URL}/${cleanKey}`;
}

/**
 * Uploads media with automated tier-fallback:
 * 1. Cloudflare R2 S3 API (if R2_ACCESS_KEY_ID & R2_SECRET_ACCESS_KEY configured in Vercel/env)
 * 2. Cloudflare Wrangler CLI (in local dev with authenticated session)
 * 3. Supabase Storage 'Vibe Bucket' (live fallback on Vercel)
 * 4. Data URL (fail-safe fallback)
 */
export async function uploadMediaFile(
  objectKey: string,
  fileContent: Buffer | ArrayBuffer | Uint8Array | Blob,
  contentType: string
): Promise<{ path: string; publicUrl: string }> {
  const cleanKey = objectKey.replace(/^\/+/, "");
  const defaultPublicUrl = getMediaPublicUrl(cleanKey);

  // If running in test environment
  if (process.env.NODE_ENV === "test") {
    return { path: cleanKey, publicUrl: defaultPublicUrl };
  }

  // Convert input content to Buffer
  let buffer: Buffer;
  if (Buffer.isBuffer(fileContent)) {
    buffer = fileContent;
  } else if (fileContent instanceof ArrayBuffer) {
    buffer = Buffer.from(fileContent);
  } else if (fileContent instanceof Uint8Array) {
    buffer = Buffer.from(fileContent);
  } else if (typeof (fileContent as any)?.arrayBuffer === "function") {
    const ab = await (fileContent as Blob).arrayBuffer();
    buffer = Buffer.from(ab);
  } else {
    buffer = Buffer.from(fileContent as any);
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  // 1. Try Direct S3 Client (Cloudflare R2 on Vercel)
  if (accountId && accessKeyId && secretAccessKey) {
    try {
      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: cleanKey,
          Body: buffer,
          ContentType: contentType || "application/octet-stream",
        })
      );

      return { path: cleanKey, publicUrl: defaultPublicUrl };
    } catch (s3Err) {
      console.warn("[R2 S3 Upload Failed, attempting fallback]:", s3Err);
    }
  }

  // 2. Try Wrangler CLI (Local Dev Environment)
  if (process.env.VERCEL !== "1" && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      const tmpFile = path.join(
        os.tmpdir(),
        `r2-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.tmp`
      );
      await fs.promises.writeFile(tmpFile, buffer);

      const isWindows = process.platform === "win32";
      const cmd = isWindows ? "npx.cmd" : "npx";

      const success = await new Promise<boolean>((resolve) => {
        execFile(
          cmd,
          [
            "wrangler",
            "r2",
            "object",
            "put",
            `${R2_BUCKET}/${cleanKey}`,
            "--file",
            tmpFile,
            "--content-type",
            contentType || "application/octet-stream",
            "--remote",
          ],
          { shell: true, timeout: 35000 },
          (err) => {
            resolve(!err);
          }
        );
      });

      try {
        await fs.promises.unlink(tmpFile);
      } catch {}

      if (success) {
        return { path: cleanKey, publicUrl: defaultPublicUrl };
      }
    } catch (wranglerErr) {
      console.warn("[R2 Wrangler Upload Failed, attempting fallback]:", wranglerErr);
    }
  }

  // 3. Fallback to Supabase Storage ('Vibe Bucket')
  if (isUsingLiveSupabase() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from("Vibe Bucket")
        .upload(cleanKey, buffer, {
          upsert: true,
          contentType: contentType || "image/jpeg",
        });

      if (data && !error) {
        const { data: pubData } = supabaseAdmin.storage
          .from("Vibe Bucket")
          .getPublicUrl(data.path);
        return { path: cleanKey, publicUrl: pubData.publicUrl };
      }
      if (error) {
        console.warn("[Supabase Storage Upload Error]:", error.message);
      }
    } catch (supaErr) {
      console.warn("[Supabase Storage Exception]:", supaErr);
    }
  }

  // 4. Fail-safe Data URL fallback
  return {
    path: cleanKey,
    publicUrl: `data:${contentType || "image/jpeg"};base64,${buffer.toString("base64")}`,
  };
}

export async function deleteMediaFile(objectKeys: string[]): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (accountId && accessKeyId && secretAccessKey) {
    try {
      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      for (const key of objectKeys) {
        const cleanKey = key.replace(/^\/+/, "");
        await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: cleanKey }));
      }
      return;
    } catch {}
  }

  // Supabase delete fallback
  if (isUsingLiveSupabase() && supabaseAdmin) {
    try {
      await supabaseAdmin.storage.from("Vibe Bucket").remove(objectKeys);
    } catch {}
  }
}

export async function createPresignedUploadUrl(
  eventSlug: string,
  category: "avatars" | "experiences" | "rewards" | "sponsors" | "banners" | "posts",
  fileName: string,
  _mimeType: string,
  _maxSizeBytes = 10 * 1024 * 1024
): Promise<SignedUploadUrlResult> {
  const extension = fileName.split(".").pop() || "bin";
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const objectKey = `events/${eventSlug}/${category}/${uniqueId}.${extension}`;
  const publicUrl = getMediaPublicUrl(objectKey);

  return {
    uploadUrl: `/api/media/upload?key=${encodeURIComponent(objectKey)}`,
    objectKey,
    publicUrl,
  };
}
