import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      club,
      instagramId,
      registrationId,
      assignedZoneId,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
    }

    const eventId = "a0000000-0000-0000-0000-000000000001";
    const cleanInsta = instagramId?.trim()
      ? (instagramId.startsWith("@") ? instagramId.trim() : `@${instagramId.trim()}`)
      : `@${name.toLowerCase().replace(/\s+/g, ".")}`;

    let newUserId = `usr-reg-${Date.now()}`;
    try {
      const { auth } = await import("@clerk/nextjs/server");
      const authData = auth();
      if (authData.userId) {
        newUserId = authData.userId;
      }
    } catch {
      // Clerk not active or dev mode
    }
    const vibeId = `VIBE-${Math.floor(1000 + Math.random() * 9000)}`;

    // Pick zone if not specified: round-robin or default to Arnava
    const zoneKeys = ["z-arnava", "z-taranaga", "z-sagara", "z-pravaha", "z-samudhra", "z-varuna"];
    const chosenZone = assignedZoneId && zoneKeys.includes(assignedZoneId)
      ? assignedZoneId
      : zoneKeys[Math.floor(Math.random() * zoneKeys.length)];

    let profile: any = null;

    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const { data: newProfile, error } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              clerk_user_id: newUserId,
              vibe_id: vibeId,
              display_name: name.trim(),
              college: club || "Rotaract District 3192",
              club: club || "Rotaract Member",
            },
            { onConflict: "clerk_user_id" }
          )
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }
        profile = {
          ...newProfile,
          instagram_id: cleanInsta,
          assigned_zone_id: chosenZone,
        };
        mockDb.profiles.set(newProfile.id, profile);

        await supabaseAdmin.from("event_members").upsert(
          {
            event_id: eventId,
            profile_id: profile.id,
            role: "attendee",
            status: "active",
          },
          { onConflict: "event_id,profile_id" }
        );

        await supabaseAdmin.rpc("fn_credit_initial_wallet", {
          p_event_id: eventId,
          p_profile_id: profile.id,
          p_initial_amount: 500,
        });
      } catch (dbErr) {
        console.warn("Live Supabase registration failed, falling back to mockDb:", dbErr);
        profile = null;
      }
    }

    if (!profile) {
      // In-memory mock store
      profile = mockDb.createAttendeeProfile(
        newUserId,
        name.trim(),
        vibeId,
        club || "Rotaract District 3192",
        club || "Rotaract Club",
        0,
        0,
        0,
        cleanInsta,
        phone || "+91 98765 43210",
        chosenZone
      );
      profile.email = email || `${name.toLowerCase().replace(/\s+/g, "")}@example.com`;
      profile.registration_id = registrationId || `REG-${Date.now().toString().slice(-6)}`;

      mockDb.creditInitialWallet(eventId, profile.id, 500);
    }

    // Set attendee auth cookie
    cookies().set("vibe_user_id", newUserId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      profile,
      userId: newUserId,
      redirect: "/app/welcome",
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 500 });
  }
}
