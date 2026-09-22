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

    if (!caption && !imageUrl) {
      return NextResponse.json({ success: false, error: "Caption or Image required" }, { status: 400 });
    }

    const post = mockDb.createPost(session.profile.id, caption || "", imageUrl);
    const fullPost = { ...post, author: mockDb.getProfile(session.profile.id) || session.profile };

    return NextResponse.json({ success: true, post: fullPost });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
