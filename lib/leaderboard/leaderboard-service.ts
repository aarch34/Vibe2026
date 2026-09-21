import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { LeaderboardEntry, Level, ZoneLeaderboardEntry } from "@/types/database";
import { getCachedEventLevels, getCachedEventZones } from "@/lib/gameplay/progression-service";

let cachedLeaderboardData: {
  eventId: string;
  timestamp: number;
  entries: LeaderboardEntry[];
  rankMap: Map<string, LeaderboardEntry>;
} | null = null;

let cachedZoneLeaderboard: {
  eventId: string;
  timestamp: number;
  entries: ZoneLeaderboardEntry[];
} | null = null;

const LEADERBOARD_CACHE_TTL_MS = 60_000; // 60 seconds

export function invalidateLeaderboardCache() {
  cachedLeaderboardData = null;
  cachedZoneLeaderboard = null;
}

export async function getLeaderboard(
  eventId: string,
  limit = 50,
  offset = 0
): Promise<{ entries: LeaderboardEntry[]; totalParticipants: number }> {
  if (
    cachedLeaderboardData &&
    cachedLeaderboardData.eventId === eventId &&
    Date.now() - cachedLeaderboardData.timestamp < LEADERBOARD_CACHE_TTL_MS
  ) {
    return {
      entries: cachedLeaderboardData.entries.slice(offset, offset + limit),
      totalParticipants: cachedLeaderboardData.entries.length,
    };
  }

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [membersRes, levels, compsRes, zones] = await Promise.all([
      supabaseAdmin
        .from("event_members")
        .select("profile_id, profiles(id, display_name, vibe_id, instagram_id, club, assigned_zone_id)")
        .eq("event_id", eventId),
      getCachedEventLevels(eventId),
      supabaseAdmin
        .from("experience_completions")
        .select("profile_id, xp_earned, completed_at, experiences(zone_id)")
        .eq("event_id", eventId),
      getCachedEventZones(eventId),
    ]);

    const members = membersRes.data || [];
    const completions = compsRes.data || [];
    const zonesMap = new Map((zones || []).map((z: any) => [z.id, z.name]));

    // Aggregate by profile
    const profileAggregates = new Map<
      string,
      {
        totalXP: number;
        completionsCount: number;
        zonesVisited: Set<string>;
        earliestTime: number;
      }
    >();

    completions.forEach((c: any) => {
      let agg = profileAggregates.get(c.profile_id);
      if (!agg) {
        agg = {
          totalXP: 0,
          completionsCount: 0,
          zonesVisited: new Set<string>(),
          earliestTime: new Date(c.completed_at).getTime(),
        };
        profileAggregates.set(c.profile_id, agg);
      }
      agg.totalXP += c.xp_earned || 0;
      agg.completionsCount += 1;
      if (c.experiences?.zone_id) {
        agg.zonesVisited.add(c.experiences.zone_id);
      }
      const time = new Date(c.completed_at).getTime();
      if (time < agg.earliestTime) {
        agg.earliestTime = time;
      }
    });

    const entries: (LeaderboardEntry & { zonesCount: number; earliestTime: number })[] = members.map((m: any) => {
      const p = m.profiles;
      const agg = profileAggregates.get(m.profile_id) || {
        totalXP: 0,
        completionsCount: 0,
        zonesVisited: new Set<string>(),
        earliestTime: Infinity,
      };

      let level = levels[0] || {
        id: "lvl-1",
        name: "🌱 VIBE Newbie",
        sort_order: 1,
        min_xp: 0,
      };

      for (const lvl of levels) {
        if (agg.totalXP >= lvl.min_xp) {
          level = lvl;
        }
      }

      return {
        rank: 0,
        profile_id: p.id,
        display_name: p.display_name,
        vibe_id: p.vibe_id,
        instagram_id: p.instagram_id || undefined,
        club: p.club || "Rotaract Member",
        assigned_zone_name: p.assigned_zone_id ? zonesMap.get(p.assigned_zone_id) : undefined,
        total_xp: agg.totalXP,
        level_name: level.name,
        level_order: level.sort_order,
        completions_count: agg.completionsCount,
        zonesCount: agg.zonesVisited.size,
        earliestTime: agg.earliestTime,
      };
    });

    // Sort descending by XP
    entries.sort((a, b) => {
      if (b.total_xp !== a.total_xp) return b.total_xp - a.total_xp;
      if (b.zonesCount !== a.zonesCount) return b.zonesCount - a.zonesCount;
      if (b.completions_count !== a.completions_count) {
        return b.completions_count - a.completions_count;
      }
      if (a.earliestTime !== b.earliestTime) return a.earliestTime - b.earliestTime;
      return a.display_name.localeCompare(b.display_name);
    });

    const rankMap = new Map<string, LeaderboardEntry>();
    entries.forEach((entry, idx) => {
      entry.rank = idx + 1;
      rankMap.set(entry.profile_id, entry);
    });

    cachedLeaderboardData = {
      eventId,
      timestamp: Date.now(),
      entries,
      rankMap,
    };

    const paged = entries.slice(offset, offset + limit);

    return {
      entries: paged,
      totalParticipants: entries.length,
    };
  }

  // Memory fallback
  const mockEntries = mockDb.getLeaderboard(eventId, 1000);
  const formatted: LeaderboardEntry[] = mockEntries.map((e) => ({
    rank: e.rank,
    profile_id: e.profile_id,
    display_name: e.display_name,
    vibe_id: e.vibe_id,
    instagram_id: e.instagram_id,
    club: e.club,
    assigned_zone_name: e.assigned_zone_name,
    total_xp: e.xp,
    level_name: e.level,
    level_order: e.level_number,
    completions_count: e.experiences_completed_count,
  }));

  const paged = formatted.slice(offset, offset + limit);

  return {
    entries: paged,
    totalParticipants: formatted.length,
  };
}

export async function getUserLeaderboardRank(
  eventId: string,
  profileId: string
): Promise<LeaderboardEntry | null> {
  // Fast path: if cached, resolve in O(1) time with 0 network calls
  if (
    cachedLeaderboardData &&
    cachedLeaderboardData.eventId === eventId &&
    Date.now() - cachedLeaderboardData.timestamp < LEADERBOARD_CACHE_TTL_MS
  ) {
    return cachedLeaderboardData.rankMap.get(profileId) || null;
  }

  const { entries } = await getLeaderboard(eventId, 1000, 0);
  if (cachedLeaderboardData?.rankMap) {
    return cachedLeaderboardData.rankMap.get(profileId) || null;
  }
  return entries.find((e) => e.profile_id === profileId) || null;
}

// Zone Battle Competition: Ranked strictly by VIBE Coins collected (Section 27 & 33)
export async function getZoneLeaderboard(eventId: string): Promise<ZoneLeaderboardEntry[]> {
  if (
    cachedZoneLeaderboard &&
    cachedZoneLeaderboard.eventId === eventId &&
    Date.now() - cachedZoneLeaderboard.timestamp < LEADERBOARD_CACHE_TTL_MS
  ) {
    return cachedZoneLeaderboard.entries;
  }

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const zones = await getCachedEventZones(eventId);

    if (zones && zones.length > 0) {
      // Fetch real completions to count per zone
      const { data: comps } = await supabaseAdmin
        .from("experience_completions")
        .select("profile_id, xp_earned, experiences(zone_id)")
        .eq("event_id", eventId);

      const zoneStatsMap = new Map<string, { participants: Set<string>; compsCount: number; totalXP: number }>();
      (comps || []).forEach((c: any) => {
        const zId = c.experiences?.zone_id;
        if (zId) {
          let s = zoneStatsMap.get(zId);
          if (!s) {
            s = { participants: new Set<string>(), compsCount: 0, totalXP: 0 };
            zoneStatsMap.set(zId, s);
          }
          s.participants.add(c.profile_id);
          s.compsCount += 1;
          s.totalXP += c.xp_earned || 0;
        }
      });

      const list = zones.map((z: any) => {
        const coins = Number(z.coins_collected ?? z.map_data?.coins_collected ?? 0);
        const st = zoneStatsMap.get(z.id) || { participants: new Set<string>(), compsCount: 0, totalXP: 0 };
        return {
          rank: 0,
          zone_id: z.id,
          name: z.name,
          slug: z.slug,
          coins_collected: coins,
          participants_count: st.participants.size,
          experiences_completed_count: st.compsCount,
          stall_interactions_count: 0,
          games_played_count: 0,
          total_xp_generated: st.totalXP,
          completion_rate_percent: st.participants.size > 0 ? Math.min(100, Math.round((st.compsCount / st.participants.size) * 20)) : 0,
        };
      });

      // Rank descending by coins_collected, then by total XP
      list.sort((a, b) => b.coins_collected - a.coins_collected || b.total_xp_generated - a.total_xp_generated);
      list.forEach((z, idx) => {
        z.rank = idx + 1;
      });

      cachedZoneLeaderboard = {
        eventId,
        timestamp: Date.now(),
        entries: list,
      };

      return list;
    }
  }

  return mockDb.getZonalStats(eventId);
}
