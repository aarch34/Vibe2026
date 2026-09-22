import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mock-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const clerkUserId = body.clerkUserId || `usr-reg-${Date.now()}`;
    const profile = mockDb.createProfile({
      clerk_user_id: clerkUserId,
      display_name: body.fullName || body.displayName || "VIBE Member",
      email: body.email || "delegate@rotaract3192.org",
      phone: body.phone || "+91 98765 43210",
      rotaract_club: body.rotaractClub || "Rotaract Club of Bangalore Central",
      college: body.college || "RV College of Engineering",
      course_year: body.courseYear || "Student",
      instagram_username: body.instagramUsername || null,
      bio: body.bio || null,
      interests: body.interests || ["Music", "Gaming"],
      skills: body.skills ? body.skills.split(",").map((s: string) => s.trim()) : [],
      hobbies: body.hobbies ? body.hobbies.split(",").map((h: string) => h.trim()) : [],
      favorite_music: body.favoriteMusic ? body.favoriteMusic.split(",").map((m: string) => m.trim()) : [],
      favorite_movies: body.favoriteMovies ? body.favoriteMovies.split(",").map((m: string) => m.trim()) : [],
      city: body.city || "Bengaluru",
      avatar_url: body.avatarUrl || null,
    });

    const response = NextResponse.json({ success: true, profile });
    response.cookies.set("vibe_user_id", clerkUserId, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
