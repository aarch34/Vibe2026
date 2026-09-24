import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { socialStore } from "@/lib/db/social-store";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUserSession();
    const result = await socialStore.toggleLike(
      params.id,
      session.profile.id,
      session.profile.display_name
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
