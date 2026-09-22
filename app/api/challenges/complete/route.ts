import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { challengeId } = await req.json();

    if (!challengeId) {
      return NextResponse.json({ success: false, error: "challengeId required" }, { status: 400 });
    }

    const result = mockDb.completeChallenge(session.profile.id, challengeId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
