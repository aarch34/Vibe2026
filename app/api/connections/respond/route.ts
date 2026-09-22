import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { requestId, action } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json({ success: false, error: "requestId and action are required" }, { status: 400 });
    }

    if (action === "accept") {
      const result = mockDb.acceptConnectionRequest(requestId, session.profile.id);
      return NextResponse.json(result);
    } else {
      const result = mockDb.declineConnectionRequest(requestId, session.profile.id);
      return NextResponse.json(result);
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
