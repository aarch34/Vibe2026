// Re-export from the unified Supabase Storage client
export {
  STORAGE_BUCKET,
  R2_BUCKET,
  R2_PUBLIC_DEV_URL,
  type SignedUploadUrlResult,
  getMediaPublicUrl,
  uploadMediaFile,
  deleteMediaFile,
  createPresignedUploadUrl,
} from "@/lib/storage/storage-client";
