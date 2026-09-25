import { NextResponse } from "next/server";
import { mockDb, calculateLevel } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { GameType, LeaderboardEntry, GameLeaderboardEntry } from "@/types/database";
import { getCachedLeaderboard, setCachedLeaderboard } from "@/lib/cache/app-cache";
import { getCurrentUserSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "overall";
    const bypassCache = searchParams.get("nocache") === "true" || searchParams.has("_t");

    let currentUserId: string | null = null;
    try {
      const session = await getCurrentUserSession();
      currentUserId = session?.profile?.id || null;
    } catch {
      // unauthenticated or background
    }

    // Return from shared cache if fresh (<5s) and not explicitly bypassing cache
    if (!bypassCache) {
      const cached = getCachedLeaderboard(type);
      if (cached) {
        return NextResponse.json(
          { ...cached, currentUserId },
          { headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" } }
        );
      }
    }

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
                level_name: lvl.level_name,
                level_number: lvl.level_number,
                connections_count: p.connections_count || 0,
              };
            });

            // Find or compute current user rank & summary
            let currentUserSummary: any = null;
            if (currentUserId) {
              const inList = entries.find((e) => e.profile_id === currentUserId);
              if (inList) {
                currentUserSummary = { ...inList };
              } else {
                try {
                  const { data: myProf } = await supabaseAdmin
                    .from("profiles")
                    .select("id, display_name, username, avatar_url, college, rotaract_club, xp")
                    .eq("id", currentUserId)
                    .single();

                  if (myProf) {
                    const { count } = await supabaseAdmin
                      .from("profiles")
                      .select("id", { count: "exact", head: true })
                      .gt("xp", myProf.xp || 0);

                    const lvl = calculateLevel(myProf.xp || 0);
                    currentUserSummary = {
                      rank: (count || 0) + 1,
                      profile_id: myProf.id,
                      display_name: myProf.display_name,
                      username: myProf.username,
                      avatar_url: myProf.avatar_url,
                      college: myProf.college,
                      rotaract_club: myProf.rotaract_club,
                      total_xp: myProf.xp || 0,
                      level_name: lvl.level_name,
                      level_number: lvl.level_number,
                      connections_count: 0,
                    };
                  }
                } catch {
                  // ignore
                }
              }
            }

            const payload = { success: true, entries, currentUserId, currentUserSummary };
            setCachedLeaderboard("overall", payload);
            return NextResponse.json(payload, {
              headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
            });
          }
        } catch (err) {
          console.warn("Supabase leaderboard query fallback:", err);
        }
      }

      const entries = mockDb.getLeaderboard().map((e) => {
        const lvl = calculateLevel(e.total_xp || 0);
        return {
          ...e,
          level_name: lvl.level_name,
          level_number: lvl.level_number,
        };
      });

      let currentUserSummary: any = null;
      if (currentUserId) {
        const inList = entries.find((e) => e.profile_id === currentUserId);
        if (inList) currentUserSummary = { ...inList };
      }

      const payload = { success: true, entries, currentUserId, currentUserSummary };
      setCachedLeaderboard("overall", payload);
      return NextResponse.json(payload, {
        headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
      });
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

            const payload = { success: true, entries, currentUserId };
            setCachedLeaderboard(type, payload);
            return NextResponse.json(payload, {
              headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
            });
          }
        } catch (err) {
          console.warn("Supabase game leaderboard query fallback:", err);
        }
      }

      const entries = mockDb.getGameLeaderboard(type as GameType);
      const payload = { success: true, entries, currentUserId };
      setCachedLeaderboard(type, payload);
      return NextResponse.json(payload, {
        headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
      });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
