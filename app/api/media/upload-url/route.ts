import { NextRequest, NextResponse } from "next/server";
import { createPresignedUploadUrl } from "@/lib/storage/storage-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventSlug = "vibe-2026",
      category = "avatars",
      fileName = "upload.jpg",
      mimeType = "image/jpeg",
    } = body;

    const allowedCategories = ["avatars", "experiences", "rewards", "sponsors", "banners"];
    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Allowed: ${allowedCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const uploadInfo = await createPresignedUploadUrl(
      eventSlug,
      category,
      fileName,
      mimeType
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
