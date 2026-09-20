import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { Profile, EventMember, MemberRole } from "@/types/database";

const isClerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder") &&
  process.env.CLERK_SECRET_KEY &&
  !process.env.CLERK_SECRET_KEY.includes("placeholder");

export interface CurrentUserSession {
  clerkUserId: string;
  profile: Profile;
  member: EventMember;
  eventId: string;
  role: MemberRole;
}

export async function getCurrentUserSession(
  requestedEventSlug = "vibe-2026"
): Promise<CurrentUserSession> {
  let clerkUserId: string | null = null;
  let displayName = "VIBE Attendee";
  let userEmail: string | null = null;

  let clerkRole: MemberRole | null = null;

  if (isClerkConfigured) {
    try {
      const { auth, currentUser } = await import("@clerk/nextjs/server");
      const authData = auth();
      clerkUserId = authData.userId;
      if (clerkUserId) {
        const metadataRole = (authData.sessionClaims?.metadata as any)?.role;
        if (metadataRole === "admin" || metadataRole === "volunteer" || metadataRole === "lead") {
          clerkRole = metadataRole;
        }
        const user = await currentUser();
        displayName = user?.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : user?.username || "VIBE Attendee";
        userEmail = user?.emailAddresses?.[0]?.emailAddress || null;
      }
    } catch (err) {
      console.warn("Clerk session resolution fallback:", err);
    }
  }

  // Check for test user cookie when Clerk is not configured or in development testing
  if (!clerkUserId) {
    try {
      const { cookies } = await import("next/headers");
      const cookieUserId = cookies().get("vibe_user_id")?.value;
      if (cookieUserId) {
        clerkUserId = cookieUserId;
      }
    } catch {
      // Cookies not available in static or non-request context
    }
  }

  // Fallback default attendee for initial run
  if (!clerkUserId) {
    clerkUserId = "usr-demo-1";
    displayName = "Aarav Sharma";
  }

  const eventId = "a0000000-0000-0000-0000-000000000001";

  // Check if profile exists in memory store first (e.g. newly registered attendee or demo attendee)
  const memProfile = Array.from(mockDb.profiles.values()).find(
    (p) => p.clerk_user_id === clerkUserId
  );
  if (memProfile && (clerkUserId.startsWith("usr-reg-") || clerkUserId.startsWith("usr-demo-") || !isUsingLiveSupabase())) {
    let member = mockDb.eventMembers.get(`${eventId}:${memProfile.id}`);
    if (!member) {
      member = {
        id: `em-${memProfile.id}`,
        event_id: eventId,
        profile_id: memProfile.id,
        role: "attendee",
        status: "active",
        joined_at: new Date().toISOString(),
      };
      mockDb.eventMembers.set(`${eventId}:${memProfile.id}`, member);
    }
    return {
      clerkUserId,
      profile: memProfile,
      member,
      eventId,
      role: member.role || "attendee",
    };
  }

  // If using live Supabase with service role
  if (isUsingLiveSupabase() && supabaseAdmin) {
    // 1. Resolve Profile
    let { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (!profile) {
      const vibeId = `VIBE-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: newProfile, error } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            clerk_user_id: clerkUserId,
            vibe_id: vibeId,
            display_name: displayName,
            college: "Rotaract District 3192",
          },
          { onConflict: "clerk_user_id" }
        )
        .select()
        .single();
      if (error) {
        // If race condition occurred, re-query profile
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("clerk_user_id", clerkUserId)
          .maybeSingle();
        profile = existingProfile;
      } else {
        profile = newProfile;
      }
    }

    if (!profile) {
      throw new Error(`Failed to resolve user profile for ${clerkUserId}`);
    }

    // 2. Resolve Event Member
    let { data: member } = await supabaseAdmin
      .from("event_members")
      .select("*")
      .eq("event_id", eventId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!member) {
      const { data: newMember } = await supabaseAdmin
        .from("event_members")
        .upsert(
          {
            event_id: eventId,
            profile_id: profile.id,
            role: clerkRole || "attendee",
            status: "active",
          },
          { onConflict: "event_id,profile_id" }
        )
        .select()
        .single();
      member = newMember;
    }

    // Default member if somehow null
    const memberRole: MemberRole = clerkRole || member?.role || "attendee";

    // 3. Ensure Initial Wallet Credit (if procedure exists)
    try {
      await supabaseAdmin.rpc("fn_credit_initial_wallet", {
        p_event_id: eventId,
        p_profile_id: profile.id,
        p_initial_amount: 500,
      });
    } catch {
      // Ignore if procedures not yet applied
    }

    return {
      clerkUserId,
      profile,
      member: member || {
        id: `em-${profile.id}`,
        event_id: eventId,
        profile_id: profile.id,
        role: memberRole,
        status: "active",
        joined_at: new Date().toISOString(),
      },
      eventId,
      role: memberRole,
    };
  }

  // Fallback / In-Memory Mock Store
  let profile = Array.from(mockDb.profiles.values()).find(
    (p) => p.clerk_user_id === clerkUserId
  );

  if (!profile) {
    const vibeId = `VIBE-${Math.floor(1000 + Math.random() * 9000)}`;
    profile = mockDb.createAttendeeProfile(
      clerkUserId,
      displayName,
      vibeId,
      "District 3192 Delegate",
      "Rotaract Youth Club",
      0
    );
  }

  let member = mockDb.eventMembers.get(`${eventId}:${profile.id}`);
  if (!member) {
    member = {
      id: `em-${profile.id}`,
      event_id: eventId,
      profile_id: profile.id,
      role: "attendee",
      status: "active",
      joined_at: new Date().toISOString(),
    };
    mockDb.eventMembers.set(`${eventId}:${profile.id}`, member);
  }

  // Credit starting wallet
  mockDb.creditInitialWallet(eventId, profile.id, 500);

  return {
    clerkUserId,
    profile,
    member,
    eventId,
    role: member.role,
  };
}
