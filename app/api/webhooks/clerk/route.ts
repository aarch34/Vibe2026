import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mock-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.type === "user.created") {
      const data = body.data;
      mockDb.createProfile({
        clerk_user_id: data.id,
        display_name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "VIBE Member",
        email: data.email_addresses?.[0]?.email_address || `${data.id}@vibe2026.org`,
        phone: "+91 98765 43210",
        rotaract_club: "Rotaract Club of Bangalore Central",
        college: "District 3192",
        course_year: "Delegate • 2026",
        interests: ["Networking", "Events"],
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
