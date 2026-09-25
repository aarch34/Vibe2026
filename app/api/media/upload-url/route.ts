import { NextRequest, NextResponse } from "next/server";
import { createPresignedUploadUrl } from "@/lib/storage/storage-client";
import { getCurrentUserSession } from "@/lib/auth/session";
import { getAdminSession } from "@/actions/admin/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session?.profile?.id) {
      return NextResponse.json(
        { error: "Unauthorized: You must be signed in to upload media." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      eventSlug = "vibe-2026",
      category = "avatars",
      fileName = "upload.jpg",
      mimeType = "image/jpeg",
    } = body;

    const allowedCategories = ["avatars", "posts", "experiences", "rewards", "sponsors", "banners"];
    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Allowed: ${allowedCategories.join(", ")}` },
        { status: 400 }
      );
    }

    // Only administrators can upload banners, experiences, rewards, or sponsors
    if (category !== "avatars" && category !== "posts") {
      const admin = await getAdminSession();
      if (!admin) {
        return NextResponse.json(
          { error: "Forbidden: Administrator privileges required for this category." },
          { status: 403 }
        );
      }
    }

    // Validate MIME types strictly to prevent arbitrary/malicious file uploads
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/mov",
      "video/x-m4v",
    ];
    if (!allowedMimeTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Invalid mime type: Only photo (JPEG, PNG, WebP, AVIF, GIF) and video (MP4, WebM, MOV) uploads up to 50MB are permitted." },
        { status: 400 }
      );
    }

    const uploadInfo = await createPresignedUploadUrl(
      eventSlug,
      category,
      fileName,
      mimeType,
      50 * 1024 * 1024 // 50MB limit
    );

    return NextResponse.json({ success: true, data: uploadInfo });
  } catch (error: any) {
    console.error("Upload URL generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
