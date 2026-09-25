import { NextResponse } from "next/server";
import { getCurrentUserSession, invalidateSessionCache } from "@/lib/auth/session";
import { socialStore } from "@/lib/db/social-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const nowIso = new Date().toISOString();

    const allPosts = await socialStore.getPostsWithAuthors(10);

    if (since) {
      const sinceDate = new Date(since).getTime();
      if (!isNaN(sinceDate)) {
        const deltaPosts = allPosts.filter((p) => {
          const postTime = new Date(p.created_at || 0).getTime();
          return postTime > sinceDate;
        }).slice(0, 10);

        return NextResponse.json(
          { success: true, isDelta: true, posts: deltaPosts, timestamp: nowIso },
          { headers: { "Cache-Control": "private, no-cache" } }
        );
      }
    }

    return NextResponse.json(
      { success: true, isDelta: false, posts: allPosts.slice(0, 10), timestamp: nowIso },
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

    let finalImageUrl = imageUrl?.trim() || null;
    if (
      finalImageUrl &&
      (finalImageUrl.startsWith("data:image/") || finalImageUrl.startsWith("data:video/")) &&
      isUsingLiveSupabase() &&
      supabaseAdmin
    ) {
      const matches = finalImageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        let ext = mimeType.split("/")[1]?.split(";")[0] || "bin";
        if (ext === "jpeg") ext = "jpg";
        else if (ext === "quicktime") ext = "mov";
        const buffer = Buffer.from(matches[2], "base64");
        const folder = mimeType.startsWith("video/") ? "videos" : "photos";
        const fileName = `${folder}/post-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

        const { data, error } = await supabaseAdmin.storage
          .from("Vibe Bucket")
          .upload(`posts/${fileName}`, buffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (error) {
          console.error("Storage upload error:", error);
        } else if (data) {
          const { data: publicData } = supabaseAdmin.storage
            .from("Vibe Bucket")
            .getPublicUrl(`posts/${fileName}`);
          finalImageUrl = publicData.publicUrl;
        }
      }
    }

    const { post, xpEarned } = await socialStore.createPost(
      session.profile.id,
      caption?.trim() || "",
      finalImageUrl
    );

    const fullPost = { ...post, author: session.profile };

    invalidateSessionCache(session.clerkUserId);
    invalidateSessionCache(session.profile.id);

    return NextResponse.json({ success: true, post: fullPost, xpEarned });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
