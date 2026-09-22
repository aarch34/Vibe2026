import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUserSession();
    const result = mockDb.likePost(params.id, session.profile.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
