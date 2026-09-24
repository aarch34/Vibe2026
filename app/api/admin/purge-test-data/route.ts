import { NextResponse } from "next/server";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { mockDb } from "@/lib/db/mock-store";
import { socialStore } from "@/lib/db/social-store";

export const dynamic = "force-dynamic";

const ADMIN_SECRET = process.env.ADMIN_CLEANUP_SECRET || "";

/**
 * POST /api/admin/purge-test-data
 * 
 * Wipes ALL user accounts and social data from Supabase + in-memory store.
 * Requires the ADMIN_CLEANUP_SECRET header to prevent accidental execution.
 * 
 * Usage:
 *   curl -X POST https://your-domain.com/api/admin/purge-test-data \
 *     -H "x-admin-secret: YOUR_SECRET"
 */
export async function POST(req: Request) {
  // Require secret header
  const secret = req.headers.get("x-admin-secret") || "";
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — provide x-admin-secret header." },
      { status: 401 }
    );
  }

  const results: Record<string, string> = {};

  // ── 1. Clear in-memory mock store ────────────────────────────
  mockDb.profiles.clear();
  mockDb.clerkToProfileMap.clear();
  mockDb.connectionRequests = [];
  mockDb.connections = [];
  mockDb.posts = [];
  mockDb.postLikes = [];
  mockDb.postComments = [];
  mockDb.gameSessions = [];
  mockDb.notifications = [];
  mockDb.adminXpAdjustments = [];
  mockDb.challengeCompletions = [];
  results["mock_store"] = "cleared";

  // Re-seed system challenges (not user data)
  mockDb.seed();
  results["mock_store_challenges"] = "re-seeded";

  // ── 2. Clear social store in-memory ──────────────────────────
  try {
    (socialStore as any).posts = [];
    (socialStore as any).likes = new Map();
    (socialStore as any).comments = [];
    (socialStore as any).connections = [];
    (socialStore as any).connectionRequests = [];
    (socialStore as any).notifications = [];
    results["social_store"] = "cleared";
  } catch (err) {
    results["social_store"] = `warning: ${err}`;
  }

  // ── 3. Clear Supabase (if live) ───────────────────────────────
  if (!isUsingLiveSupabase() || !supabaseAdmin) {
    results["supabase"] = "skipped — not connected";
    return NextResponse.json({ success: true, results, note: "In-memory stores cleared. Supabase not connected." });
  }

  // Tables to truncate in safe order (children first, parents last)
  const truncateOrder = [
    // Social / DPDP leaf tables
    "awarded_like_xp",
    "xp_transactions",
    "post_comments",
    "post_likes",
    "connections",
    "connection_requests",
    "dpdp_consent_register",
    "dpdp_erasure_requests",
    "dpdp_grievances",
    "dpdp_nominees",
    // Transaction / activity tables
    "wallet_transactions",
    "reward_redemptions",
    "sponsor_interactions",
    "experience_completions",
    "quest_progress",
    "user_achievements",
    "audit_logs",
    "analytics_events",
    "duty_rewards",
    "stall_photos",
    // Mid-level
    "game_sessions",
    "posts",
    "notifications",
    "qr_codes",
    "wallets",
    "staff_zone_assignments",
    "staff_members",
    // Core user tables (last)
    "event_members",
    "profiles",
  ];

  for (const table of truncateOrder) {
    try {
      // DELETE all rows (TRUNCATE not available via REST API — use delete with always-true filter)
      const { error } = await (supabaseAdmin as any)
        .from(table)
        .delete()
        .gte("created_at", "2000-01-01"); // matches all rows

      if (error) {
        // Try without created_at for tables that may not have it
        const { error: err2 } = await (supabaseAdmin as any)
          .from(table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // matches all rows

        results[table] = err2 ? `error: ${err2.message}` : "cleared";
      } else {
        results[table] = "cleared";
      }
    } catch (err) {
      results[table] = `exception: ${err}`;
    }
  }

  return NextResponse.json({
    success: true,
    clearedAt: new Date().toISOString(),
    results,
    preserved: [
      "events (VIBE 2026 config)",
      "levels (XP tier definitions)",
      "rewards (reward catalog)",
      "achievements (achievement definitions)",
      "quests (quest definitions)",
      "zones, stalls, sponsors, experiences",
    ],
    note: "All user accounts, posts, social connections, game sessions, wallets, and DPDP records have been purged. The app is ready for fresh registrations.",
  });
}
