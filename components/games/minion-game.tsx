"use client";

import React, { useState, useEffect, useRef } from "react";
import { Gamepad2, Trophy, Sparkles, Play, RotateCcw } from "lucide-react";

interface MinionGameProps {
  onScoreSubmitted: (score: number, maxScore: number, xp: number) => void;
  onClose: () => void;
}

export function MinionGame({ onScoreSubmitted, onClose }: MinionGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [minionPos, setMinionPos] = useState({ x: 50, y: 50 });
  const [starPos, setStarPos] = useState({ x: 70, y: 40 });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsFinished(false);
    setIsPlaying(true);
    relocateStar();
  };

  const relocateStar = () => {
    const rx = Math.floor(Math.random() * 80) + 10;
    const ry = Math.floor(Math.random() * 70) + 15;
    setStarPos({ x: rx, y: ry });
  };

  const handleCatch = () => {
    if (!isPlaying) return;
    const newScore = score + 100;
    setScore(newScore);
    relocateStar();
  };

  const endGame = () => {
    setIsPlaying(false);
    setIsFinished(true);

    const ratio = Math.min(1, score / 1500);
    const xp = Math.min(100, Math.max(25, Math.floor(ratio * 100)));
    setXpEarned(xp);

    onScoreSubmitted(score, 1500, xp);
  };

  return (
    <div className="p-6 rounded-3xl bg-card border border-yellow-500/40 max-w-xl mx-auto shadow-2xl space-y-6">
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
        <div className="text-center py-8 space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center text-4xl animate-bounce">
            🍌
          </div>
          <h4 className="text-xl font-black text-foreground">Catch the VIBE Energy Stars!</h4>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Tap/click stars as fast as you can in 30 seconds to score points & earn XP!
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 text-black font-black text-sm rounded-2xl shadow-xl flex items-center justify-center space-x-2 mx-auto"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>START GAME</span>
          </button>
        </div>
      )}

      {isPlaying && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-black font-mono">
            <span className="text-yellow-400">Score: {score}</span>
            <span className="text-pink-400">Time: {timeLeft}s</span>
          </div>

          <div className="relative w-full h-64 bg-secondary/80 rounded-2xl border-2 border-yellow-500/30 overflow-hidden cursor-crosshair">
            {/* Catchable Star */}
            <button
              onClick={handleCatch}
              style={{ left: `${starPos.x}%`, top: `${starPos.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 p-2 text-3xl animate-pulse active:scale-125 transition-transform"
            >
              ⭐
            </button>
          </div>
        </div>
      )}

      {isFinished && (
        <div className="text-center py-6 space-y-4">
          <Trophy className="w-16 h-16 mx-auto text-yellow-400 animate-bounce" />
          <h4 className="text-2xl font-black text-foreground">Time's Up!</h4>
          <p className="text-sm text-muted-foreground">
            Final Score: <span className="font-bold text-foreground font-mono">{score} PTS</span>
          </p>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 inline-block text-yellow-300 font-mono text-xl font-black">
            +${xpEarned} XP EARNED! ⭐
          </div>

          <div className="flex justify-center space-x-3 pt-2">
            <button
              onClick={startGame}
              className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>PLAY AGAIN</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-yellow-500 text-black font-black text-xs rounded-xl"
            >
              BACK TO GAMES
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
