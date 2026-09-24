import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { invalidateSessionCache } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let clerkUserId = body.clerkUserId;
    try {
      const { auth } = await import("@clerk/nextjs/server");
      const authData = auth();
      if (authData?.userId) {
        clerkUserId = authData.userId;
      }
    } catch {
      // fallback
    }

    if (!clerkUserId) {
      clerkUserId = body.clerkUserId || `usr-reg-${Date.now()}`;
    }

    const eventId = "a0000000-0000-0000-0000-000000000001";

    const profile = mockDb.createProfile({
      clerk_user_id: clerkUserId,
      display_name: body.fullName || body.displayName || "VIBE Member",
      email: body.email || "delegate@rotaract3192.org",
      phone: body.phone || "+91 98765 43210",
      rotaract_club: body.rotaractClub || "Rotaract District 3192",
      college: body.college || "Rotaract District 3192",
      course_year: body.courseYear || "Student",
      instagram_username: body.instagramUsername || null,
      bio: body.bio || null,
      interests: body.interests || [],
      skills: body.skills ? (Array.isArray(body.skills) ? body.skills : body.skills.split(",").map((s: string) => s.trim())) : [],
      hobbies: body.hobbies ? (Array.isArray(body.hobbies) ? body.hobbies : body.hobbies.split(",").map((h: string) => h.trim())) : [],
      favorite_music: body.favoriteMusic ? (Array.isArray(body.favoriteMusic) ? body.favoriteMusic : body.favoriteMusic.split(",").map((m: string) => m.trim())) : [],
      favorite_movies: body.favoriteMovies ? (Array.isArray(body.favoriteMovies) ? body.favoriteMovies : body.favoriteMovies.split(",").map((m: string) => m.trim())) : [],
      city: body.city || "Bengaluru",
      avatar_url: body.avatarUrl || null,
    });

    profile.profile_completed = true;

    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const { data: supaProfile, error: supaErr } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              clerk_user_id: clerkUserId,
              vibe_id: profile.vibe_id,
              display_name: profile.display_name,
              email: profile.email,
              phone: profile.phone,
              club: profile.rotaract_club, // Correct column in Supabase
              college: profile.college,
              course_year: profile.course_year,
              instagram_id: profile.instagram_username, // Correct column in Supabase
              username: profile.username,
              bio: profile.bio,
              interests: profile.interests,
              skills: profile.skills,
              hobbies: profile.hobbies,
              city: profile.city,
              avatar_url: profile.avatar_url,
              profile_completed: true,
              is_discoverable: true,
              xp: profile.xp || 100,
              level_number: profile.level_number || 1,
              level_name: profile.level_name || "VIBE NEWBIE",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "clerk_user_id" }
          )
          .select()
          .single();

        if (supaErr) {
          console.error("Supabase profile upsert error on /api/register:", supaErr);
        }

        if (supaProfile) {
          // Keep mockDb profile aligned with Supabase ID
          mockDb.profiles.delete(profile.id);
          profile.id = supaProfile.id;
          mockDb.profiles.set(supaProfile.id, profile);
          mockDb.clerkToProfileMap.set(clerkUserId, supaProfile.id);

          // Add to event_members
          await supabaseAdmin.from("event_members").upsert(
            {
              event_id: eventId,
              profile_id: supaProfile.id,
              role: "attendee",
              status: "active",
            },
            { onConflict: "event_id,profile_id" }
          );

          // Credit starter 500 VIBE Coins to attendee wallet
          try {
            await supabaseAdmin.rpc("fn_credit_initial_wallet", {
              p_event_id: eventId,
              p_profile_id: supaProfile.id,
              p_initial_amount: 500,
            });
          } catch {
            await supabaseAdmin.from("wallets").upsert(
              {
                event_id: eventId,
                profile_id: supaProfile.id,
                balance: 500,
              },
              { onConflict: "event_id,profile_id" }
            );
          }
        }
      } catch (dbErr) {
        console.warn("Supabase registration sync warning:", dbErr);
      }
    }

    invalidateSessionCache(clerkUserId);

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
