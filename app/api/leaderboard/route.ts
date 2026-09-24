import { NextResponse } from "next/server";
import { mockDb, calculateLevel } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { GameType, LeaderboardEntry, GameLeaderboardEntry } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "overall";

    if (type === "overall") {
      if (isUsingLiveSupabase() && supabaseAdmin) {
        try {
          const { data: supaProfiles } = await supabaseAdmin
            .from("profiles")
            .select("id, display_name, username, avatar_url, college, rotaract_club, xp, level_name, level_number, connections_count")
            .order("xp", { ascending: false })
            .limit(50);

          if (supaProfiles && supaProfiles.length > 0) {
            const entries: LeaderboardEntry[] = supaProfiles.map((p: any, idx: number) => {
              const lvl = calculateLevel(p.xp || 0);
              return {
                rank: idx + 1,
                profile_id: p.id,
                display_name: p.display_name || "VIBE Member",
                username: p.username || "attendee",
                avatar_url: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username || p.id}`,
                college: p.college || "Rotaract District 3192",
                rotaract_club: p.rotaract_club || "District 3192",
                total_xp: p.xp || 0,
                level_name: p.level_name || lvl.level_name,
                level_number: p.level_number || lvl.level_number,
                connections_count: p.connections_count || 0,
              };
            });
            return NextResponse.json({ success: true, entries });
          }
        } catch (err) {
          console.warn("Supabase leaderboard query fallback:", err);
        }
      }

      const entries = mockDb.getLeaderboard();
      return NextResponse.json({ success: true, entries });
    } else {
      if (isUsingLiveSupabase() && supabaseAdmin) {
        try {
          const { data: supaSessions } = await supabaseAdmin
            .from("game_sessions")
            .select("profile_id, score, played_at")
            .eq("game_type", type);

          if (supaSessions && supaSessions.length > 0) {
            const bestScoresMap = new Map<string, { highScore: number; gamesPlayed: number; playedAt: string }>();

            supaSessions.forEach((gs: any) => {
              const current = bestScoresMap.get(gs.profile_id) || { highScore: 0, gamesPlayed: 0, playedAt: gs.played_at };
              bestScoresMap.set(gs.profile_id, {
                highScore: Math.max(current.highScore, gs.score),
                gamesPlayed: current.gamesPlayed + 1,
                playedAt: gs.played_at,
              });
            });

            // Fetch profile data for these users
            const profileIds = Array.from(bestScoresMap.keys());
            const { data: profiles } = await supabaseAdmin
              .from("profiles")
              .select("id, display_name, username, avatar_url")
              .in("id", profileIds);

            const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

            const entries: GameLeaderboardEntry[] = [];
            bestScoresMap.forEach((val, profileId) => {
              const p = profileMap.get(profileId) || mockDb.getProfile(profileId);
              if (p) {
                entries.push({
                  rank: 0,
                  profile_id: p.id,
                  display_name: p.display_name,
                  username: p.username,
                  avatar_url: p.avatar_url,
                  high_score: val.highScore,
                  games_played: val.gamesPlayed,
                  played_at: val.playedAt,
                });
              }
            });

            entries.sort((a, b) => b.high_score - a.high_score);
            entries.forEach((entry, idx) => {
              entry.rank = idx + 1;
            });

            return NextResponse.json({ success: true, entries });
          }
        } catch (err) {
          console.warn("Supabase game leaderboard query fallback:", err);
        }
      }

      const entries = mockDb.getGameLeaderboard(type as GameType);
      return NextResponse.json({ success: true, entries });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
