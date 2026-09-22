"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Award, Gamepad2, Sparkles, Users, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaderboardEntry, GameLeaderboardEntry, GameType } from "@/types/database";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"overall" | GameType>("overall");
  const [overallEntries, setOverallEntries] = useState<LeaderboardEntry[]>([]);
  const [gameEntries, setGameEntries] = useState<GameLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?type=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        if (activeTab === "overall") {
          setOverallEntries(data.entries || []);
        } else {
          setGameEntries(data.entries || []);
        }
      }
    } catch {
      // Fallback local fetch
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="font-mono text-sm font-black text-muted-foreground">#{rank}</span>;
  };

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
          onClick={() => setActiveTab("rotaract_game")}
          className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 border flex items-center space-x-1.5",
            activeTab === "rotaract_game"
              ? "bg-purple-600 text-white border-purple-400 shadow-md"
              : "bg-card text-muted-foreground border-border hover:bg-secondary"
          )}
        >
          <span>⚙️ Rotaract Game</span>
        </button>

        <button
          onClick={() => setActiveTab("minion_game")}
          className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 border flex items-center space-x-1.5",
            activeTab === "minion_game"
              ? "bg-yellow-500 text-black border-yellow-400 shadow-md"
              : "bg-card text-muted-foreground border-border hover:bg-secondary"
          )}
        >
          <span>🍌 Minion Run</span>
        </button>

        <button
          onClick={() => setActiveTab("memory_game")}
          className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 border flex items-center space-x-1.5",
            activeTab === "memory_game"
              ? "bg-pink-500 text-white border-pink-400 shadow-md"
              : "bg-card text-muted-foreground border-border hover:bg-secondary"
          )}
        >
          <span>🧠 Memory Match</span>
        </button>

        <button
          onClick={() => setActiveTab("vibe_quiz")}
          className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 border flex items-center space-x-1.5",
            activeTab === "vibe_quiz"
              ? "bg-cyan-500 text-black border-cyan-400 shadow-md"
              : "bg-card text-muted-foreground border-border hover:bg-secondary"
          )}
        >
          <span>🔮 VIBE Quiz</span>
        </button>
      </div>

      {/* Leaderboard Table / List */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
        {activeTab === "overall" ? (
          <div className="divide-y divide-border/60">
            <div className="px-6 py-3 bg-secondary/50 flex items-center justify-between text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider">
              <span className="w-12 text-center">Rank</span>
              <span className="flex-1">Member</span>
              <span className="w-24 text-center hidden sm:inline-block">Level</span>
              <span className="w-28 text-right">Total XP</span>
            </div>

            {overallEntries.map((entry) => (
              <div
                key={entry.profile_id}
                className="px-6 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
              >
                <div className="w-12 text-center shrink-0">{getRankBadge(entry.rank)}</div>

                <div className="flex-1 flex items-center space-x-3 min-w-0 pr-2">
                  <Link href={`/app/profile?id=${entry.profile_id}`}>
                    <img
                      src={entry.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                      alt={entry.display_name}
                      className="w-10 h-10 rounded-full border border-amber-500/30 object-cover shrink-0"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/app/profile?id=${entry.profile_id}`}
                      className="font-black text-sm text-foreground hover:text-amber-400 transition-colors block truncate"
                    >
                      {entry.display_name}
                    </Link>
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
            ))}
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
              gameEntries.map((entry) => (
                <div
                  key={entry.profile_id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                >
                  <div className="w-12 text-center shrink-0">{getRankBadge(entry.rank)}</div>

                  <div className="flex-1 flex items-center space-x-3 min-w-0 pr-2">
                    <Link href={`/app/profile?id=${entry.profile_id}`}>
                      <img
                        src={entry.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                        alt={entry.display_name}
                        className="w-10 h-10 rounded-full border border-purple-500/30 object-cover shrink-0"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={`/app/profile?id=${entry.profile_id}`}
                        className="font-black text-sm text-foreground hover:text-purple-400 transition-colors block truncate"
                      >
                        {entry.display_name}
                      </Link>
                      <span className="text-[11px] font-mono text-muted-foreground block truncate">
                        @{entry.username}
                      </span>
                    </div>
                  </div>

                  <div className="w-24 text-center text-xs font-bold text-muted-foreground hidden sm:block shrink-0">
                    {entry.games_played} played
                  </div>

                  <div className="w-28 text-right font-mono font-black text-cyan-400 text-sm shrink-0">
                    {entry.high_score.toLocaleString()} PTS
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
