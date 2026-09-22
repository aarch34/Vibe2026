"use server";

import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { GameType } from "@/types/database";

export async function submitGameScoreAction(gameType: GameType, score: number, maxScore: number) {
  const session = await getCurrentUserSession();
  return mockDb.submitGameScore(session.profile.id, gameType, score, maxScore);
}
