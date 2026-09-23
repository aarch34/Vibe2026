import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { gameType, score, maxScore, timeSeconds } = await req.json();

    if (!gameType || score === undefined) {
      return NextResponse.json({ success: false, error: "gameType and score required" }, { status: 400 });
    }

    const result = mockDb.submitGameScore(session.profile.id, gameType, score, maxScore || 100, timeSeconds);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
