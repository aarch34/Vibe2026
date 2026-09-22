import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { receiverId } = await req.json();

    if (!receiverId) {
      return NextResponse.json({ success: false, error: "receiverId is required" }, { status: 400 });
    }

    const result = mockDb.sendConnectionRequest(session.profile.id, receiverId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
