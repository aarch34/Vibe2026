import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { socialStore } from "@/lib/db/social-store";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { receiverId } = await req.json();

    if (!receiverId) {
      return NextResponse.json({ success: false, error: "receiverId is required" }, { status: 400 });
    }

    const result = await socialStore.sendConnectionRequest(
      session.profile.id,
      receiverId,
      session.profile.display_name,
      session.profile.rotaract_club
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
