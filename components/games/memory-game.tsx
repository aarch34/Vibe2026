"use client";

import React, { useState, useEffect } from "react";
import { Trophy, RotateCcw } from "lucide-react";

interface MemoryGameProps {
  onScoreSubmitted: (score: number, maxScore: number, xp: number, timeSeconds: number) => Promise<void>;
  onClose: () => void;
}

const CARD_ICONS = ["🎵", "🎮", "📸", "🚀", "⚡", "👑"];

interface CardItem {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function MemoryGame({ onScoreSubmitted, onClose }: MemoryGameProps) {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [calculatedScore, setCalculatedScore] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isFinished) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isFinished]);

  const initGame = () => {
    const deck = [...CARD_ICONS, ...CARD_ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setTimer(0);
    setIsPlaying(true);
    setIsFinished(false);
    setIsEvaluating(false);
    setCalculatedScore(0);
  };

  const handleCardClick = (index: number) => {
    if (!isPlaying || isFinished || isEvaluating) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    if (flippedIndices.length === 2) return;

    const newFlipped = [...flippedIndices, index];
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const finalMoves = moves + 1;
      setMoves(finalMoves);
      const [first, second] = newFlipped;

      if (newCards[first].icon === newCards[second].icon) {
        newCards[first].isMatched = true;
        newCards[second].isMatched = true;
        setCards(newCards);
        setFlippedIndices([]);

        // Check if all matched
        if (newCards.every((c) => c.isMatched)) {
          handleWin(timer, finalMoves);
        }
      } else {
        setIsEvaluating(true);
        setTimeout(() => {
          newCards[first].isFlipped = false;
          newCards[second].isFlipped = false;
          setCards(newCards);
          setFlippedIndices([]);
          setIsEvaluating(false);
        }, 800);
      }
    }
  };

  const handleWin = async (finalTime: number, finalMoves: number) => {
    setIsFinished(true);
    setIsPlaying(false);

    let xp = 50; // Base Completion
    if (finalTime <= 25) xp = 100;
    else if (finalTime <= 40) xp = 75;

    const scoreMath = Math.max(100, 1000 - finalTime * 10 - finalMoves * 20);
    setCalculatedScore(scoreMath);
    setXpEarned(xp);

    setIsSubmitting(true);
    try {
      await onScoreSubmitted(scoreMath, 1000, xp, finalTime);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-card border border-pink-500/40 max-w-xl mx-auto shadow-2xl space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-black text-lg text-pink-400 flex items-center space-x-2">
          <span>🧠</span>
          <span>MEMORY GAME</span>
        </h3>
        <button onClick={onClose} className="text-xs font-bold text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {!isFinished ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-black font-mono px-1">
            <span className="text-pink-400 text-sm">Moves: {moves}</span>
            <span className="text-cyan-400 text-sm">Time: {timer}s</span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {cards.map((card, idx) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                disabled={card.isFlipped || card.isMatched || isEvaluating}
                className={`h-20 rounded-2xl text-2xl font-bold transition-all flex items-center justify-center border-2 touch-manipulation ${
                  card.isFlipped || card.isMatched
                    ? "bg-gradient-to-tr from-pink-500 to-purple-600 border-pink-400 text-white"
                    : "bg-secondary border-border/80 hover:border-pink-500/50 text-transparent"
                }`}
              >
                {card.isFlipped || card.isMatched ? card.icon : "❓"}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-5">
          <Trophy className="w-16 h-16 mx-auto text-pink-400 animate-bounce" />
          <h4 className="text-2xl font-black text-foreground tracking-tight">MEMORY GAME COMPLETE</h4>

          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto text-center font-mono">
            <div className="p-2.5 rounded-xl bg-secondary/60 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase">Time</p>
              <p className="text-base font-black text-foreground">{timer}s</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/60 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase">Moves</p>
              <p className="text-base font-black text-foreground">{moves}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/60 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase">Score</p>
              <p className="text-base font-black text-foreground">{calculatedScore}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 inline-block text-pink-300 font-mono text-xl font-black">
            XP EARNED: +{xpEarned} XP
          </div>

          <div className="flex justify-center space-x-3 pt-3">
            <button
              onClick={initGame}
              className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>PLAY AGAIN</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-pink-500 text-white font-black text-xs rounded-xl transition-all"
            >
              BACK TO GAMES
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
