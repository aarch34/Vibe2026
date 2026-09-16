"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Coins,
  Sparkles,
  Trophy,
  Play,
  ArrowLeft,
  Flame,
  Clock,
  Award,
} from "lucide-react";
import { formatCoins } from "@/lib/utils";
import { RotaractGame } from "./rotaract-game";
import { MinionRun } from "./minion-run";
import { MemoryGame } from "./memory-game";
import { VibeQuiz } from "./vibe-quiz";

interface GamesHubClientProps {
  userBalance: number;
}

export function GamesHubClient({ userBalance }: GamesHubClientProps) {
  const [activeGame, setActiveGame] = useState<
    "rotaract_game" | "minion_run" | "memory_game" | "vibe_quiz" | null
  >(null);

  const games = [
    {
      id: "rotaract_game" as const,
      title: "Rotaract Game",
      tagline: "Rotary & District Trivia Challenge",
      icon: "🎯",
      badge: "Trivia",
      badgeColor: "bg-blue-950/80 text-blue-400 border-blue-500/30",
      description: "Answer 5 questions about Rotaract and District 3192. Score ≥ 80% to win a +100 VIBE bonus!",
      cost: 50,
      rewardXP: "100 - 200 XP",
      bonus: "+100 VIBE (≥80%)",
      colorGradient: "from-blue-600/20 via-slate-900 to-slate-900 border-blue-500/30 hover:border-blue-400/60",
    },
    {
      id: "minion_run" as const,
      title: "Minion VIBE Run",
      tagline: "3-Lane Fast Reaction Arcade",
      icon: "🍌",
      badge: "Arcade",
      badgeColor: "bg-amber-950/80 text-amber-400 border-amber-500/30",
      description: "Dodge incoming waves, gather bananas & coins. Reach ≥ 120 points for +150 VIBE and double XP!",
      cost: 50,
      rewardXP: "100 - 300 XP",
      bonus: "+150 VIBE (≥120 pts)",
      colorGradient: "from-amber-600/20 via-slate-900 to-slate-900 border-amber-500/30 hover:border-amber-400/60",
    },
    {
      id: "memory_game" as const,
      title: "Memory Match",
      tagline: "Card Flip Visual Recall",
      icon: "🃏",
      badge: "Memory",
      badgeColor: "bg-purple-950/80 text-purple-400 border-purple-500/30",
      description: "Match all 6 pairs in a 12-card grid before time runs out. Clear in under 25s for speed bonus!",
      cost: 50,
      rewardXP: "100 - 250 XP",
      bonus: "+100 VIBE (<25s)",
      colorGradient: "from-purple-600/20 via-slate-900 to-slate-900 border-purple-500/30 hover:border-purple-400/60",
    },
    {
      id: "vibe_quiz" as const,
      title: "VIBE Festival Quiz",
      tagline: "Lore, Music & Culture",
      icon: "🌊",
      badge: "Tiered XP",
      badgeColor: "bg-cyan-950/80 text-cyan-400 border-cyan-500/30",
      description: "5 dynamic questions with 4-tier score XP payouts. Score 100% to take home +100 bonus coins!",
      cost: 50,
      rewardXP: "50 - 250 XP",
      bonus: "+100 VIBE (100%)",
      colorGradient: "from-cyan-600/20 via-slate-900 to-slate-900 border-cyan-500/30 hover:border-cyan-400/60",
    },
  ];

  if (activeGame) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveGame(null)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All 4 Games</span>
        </button>

        {activeGame === "rotaract_game" && (
          <RotaractGame
            userBalance={userBalance}
            onFinished={() => setActiveGame(null)}
          />
        )}
        {activeGame === "minion_run" && (
          <MinionRun
            userBalance={userBalance}
            onFinished={() => setActiveGame(null)}
          />
        )}
        {activeGame === "memory_game" && (
          <MemoryGame
            userBalance={userBalance}
            onFinished={() => setActiveGame(null)}
          />
        )}
        {activeGame === "vibe_quiz" && (
          <VibeQuiz
            userBalance={userBalance}
            onFinished={() => setActiveGame(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {games.map((g) => (
        <div
          key={g.id}
          className={`p-5 rounded-2xl bg-gradient-to-br ${g.colorGradient} border transition-all flex flex-col justify-between space-y-4 shadow-lg group`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{g.icon}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${g.badgeColor}`}>
                {g.badge}
              </span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                {g.title}
              </h3>
              <p className="text-[11px] font-medium text-slate-400">
                {g.tagline}
              </p>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {g.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Entry Fee</span>
                <span className="text-amber-400 font-bold">{g.cost} VIBE</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Rewards</span>
                <span className="text-purple-300 font-bold">{g.rewardXP}</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-amber-300 flex items-center space-x-1.5">
              <span>🏆</span>
              <span><strong>Bonus:</strong> {g.bonus}</span>
            </div>
          </div>

          <button
            onClick={() => setActiveGame(g.id)}
            disabled={userBalance < g.cost}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 text-xs font-black text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{userBalance < g.cost ? "Need 50 Coins" : `Play Now (${g.cost} VIBE)`}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
