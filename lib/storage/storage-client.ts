import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "Vibe Bucket";

export interface SignedUploadUrlResult {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  token?: string;
}

/**
 * Returns the public CDN / storage URL for an object stored in the Supabase 'Vibe Bucket'.
 */
export function getMediaPublicUrl(objectKey: string): string {
  const cleanKey = objectKey.replace(/^\/+/, "");
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(cleanKey);
    return data.publicUrl;
  }
  return `/uploads/${cleanKey}`;
}

/**
 * Uploads media (images or videos) directly to the Supabase Storage Bucket ('Vibe Bucket').
 * Full support for Supabase Pro plan with high bandwidth, video streaming, and CDN caching.
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

  // Convert input content to Node Buffer
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

  // 1. Live Supabase Storage Bucket ('Vibe Bucket')
  if (isUsingLiveSupabase() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(cleanKey, buffer, {
          upsert: true,
          contentType: contentType || "application/octet-stream",
          cacheControl: "31536000",
        });

      if (error) {
        console.error("[Supabase Storage Upload Error]:", error.message);
        throw new Error(`Supabase Storage upload failed: ${error.message}`);
      }

      if (data) {
        const { data: pubData } = supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(data.path);
        return { path: cleanKey, publicUrl: pubData.publicUrl };
      }
    } catch (supaErr: any) {
      console.error("[Supabase Storage Upload Exception]:", supaErr);
      throw supaErr;
    }
  }

  // 2. Fail-safe Data URL fallback (local dev without Supabase only)
  return {
    path: cleanKey,
    publicUrl: `data:${contentType || "application/octet-stream"};base64,${buffer.toString("base64")}`,
  };
}

/**
 * Deletes media files from the Supabase Storage Bucket.
 */
export async function deleteMediaFile(objectKeys: string[]): Promise<void> {
  if (isUsingLiveSupabase() && supabaseAdmin) {
    try {
      const cleanKeys = objectKeys.map((k) => k.replace(/^\/+/, ""));
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(cleanKeys);
    } catch (err) {
      console.warn("[Supabase Storage Delete Error]:", err);
    }
  }
}

/**
 * Generates an upload route URL and public URL for pre-flight uploads.
 */
export async function createPresignedUploadUrl(
  eventSlug: string,
  category: "avatars" | "experiences" | "rewards" | "sponsors" | "banners" | "posts",
  fileName: string,
  _mimeType: string,
  _maxSizeBytes = 50 * 1024 * 1024
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

// Backward-compatibility exports
export const R2_BUCKET = STORAGE_BUCKET;
export const R2_PUBLIC_DEV_URL = "";
