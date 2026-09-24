"use server";

import { z } from "zod";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { GameType } from "@/types/database";

const GAME_EXPERIENCE_IDS: Record<string, string> = {
  rotaract_game: "e0000000-0000-0000-0000-000000000011",
  minion_run: "e0000000-0000-0000-0000-000000000012",
  memory_game: "e0000000-0000-0000-0000-000000000013",
  vibe_quiz: "e0000000-0000-0000-0000-000000000014",
  flappy_rocco: "e0000000-0000-0000-0000-000000000015",
};

const playGameOverSchema = z.object({
  gameType: z.enum(["rotaract_game", "minion_run", "memory_game", "vibe_quiz", "flappy_rocco"]),
  score: z.number().min(0),
  maxScore: z.number().min(1),
  coinCost: z.number().min(0).default(0),
  coinReward: z.number().min(0).default(0),
  xpReward: z.number().min(0).default(20),
});

export async function submitGameResultAction(rawInput: z.infer<typeof playGameOverSchema>) {
  const parsed = playGameOverSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  const { gameType, score, maxScore, coinCost, coinReward, xpReward } = parsed.data;

  try {
    const session = await getCurrentUserSession();

    if (isUsingLiveSupabase() && supabaseAdmin) {
      // 1. Lock wallet and check balance if coinCost > 0
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("*")
        .eq("event_id", session.eventId)
        .eq("profile_id", session.profile.id)
        .maybeSingle();

      const balBefore = wallet?.balance ?? 0;

      if (coinCost > 0 && balBefore < coinCost) {
        return {
          success: false,
          code: "INSUFFICIENT_COINS",
          message: `You need ${coinCost} VIBE Coins to play.`,
        };
      }

      const netCoins = coinReward - coinCost;
      const newBal = Math.max(0, balBefore + netCoins);

      // 2. Update wallet if there is a wallet and balance changed
      if (wallet && (coinCost > 0 || coinReward > 0)) {
        await supabaseAdmin
          .from("wallets")
          .update({
            balance: newBal,
            version: (wallet.version || 1) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", wallet.id);

        if (coinCost > 0) {
          await supabaseAdmin.from("wallet_transactions").insert({
            wallet_id: wallet.id,
            event_id: session.eventId,
            profile_id: session.profile.id,
            type: "spend",
            amount: coinCost,
            balance_before: balBefore,
            balance_after: balBefore - coinCost,
            source_type: "game_entry",
            metadata: { game_type: gameType },
          });
        }

        if (coinReward > 0) {
          await supabaseAdmin.from("wallet_transactions").insert({
            wallet_id: wallet.id,
            event_id: session.eventId,
            profile_id: session.profile.id,
            type: "earn",
            amount: coinReward,
            balance_before: balBefore - coinCost,
            balance_after: newBal,
            source_type: "game_win",
            metadata: { game_type: gameType, score },
          });
        }
      }

      // 3. Award XP directly to profile and update games_played_count
      if (xpReward > 0) {
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("xp, games_played_count")
          .eq("id", session.profile.id)
          .maybeSingle();

        if (prof) {
          await supabaseAdmin
            .from("profiles")
            .update({
              xp: (prof.xp || 0) + xpReward,
              games_played_count: (prof.games_played_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", session.profile.id);
        }
      }

      // 4. Safely attempt to record game session in game_sessions table
      try {
        await supabaseAdmin.from("game_sessions").insert({
          event_id: session.eventId,
          profile_id: session.profile.id,
          game_type: gameType,
          score,
          max_score: maxScore,
          coin_spent: coinCost,
          coin_earned: coinReward,
          xp_earned: xpReward,
        });
      } catch {
        // Table might not exist, ignore
      }

      return {
        success: true,
        balanceAfter: newBal,
        xpEarned: xpReward,
        coinsEarned: coinReward,
      };
    }

    // Mock fallback
    const res = mockDb.submitGameScore(
      session.profile.id,
      gameType as GameType,
      score,
      maxScore
    );

    return {
      success: true,
      balanceAfter: 0,
      xpEarned: res.xpEarned ?? xpReward,
      coinsEarned: coinReward,
    };
  } catch (err: any) {
    console.error("submitGameResultAction error:", err);
    return { success: false, message: err.message || "Failed to record game" };
  }
}

export async function submitGameScoreAction(gameType: GameType, score: number, maxScore: number) {
  const session = await getCurrentUserSession();
  return mockDb.submitGameScore(session.profile.id, gameType, score, maxScore);
}
