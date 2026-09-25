import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { getAllDiscoverableProfiles, normalizeSupabaseProfile } from "@/lib/db/profiles";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { mockDb } from "@/lib/db/mock-store";
import { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * Delta-sync & cached directory endpoint for Discover People.
 * If ?since=timestamp is provided, only returns profiles created or modified after that timestamp.
 * Otherwise returns the cached top discoverable directory.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const session = await getCurrentUserSession().catch(() => null);
    const currentUserId = session?.profile?.id;

    const nowIso = new Date().toISOString();

    // 1. Delta Sync Mode
    if (since) {
      const sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        return NextResponse.json({ success: false, error: "Invalid 'since' timestamp format" }, { status: 400 });
      }

      const updatedProfiles: Profile[] = [];
      const seenIds = new Set<string>();

      if (isUsingLiveSupabase() && supabaseAdmin) {
        try {
          const { data: dbRows, error } = await supabaseAdmin
            .from("profiles")
            .select("id, clerk_user_id, vibe_id, display_name, username, avatar_url, avatar_media_id, email, phone, club, rotaract_club, college, course_year, instagram_username, bio, interests, skills, hobbies, city, is_discoverable, xp, level_number, level_name, connections_count, posts_count, games_played_count, registration_id, profile_completed, created_at, updated_at")
            .or(`updated_at.gt.${since},created_at.gt.${since}`)
            .order("updated_at", { ascending: false })
            .limit(50);

          if (dbRows && !error) {
            for (const row of dbRows) {
              if (row.id === currentUserId || (row.is_discoverable === false)) continue;
              const norm = normalizeSupabaseProfile(row);
              updatedProfiles.push(norm);
              seenIds.add(norm.id);
            }
          }
        } catch (err) {
          console.warn("Delta discover sync Supabase query error:", err);
        }
      }

      // Merge any local mock changes since timestamp
      for (const p of Array.from(mockDb.profiles.values())) {
        if (p.id === currentUserId || !p.is_discoverable || seenIds.has(p.id)) continue;
        const pUpdated = new Date(p.updated_at || p.created_at || 0).getTime();
        if (pUpdated > sinceDate.getTime()) {
          updatedProfiles.push(p);
          seenIds.add(p.id);
        }
      }

      return NextResponse.json(
        {
          success: true,
          isDelta: true,
          profiles: updatedProfiles,
          timestamp: nowIso,
        },
        {
          headers: {
            "Cache-Control": "private, no-cache",
          },
        }
      );
    }

    // 2. Full Directory Mode (Uses shared 60s server cache)
    const profiles = await getAllDiscoverableProfiles(currentUserId, 60);

    return NextResponse.json(
      {
        success: true,
        isDelta: false,
        profiles,
        timestamp: nowIso,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
