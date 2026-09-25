import { NextResponse } from "next/server";
import { getCurrentUserSession, invalidateSessionCache } from "@/lib/auth/session";
import { mockDb, calculateLevel } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { socialStore } from "@/lib/db/social-store";
import { GameType } from "@/types/database";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { gameType, score, maxScore, xp, timeSeconds } = await req.json();

    if (!gameType || score === undefined) {
      return NextResponse.json({ success: false, error: "gameType and score required" }, { status: 400 });
    }

    const numScore = Number(score) || 0;
    const numMax = Number(maxScore) || 100;
    const profileId = session.profile.id;

    // Generous and progressive XP calculation
    // Always reward base participation + performance bonus so players always gain XP
    let xpAwarded = 25;
    const gameTitles: Record<string, string> = {
      flappy_rocco: "ROCO Flappie",
      rotaract_quiz: "Rotaract Quiz",
      sanjay_run: "Sanjay Run",
    };
    const title = gameTitles[gameType] || "VIBE Game";

    // Use frontend-calculated XP to match the UI perfectly,
    // otherwise fallback to backend conservative calculation
    let parsedXp: number | undefined;
    if (xp !== undefined && xp !== null && !isNaN(Number(xp))) {
      parsedXp = Number(xp);
    }
    
    if (parsedXp !== undefined) {
      xpAwarded = parsedXp;
    } else {
      if (gameType === "rotaract_quiz") {
        const pct = numMax > 0 ? (numScore / numMax) * 100 : 0;
        if (pct >= 81) xpAwarded = 150;
        else if (pct >= 61) xpAwarded = 100;
        else if (pct >= 31) xpAwarded = 50;
        else xpAwarded = 25;
      } else if (gameType === "flappy_rocco") {
        if (numScore >= 10) xpAwarded = 25;
        else if (numScore >= 5) xpAwarded = 15;
        else xpAwarded = 0;
      } else if (gameType === "sanjay_run") {
        if (numScore >= 1000) xpAwarded = 50;
        else if (numScore >= 500) xpAwarded = 25;
        else if (numScore >= 100) xpAwarded = 10;
        else xpAwarded = 0;
      }
    }

    // 1. Update in-memory mockDb
    if (!mockDb.getProfile(profileId)) {
      mockDb.profiles.set(profileId, { ...session.profile });
    }
    const memProfile = mockDb.getProfile(profileId);
    if (memProfile) {
      memProfile.games_played_count = (memProfile.games_played_count || 0) + 1;
    }

    const gameSession = {
      id: `gs-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      profile_id: profileId,
      game_type: gameType as GameType,
      score: Math.round(numScore),
      max_score: Math.round(numMax),
      xp_earned: xpAwarded,
      played_at: new Date().toISOString(),
    };
    mockDb.gameSessions.push(gameSession);

    if (xpAwarded > 0) {
      mockDb.addXpToProfile(
        profileId,
        xpAwarded,
        `Scored ${numScore} in ${title} (+${xpAwarded} XP)`
      );
    }

    // 2. Update Supabase if live
    let finalTotalXp = (session.profile.xp || 0) + xpAwarded;
    let finalGamesPlayed = (session.profile.games_played_count || 0) + 1;
    let newLevel = calculateLevel(finalTotalXp);

    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        // Record game session in Supabase game_sessions table
        await supabaseAdmin.from("game_sessions").insert({
          event_id: session.eventId || "a0000000-0000-0000-0000-000000000001",
          profile_id: profileId,
          game_type: gameType,
          score: Math.round(numScore),
          max_score: Math.round(numMax),
          coin_spent: 0,
          coin_earned: 0,
          xp_earned: xpAwarded,
          played_at: new Date().toISOString(),
        });

        // Get fresh profile XP from Supabase
        const { data: currentP } = await supabaseAdmin
          .from("profiles")
          .select("xp, games_played_count, level_number")
          .eq("id", profileId)
          .single();

        if (currentP) {
          finalTotalXp = (currentP.xp || 0) + xpAwarded;
          finalGamesPlayed = (currentP.games_played_count || 0) + 1;
          newLevel = calculateLevel(finalTotalXp);

          await supabaseAdmin
            .from("profiles")
            .update({
              xp: finalTotalXp,
              games_played_count: finalGamesPlayed,
              level_number: newLevel.level_number,
              level_name: newLevel.level_name,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profileId);

          // Check for Level Up!
          if (newLevel.level_number > (currentP.level_number || 1)) {
            await socialStore.createNotification({
              profile_id: profileId,
              type: "level_unlocked",
              title: `🎉 LEVEL UP! ${newLevel.badge} ${newLevel.level_name}`,
              message: `Incredible! You just unlocked Level ${newLevel.level_number}: ${newLevel.level_name}!`,
              link: "/app/profile",
            });
          }
        }

        // Send XP Earned notification
        if (xpAwarded > 0) {
          await socialStore.createNotification({
            profile_id: profileId,
            type: "xp_earned",
            title: `+${xpAwarded} XP Earned! 🎮`,
            message: `Great game! You scored ${numScore} in ${title} and earned +${xpAwarded} XP!`,
            link: "/app/games",
          });
        }
      } catch (err) {
        console.warn("Supabase game session recording warning:", err);
      }
    }

    // Invalidate session cache so all pages and headers reflect updated XP and level immediately
    invalidateSessionCache(session.clerkUserId);
    invalidateSessionCache(profileId);
    invalidateSessionCache();

    try {
      const { invalidateUserGameSummary, invalidateLeaderboardCache } = await import("@/lib/cache/app-cache");
      invalidateUserGameSummary(profileId);
      invalidateLeaderboardCache(gameType);
      invalidateLeaderboardCache("overall");
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      xpEarned: xpAwarded,
      newTotalXp: finalTotalXp,
      level: newLevel,
      gamesPlayed: finalGamesPlayed,
      message: `+${xpAwarded} XP earned! Keep playing to level up!`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
