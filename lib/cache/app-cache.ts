import { GameSummary } from "@/components/games/games-hub";

// ── LEADERBOARD CACHE ───────────────────────────────────────
interface CachedLeaderboard {
  data: any;
  timestamp: number;
}

const leaderboardCache = new Map<string, CachedLeaderboard>();
export const LEADERBOARD_CACHE_TTL_MS = 5_000; // 5s burst throttle, near real-time

export function getCachedLeaderboard(type: string): any | null {
  if (process.env.NODE_ENV === "test") return null;
  const cached = leaderboardCache.get(type);
  if (cached && Date.now() - cached.timestamp < LEADERBOARD_CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

export function setCachedLeaderboard(type: string, data: any) {
  if (process.env.NODE_ENV === "test") return;
  leaderboardCache.set(type, { data, timestamp: Date.now() });
}

export function invalidateLeaderboardCache(type?: string) {
  if (type) {
    leaderboardCache.delete(type);
  } else {
    leaderboardCache.clear();
  }
}

// ── GAMES SUMMARY CACHE ─────────────────────────────────────
interface CachedGameSummary {
  summary: GameSummary;
  timestamp: number;
}

const userGameSummaryCache = new Map<string, CachedGameSummary>();
export const GAME_SUMMARY_CACHE_TTL_MS = 60_000;

export function getCachedUserGameSummary(profileId: string): GameSummary | null {
  if (process.env.NODE_ENV === "test") return null;
  const cached = userGameSummaryCache.get(profileId);
  if (cached && Date.now() - cached.timestamp < GAME_SUMMARY_CACHE_TTL_MS) {
    return cached.summary;
  }
  return null;
}

export function setCachedUserGameSummary(profileId: string, summary: GameSummary) {
  if (process.env.NODE_ENV === "test") return;
  userGameSummaryCache.set(profileId, { summary, timestamp: Date.now() });
}

export function invalidateUserGameSummary(profileId?: string) {
  if (profileId) {
    userGameSummaryCache.delete(profileId);
  } else {
    userGameSummaryCache.clear();
  }
}
