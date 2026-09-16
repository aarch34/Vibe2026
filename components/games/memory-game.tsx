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

  function initializeCards() {
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
    if (userBalance < 50) {
      setErrorMsg("You need at least 50 VIBE Coins to enter the Memory Game.");
      return;
    }
    setErrorMsg(null);
    initializeCards();
    setGameState("playing");
  }

  // Timer countdown
  useEffect(() => {
    if (gameState !== "playing") return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handleGameOver(false, 0);
          return 0;
        }
        return prev - 1;
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
            if (newCount === CARD_ICONS.length) {
              handleGameOver(true, secondsLeft);
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
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState("gameover");
    setIsSubmitting(true);

    const timeTaken = 40 - remainingSec;
    const isFastBonus = won && timeTaken <= 25;
    const xpPayout = won ? (isFastBonus ? 250 : 100) : 50;
    const coinPayout = isFastBonus ? 100 : 0;

    try {
      const res = await submitGameResultAction({
        gameType: "memory_game",
        score: won ? 6 : matchedPairs,
        maxScore: 6,
        coinCost: 50,
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
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border border-purple-500/30 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-400">
          <Sparkles className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
            Game 3 • Visual Focus & Recall
          </span>
          <h2 className="text-xl font-extrabold text-white mt-0.5">
            VIBE Memory Match
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed">
            Flip 12 cards, match 6 festival symbol pairs before the 40-second countdown runs out!
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

        <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs max-w-sm mx-auto">
          ⚡ <strong>Speed Bonus:</strong> Clear all 6 pairs in under 25 seconds to win <span className="font-bold text-amber-400">+100 VIBE</span> and <span className="font-bold text-purple-300">+150 extra XP</span> (Total 250 XP)!
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
        )}

        <button
          onClick={startGame}
          disabled={userBalance < 50}
          className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 disabled:opacity-50 text-sm font-extrabold text-white shadow-lg shadow-purple-500/30 active:scale-95 transition-all"
        >
          {userBalance < 50 ? "Insufficient Coins (Need 50)" : "Start Memory Game (50 VIBE)"}
        </button>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-w-md mx-auto">
        {/* HUD */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-cyan-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-bold">{secondsLeft}s left</span>
          </div>
          <div className="text-slate-400">
            Pairs: <strong className="text-purple-300">{matchedPairs} / 6</strong>
          </div>
          <div className="text-slate-400">
            Moves: <strong className="text-white">{moves}</strong>
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
                className={`aspect-square rounded-xl text-2xl font-bold flex items-center justify-center transition-all duration-300 border ${
                  card.isMatched
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 scale-95"
                    : isRevealed
                    ? "bg-blue-900/60 border-blue-400 text-white rotate-y-180"
                    : "bg-slate-950 hover:bg-slate-800 border-slate-700 text-transparent"
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
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-md mx-auto">
      {isSubmitting ? (
        <div className="py-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
          <p className="text-xs text-slate-400">Saving match records...</p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-400">
            {won ? <Award className="w-7 h-7 text-amber-400 animate-bounce" /> : <Clock className="w-7 h-7 text-rose-400" />}
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
              {won ? "Victory!" : "Time's Up!"}
            </span>
            <h3 className="text-xl font-black text-white mt-0.5 font-mono">
              {won ? `Cleared in ${timeTaken}s!` : `Matched ${matchedPairs}/6 pairs`}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {isFastBonus
                ? "⚡ Lightning speed! Fast completion bonus awarded (+100🪙 & +150 extra XP)!"
                : won
                ? "Great recall! You cleared all cards successfully!"
                : "You ran out of time. Try again and spot those pairs faster!"}
            </p>
          </div>

          {/* Reward Breakdown */}
          <div className="grid grid-cols-2 gap-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">XP Earned</span>
              <span className="text-purple-300 font-bold text-sm">
                +{won ? (isFastBonus ? 250 : 100) : 50} XP
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Coins Earned</span>
              <span className="text-amber-400 font-bold text-sm">
                +{isFastBonus ? 100 : 0} VIBE
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 pt-2">
            <button
              onClick={startGame}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
            >
              Play Again (50🪙)
            </button>
            {onFinished && (
              <button
                onClick={onFinished}
                className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors"
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
