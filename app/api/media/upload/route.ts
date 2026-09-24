import { NextRequest, NextResponse } from "next/server";
import { uploadMediaFile } from "@/lib/r2/r2-client";
import { getCurrentUserSession } from "@/lib/auth/session";

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
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const objectKey = `${category}/${session.profile.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadMediaFile(objectKey, buffer, file.type);

    return NextResponse.json({
      success: true,
      url: result.publicUrl,
      path: result.path,
    });
  } catch (error: any) {
    console.error("Media upload error:", error);
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 });
  }
}
