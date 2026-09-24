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
      if (authData?.userId) {
        fetchedClerkId = authData.userId;
      }
    } catch {
      // Clerk deferral
    }

    const validClerkUserId: string = fetchedClerkId || body.clerkUserId || `usr-reg-${Date.now()}`;
    const eventId = "a0000000-0000-0000-0000-000000000001";

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
    const rotaractClub = body.rotaractClub || "Rotaract District 3192";
    const college = body.college || body.rotaractClub || "Rotaract District 3192";
    const courseYear = body.courseYear || body.designation || "Student";
    const rawInstagram = body.instagramUsername || null;
    const instagramUsername = rawInstagram ? rawInstagram.replace(/^@/, "").trim() : null;
    const bio = body.bio || null;
    const interests = body.interests && body.interests.length > 0 ? body.interests : ["Music", "Gaming"];
    const avatarUrl =
      body.avatarUrl ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

    let profile;
    if (existingProfile) {
      profile =
        mockDb.updateProfile(existingProfile.id, {
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
        skills: body.skills
          ? Array.isArray(body.skills)
            ? body.skills
            : body.skills.split(",").map((s: string) => s.trim())
          : [],
        hobbies: body.hobbies
          ? Array.isArray(body.hobbies)
            ? body.hobbies
            : body.hobbies.split(",").map((h: string) => h.trim())
          : [],
        city: body.city || "Bengaluru",
        avatar_url: avatarUrl,
      });
    }

    profile.profile_completed = true;

    // 4. Sync with Live Supabase if configured
    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const { data: supaProfile, error: supaErr } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              clerk_user_id: validClerkUserId,
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
          mockDb.clerkToProfileMap.set(validClerkUserId, supaProfile.id);

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
