"use client";

import React, { useState } from "react";
import { Gamepad2, Trophy, Sparkles, Play, AlertCircle } from "lucide-react";
import { MinionGame } from "./minion-game";
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
  flappy_rocco: GameItemSummary;
  rotaract_quiz: GameItemSummary;
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
          Play ROCO Flappie or take the Rotaract Quiz — earn XP, set high scores, and climb the leaderboard!
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Score History */}
      {!activeGame && (
        <div className="p-5 rounded-3xl bg-card border border-border shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>YOUR GAME RESULTS</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-muted-foreground">
              Total Played: {summary.flappy_rocco.attempts + summary.rotaract_quiz.attempts}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* ROCO Flappie */}
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/80 space-y-1 font-mono">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">🐦 ROCO Flappie</span>
              <p className="text-xs font-black text-foreground">
                Best: {summary.flappy_rocco.completed ? `${summary.flappy_rocco.bestScore} PTS` : "Not Played"}
              </p>
              <p className="text-[10px] font-bold text-amber-400">XP: +{summary.flappy_rocco.totalXp} XP</p>
            </div>

            {/* Rotaract Quiz */}
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/80 space-y-1 font-mono">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">🔮 Rotaract Quiz</span>
              <p className="text-xs font-black text-foreground">
                Best: {summary.rotaract_quiz.completed ? `${summary.rotaract_quiz.bestScore}/10` : "Not Played"}
              </p>
              <p className="text-[10px] font-bold text-cyan-400">XP: +{summary.rotaract_quiz.totalXp} XP</p>
            </div>
          </div>
        </div>
      )}

      {/* Active Game Views */}
      {activeGame === "flappy_rocco" && (
        <MinionGame
          onScoreSubmitted={(s, m, xp) => handleScoreSubmit("flappy_rocco", s, m, xp)}
          onClose={() => setActiveGame(null)}
        />
      )}

      {activeGame === "rotaract_quiz" && (
        <VibeQuiz
          onScoreSubmitted={(s, m, xp) => handleScoreSubmit("rotaract_quiz", s, m, xp)}
          onClose={() => setActiveGame(null)}
        />
      )}

      {/* 2 Game Cards */}
      {!activeGame && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* 1. ROCO FLAPPIE */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-900/30 to-card border border-amber-500/30 shadow-lg space-y-4 hover:border-amber-400 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-4xl">🐦</span>
                <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  25–125 XP
                </span>
              </div>
              <h3 className="text-xl font-black text-foreground">1. ROCO FLAPPIE</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tap to keep ROCO flying through the pipes! Fast-reaction arcade action — tap glowing VIBE energy stars in 30 seconds and set a personal best.
              </p>

              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Best Score:</span>
                  <span className="font-bold text-foreground">
                    {summary.flappy_rocco.completed ? `${summary.flappy_rocco.bestScore} PTS` : "None"}
                  </span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>XP Earned:</span>
                  <span>{summary.flappy_rocco.totalXp} XP</span>
                </div>
              </div>
            </div>

            <button
              id="play-roco-flappie"
              onClick={() => setActiveGame("flappy_rocco")}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-black font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>{summary.flappy_rocco.completed ? "PLAY AGAIN" : "PLAY NOW"}</span>
            </button>
          </div>

          {/* 2. ROTARACT QUIZ */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-900/30 to-card border border-cyan-500/30 shadow-lg space-y-4 hover:border-cyan-400 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-4xl">🔮</span>
                <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                  Up to +150 XP
                </span>
              </div>
              <h3 className="text-xl font-black text-foreground">2. ROTARACT QUIZ</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                10-question quiz on Rotaract, ROCCO '26, District 3192, and event knowledge. Answer all correctly for maximum XP!
              </p>

              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Best Score:</span>
                  <span className="font-bold text-foreground">
                    {summary.rotaract_quiz.completed ? `${summary.rotaract_quiz.bestScore}/10` : "None"}
                  </span>
                </div>
                <div className="flex justify-between text-cyan-400 font-bold">
                  <span>XP Earned:</span>
                  <span>{summary.rotaract_quiz.totalXp} XP</span>
                </div>
              </div>
            </div>

            <button
              id="play-rotaract-quiz"
              onClick={() => setActiveGame("rotaract_quiz")}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>{summary.rotaract_quiz.completed ? "PLAY AGAIN" : "PLAY NOW"}</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
