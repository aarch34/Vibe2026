import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mock-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profile = mockDb.createProfile({
      clerk_user_id: body.clerkUserId || `usr-${Date.now()}`,
      display_name: body.fullName || body.displayName || "VIBE Member",
      email: body.email || "delegate@vibe2026.org",
      phone: body.phone || "+91 98765 43210",
      rotaract_club: body.rotaractClub || "Rotaract Club of Bangalore Central",
      college: body.college || "District 3192",
      course_year: body.courseYear || "Student",
      instagram_username: body.instagramUsername || null,
      bio: body.bio || null,
      interests: body.interests || ["Music", "Gaming"],
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
