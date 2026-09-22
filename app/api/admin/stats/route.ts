import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mock-store";

export async function GET() {
  try {
    const stats = mockDb.getAdminStats();
    const adjustments = mockDb.getAdminXpAdjustments();
    const users = Array.from(mockDb.profiles.values());

    return NextResponse.json({ success: true, stats, adjustments, users });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
