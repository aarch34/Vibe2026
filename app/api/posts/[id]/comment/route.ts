import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { socialStore } from "@/lib/db/social-store";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const comments = socialStore.getPostComments(params.id);
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUserSession();
    const { comment } = await req.json();

    if (!comment || !comment.trim()) {
      return NextResponse.json({ success: false, error: "Comment text is required" }, { status: 400 });
    }

    const result = await socialStore.addComment(
      params.id,
      session.profile.id,
      comment.trim(),
      session.profile.display_name
    );

    return NextResponse.json({
      success: true,
      comment: {
        id: result.comment.id,
        authorName: session.profile.display_name,
        authorAvatar: session.profile.avatar_url,
        comment: result.comment.comment,
        createdAt: result.comment.created_at,
      },
      commentsCount: result.commentsCount,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
