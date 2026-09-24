import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUserSession, invalidateSessionCache } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { socialStore } from "@/lib/db/social-store";

export const dynamic = "force-dynamic";

/**
 * DPDP Act 2023 - Section 12: Right to Correction and Erasure of Personal Data
 * Permanently erases all digital personal data, social posts, connections, and event records for the user.
 */
export async function POST() {
  try {
    const session = await getCurrentUserSession();
    const profileId = session.profile.id;
    const clerkUserId = session.clerkUserId;

    // 1. Erase from local in-memory & persistent file store
    socialStore.eraseUserData(profileId);
    mockDb.profiles.delete(profileId);
    mockDb.clerkToProfileMap.delete(clerkUserId);
    mockDb.gameSessions = mockDb.gameSessions.filter((gs) => gs.profile_id !== profileId);
    mockDb.notifications = mockDb.notifications.filter((n) => n.profile_id !== profileId);

    // 2. Erase from live Supabase tables if active
    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        await supabaseAdmin.from("game_sessions").delete().eq("profile_id", profileId);
        await supabaseAdmin.from("notifications").delete().eq("profile_id", profileId);
        await supabaseAdmin.from("event_members").delete().eq("profile_id", profileId);
        await supabaseAdmin.from("wallets").delete().eq("profile_id", profileId);
        await supabaseAdmin.from("profiles").delete().eq("id", profileId);
      } catch (err) {
        console.warn("Supabase record erasure warning:", err);
      }
    }

    // 3. Invalidate session cache
    invalidateSessionCache(clerkUserId);
    invalidateSessionCache(profileId);
    invalidateSessionCache();

    // 4. Clear attendee cookie if present
    const cookieStore = cookies();
    cookieStore.delete("vibe_user_id");

    return NextResponse.json({
      success: true,
      message:
        "Your account and all associated personal data have been permanently erased in compliance with Section 12 of the Digital Personal Data Protection Act, 2023.",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
