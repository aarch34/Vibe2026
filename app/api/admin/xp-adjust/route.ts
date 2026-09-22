import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { targetUserId, amount, reason, adminName } = await req.json();

    if (!targetUserId || amount === undefined || !reason) {
      return NextResponse.json({ success: false, error: "targetUserId, amount, and reason required" }, { status: 400 });
    }

    const adminProfileId = session.profile.id;
    const adminDisplayName = adminName || session.profile.display_name || "Admin";

    const result = mockDb.adminAdjustXp(
      targetUserId,
      adminProfileId,
      adminDisplayName,
      Number(amount),
      reason
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
