import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";

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

    const result = mockDb.commentPost(params.id, session.profile.id, comment.trim());
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    const author = mockDb.getProfile(session.profile.id) || session.profile;
    return NextResponse.json({ ...result, author });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
