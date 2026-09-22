"use client";

import React, { useState } from "react";
import { Gamepad2, Trophy, Sparkles, Play, Award } from "lucide-react";
import { RotaractGame } from "./rotaract-game";
import { MinionGame } from "./minion-game";
import { MemoryGame } from "./memory-game";
import { VibeQuiz } from "./vibe-quiz";
import { GameType } from "@/types/database";

interface GamesHubProps {
  currentProfileId: string;
}

export function GamesHub({ currentProfileId }: GamesHubProps) {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);

  const handleScoreSubmit = async (gameType: GameType, score: number, maxScore: number, xp: number) => {
    try {
      await fetch("/api/games/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType, score, maxScore }),
      });
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-purple-500/20 shadow-xl space-y-2">
        <div className="flex items-center space-x-2">
          <Gamepad2 className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            VIBE GAMES ARENA
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Play casual mobile games, test your Rotaract & event knowledge, set high scores, and climb the XP Leaderboard!
        </p>
      </div>

      {/* Active Modal / Game View */}
      {activeGame === "rotaract_game" && (
        <RotaractGame
          onScoreSubmitted={(s, m, xp) => handleScoreSubmit("rotaract_game", s, m, xp)}
          onClose={() => setActiveGame(null)}
        />
      )}

      {activeGame === "minion_game" && (
        <MinionGame
          onScoreSubmitted={(s, m, xp) => handleScoreSubmit("minion_game", s, m, xp)}
          onClose={() => setActiveGame(null)}
        />
      )}

      {activeGame === "memory_game" && (
        <MemoryGame
          onScoreSubmitted={(s, m, xp) => handleScoreSubmit("memory_game", s, m, xp)}
          onClose={() => setActiveGame(null)}
        />
      )}

      {activeGame === "vibe_quiz" && (
        <VibeQuiz
          onScoreSubmitted={(s, m, xp) => handleScoreSubmit("vibe_quiz", s, m, xp)}
          onClose={() => setActiveGame(null)}
        />
      )}

      {/* 4 Main Large Game Cards */}
      {!activeGame && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. ROTARACT GAME */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900/30 to-card border border-purple-500/30 shadow-lg space-y-4 hover:border-purple-400 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl">⚙️</span>
                <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
                  Up to +150 XP
                </span>
              </div>
              <h3 className="text-xl font-black text-foreground">1. ROTARACT GAME</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Test your knowledge on Rotaract, Rotary International, fellowship, leadership, and district initiatives.
              </p>
              <div className="text-[11px] text-muted-foreground font-mono">
                Rewards: 0–30% (25 XP) | 31–60% (50 XP) | 61–80% (100 XP) | 81–100% (150 XP)
              </div>
            </div>

            <button
              onClick={() => setActiveGame("rotaract_game")}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>PLAY ROTARACT GAME</span>
            </button>
          </div>

          {/* 2. VIBE MINION GAME */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-yellow-900/30 to-card border border-yellow-500/30 shadow-lg space-y-4 hover:border-yellow-400 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🍌</span>
                <span className="text-xs font-black text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/30">
                  25–100 XP + Bonus
                </span>
              </div>
              <h3 className="text-xl font-black text-foreground">2. VIBE MINION GAME</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fast-reaction arcade catcher game! Tap glowing VIBE energy stars in 30 seconds to set a personal best.
              </p>
              <div className="text-[11px] text-muted-foreground font-mono">
                Score-based performance scaling with personal best rewards.
              </div>
            </div>

            <button
              onClick={() => setActiveGame("minion_game")}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 text-black font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>PLAY MINION GAME</span>
            </button>
          </div>

          {/* 3. MEMORY GAME */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-pink-900/30 to-card border border-pink-500/30 shadow-lg space-y-4 hover:border-pink-400 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🧠</span>
                <span className="text-xs font-black text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/30">
                  50–100 XP
                </span>
              </div>
              <h3 className="text-xl font-black text-foreground">3. MEMORY GAME</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Flip & match hidden VIBE card pairs. Tracks completion time, total moves, and grants fast completion bonuses!
              </p>
              <div className="text-[11px] text-muted-foreground font-mono">
                Completion = 50 XP | Fast = 75 XP | Personal Best = 100 XP
              </div>
            </div>

            <button
              onClick={() => setActiveGame("memory_game")}
              className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>PLAY MEMORY GAME</span>
            </button>
          </div>

          {/* 4. VIBE QUIZ */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-900/30 to-card border border-cyan-500/30 shadow-lg space-y-4 hover:border-cyan-400 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🔮</span>
                <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                  Up to +150 XP
                </span>
              </div>
              <h3 className="text-xl font-black text-foreground">4. VIBE QUIZ</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pop culture, music, movies, and VIBE event lore quiz! Answer correctly to score maximum XP.
              </p>
              <div className="text-[11px] text-muted-foreground font-mono">
                Rewards: 0–30% (25 XP) | 31–60% (50 XP) | 61–80% (100 XP) | 81–100% (150 XP)
              </div>
            </div>

            <button
              onClick={() => setActiveGame("vibe_quiz")}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>PLAY VIBE QUIZ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
