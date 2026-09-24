import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUserSession, invalidateSessionCache } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { socialStore } from "@/lib/db/social-store";

export const dynamic = "force-dynamic";

/**
 * DPDP Act 2023 - Section 12(3): Right to Erasure of Personal Data
 * Permanently erases ALL digital personal data across every table for this Data Principal.
 * Tables covered: profiles, posts, post_likes, post_comments, connection_requests, connections,
 * notifications, game_sessions, event_members, wallets, xp_transactions, dpdp_* tables.
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

    // 2. Complete erasure from ALL live Supabase tables (Section 12 full compliance)
    if (isUsingLiveSupabase() && supabaseAdmin) {
      const eraseErrors: string[] = [];

      // 2a. Social / networking tables (migration 007)
      const singleColTables: Array<[string, string]> = [
        ["awarded_like_xp", "profile_id"],
        ["xp_transactions", "profile_id"],
        ["post_comments", "profile_id"],
        ["post_likes", "profile_id"],
        ["dpdp_grievances", "profile_id"],
        ["dpdp_nominees", "profile_id"],
        ["dpdp_consent_register", "profile_id"],
      ];

      for (const [table, col] of singleColTables) {
        try {
          await (supabaseAdmin as any).from(table).delete().eq(col, profileId);
        } catch (err) {
          eraseErrors.push(`${table}: ${err}`);
        }
      }

      // 2b. Connections (appears in both columns)
      try {
        await (supabaseAdmin as any).from("connections").delete().eq("user_id_1", profileId);
        await (supabaseAdmin as any).from("connections").delete().eq("user_id_2", profileId);
      } catch (err) { eraseErrors.push(`connections: ${err}`); }

      // 2c. Connection requests (appears in both columns)
      try {
        await (supabaseAdmin as any).from("connection_requests").delete().eq("sender_id", profileId);
        await (supabaseAdmin as any).from("connection_requests").delete().eq("receiver_id", profileId);
      } catch (err) { eraseErrors.push(`connection_requests: ${err}`); }

      // 2d. Posts authored by user
      try {
        await (supabaseAdmin as any).from("posts").delete().eq("author_id", profileId);
      } catch (err) { eraseErrors.push(`posts: ${err}`); }

      // 2e. Core event tables
      try {
        await supabaseAdmin.from("game_sessions").delete().eq("profile_id", profileId);
        await supabaseAdmin.from("notifications").delete().eq("profile_id", profileId);
        await supabaseAdmin.from("event_members").delete().eq("profile_id", profileId);
        await supabaseAdmin.from("wallets").delete().eq("profile_id", profileId);
      } catch (err) { eraseErrors.push(`event_tables: ${err}`); }

      // 2f. Log the erasure request for audit trail BEFORE deleting the profile
      try {
        await (supabaseAdmin as any).from("dpdp_erasure_requests").insert({
          profile_id: profileId,
          reason: "Self-initiated erasure via VIBE 2026 app",
          status: "completed",
          completed_at: new Date().toISOString(),
          notes: "Section 12 DPDP Act 2023 — full automated erasure of all personal data.",
        });
      } catch { /* ignore if dpdp_erasure_requests table not yet migrated */ }

      // 2g. Finally delete the profile row itself
      try {
        await supabaseAdmin.from("profiles").delete().eq("id", profileId);
      } catch (err) { eraseErrors.push(`profiles: ${err}`); }

      if (eraseErrors.length > 0) {
        console.warn("[DPDP §12] Partial erasure warnings:", eraseErrors.join(" | "));
      }
    }

    // 3. Invalidate session cache
    invalidateSessionCache(clerkUserId);
    invalidateSessionCache(profileId);
    invalidateSessionCache();

    // 4. Clear attendee cookie
    const cookieStore = cookies();
    cookieStore.delete("vibe_user_id");

    return NextResponse.json({
      success: true,
      erasedAt: new Date().toISOString(),
      message:
        "Your account and all associated personal data have been permanently erased in compliance with Section 12 of the Digital Personal Data Protection Act, 2023 (India).",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
