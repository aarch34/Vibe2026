import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { LeaderboardEntry } from "@/types/database";

export async function getLeaderboard(
  eventId: string,
  limit = 20,
  offset = 0
): Promise<{ entries: LeaderboardEntry[]; totalParticipants: number }> {
  // Compute leaderboard from profiles and completions
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

  // Sort descending XP, tie-break on completions count, then display_name
  aggregated.sort((a, b) => {
    if (b.total_xp !== a.total_xp) return b.total_xp - a.total_xp;
    if (b.completions_count !== a.completions_count) {
      return b.completions_count - a.completions_count;
    }
    return a.display_name.localeCompare(b.display_name);
  });

  // Assign ranks
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
