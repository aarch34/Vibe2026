import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

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

export async function uploadMediaFile(
  objectKey: string,
  fileContent: Buffer | ArrayBuffer | Uint8Array | Blob,
  contentType: string
): Promise<{ path: string; publicUrl: string }> {
  const cleanKey = objectKey.replace(/^\/+/, "");
  const publicUrl = getMediaPublicUrl(cleanKey);

  // If running in test environment or mock
  if (process.env.NODE_ENV === "test") {
    return { path: cleanKey, publicUrl };
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

  // Write to temp file for wrangler R2 upload
  const tmpFile = path.join(os.tmpdir(), `r2-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.tmp`);
  await fs.promises.writeFile(tmpFile, buffer);

  try {
    const isWindows = process.platform === "win32";
    const cmd = isWindows ? "npx.cmd" : "npx";

    await new Promise<void>((resolve) => {
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
        (err, stdout, stderr) => {
          if (err) {
            console.warn("[R2 Upload Warning]:", stderr || err.message);
          }
          resolve();
        }
      );
    });

    return { path: cleanKey, publicUrl };
  } finally {
    try {
      await fs.promises.unlink(tmpFile);
    } catch {}
  }
}

export async function deleteMediaFile(objectKeys: string[]): Promise<void> {
  const isWindows = process.platform === "win32";
  const cmd = isWindows ? "npx.cmd" : "npx";

  for (const key of objectKeys) {
    const cleanKey = key.replace(/^\/+/, "");
    try {
      await new Promise<void>((resolve) => {
        execFile(
          cmd,
          ["wrangler", "r2", "object", "delete", `${R2_BUCKET}/${cleanKey}`, "--remote"],
          { shell: true, timeout: 20000 },
          () => resolve()
        );
      });
    } catch {}
  }
}

export async function createPresignedUploadUrl(
  eventSlug: string,
  category: "avatars" | "experiences" | "rewards" | "sponsors" | "banners" | "posts",
  fileName: string,
  mimeType: string,
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
