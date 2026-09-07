import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.R2_BUCKET || "vibe-media-production";
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL || "https://media.vibeplatform.internal";

const isConfigured =
  accountId &&
  !accountId.includes("placeholder") &&
  accessKeyId &&
  !accessKeyId.includes("placeholder") &&
  secretAccessKey &&
  !secretAccessKey.includes("placeholder");

const s3Client = isConfigured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

export interface SignedUploadUrlResult {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
}

export async function createPresignedUploadUrl(
  eventSlug: string,
  category: "avatars" | "experiences" | "rewards" | "sponsors",
  fileName: string,
  mimeType: string,
  maxSizeBytes = 10 * 1024 * 1024
): Promise<SignedUploadUrlResult> {
  const extension = fileName.split(".").pop() || "bin";
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const objectKey = `events/${eventSlug}/${category}/${uniqueId}.${extension}`;
  const publicUrl = `${publicBaseUrl}/${objectKey}`;

  if (!s3Client) {
    // When R2 credentials are placeholder tokens, return mock direct upload URL
    return {
      uploadUrl: `/api/media/mock-upload?key=${encodeURIComponent(objectKey)}`,
      objectKey,
      publicUrl: `/uploads/${objectKey}`,
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return {
    uploadUrl,
    objectKey,
    publicUrl,
  };
}
