"use client";

import React, { useState } from "react";
import { Gamepad2, Trophy, Sparkles, Play, Award, CheckCircle2, AlertCircle } from "lucide-react";
import { RotaractGame } from "./rotaract-game";
import { MinionGame } from "./minion-game";
import { MemoryGame } from "./memory-game";
import { VibeQuiz } from "./vibe-quiz";
import { GameType, Profile } from "@/types/database";

export interface GameItemSummary {
  bestScore: number;
  maxScore: number;
  bestTimeSeconds?: number;
  totalXp: number;
  attempts: number;
  completed: boolean;
}

export interface GameSummary {
  rotaract_game: GameItemSummary;
  minion_game: GameItemSummary;
  memory_game: GameItemSummary;
  vibe_quiz: GameItemSummary;
}

interface GamesHubProps {
  currentProfile: Profile;
  initialSummary: GameSummary;
}

export function GamesHub({ currentProfile, initialSummary }: GamesHubProps) {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [summary, setSummary] = useState<GameSummary>(initialSummary);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleScoreSubmit = async (gameType: GameType, score: number, maxScore: number, xp: number, timeSeconds?: number) => {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/games/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType, score, maxScore, timeSeconds }),
      });

      if (res.ok) {
        const data = await res.json();
        const actualXpEarned = data.xpEarned ?? xp;

        setSummary((prev) => {
          const current = prev[gameType];
          return {
            ...prev,
            [gameType]: {
              ...current,
              attempts: current.attempts + 1,
              completed: true,
              bestScore: Math.max(current.bestScore, score),
              totalXp: current.totalXp + actualXpEarned,
            },
          };
        });
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failed to save game results to server.");
      }
    } catch {
      setErrorMsg("Network error saving game results.");
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

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* YOUR GAMES History Summary Section */}
      {!activeGame && (
        <div className="p-5 rounded-3xl bg-card border border-border shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>YOUR GAME RESULTS HISTORY</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-muted-foreground">
              Total Games Played: {summary.rotaract_game.attempts + summary.minion_game.attempts + summary.memory_game.attempts + summary.vibe_quiz.attempts}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Rotaract Game */}
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/80 space-y-1 font-mono">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Rotaract Game</span>
              <p className="text-xs font-black text-foreground">
                Best: {summary.rotaract_game.completed ? `${summary.rotaract_game.bestScore}/10` : "Not Played"}
              </p>
              <p className="text-[10px] font-bold text-amber-400">XP: +{summary.rotaract_game.totalXp} XP</p>
            </div>

            {/* Minion Game */}
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/80 space-y-1 font-mono">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Minion Game</span>
              <p className="text-xs font-black text-foreground">
                Best: {summary.minion_game.completed ? `${summary.minion_game.bestScore} PTS` : "Not Played"}
              </p>
              <p className="text-[10px] font-bold text-yellow-400">XP: +{summary.minion_game.totalXp} XP</p>
            </div>

            {/* Memory Game */}
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/80 space-y-1 font-mono">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Memory Game</span>
              <p className="text-xs font-black text-foreground">
                Best: {summary.memory_game.completed ? `${summary.memory_game.bestScore} PTS` : "Not Played"}
              </p>
              <p className="text-[10px] font-bold text-pink-400">XP: +{summary.memory_game.totalXp} XP</p>
            </div>

            {/* VIBE Quiz */}
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/80 space-y-1 font-mono">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">VIBE Quiz</span>
              <p className="text-xs font-black text-foreground">
                Best: {summary.vibe_quiz.completed ? `${summary.vibe_quiz.bestScore}/10` : "Not Played"}
              </p>
              <p className="text-[10px] font-bold text-cyan-400">XP: +{summary.vibe_quiz.totalXp} XP</p>
            </div>
          </div>
        </div>
      )}

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
          onScoreSubmitted={(s, m, xp, timeSeconds) => handleScoreSubmit("memory_game", s, m, xp, timeSeconds)}
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">⚙️</span>
                <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
                  Up to +150 XP
                </span>
              </div>
              <h3 className="text-xl font-black text-foreground">1. ROTARACT GAME</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Test how well you know Rotaract, Rotary International, fellowship, leadership, and district initiatives.
              </p>

              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Best Score:</span>
                  <span className="font-bold text-foreground">
                    {summary.rotaract_game.completed ? `${summary.rotaract_game.bestScore}/10` : "None"}
                  </span>
                </div>
                <div className="flex justify-between text-purple-400 font-bold">
                  <span>XP Earned:</span>
                  <span>{summary.rotaract_game.totalXp} XP</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveGame("rotaract_game")}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{summary.rotaract_game.completed ? "PLAY AGAIN" : "PLAY NOW"}</span>
            </button>
          </div>

          {/* 2. VIBE MINION GAME */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-yellow-900/30 to-card border border-yellow-500/30 shadow-lg space-y-4 hover:border-yellow-400 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🍌</span>
                <span className="text-xs font-black text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/30">
                  25–100 XP
                </span>
              </div>
              <h3 className="text-xl font-black text-foreground">2. VIBE MINION GAME</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fast-reaction arcade catcher game! Tap glowing VIBE energy stars in 30 seconds to set a personal best.
              </p>

              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Best Score:</span>
                  <span className="font-bold text-foreground">
                    {summary.minion_game.completed ? `${summary.minion_game.bestScore} PTS` : "None"}
                  </span>
                </div>
                <div className="flex justify-between text-yellow-400 font-bold">
                  <span>XP Earned:</span>
                  <span>{summary.minion_game.totalXp} XP</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveGame("minion_game")}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 text-black font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>{summary.minion_game.completed ? "PLAY AGAIN" : "PLAY NOW"}</span>
            </button>
          </div>

          {/* 3. MEMORY GAME */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-pink-900/30 to-card border border-pink-500/30 shadow-lg space-y-4 hover:border-pink-400 transition-all flex flex-col justify-between">
            <div className="space-y-3">
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

              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Best Score:</span>
                  <span className="font-bold text-foreground">
                    {summary.memory_game.completed ? `${summary.memory_game.bestScore} PTS` : "None"}
                  </span>
                </div>
                <div className="flex justify-between text-pink-400 font-bold">
                  <span>XP Earned:</span>
                  <span>{summary.memory_game.totalXp} XP</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveGame("memory_game")}
              className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{summary.memory_game.completed ? "PLAY AGAIN" : "PLAY NOW"}</span>
            </button>
          </div>

          {/* 4. VIBE QUIZ */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-900/30 to-card border border-cyan-500/30 shadow-lg space-y-4 hover:border-cyan-400 transition-all flex flex-col justify-between">
            <div className="space-y-3">
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

              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Best Score:</span>
                  <span className="font-bold text-foreground">
                    {summary.vibe_quiz.completed ? `${summary.vibe_quiz.bestScore}/10` : "None"}
                  </span>
                </div>
                <div className="flex justify-between text-cyan-400 font-bold">
                  <span>XP Earned:</span>
                  <span>{summary.vibe_quiz.totalXp} XP</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveGame("vibe_quiz")}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>{summary.vibe_quiz.completed ? "PLAY AGAIN" : "PLAY NOW"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
