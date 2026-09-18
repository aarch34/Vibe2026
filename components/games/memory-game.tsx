"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Coins,
  CheckCircle2,
  Trophy,
  Loader2,
  Clock,
  RotateCcw,
  Award,
} from "lucide-react";
import { submitGameResultAction } from "@/actions/games/play";
import confetti from "canvas-confetti";

const CARD_ICONS = ["🍌", "🎈", "🎉", "🌊", "🪙", "⭐"];

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryGameProps {
  userBalance: number;
  onFinished?: () => void;
}

export function MemoryGame({ userBalance, onFinished }: MemoryGameProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<"intro" | "playing" | "gameover">("intro");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(40);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutResult, setPayoutResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const secondsLeftRef = useRef(40);
  const isEndingRef = useRef(false);

  function initializeCards() {
    isEndingRef.current = false;
    secondsLeftRef.current = 40;
    const deck: Card[] = [];
    const pairs = [...CARD_ICONS, ...CARD_ICONS];
    // Shuffle
    pairs.sort(() => Math.random() - 0.5);

    pairs.forEach((icon, idx) => {
      deck.push({
        id: idx,
        icon,
        isFlipped: false,
        isMatched: false,
      });
    });

    setCards(deck);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setSecondsLeft(40);
    setPayoutResult(null);
  }

  function startGame() {
    setErrorMsg(null);
    initializeCards();
    setGameState("playing");
  }

  // Timer countdown
  useEffect(() => {
    if (gameState !== "playing") return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        secondsLeftRef.current = Math.max(0, next);
        if (next <= 0) {
          if (!isEndingRef.current) {
            setTimeout(() => handleGameOver(false, 0), 0);
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  function handleCardClick(idx: number) {
    if (flippedCards.length >= 2 || cards[idx].isFlipped || cards[idx].isMatched) {
      return;
    }

    const newCards = [...cards];
    newCards[idx].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, idx];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (cards[firstIdx].icon === cards[secondIdx].icon) {
        // Matched!
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isMatched = true;
            updated[secondIdx].isMatched = true;
            return updated;
          });
          setFlippedCards([]);

          setMatchedPairs((mp) => {
            const newCount = mp + 1;
            if (newCount === CARD_ICONS.length && !isEndingRef.current) {
              setTimeout(() => handleGameOver(true, secondsLeftRef.current), 0);
            }
            return newCount;
          });
        }, 500);
      } else {
        // Not matched, flip back
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isFlipped = false;
            updated[secondIdx].isFlipped = false;
            return updated;
          });
          setFlippedCards([]);
        }, 900);
      }
    }
  }

  async function handleGameOver(won: boolean, remainingSec: number) {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState("gameover");
    setIsSubmitting(true);

    const timeTaken = 40 - remainingSec;
    const isFastBonus = won && timeTaken <= 25;
    const xpPayout = won ? (isFastBonus ? 25 : 20) : 10;
    const coinPayout = isFastBonus ? 10 : 0;

    try {
      const res = await submitGameResultAction({
        gameType: "memory_game",
        score: won ? 6 : matchedPairs,
        maxScore: 6,
        coinCost: 0,
        coinReward: coinPayout,
        xpReward: xpPayout,
      });

      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setPayoutResult(res);
        if (won) {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
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
      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo text-center space-y-5 max-w-md mx-auto">
        <div className="w-14 h-14 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-black text-primary tracking-wider">
            Game 3 • Visual Focus & Recall
          </span>
          <h2 className="text-xl font-black text-foreground mt-0.5 font-mono">
            VIBE Memory Match
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed font-bold">
            Flip 12 cards, match 6 festival symbol pairs before the 40-second countdown runs out!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 bg-muted text-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-mono max-w-xs mx-auto font-bold">
          <div>
            <span className="text-[10px] text-muted-foreground block font-sans">Entry Fee</span>
            <span className="text-primary font-black">FREE</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-sans">Base Reward</span>
            <span className="text-foreground font-black">+15 XP</span>
          </div>
        </div>

        <div className="p-2.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] text-xs max-w-sm mx-auto font-bold">
          ⚡ <strong>Speed Bonus:</strong> Clear all 6 pairs in under 25 seconds to win <span className="font-black">+10 VIBE</span> and <span className="font-black">+25 total XP</span>!
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-500 font-bold">{errorMsg}</p>
        )}

        <button
          onClick={startGame}
          className="neo-btn-primary w-full max-w-xs py-3.5 text-sm font-black uppercase tracking-wider mx-auto cursor-pointer flex items-center justify-center"
        >
          Start Memory Game (Free)
        </button>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="p-4 sm:p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4 max-w-md mx-auto">
        {/* HUD */}
        <div className="flex items-center justify-between text-xs font-mono font-bold text-foreground">
          <div className="flex items-center space-x-1.5 text-primary">
            <Clock className="w-3.5 h-3.5" />
            <span>{secondsLeft}s left</span>
          </div>
          <div>
            Pairs: <strong className="text-foreground">{matchedPairs} / 6</strong>
          </div>
          <div>
            Moves: <strong className="text-foreground">{moves}</strong>
          </div>
        </div>

        {/* 12-Card Grid (3x4) */}
        <div className="grid grid-cols-4 gap-2.5">
          {cards.map((card, idx) => {
            const isRevealed = card.isFlipped || card.isMatched;

            return (
              <button
                key={card.id}
                disabled={card.isMatched || card.isFlipped}
                onClick={() => handleCardClick(idx)}
                className={`aspect-square text-2xl font-black flex items-center justify-center transition-all duration-150 border-2 border-border ${
                  card.isMatched
                    ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_var(--border)] scale-95"
                    : isRevealed
                    ? "bg-secondary text-secondary-foreground shadow-[3px_3px_0px_var(--border)] rotate-y-180"
                    : "bg-card text-card-foreground hover:bg-muted shadow-[3px_3px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_var(--border)] cursor-pointer"
                }`}
              >
                {isRevealed ? card.icon : "❓"}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // GameOver State
  const won = matchedPairs === CARD_ICONS.length;
  const timeTaken = 40 - secondsLeft;
  const isFastBonus = won && timeTaken <= 25;

  return (
    <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo text-center space-y-4 max-w-md mx-auto">
      {isSubmitting ? (
        <div className="py-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground font-bold">Saving match records...</p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto">
            {won ? <Award className="w-7 h-7 animate-bounce" /> : <Clock className="w-7 h-7" />}
          </div>

          <div>
            <span className="text-[10px] uppercase font-black text-primary tracking-wider">
              {won ? "Victory!" : "Time's Up!"}
            </span>
            <h3 className="text-xl font-black text-foreground mt-0.5 font-mono">
              {won ? `Cleared in ${timeTaken}s!` : `Matched ${matchedPairs}/6 pairs`}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 font-bold">
              {isFastBonus
                ? "⚡ Lightning speed! Fast completion bonus awarded (+100🪙 & +150 extra XP)!"
                : won
                ? "Great recall! You cleared all cards successfully!"
                : "You ran out of time. Try again and spot those pairs faster!"}
            </p>
          </div>

          {/* Reward Breakdown */}
          <div className="grid grid-cols-2 gap-2 p-3.5 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-mono font-bold text-foreground">
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">XP Earned</span>
              <span className="text-primary font-black text-sm">
                +{won ? (isFastBonus ? 25 : 20) : 10} XP
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">Coins Earned</span>
              <span className="text-foreground font-black text-sm">
                +{isFastBonus ? 10 : 0} VIBE
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 pt-3">
            <button
              onClick={startGame}
              className="neo-btn-secondary py-2.5 px-4 text-xs font-black cursor-pointer"
            >
              Play Again (Free)
            </button>
            {onFinished && (
              <button
                onClick={onFinished}
                className="neo-btn-card py-2.5 px-4 text-xs font-black cursor-pointer"
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
