"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Gamepad2,
  Coins,
  Sparkles,
  Trophy,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Zap,
  Play,
  RotateCcw,
} from "lucide-react";
import { submitGameResultAction } from "@/actions/games/play";
import confetti from "canvas-confetti";

interface MinionRunProps {
  userBalance: number;
  onFinished?: () => void;
}

interface Item {
  id: number;
  lane: number; // 0, 1, 2
  y: number; // 0% to 100%
  type: "banana" | "coin" | "wave";
}

export function MinionRun({ userBalance, onFinished }: MinionRunProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<"intro" | "playing" | "gameover">("intro");
  const [playerLane, setPlayerLane] = useState(1); // 0=left, 1=center, 2=right
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [lives, setLives] = useState(3);
  const [items, setItems] = useState<Item[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutResult, setPayoutResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const nextItemIdRef = useRef(1);

  function startGame() {
    if (userBalance < 50) {
      setErrorMsg("You need at least 50 VIBE Coins to enter Minion Run.");
      return;
    }
    setErrorMsg(null);
    setScore(0);
    setLives(3);
    setTimeLeft(25);
    setPlayerLane(1);
    setItems([]);
    setPayoutResult(null);
    setGameState("playing");
  }

  // Keyboard navigation
  useEffect(() => {
    if (gameState !== "playing") return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a") {
        setPlayerLane((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight" || e.key === "d") {
        setPlayerLane((prev) => Math.min(2, prev + 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // Main game loop (Spawning and moving items)
  useEffect(() => {
    if (gameState !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame(score, lives);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    gameLoopRef.current = setInterval(() => {
      setItems((prevItems) => {
        // Move items down
        const moved = prevItems
          .map((item) => ({ ...item, y: item.y + 4 }))
          .filter((item) => item.y <= 100);

        // Check collisions (player is at y ~ 85%)
        moved.forEach((item) => {
          if (item.y >= 80 && item.y <= 92 && item.lane === playerLane) {
            // Collision
            if (item.type === "banana") {
              setScore((s) => s + 10);
              item.y = 999; // consume
            } else if (item.type === "coin") {
              setScore((s) => s + 25);
              item.y = 999; // consume
            } else if (item.type === "wave") {
              setLives((l) => {
                const next = l - 1;
                if (next <= 0) {
                  endGame(score, 0);
                }
                return next;
              });
              item.y = 999;
            }
          }
        });

        // Spawn new item randomly
        if (Math.random() < 0.25) {
          const randLane = Math.floor(Math.random() * 3);
          const randType: "banana" | "coin" | "wave" =
            Math.random() < 0.4 ? "banana" : Math.random() < 0.7 ? "wave" : "coin";

          moved.push({
            id: nextItemIdRef.current++,
            lane: randLane,
            y: 0,
            type: randType,
          });
        }

        return moved.filter((i) => i.y <= 100);
      });
    }, 80);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, playerLane, score, lives]);

  async function endGame(finalScore: number, finalLives: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    setGameState("gameover");
    setIsSubmitting(true);

    const isHighScore = finalScore >= 120 && finalLives > 0;
    const xpPayout = isHighScore ? 300 : 100;
    const coinPayout = isHighScore ? 150 : 0;

    try {
      const res = await submitGameResultAction({
        gameType: "minion_run",
        score: finalScore,
        maxScore: 200,
        coinCost: 50,
        coinReward: coinPayout,
        xpReward: xpPayout,
      });

      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setPayoutResult(res);
        if (isHighScore) {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        }
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (gameState === "intro") {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
          <Gamepad2 className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
            Game 2 • Arcade Reaction Runner
          </span>
          <h2 className="text-xl font-extrabold text-white mt-0.5">
            Minion VIBE Run
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed">
            Dash across 3 lanes, collect 🍌 Bananas (+10) and 🪙 Coins (+25) while dodging 🌊 Tidal Waves!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono max-w-xs mx-auto">
          <div>
            <span className="text-[10px] text-slate-400 block">Entry Fee</span>
            <span className="text-amber-400 font-bold">50 VIBE</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Base Reward</span>
            <span className="text-purple-300 font-bold">+100 XP</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs max-w-sm mx-auto">
          🏆 <strong>High Score Bonus:</strong> Score ≥ 120 points to win <span className="font-bold text-amber-400">+150 VIBE</span> and <span className="font-bold text-purple-300">+200 extra XP</span> (Total 300 XP)!
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
        )}

        <button
          onClick={startGame}
          disabled={userBalance < 50}
          className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
        >
          {userBalance < 50 ? "Insufficient Coins (Need 50)" : "Start Minion Run (50 VIBE)"}
        </button>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 max-w-md mx-auto">
        {/* HUD */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Score:</span>
            <span className="text-amber-400 font-bold text-sm">{score}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Lives:</span>
            <span>{"❤️".repeat(lives)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Time:</span>
            <span className="text-cyan-300 font-bold">{timeLeft}s</span>
          </div>
        </div>

        {/* 3-Lane Track */}
        <div className="relative w-full h-80 rounded-2xl bg-gradient-to-b from-blue-950 via-slate-950 to-blue-950 border-2 border-slate-700 overflow-hidden shadow-inner">
          {/* Lane Divider Lines */}
          <div className="absolute inset-0 grid grid-cols-3 divide-x divide-slate-800/80 pointer-events-none">
            <div />
            <div />
            <div />
          </div>

          {/* Falling Items */}
          {items.map((item) => {
            const laneLeft = item.lane === 0 ? "16.6%" : item.lane === 1 ? "50%" : "83.3%";
            return (
              <div
                key={item.id}
                className="absolute text-2xl -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
                style={{ left: laneLeft, top: `${item.y}%` }}
              >
                {item.type === "banana" ? "🍌" : item.type === "coin" ? "🪙" : "🌊"}
              </div>
            );
          })}

          {/* Player Minion */}
          <div
            className="absolute bottom-4 text-3xl -translate-x-1/2 transition-all duration-150"
            style={{
              left: playerLane === 0 ? "16.6%" : playerLane === 1 ? "50%" : "83.3%",
            }}
          >
            🟡
          </div>
        </div>

        {/* Touch Controls (Mobile Friendly) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setPlayerLane((prev) => Math.max(0, prev - 1))}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center space-x-1 border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Move Left (A)</span>
          </button>
          <button
            onClick={() => setPlayerLane((prev) => Math.min(2, prev + 1))}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center space-x-1 border border-slate-700"
          >
            <span>Move Right (D)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // GameOver State
  const isHighScore = score >= 120 && lives > 0;
  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-md mx-auto">
      {isSubmitting ? (
        <div className="py-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
          <p className="text-xs text-slate-400">Saving Minion Run rewards...</p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full bg-amber-600/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <Trophy className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Run Completed!
            </span>
            <h3 className="text-2xl font-black text-white mt-0.5 font-mono">
              Score: {score} pts
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {isHighScore
                ? "🎉 High Score achieved! Bonus coins and double XP awarded!"
                : "Good run! Dodge those waves and aim for ≥ 120 points for the bonus!"}
            </p>
          </div>

          {/* Reward Breakdown */}
          <div className="grid grid-cols-2 gap-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">XP Earned</span>
              <span className="text-purple-300 font-bold text-sm">
                +{isHighScore ? 300 : 100} XP
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Coins Earned</span>
              <span className="text-amber-400 font-bold text-sm">
                +{isHighScore ? 150 : 0} VIBE
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 pt-2">
            <button
              onClick={startGame}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
            >
              Run Again (50🪙)
            </button>
            {onFinished && (
              <button
                onClick={onFinished}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 transition-colors"
              >
                Back to Games Hub
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
