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
import { FlappyRocco } from "./flappy-rocco";
import { MinionRun } from "./minion-run";
import { MemoryGame } from "./memory-game";

interface GamesHubClientProps {
  userBalance: number;
}

export function GamesHubClient({ userBalance }: GamesHubClientProps) {
  const [activeGame, setActiveGame] = useState<
    "rotaract_game" | "flappy_rocco" | "minion_run" | "memory_game" | null
  >(null);

  const games = [
    {
      id: "rotaract_game" as const,
      title: "Rotaract Game",
      tagline: "District & Rotary Trivia Challenge",
      icon: "🎯",
      badge: "Prestige Trivia",
      badgeColor: "bg-blue-950/80 text-blue-400 border-blue-500/30",
      description: "Answer 5 authentic, challenging questions on Rotaract history, governance, and District 3192. Score ≥ 80% to win bonus coins!",
      cost: 0,
      rewardXP: "+15 - 25 XP",
      bonus: "+10 VIBE (≥80%)",
      colorGradient: "from-blue-600/20 via-slate-900 to-slate-900 border-blue-500/30 hover:border-blue-400/60",
    },
    {
      id: "flappy_rocco" as const,
      title: "Flappy ROCCO",
      tagline: "Mascot Flap Obstacle Course",
      icon: "🦝",
      badge: "Skill Gate: 5+",
      badgeColor: "bg-pink-950/80 text-pink-400 border-pink-500/30",
      description: "Guide ROCCO through pulsing neon equalizer columns. Clear at least 5 pillars to unlock XP! Jump ≥ 10 pillars for bonus coins!",
      cost: 0,
      rewardXP: "0 / 15 / 25 XP",
      bonus: "+10 VIBE (≥10 pts)",
      colorGradient: "from-pink-600/20 via-slate-900 to-slate-900 border-pink-500/30 hover:border-pink-400/60",
    },
    {
      id: "minion_run" as const,
      title: "Minion VIBE Run",
      tagline: "3-Lane Fast Reaction Arcade",
      icon: "🍌",
      badge: "Lane Dodge",
      badgeColor: "bg-amber-950/80 text-amber-400 border-amber-500/30",
      description: "Dodge incoming waves, gather bananas & coins. Reach ≥ 120 points for bonus coins & maximum XP!",
      cost: 0,
      rewardXP: "+15 - 25 XP",
      bonus: "+10 VIBE (≥120 pts)",
      colorGradient: "from-amber-600/20 via-slate-900 to-slate-900 border-amber-500/30 hover:border-amber-400/60",
    },
    {
      id: "memory_game" as const,
      title: "Memory Match",
      tagline: "Card Flip Visual Recall",
      icon: "🃏",
      badge: "Recall Matrix",
      badgeColor: "bg-purple-950/80 text-purple-400 border-purple-500/30",
      description: "Match all 6 pairs in a 12-card grid before time runs out. Clear in under 25s for speed bonus!",
      cost: 0,
      rewardXP: "+10 - 25 XP",
      bonus: "+10 VIBE (<25s)",
      colorGradient: "from-purple-600/20 via-slate-900 to-slate-900 border-purple-500/30 hover:border-purple-400/60",
    },
  ];

  if (activeGame) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveGame(null)}
          className="neo-btn-card px-4 py-2 text-xs font-black uppercase tracking-wider space-x-2 cursor-pointer flex items-center"
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
        {activeGame === "flappy_rocco" && (
          <FlappyRocco
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
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {games.map((g) => (
        <div
          key={g.id}
          className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo transition-all flex flex-col justify-between space-y-4 group"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{g.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-muted text-foreground border-2 border-border">
                {g.badge}
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-foreground">
                {g.title}
              </h3>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                {g.tagline}
              </p>
              <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                {g.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
              <div className="p-2.5 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)]">
                <span className="text-[10px] text-muted-foreground block font-bold uppercase">Entry Fee</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">FREE</span>
              </div>
              <div className="p-2.5 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)]">
                <span className="text-[10px] text-muted-foreground block font-bold uppercase">Rewards</span>
                <span className="text-purple-600 dark:text-purple-300 font-black">{g.rewardXP}</span>
              </div>
            </div>

            <div className="p-2.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-[11px] font-bold flex items-center space-x-1.5">
              <span>🏆</span>
              <span><strong>Bonus:</strong> {g.bonus}</span>
            </div>
          </div>

          <button
            onClick={() => setActiveGame(g.id)}
            className="w-full py-3 neo-btn-primary text-xs font-black uppercase tracking-wider space-x-2 flex items-center justify-center cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Now (Free)</span>
          </button>
        </div>
      ))}
    </div>
  );
}
