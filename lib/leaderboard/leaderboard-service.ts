import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { LeaderboardEntry, Level } from "@/types/database";

export async function getLeaderboard(
  eventId: string,
  limit = 50,
  offset = 0
): Promise<{ entries: LeaderboardEntry[]; totalParticipants: number }> {
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [membersRes, levelsRes, compsRes] = await Promise.all([
      supabaseAdmin
        .from("event_members")
        .select("profile_id, profiles(id, display_name, vibe_id)")
        .eq("event_id", eventId),
      supabaseAdmin
        .from("levels")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("experience_completions")
        .select("profile_id, xp_earned, completed_at, experiences(zone_id)")
        .eq("event_id", eventId),
    ]);

    const levels: Level[] = levelsRes.data || [];
    const members = membersRes.data || [];
    const completions = compsRes.data || [];

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
        total_xp: agg.totalXP,
        level_name: level.name,
        level_order: level.sort_order,
        completions_count: agg.completionsCount,
        zonesCount: agg.zonesVisited.size,
        earliestTime: agg.earliestTime,
      };
    });

    // Sort descending with 3-tier tie-breakers:
    // Primary: Total XP
    // Tie-breaker 1: Passport zones visited count
    // Tie-breaker 2: Experiences completed count
    // Tie-breaker 3: Earliest timestamp
    entries.sort((a, b) => {
      if (b.total_xp !== a.total_xp) return b.total_xp - a.total_xp;
      if (b.zonesCount !== a.zonesCount) return b.zonesCount - a.zonesCount;
      if (b.completions_count !== a.completions_count) {
        return b.completions_count - a.completions_count;
      }
      if (a.earliestTime !== b.earliestTime) return a.earliestTime - b.earliestTime;
      return a.display_name.localeCompare(b.display_name);
    });

    entries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    const paged = entries.slice(offset, offset + limit);

    return {
      entries: paged,
      totalParticipants: entries.length,
    };
  }

  // Memory fallback
  const profiles = Array.from(mockDb.profiles.values());
  const levels = mockDb.levels.sort((a, b) => a.sort_order - b.sort_order);

  const aggregated: LeaderboardEntry[] = profiles.map((p) => {
    const userComps = mockDb.completions.filter(
      (c) => c.event_id === eventId && c.profile_id === p.id
    );
    const totalXP = userComps.reduce((sum, c) => sum + c.xp_earned, 0);

    let level = levels[0];
    for (const lvl of levels) {
      if (totalXP >= lvl.min_xp) {
        level = lvl;
      }
    }

    return {
      rank: 0,
      profile_id: p.id,
      display_name: p.display_name,
      vibe_id: p.vibe_id,
      total_xp: totalXP,
      level_name: level.name,
      level_order: level.sort_order,
      completions_count: userComps.length,
    };
  });

  aggregated.sort((a, b) => {
    if (b.total_xp !== a.total_xp) return b.total_xp - a.total_xp;
    if (b.completions_count !== a.completions_count) {
      return b.completions_count - a.completions_count;
    }
    return a.display_name.localeCompare(b.display_name);
  });

  aggregated.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  const paged = aggregated.slice(offset, offset + limit);

  return {
    entries: paged,
    totalParticipants: aggregated.length,
  };
}

export async function getUserLeaderboardRank(
  eventId: string,
  profileId: string
): Promise<LeaderboardEntry | null> {
  const { entries } = await getLeaderboard(eventId, 1000, 0);
  return entries.find((e) => e.profile_id === profileId) || null;
}
