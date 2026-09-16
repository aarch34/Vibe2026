"use server";

import { z } from "zod";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { GameType } from "@/types/database";

const playGameOverSchema = z.object({
  gameType: z.enum(["rotaract_game", "minion_run", "memory_game", "vibe_quiz"]),
  score: z.number().min(0),
  maxScore: z.number().min(1),
  coinCost: z.number().min(0).default(50),
  coinReward: z.number().min(0).default(0),
  xpReward: z.number().min(0).default(100),
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
      // 1. Lock wallet and check balance
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("*")
        .eq("event_id", session.eventId)
        .eq("profile_id", session.profile.id)
        .single();

      if (!wallet || wallet.balance < coinCost) {
        return {
          success: false,
          code: "INSUFFICIENT_COINS",
          message: `You need ${coinCost} VIBE Coins to play.`,
        };
      }

      const balBefore = wallet.balance;
      const netCoins = coinReward - coinCost;
      const newBal = balBefore + netCoins;

      // 2. Update wallet
      await supabaseAdmin
        .from("wallets")
        .update({ balance: newBal, version: wallet.version + 1, updated_at: new Date().toISOString() })
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

      // 3. Award XP
      if (xpReward > 0) {
        await supabaseAdmin.from("experience_completions").insert({
          event_id: session.eventId,
          profile_id: session.profile.id,
          experience_id: `game-${gameType}`,
          attempt_number: 1,
          coin_spent: coinCost,
          xp_earned: xpReward,
          coin_earned: coinReward,
          metadata: { type: "game_session", game_type: gameType, score },
        });
      }

      // 4. Record session
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

      return {
        success: true,
        balanceAfter: newBal,
        xpEarned: xpReward,
        coinsEarned: coinReward,
      };
    }

    return mockDb.recordGameSession(
      session.eventId,
      session.profile.id,
      gameType as GameType,
      score,
      maxScore,
      coinCost,
      coinReward,
      xpReward
    );
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to record game" };
  }
}
