import { NextRequest, NextResponse } from "next/server";
import { uploadMediaFile } from "@/lib/storage/storage-client";
import { getCurrentUserSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// Strict 50MB maximum limit as required
const MAX_MEDIA_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_PREFIXES = ["image/", "video/"];
const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/mov",
  "video/x-m4v",
  "video/ogg",
  "video/3gpp",
];

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session?.profile?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "posts";

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No media file provided." }, { status: 400 });
    }

    // 1. Enforce strict 50MB limit
    if (file.size > MAX_MEDIA_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size exceeds the 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB provided). Videos and photos must be 50MB or less.`,
        },
        { status: 400 }
      );
    }

    // 2. Validate MIME type
    const mimeType = (file.type || "").toLowerCase();
    const isAllowedType =
      ALLOWED_MIME_TYPES.includes(mimeType) ||
      ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));

    if (!isAllowedType) {
      return NextResponse.json(
        {
          error:
            "Invalid file format. Only photos (JPEG, PNG, WebP, GIF, AVIF) and videos (MP4, WebM, QuickTime, MOV up to 50MB) are permitted.",
        },
        { status: 400 }
      );
    }

    // Determine extension
    let ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ext || ext.length > 5) {
      if (mimeType.includes("video/mp4")) ext = "mp4";
      else if (mimeType.includes("video/webm")) ext = "webm";
      else if (mimeType.includes("video/quicktime")) ext = "mov";
      else if (mimeType.includes("image/png")) ext = "png";
      else if (mimeType.includes("image/webp")) ext = "webp";
      else if (mimeType.includes("image/gif")) ext = "gif";
      else ext = "jpg";
    }

    const mediaFolder = mimeType.startsWith("video/") ? "videos" : "photos";
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const objectKey = `events/vibe-2026/${category}/${session.profile.id}/${mediaFolder}/${uniqueId}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadMediaFile(objectKey, buffer, mimeType || "application/octet-stream");

    return NextResponse.json({
      success: true,
      url: result.publicUrl,
      path: result.path,
      isVideo: mimeType.startsWith("video/"),
      sizeBytes: file.size,
    });
  } catch (error: any) {
    console.error("Media upload to Supabase Storage error:", error);
    return NextResponse.json(
      { error: error?.message || "Media upload to storage failed" },
      { status: 500 }
    );
  }
}
