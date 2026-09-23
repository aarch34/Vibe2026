"use client";

import React, { useState, useEffect, useRef } from "react";
import { Trophy, Play, RotateCcw, Zap } from "lucide-react";

interface MinionGameProps {
  onScoreSubmitted: (score: number, maxScore: number, xp: number) => Promise<void>;
  onClose: () => void;
}

interface TargetItem {
  id: number;
  type: "minion" | "star" | "bolt";
  emoji: string;
  points: number;
  x: number;
  y: number;
}

export function MinionGame({ onScoreSubmitted, onClose }: MinionGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [target, setTarget] = useState<TargetItem>({
    id: 1,
    type: "minion",
    emoji: "🍌",
    points: 100,
    x: 50,
    y: 50,
  });
  const [hitEffects, setHitEffects] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto relocation timer when playing
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    let moveInterval: NodeJS.Timeout;

    if (isPlaying && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      // Auto move minion target every 1.1s if not caught
      moveInterval = setInterval(() => {
        spawnNewTarget();
      }, 1100);
    } else if (isPlaying && timeLeft === 0) {
      endGame();
    }

    return () => {
      clearInterval(timerInterval);
      clearInterval(moveInterval);
    };
  }, [isPlaying, timeLeft]);

  const spawnNewTarget = () => {
    const rx = Math.floor(Math.random() * 70) + 15;
    const ry = Math.floor(Math.random() * 65) + 15;
    const types: TargetItem["type"][] = ["minion", "minion", "star", "bolt"];
    const randType = types[Math.floor(Math.random() * types.length)];

    let emoji = "🍌";
    let points = 100;
    if (randType === "star") {
      emoji = "⭐";
      points = 200;
    } else if (randType === "bolt") {
      emoji = "⚡";
      points = 150;
    }

    setTarget({
      id: Date.now(),
      type: randType,
      emoji,
      points,
      x: rx,
      y: ry,
    });
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsFinished(false);
    setHitEffects([]);
    setIsPlaying(true);
    spawnNewTarget();
  };

  const handleCatch = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!isPlaying) return;

    const gained = target.points;
    const newScore = score + gained;
    setScore(newScore);

    // Floating text hit effect
    const hitId = Date.now();
    setHitEffects((prev) => [
      ...prev.slice(-4),
      { id: hitId, x: target.x, y: target.y, text: `+${gained}` },
    ]);

    setTimeout(() => {
      setHitEffects((prev) => prev.filter((h) => h.id !== hitId));
    }, 600);

    spawnNewTarget();
  };

  const endGame = async () => {
    setIsPlaying(false);
    setIsFinished(true);

    let xp = 25;
    if (score >= 1000) xp = 100;
    else if (score >= 600) xp = 75;
    else if (score >= 300) xp = 50;

    setXpEarned(xp);

    setIsSubmitting(true);
    try {
      await onScoreSubmitted(score, 1500, xp);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-card border border-yellow-500/40 max-w-xl mx-auto shadow-2xl space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-black text-lg text-yellow-400 flex items-center space-x-2">
          <span>🍌</span>
          <span>VIBE MINION GAME</span>
        </h3>
        <button onClick={onClose} className="text-xs font-bold text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {!isPlaying && !isFinished && (
        <div className="text-center py-8 space-y-5">
          <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center text-4xl animate-bounce shadow-[0_0_20px_rgba(250,204,21,0.4)]">
            🍌
          </div>
          <div className="space-y-1">
            <h4 className="text-xl font-black text-foreground">Catch the VIBE Minions & Energy Stars!</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Tap or click the moving Minions (🍌 100pts), Energy Bolts (⚡ 150pts) and Stars (⭐ 200pts) before time runs out!
            </p>
          </div>

          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 text-black font-black text-sm rounded-2xl shadow-xl flex items-center justify-center space-x-2 mx-auto transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>START GAME</span>
          </button>
        </div>
      )}

      {isPlaying && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-black font-mono px-2 py-1 bg-secondary/40 rounded-xl border border-border">
            <span className="text-yellow-400 text-sm flex items-center space-x-1">
              <span>Score:</span>
              <span className="font-mono text-foreground font-black text-base">{score} PTS</span>
            </span>
            <span className="text-pink-400 text-sm flex items-center space-x-1">
              <span>Timer:</span>
              <span className="font-mono text-foreground font-black text-base">{timeLeft}s</span>
            </span>
          </div>

          <div className="relative w-full h-72 sm:h-80 bg-gradient-to-b from-secondary/90 to-background rounded-2xl border-2 border-yellow-500/40 overflow-hidden touch-none cursor-pointer shadow-inner">
            {/* Target Catch Button */}
            <button
              key={target.id}
              onPointerDown={handleCatch}
              style={{ left: `${target.x}%`, top: `${target.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-400/20 border-2 border-yellow-400/80 flex items-center justify-center text-4xl sm:text-5xl shadow-[0_0_25px_rgba(250,204,21,0.6)] active:scale-90 transition-all touch-manipulation focus:outline-none z-10 hover:scale-110 cursor-pointer"
            >
              {target.emoji}
            </button>

            {/* Hit Score Popups */}
            {hitEffects.map((hit) => (
              <div
                key={hit.id}
                style={{ left: `${hit.x}%`, top: `${hit.y - 10}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 font-mono font-black text-xl text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce pointer-events-none z-20"
              >
                {hit.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {isFinished && (
        <div className="text-center py-6 space-y-5">
          <Trophy className="w-16 h-16 mx-auto text-yellow-400 animate-bounce" />
          <h4 className="text-2xl font-black text-foreground tracking-tight">MINION GAME COMPLETE</h4>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Final Score:</p>
            <p className="text-3xl font-black font-mono text-foreground">{score} PTS</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 inline-block text-yellow-300 font-mono text-xl font-black">
            XP EARNED: +{xpEarned} XP
          </div>

          <div className="flex justify-center space-x-3 pt-3">
            <button
              onClick={startGame}
              className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>PLAY AGAIN</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs rounded-xl transition-all cursor-pointer"
            >
              BACK TO GAMES
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
