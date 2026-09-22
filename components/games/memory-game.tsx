"use client";

import React, { useState, useEffect } from "react";
import { Trophy, RotateCcw, CheckCircle } from "lucide-react";

interface MemoryGameProps {
  onScoreSubmitted: (score: number, maxScore: number, xp: number) => void;
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
  };

  const handleCardClick = (index: number) => {
    if (!isPlaying || isFinished) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    if (flippedIndices.length === 2) return;

    const newFlipped = [...flippedIndices, index];
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newFlipped;

      if (newCards[first].icon === newCards[second].icon) {
        newCards[first].isMatched = true;
        newCards[second].isMatched = true;
        setCards(newCards);
        setFlippedIndices([]);

        // Check if all matched
        if (newCards.every((c) => c.isMatched)) {
          handleWin(timer, moves + 1);
        }
      } else {
        setTimeout(() => {
          newCards[first].isFlipped = false;
          newCards[second].isFlipped = false;
          setCards(newCards);
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  const handleWin = (finalTime: number, finalMoves: number) => {
    setIsFinished(true);
    setIsPlaying(false);

    let xp = 50; // Completion
    if (finalTime <= 25 && finalMoves <= 10) xp = 100; // Personal best fast
    else if (finalTime <= 40) xp = 75; // Fast completion

    setXpEarned(xp);
    const scoreMath = Math.max(100, 1000 - finalTime * 10 - finalMoves * 20);
    onScoreSubmitted(scoreMath, 1000, xp);
  };

  return (
    <div className="p-6 rounded-3xl bg-card border border-pink-500/40 max-w-xl mx-auto shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-black text-lg text-pink-400 flex items-center space-x-2">
          <span>🧠</span>
          <span>MEMORY MATCH GAME</span>
        </h3>
        <button onClick={onClose} className="text-xs font-bold text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {!isFinished ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-black font-mono">
            <span className="text-pink-400">Moves: {moves}</span>
            <span className="text-cyan-400">Time: {timer}s</span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {cards.map((card, idx) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                className={`h-20 rounded-2xl text-2xl font-bold transition-all flex items-center justify-center border-2 ${
                  card.isFlipped || card.isMatched
                    ? "bg-gradient-to-tr from-pink-500 to-purple-600 border-pink-400 text-white rotate-0"
                    : "bg-secondary border-border/80 hover:border-pink-500/50 text-transparent"
                }`}
              >
                {card.isFlipped || card.isMatched ? card.icon : "❓"}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-4">
          <Trophy className="w-16 h-16 mx-auto text-pink-400 animate-bounce" />
          <h4 className="text-2xl font-black text-foreground">Matched All Cards!</h4>
          <p className="text-sm text-muted-foreground font-mono">
            Completed in <span className="font-bold text-foreground">{timer}s</span> with <span className="font-bold text-foreground">{moves} moves</span>
          </p>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 inline-block text-pink-300 font-mono text-xl font-black">
            +${xpEarned} XP EARNED! ⭐
          </div>

          <div className="flex justify-center space-x-3 pt-2">
            <button
              onClick={initGame}
              className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>PLAY AGAIN</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-pink-500 text-white font-black text-xs rounded-xl"
            >
              BACK TO GAMES
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
