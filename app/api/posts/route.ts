import { NextResponse } from "next/server";
import { getCurrentUserSession, invalidateSessionCache } from "@/lib/auth/session";
import { socialStore } from "@/lib/db/social-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const posts = await socialStore.getPostsWithAuthors();
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
      return NextResponse.json({ success: false, error: "Caption or image is required." }, { status: 400 });
    }

    const { post, xpEarned } = await socialStore.createPost(
      session.profile.id,
      caption?.trim() || "",
      imageUrl?.trim() || null
    );

    const fullPost = { ...post, author: session.profile };

    invalidateSessionCache(session.clerkUserId);
    invalidateSessionCache(session.profile.id);

    return NextResponse.json({ success: true, post: fullPost, xpEarned });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
