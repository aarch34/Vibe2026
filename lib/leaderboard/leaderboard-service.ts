import { mockDb } from "@/lib/db/mock-store";
import { LeaderboardEntry } from "@/types/database";

export async function getLeaderboardEntries(eventId: string): Promise<LeaderboardEntry[]> {
  return mockDb.getLeaderboard();
}

export async function getCachedLeaderboard(eventId: string): Promise<LeaderboardEntry[]> {
  return mockDb.getLeaderboard();
}
