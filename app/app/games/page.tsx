import React from "react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { GamesHub, GameSummary } from "@/components/games/games-hub";
import { getCachedUserGameSummary, setCachedUserGameSummary } from "@/lib/cache/app-cache";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const session = await getCurrentUserSession();
  const currentProfile = mockDb.getProfile(session.profile.id) || session.profile;

  // Check cache for this attendee
  const cachedSummary = getCachedUserGameSummary(currentProfile.id);
  if (cachedSummary) {
    return <GamesHub currentProfile={currentProfile} initialSummary={cachedSummary} />;
  }

  const initialSummary: GameSummary = {
    flappy_rocco: { bestScore: 0, maxScore: 1500, totalXp: 0, attempts: 0, completed: false },
    rotaract_quiz: { bestScore: 0, maxScore: 10, totalXp: 0, attempts: 0, completed: false },
    sanjay_run: { bestScore: 0, maxScore: 2000, totalXp: 0, attempts: 0, completed: false },
  };

  if (isUsingLiveSupabase() && supabaseAdmin) {
    try {
      const { data: dbSessions } = await supabaseAdmin
        .from("game_sessions")
        .select("game_type, score, max_score, xp_earned")
        .eq("profile_id", currentProfile.id);

      if (dbSessions && dbSessions.length > 0) {
        dbSessions.forEach((gs: any) => {
          const item = initialSummary[gs.game_type as keyof GameSummary];
          if (item) {
            item.attempts += 1;
            item.completed = true;
            item.bestScore = Math.max(item.bestScore, gs.score);
            item.totalXp += gs.xp_earned || 0;
          }
        });
      }
    } catch (err) {
      console.warn("Could not load game sessions from Supabase:", err);
    }
  }

  setCachedUserGameSummary(currentProfile.id, initialSummary);

  return <GamesHub currentProfile={currentProfile} initialSummary={initialSummary} />;
}
