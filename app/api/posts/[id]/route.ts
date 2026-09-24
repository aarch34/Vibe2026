import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { socialStore } from "@/lib/db/social-store";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUserSession();
    const success = await socialStore.deletePost(params.id, session.profile.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Unauthorized or post not found" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
