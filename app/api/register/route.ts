import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

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
      skills: body.skills ? (Array.isArray(body.skills) ? body.skills : body.skills.split(",").map((s: string) => s.trim())) : [],
      hobbies: body.hobbies ? (Array.isArray(body.hobbies) ? body.hobbies : body.hobbies.split(",").map((h: string) => h.trim())) : [],
      favorite_music: body.favoriteMusic ? (Array.isArray(body.favoriteMusic) ? body.favoriteMusic : body.favoriteMusic.split(",").map((m: string) => m.trim())) : [],
      favorite_movies: body.favoriteMovies ? (Array.isArray(body.favoriteMovies) ? body.favoriteMovies : body.favoriteMovies.split(",").map((m: string) => m.trim())) : [],
      city: body.city || "Bengaluru",
      avatar_url: body.avatarUrl || null,
    });

    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const { data: supaProfile } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              clerk_user_id: clerkUserId,
              vibe_id: profile.vibe_id,
              display_name: profile.display_name,
              email: profile.email,
              phone: profile.phone,
              rotaract_club: profile.rotaract_club,
              college: profile.college,
              course_year: profile.course_year,
              instagram_username: profile.instagram_username,
              bio: profile.bio,
              interests: profile.interests,
              xp: profile.xp || 75,
            },
            { onConflict: "clerk_user_id" }
          )
          .select()
          .single();

        if (supaProfile) {
          await supabaseAdmin.from("event_members").upsert(
            {
              event_id: "a0000000-0000-0000-0000-000000000001",
              profile_id: supaProfile.id,
              role: "attendee",
              status: "active",
            },
            { onConflict: "event_id,profile_id" }
          );
        }
      } catch (dbErr) {
        console.warn("Supabase registration sync warning:", dbErr);
      }
    }

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
