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

  const gameAuras: Record<string, { shadow: string; border: string; accent: string }> = {
    rotaract_game: { shadow: "hover:shadow-neon-cyan", border: "hover:border-[#00F0FF]", accent: "#00F0FF" },
    flappy_rocco: { shadow: "hover:shadow-neon-pink", border: "hover:border-[#FF1B7A]", accent: "#FF1B7A" },
    minion_run: { shadow: "hover:shadow-neon-gold", border: "hover:border-[#F59E0B]", accent: "#F59E0B" },
    memory_game: { shadow: "hover:shadow-neon-purple", border: "hover:border-[#8B5CF6]", accent: "#8B5CF6" },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {games.map((g) => {
        const aura = gameAuras[g.id] || { shadow: "hover:shadow-neon-pink", border: "hover:border-primary", accent: "#FF1B7A" };
        return (
          <div
            key={g.id}
            className={`p-5 bg-card text-card-foreground border-2 border-border shadow-[4px_4px_0px_#000] transition-all duration-200 flex flex-col justify-between space-y-4 group relative overflow-hidden ${aura.shadow} ${aura.border}`}
          >
            {/* Ambient Arcade Glow Strip */}
            <div
              className="absolute top-0 left-0 right-0 h-1 opacity-80"
              style={{ backgroundColor: aura.accent }}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl group-hover:scale-110 transition-transform">{g.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-muted text-foreground border-2 border-border shadow-[1px_1px_0px_var(--border)] font-mono">
                  {g.badge}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
                  {g.title}
                </h3>
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider font-mono">
                  {g.tagline}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
                  {g.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
                <div className="p-2.5 bg-muted/80 border-2 border-border shadow-[2px_2px_0px_var(--border)]">
                  <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider">Entry Fee</span>
                  <span className="text-emerald-400 font-black text-xs tracking-wider">100% FREE</span>
                </div>
                <div className="p-2.5 bg-muted/80 border-2 border-border shadow-[2px_2px_0px_var(--border)]">
                  <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider">Rewards</span>
                  <span className="text-purple-300 font-black text-xs">{g.rewardXP}</span>
                </div>
              </div>

              <div className="p-2.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-[11px] font-bold flex items-center space-x-2">
                <span className="text-sm">🏆</span>
                <span><strong className="text-cyan-300 font-mono font-black">Bonus:</strong> {g.bonus}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveGame(g.id)}
              className="w-full py-3 neo-btn-primary text-xs font-black uppercase tracking-wider space-x-2 flex items-center justify-center cursor-pointer shadow-[3px_3px_0px_#000] hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span>Play Now (Free)</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
