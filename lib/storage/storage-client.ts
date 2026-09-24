// Storage migrated to Cloudflare R2 (vibe2026-media)
export {
  createPresignedUploadUrl,
  getMediaPublicUrl,
  uploadMediaFile,
  deleteMediaFile,
  STORAGE_BUCKET,
  R2_BUCKET,
  R2_PUBLIC_DEV_URL,
  type SignedUploadUrlResult,
} from "@/lib/r2/r2-client";
