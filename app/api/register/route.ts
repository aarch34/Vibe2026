import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { invalidateSessionCache } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Resolve Clerk User ID from auth() header/session or body fallback
    let fetchedClerkId: string | null = null;
    try {
      const { auth } = await import("@clerk/nextjs/server");
      const authData = auth();
      fetchedClerkId = authData.userId;
    } catch {
      // Clerk non-request or deferral
    }

    const validClerkUserId: string = fetchedClerkId || body.clerkUserId || `usr-reg-${Date.now()}`;

    // 2. Prevent duplicate profile creation for the same Clerk User
    let existingProfile = mockDb.getProfileByClerkId(validClerkUserId);
    if (existingProfile && existingProfile.profile_completed && existingProfile.display_name !== "VIBE Attendee") {
      const response = NextResponse.json({ success: true, profile: existingProfile, alreadyRegistered: true });
      response.cookies.set("vibe_user_id", validClerkUserId, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }

    // 3. Create or update VIBE Profile in mock DB
    const displayName = body.fullName || body.displayName || "VIBE Member";
    const email = body.email || "delegate@rotaract3192.org";
    const phone = body.phone || "+91 98765 43210";
    const rotaractClub = body.rotaractClub || "Rotaract Club of Bangalore Central";
    const college = body.college || "RV College of Engineering";
    const courseYear = body.courseYear || "Student";
    const instagramUsername = body.instagramUsername || null;
    const bio = body.bio || null;
    const interests = body.interests || ["Music", "Gaming"];
    const avatarUrl = body.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

    let profile;
    if (existingProfile) {
      // Update existing placeholder profile
      profile = mockDb.updateProfile(existingProfile.id, {
        display_name: displayName,
        email,
        phone,
        rotaract_club: rotaractClub,
        college,
        course_year: courseYear,
        instagram_username: instagramUsername,
        bio,
        interests,
        avatar_url: avatarUrl,
        profile_completed: true,
      }) || existingProfile;
    } else {
      profile = mockDb.createProfile({
        clerk_user_id: validClerkUserId,
        display_name: displayName,
        email,
        phone,
        rotaract_club: rotaractClub,
        college,
        course_year: courseYear,
        instagram_username: instagramUsername,
        bio,
        interests,
        avatar_url: avatarUrl,
      });
    }

    // Ensure profile_completed flag is set
    profile.profile_completed = true;

    // 4. Sync with Live Supabase if configured
    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const { data: supaProfile } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              clerk_user_id: validClerkUserId,
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

    // Invalidate session cache for this user
    invalidateSessionCache(validClerkUserId);

    const response = NextResponse.json({ success: true, profile });
    response.cookies.set("vibe_user_id", validClerkUserId, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
