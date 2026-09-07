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

  if (isClerkConfigured) {
    try {
      const { auth, currentUser } = await import("@clerk/nextjs/server");
      const { userId } = await auth();
      clerkUserId = userId;
      if (clerkUserId) {
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

  // Fallback to demo attendee for local development when Clerk is not configured
  if (!clerkUserId) {
    clerkUserId = "usr-demo-1";
    displayName = "Aarav Sharma";
  }

  const eventId = "a0000000-0000-0000-0000-000000000001";

  // If using live Supabase with service role
  if (isUsingLiveSupabase() && supabaseAdmin) {
    // 1. Resolve Profile
    let { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (!profile) {
      const vibeId = `VIBE-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: newProfile, error } = await supabaseAdmin
        .from("profiles")
        .insert({
          clerk_user_id: clerkUserId,
          vibe_id: vibeId,
          display_name: displayName,
          college: "Rotaract District 3192",
        })
        .select()
        .single();
      if (error) throw error;
      profile = newProfile;
    }

    // 2. Resolve Event Member
    let { data: member } = await supabaseAdmin
      .from("event_members")
      .select("*")
      .eq("event_id", eventId)
      .eq("profile_id", profile.id)
      .single();

    if (!member) {
      const { data: newMember } = await supabaseAdmin
        .from("event_members")
        .insert({
          event_id: eventId,
          profile_id: profile.id,
          role: "attendee",
          status: "active",
        })
        .select()
        .single();
      member = newMember;
    }

    // 3. Ensure Initial Wallet Credit
    await supabaseAdmin.rpc("fn_credit_initial_wallet", {
      p_event_id: eventId,
      p_profile_id: profile.id,
      p_initial_amount: 500,
    });

    return {
      clerkUserId,
      profile,
      member,
      eventId,
      role: member.role,
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
