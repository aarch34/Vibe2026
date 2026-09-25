import { NextResponse } from "next/server";
import { getCurrentUserSession, invalidateSessionCache } from "@/lib/auth/session";
import { socialStore } from "@/lib/db/social-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const nowIso = new Date().toISOString();

    const allPosts = await socialStore.getPostsWithAuthors();

    if (since) {
      const sinceDate = new Date(since).getTime();
      if (!isNaN(sinceDate)) {
        const deltaPosts = allPosts.filter((p) => {
          const postTime = new Date(p.created_at || 0).getTime();
          return postTime > sinceDate;
        });

        return NextResponse.json(
          { success: true, isDelta: true, posts: deltaPosts, timestamp: nowIso },
          { headers: { "Cache-Control": "private, no-cache" } }
        );
      }
    }

    return NextResponse.json(
      { success: true, isDelta: false, posts: allPosts, timestamp: nowIso },
      { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } }
    );
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
