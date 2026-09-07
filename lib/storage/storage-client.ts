import { supabase, supabaseAdmin, isUsingLiveSupabase } from "@/lib/db/supabase";

export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "Vibe Bucket";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

export interface SignedUploadUrlResult {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  token?: string;
}

/**
 * Generates a signed upload URL for client-side uploads directly to Supabase Storage.
 * The objectKey is organized cleanly by event and category.
 */
export async function createPresignedUploadUrl(
  eventSlug: string,
  category: "avatars" | "experiences" | "rewards" | "sponsors" | "banners",
  fileName: string,
  mimeType: string,
  _maxSizeBytes = 10 * 1024 * 1024
): Promise<SignedUploadUrlResult> {
  const extension = fileName.split(".").pop() || "bin";
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const objectKey = `events/${eventSlug}/${category}/${uniqueId}.${extension}`;

  // If live Supabase service client is not available, return mock upload URL
  if (!isUsingLiveSupabase() || !supabaseAdmin) {
    return {
      uploadUrl: `/api/media/mock-upload?key=${encodeURIComponent(objectKey)}`,
      objectKey,
      publicUrl: `/uploads/${objectKey}`,
    };
  }

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(objectKey);

  if (error || !data) {
    throw new Error(`Failed to create signed upload URL: ${error?.message || "Unknown error"}`);
  }

  const publicUrl = getMediaPublicUrl(objectKey);

  return {
    uploadUrl: data.signedUrl,
    token: data.token,
    objectKey,
    publicUrl,
  };
}

/**
 * Returns the public CDN / Supabase URL for an object stored in the bucket.
 */
export function getMediaPublicUrl(objectKey: string): string {
  if (!supabase) {
    return `/uploads/${objectKey}`;
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectKey);
  return data.publicUrl;
}

/**
 * Directly uploads a buffer or file to Supabase Storage using the service-role client.
 */
export async function uploadMediaFile(
  objectKey: string,
  fileContent: Buffer | ArrayBuffer | Uint8Array | Blob,
  contentType: string
): Promise<{ path: string; publicUrl: string }> {
  if (!isUsingLiveSupabase() || !supabaseAdmin) {
    return {
      path: objectKey,
      publicUrl: `/uploads/${objectKey}`,
    };
  }

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(objectKey, fileContent, {
      contentType,
      upsert: true,
    });

  if (error || !data) {
    throw new Error(`Failed to upload media file: ${error?.message || "Unknown error"}`);
  }

  return {
    path: data.path,
    publicUrl: getMediaPublicUrl(objectKey),
  };
}

/**
 * Deletes one or more files from the Supabase Storage bucket.
 */
export async function deleteMediaFile(objectKeys: string[]): Promise<void> {
  if (!isUsingLiveSupabase() || !supabaseAdmin) {
    return;
  }

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove(objectKeys);

  if (error) {
    throw new Error(`Failed to delete media file: ${error.message}`);
  }
}
