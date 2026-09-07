import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { verifyQRScan } from "@/lib/qr/qr-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { valid: false, error: "QR code parameter is required" },
      { status: 400 }
    );
  }

  try {
    const session = await getCurrentUserSession();
    const result = await verifyQRScan(code, session.eventId, session.profile.id);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err.message || "Failed to scan QR" },
      { status: 500 }
    );
  }
}
