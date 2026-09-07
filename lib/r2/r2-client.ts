// Compatibility wrapper: Storage migrated from Cloudflare R2 to Supabase Storage ("Vibe Bucket")
export {
  createPresignedUploadUrl,
  getMediaPublicUrl,
  uploadMediaFile,
  deleteMediaFile,
  STORAGE_BUCKET,
  type SignedUploadUrlResult,
} from "@/lib/storage/storage-client";
