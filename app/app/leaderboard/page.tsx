"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Award, Gamepad2, Sparkles, Users, Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaderboardEntry, GameLeaderboardEntry, GameType } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptionalLiveStats } from "@/components/providers/live-stats-provider";
import { calculateLevel } from "@/lib/db/mock-store";

export default function LeaderboardPage() {
  const liveStats = useOptionalLiveStats();
  const [activeTab, setActiveTab] = useState<"overall" | GameType>("overall");
  const [overallEntries, setOverallEntries] = useState<LeaderboardEntry[]>([]);
  const [gameEntries, setGameEntries] = useState<GameLeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserSummary, setCurrentUserSummary] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // Clear legacy permanent cache on mount so user always gets live verified XP
  useEffect(() => {
    try {
      sessionStorage.removeItem("vibe_leaderboard_cache_v1");
    } catch { /* ignore */ }
  }, []);

  const fetchLeaderboard = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      // Use cache-busting timestamp and no-cache header to always get live, verified database scores
      const res = await fetch(`/api/leaderboard?type=${activeTab}&_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        const entries = data.entries || [];
        if (data.currentUserId) setCurrentUserId(data.currentUserId);
        if (data.currentUserSummary) setCurrentUserSummary(data.currentUserSummary);

        if (activeTab === "overall") {
          setOverallEntries(entries);
        } else {
          setGameEntries(entries);
        }
      }
    } catch {
      // Fallback local fetch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(true);
  }, [activeTab]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="font-mono text-sm font-black text-muted-foreground">#{rank}</span>;
  };

  const displayUserXp = liveStats?.xp ?? currentUserSummary?.total_xp ?? 0;
  const userLevel = calculateLevel(displayUserXp);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-500/10 border border-amber-500/30 shadow-xl space-y-2">
        <div className="flex items-center space-x-2">
          <Trophy className="w-7 h-7 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            VIBE LEADERBOARD
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Rankings based on total verified XP and game high scores. Climb the leaderboard before VIBE 2026!
        </p>
      </div>

      {/* Your Standing Banner (Live & Verified) */}
      {currentUserSummary && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-amber-500/15 border-2 border-pink-500/50 shadow-xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={currentUserSummary.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                alt={currentUserSummary.display_name}
                className="w-12 h-12 rounded-full border-2 border-pink-500 object-cover shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-pink-500 text-white font-mono text-[9px] font-black uppercase tracking-wider shadow">
                YOU
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base text-foreground truncate">
                  {currentUserSummary.display_name}
                </h3>
                <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                  {userLevel.level_name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your Official Rank: <span className="font-extrabold text-foreground font-mono">#{currentUserSummary.rank}</span> on VIBE 2026
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground">Your Verified XP</div>
            <div className="text-base sm:text-lg font-mono font-black text-amber-400">
              ⭐ {displayUserXp.toLocaleString()} XP
            </div>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab("overall")}
          className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 border flex items-center space-x-1.5",
            activeTab === "overall"
              ? "bg-amber-500 text-black border-amber-400 shadow-md"
              : "bg-card text-muted-foreground border-border hover:bg-secondary"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>OVERALL XP</span>
        </button>

        <button
          onClick={() => setActiveTab("flappy_rocco")}
          className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 border flex items-center space-x-1.5",
            activeTab === "flappy_rocco"
              ? "bg-pink-500 text-white border-pink-400 shadow-md"
              : "bg-card text-muted-foreground border-border hover:bg-secondary"
          )}
        >
          <span>🐦 ROCO Flappie</span>
        </button>

        <button
          onClick={() => setActiveTab("sanjay_run")}
          className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 border flex items-center space-x-1.5",
            activeTab === "sanjay_run"
              ? "bg-emerald-500 text-black border-emerald-400 shadow-md"
              : "bg-card text-muted-foreground border-border hover:bg-secondary"
          )}
        >
          <span>🏃 Sanjay Run</span>
        </button>

        <button
          onClick={() => setActiveTab("rotaract_quiz")}
          className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 border flex items-center space-x-1.5",
            activeTab === "rotaract_quiz"
              ? "bg-cyan-500 text-black border-cyan-400 shadow-md"
              : "bg-card text-muted-foreground border-border hover:bg-secondary"
          )}
        >
          <span>🔮 Rotaract Quiz</span>
        </button>
      </div>

      {/* Leaderboard Table / List */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="divide-y divide-border/60">
            <div className="px-6 py-3 bg-secondary/50 flex items-center justify-between text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider">
              <span className="w-12 text-center">Rank</span>
              <span className="flex-1">Member</span>
              <span className="w-24 text-center hidden sm:inline-block">Level</span>
              <span className="w-28 text-right">Score</span>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div className="w-12 text-center flex justify-center shrink-0">
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
                <div className="flex-1 flex items-center space-x-3 pr-2 min-w-0">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="w-24 hidden sm:flex justify-center shrink-0">
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="w-28 flex justify-end shrink-0">
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "overall" ? (
          <div className="divide-y divide-border/60">
            <div className="px-6 py-3 bg-secondary/50 flex items-center justify-between text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider">
              <span className="w-12 text-center">Rank</span>
              <span className="flex-1">Member</span>
              <span className="w-24 text-center hidden sm:inline-block">Level</span>
              <span className="w-28 text-right">Total XP</span>
            </div>

            {overallEntries.map((entry) => {
              const isCurrentUser = Boolean(currentUserId && entry.profile_id === currentUserId);
              return (
                <div
                  key={entry.profile_id}
                  className={cn(
                    "px-6 py-4 flex items-center justify-between transition-colors",
                    isCurrentUser
                      ? "bg-pink-500/10 hover:bg-pink-500/15 border-l-4 border-pink-500 shadow-sm"
                      : "hover:bg-secondary/30"
                  )}
                >
                  <div className="w-12 text-center shrink-0">{getRankBadge(entry.rank)}</div>

                  <div className="flex-1 flex items-center space-x-3 min-w-0 pr-2">
                    <Link href={`/app/profile?id=${entry.profile_id}`} className="relative shrink-0">
                      <img
                        src={entry.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                        alt={entry.display_name}
                        className={cn(
                          "w-10 h-10 rounded-full object-cover shrink-0",
                          isCurrentUser ? "border-2 border-pink-500" : "border border-amber-500/30"
                        )}
                      />
                    </Link>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/app/profile?id=${entry.profile_id}`}
                          className={cn(
                            "font-black text-sm block truncate transition-colors",
                            isCurrentUser ? "text-pink-400 hover:text-pink-300" : "text-foreground hover:text-amber-400"
                          )}
                        >
                          {entry.display_name}
                        </Link>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.5 rounded-full bg-pink-500 text-white font-mono text-[9px] font-black uppercase tracking-wider shrink-0 shadow">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground block truncate">
                        @{entry.username} • {entry.college}
                      </span>
                    </div>
                  </div>

                  <div className="w-24 text-center text-xs font-extrabold text-purple-400 hidden sm:block shrink-0">
                    {entry.level_name}
                  </div>

                  <div className="w-28 text-right font-mono font-black text-amber-400 text-sm shrink-0">
                    ⭐ {entry.total_xp.toLocaleString()} XP
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            <div className="px-6 py-3 bg-secondary/50 flex items-center justify-between text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider">
              <span className="w-12 text-center">Rank</span>
              <span className="flex-1">Player</span>
              <span className="w-24 text-center hidden sm:inline-block">Games Played</span>
              <span className="w-28 text-right">High Score</span>
            </div>

            {gameEntries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No high scores recorded for this game yet! Be the first to play.
              </div>
            ) : (
              gameEntries.map((entry) => {
                const isCurrentUser = Boolean(currentUserId && entry.profile_id === currentUserId);
                return (
                  <div
                    key={entry.profile_id}
                    className={cn(
                      "px-6 py-4 flex items-center justify-between transition-colors",
                      isCurrentUser
                        ? "bg-purple-500/10 hover:bg-purple-500/15 border-l-4 border-purple-500 shadow-sm"
                        : "hover:bg-secondary/30"
                    )}
                  >
                    <div className="w-12 text-center shrink-0">{getRankBadge(entry.rank)}</div>

                    <div className="flex-1 flex items-center space-x-3 min-w-0 pr-2">
                      <Link href={`/app/profile?id=${entry.profile_id}`} className="relative shrink-0">
                        <img
                          src={entry.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                          alt={entry.display_name}
                          className={cn(
                            "w-10 h-10 rounded-full object-cover shrink-0",
                            isCurrentUser ? "border-2 border-purple-500" : "border border-purple-500/30"
                          )}
                        />
                      </Link>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/app/profile?id=${entry.profile_id}`}
                            className={cn(
                              "font-black text-sm block truncate transition-colors",
                              isCurrentUser ? "text-purple-400 hover:text-purple-300" : "text-foreground hover:text-purple-400"
                            )}
                          >
                            {entry.display_name}
                          </Link>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 rounded-full bg-purple-500 text-white font-mono text-[9px] font-black uppercase tracking-wider shrink-0 shadow">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground block truncate">
                          @{entry.username}
                        </span>
                      </div>
                    </div>

                    <div className="w-24 text-center text-xs font-bold text-muted-foreground hidden sm:block shrink-0">
                      {entry.games_played} played
                    </div>

                    <div className="w-28 text-right font-mono font-black text-cyan-400 text-sm shrink-0">
                      {entry.high_score.toLocaleString()} {activeTab === "sanjay_run" ? "M" : "PTS"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
