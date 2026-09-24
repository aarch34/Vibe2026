import { NextResponse } from "next/server";
import { getCurrentUserSession, invalidateSessionCache } from "@/lib/auth/session";
import { socialStore } from "@/lib/db/social-store";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { requestId, action } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json({ success: false, error: "requestId and action are required" }, { status: 400 });
    }

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json({ success: false, error: "action must be accept or decline" }, { status: 400 });
    }

    const result = await socialStore.respondConnectionRequest(
      requestId,
      session.profile.id,
      action,
      session.profile.display_name
    );

    invalidateSessionCache(session.clerkUserId);
    invalidateSessionCache(session.profile.id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
