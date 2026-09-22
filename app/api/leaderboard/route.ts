import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mock-store";
import { GameType } from "@/types/database";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "overall";

    if (type === "overall") {
      const entries = mockDb.getLeaderboard();
      return NextResponse.json({ success: true, entries });
    } else {
      const entries = mockDb.getGameLeaderboard(type as GameType);
      return NextResponse.json({ success: true, entries });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
