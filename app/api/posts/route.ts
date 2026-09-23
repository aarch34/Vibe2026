import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";

export async function GET() {
  try {
    const posts = mockDb.getPosts();
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { caption, imageUrl } = await req.json();

    if (!caption?.trim() && !imageUrl?.trim()) {
      return NextResponse.json({ success: false, error: "Caption or Image required" }, { status: 400 });
    }

    const { post, xpEarned } = mockDb.createPost(session.profile.id, caption?.trim() || "", imageUrl?.trim());
    const author = mockDb.getProfile(session.profile.id) || session.profile;
    const fullPost = { ...post, author };

    return NextResponse.json({ success: true, post: fullPost, xpEarned });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
