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
  const touchStartX = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const isOverRef = useRef(false);

  function startGame() {
    isOverRef.current = false;
    scoreRef.current = 0;
    livesRef.current = 3;
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
          if (!isOverRef.current) {
            setTimeout(() => {
              endGame(scoreRef.current, livesRef.current);
            }, 0);
          }
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
              setScore((s) => {
                const next = s + 10;
                scoreRef.current = next;
                return next;
              });
              item.y = 999; // consume
            } else if (item.type === "coin") {
              setScore((s) => {
                const next = s + 25;
                scoreRef.current = next;
                return next;
              });
              item.y = 999; // consume
            } else if (item.type === "wave") {
              setLives((l) => {
                const next = Math.max(0, l - 1);
                livesRef.current = next;
                if (next === 0 && !isOverRef.current) {
                  setTimeout(() => {
                    endGame(scoreRef.current, 0);
                  }, 0);
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
  }, [gameState, playerLane]);

  async function endGame(finalScore: number, finalLives: number) {
    if (isOverRef.current) return;
    isOverRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    setGameState("gameover");
    setIsSubmitting(true);

    const isHighScore = finalScore >= 120 && finalLives > 0;
    const isQualified = finalScore >= 30; // Minimum 30 points to earn XP
    const xpPayout = isHighScore ? 25 : isQualified ? 15 : 0;
    const coinPayout = isHighScore ? 10 : 0;

    try {
      const res = await submitGameResultAction({
        gameType: "minion_run",
        score: finalScore,
        maxScore: 200,
        coinCost: 0,
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
      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo text-center space-y-5">
        <div className="w-14 h-14 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto">
          <Gamepad2 className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">
            Game 2 • Arcade Reaction Runner
          </span>
          <h2 className="text-xl font-black text-foreground mt-0.5">
            Minion VIBE Run
          </h2>
          <p className="text-xs text-foreground/80 max-w-sm mx-auto mt-1 leading-relaxed">
            Dash across 3 lanes, collect 🍌 Bananas (+10) and 🪙 Coins (+25) while dodging 🌊 Tidal Waves!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-mono max-w-xs mx-auto">
          <div>
            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Entry Fee</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">FREE</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Base Reward</span>
            <span className="text-purple-600 dark:text-purple-300 font-black">+15 XP</span>
          </div>
        </div>

        <div className="p-2.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-bold max-w-sm mx-auto">
          🏆 <strong>High Score Bonus:</strong> Score ≥ 120 points to win <span className="font-black">+10 VIBE</span> and <span className="font-black">+25 total XP</span>!
        </div>

        <button
          onClick={startGame}
          className="w-full max-w-xs py-3.5 neo-btn-secondary text-sm font-black uppercase tracking-wider space-x-2 mx-auto"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start Minion Run (Free)</span>
        </button>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="p-4 sm:p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3 max-w-md mx-auto">
        {/* HUD */}
        <div className="flex items-center justify-between text-xs font-mono font-bold text-foreground">
          <div className="flex items-center space-x-1.5">
            <span className="text-muted-foreground font-sans">Score:</span>
            <span className="text-primary font-black text-sm">{score}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-muted-foreground font-sans">Lives:</span>
            <span>{lives > 0 ? "❤️".repeat(Math.min(3, Math.max(0, lives))) : "💀"}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-muted-foreground font-sans">Time:</span>
            <span className="text-foreground font-black">{timeLeft}s</span>
          </div>
        </div>

        {/* 3-Lane Track with Tap & Swipe Support */}
        <div
          className="relative w-full h-80 bg-background border-2 border-border shadow-[2px_2px_0px_var(--border)] overflow-hidden touch-none cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const third = rect.width / 3;
          if (clickX < third) setPlayerLane(0);
          else if (clickX < third * 2) setPlayerLane(1);
          else setPlayerLane(2);
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(diff) > 25) {
            if (diff > 0) setPlayerLane((prev) => Math.min(2, prev + 1));
            else setPlayerLane((prev) => Math.max(0, prev - 1));
          }
          touchStartX.current = null;
        }}
      >
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
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => setPlayerLane((prev) => Math.max(0, prev - 1))}
            className="py-3 neo-btn-card text-card-foreground font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Move Left (A)</span>
          </button>
          <button
            onClick={() => setPlayerLane((prev) => Math.min(2, prev + 1))}
            className="py-3 neo-btn-card text-card-foreground font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5"
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
    <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo text-center space-y-4 max-w-md mx-auto">
      {isSubmitting ? (
        <div className="py-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground font-bold">Saving Minion Run rewards...</p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto">
            <Trophy className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">
              Run Completed!
            </span>
            <h3 className="text-2xl font-black text-foreground mt-0.5 font-mono">
              Score: {score} pts
            </h3>
            <p className="text-xs text-foreground/80 mt-1">
              {isHighScore
                ? "🎉 High Score achieved! Bonus coins and double XP awarded!"
                : score >= 30
                ? "Good run! Dodge those waves and aim for ≥ 120 points for the bonus!"
                : "You must score at least 30 points to earn XP. Dodge waves and collect items!"}
            </p>
          </div>

          {score < 30 && (
            <div className="p-2 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold max-w-xs mx-auto">
              ⚠️ Score ≥ 30 pts required to earn XP!
            </div>
          )}

          {/* Reward Breakdown */}
          <div className="grid grid-cols-2 gap-2 p-3.5 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-mono">
            <div>
              <span className="text-[10px] text-muted-foreground block font-bold uppercase">XP Earned</span>
              <span className={score >= 30 ? "text-purple-600 dark:text-purple-300 font-black text-sm" : "text-muted-foreground font-black text-sm"}>
                +{isHighScore ? 25 : score >= 30 ? 15 : 0} XP
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-bold uppercase">Coins Earned</span>
              <span className={isHighScore ? "text-amber-500 dark:text-amber-400 font-black text-sm" : "text-muted-foreground font-black text-sm"}>
                +{isHighScore ? 10 : 0} VIBE
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 pt-2">
            <button
              onClick={startGame}
              className="neo-btn-secondary py-2.5 px-4 text-xs font-black uppercase tracking-wide"
            >
              Run Again (Free)
            </button>
            {onFinished && (
              <button
                onClick={onFinished}
                className="neo-btn-card py-2.5 px-4 text-xs font-black uppercase tracking-wide"
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
