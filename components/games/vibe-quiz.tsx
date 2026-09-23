"use client";

import React, { useState } from "react";
import { Trophy, Sparkles, RotateCcw, ArrowRight } from "lucide-react";

interface VibeQuizProps {
  onScoreSubmitted: (score: number, maxScore: number, xp: number) => Promise<void>;
  onClose: () => void;
}

const VIBE_QUIZ_QUESTIONS = [
  {
    q: "What is the primary theme and vision of VIBE 2026?",
    options: ["Pre-Event Social Networking & Casual Games", "Physical Zone Wars Only", "Silent Coin Trading", "Corporate Seminar"],
    correct: 0,
  },
  {
    q: "What is the primary gamification currency in VIBE 2026?",
    options: ["XP (Experience Points)", "VIBE Coins", "Gems", "Gold Tokens"],
    correct: 0,
  },
  {
    q: "How many levels exist in the VIBE 2026 XP progression system?",
    options: ["6 Levels (Newbie to Legend)", "3 Levels", "10 Levels", "1 Level"],
    correct: 0,
  },
  {
    q: "What maximum level title is unlocked at 2,500 XP?",
    options: ["VIBE LEGEND", "VIBE NEWBIE", "VIBE ICON", "VIBE RIDER"],
    correct: 0,
  },
  {
    q: "What bonus XP is awarded for linking your Instagram username during registration?",
    options: ["+25 XP Bonus", "+50 XP Bonus", "+100 XP Bonus", "0 XP"],
    correct: 0,
  },
  {
    q: "Which social milestone rewards attendees with XP on the Discover page?",
    options: ["Connecting with new attendees", "Deleting contacts", "Blocking users", "Muting feeds"],
    correct: 0,
  },
  {
    q: "What feature lets attendees view social feeds and post photos?",
    options: ["VIBE Social Feed", "Zone Passport", "Wallet Ledger", "Coin Scanner"],
    correct: 0,
  },
  {
    q: "Which Rotaract District organizes VIBE 2026?",
    options: ["District 3192", "District 3200", "District 3180", "District 3000"],
    correct: 0,
  },
  {
    q: "What is the name of the reaction-based arcade game on the VIBE Games Arena?",
    options: ["VIBE Minion Game", "Space Invaders", "Flappy Rocco", "Coin Collector"],
    correct: 0,
  },
  {
    q: "How many card pairs are matched in the VIBE Memory Game?",
    options: ["6 Pairs (12 Cards)", "2 Pairs", "20 Pairs", "50 Pairs"],
    correct: 0,
  },
];

export function VibeQuiz({ onScoreSubmitted, onClose }: VibeQuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    if (selectedOpt === null || isSubmitting) return;

    let newScore = score;
    if (selectedOpt === VIBE_QUIZ_QUESTIONS[currentIdx].correct) {
      newScore += 1;
      setScore(newScore);
    }

    if (currentIdx + 1 < VIBE_QUIZ_QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
    } else {
      setIsSubmitting(true);
      const pct = (newScore / VIBE_QUIZ_QUESTIONS.length) * 100;
      let xp = 25;
      if (pct >= 81) xp = 150;
      else if (pct >= 61) xp = 100;
      else if (pct >= 31) xp = 50;

      setXpEarned(xp);
      setIsFinished(true);
      try {
        await onScoreSubmitted(newScore, VIBE_QUIZ_QUESTIONS.length, xp);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const restartGame = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setIsFinished(false);
    setXpEarned(0);
  };

  return (
    <div className="p-6 rounded-3xl bg-card border border-cyan-500/40 max-w-xl mx-auto shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-black text-lg text-cyan-400 flex items-center space-x-2">
          <span>🔮</span>
          <span>VIBE QUIZ</span>
        </h3>
        <button onClick={onClose} className="text-xs font-bold text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {!isFinished ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-xs font-extrabold text-muted-foreground">
            <span>Question {currentIdx + 1}/{VIBE_QUIZ_QUESTIONS.length}</span>
            <span className="font-mono text-cyan-400">Score: {score}</span>
          </div>

          <h4 className="font-black text-base text-foreground leading-snug">
            {VIBE_QUIZ_QUESTIONS[currentIdx].q}
          </h4>

          <div className="space-y-2.5">
            {VIBE_QUIZ_QUESTIONS[currentIdx].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedOpt(i)}
                className={`w-full p-3.5 rounded-2xl text-left text-sm font-bold transition-all border ${
                  selectedOpt === i
                    ? "bg-cyan-500 text-black border-cyan-300 shadow-md"
                    : "bg-secondary/60 text-foreground border-border/80 hover:bg-secondary"
                }`}
              >
                <span className="font-mono mr-2 text-cyan-400">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={selectedOpt === null || isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-black font-black text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{currentIdx + 1 === VIBE_QUIZ_QUESTIONS.length ? (isSubmitting ? "SUBMITTING..." : "SUBMIT QUIZ") : "NEXT QUESTION"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="text-center py-6 space-y-5">
          <Trophy className="w-16 h-16 mx-auto text-cyan-400 animate-bounce" />
          <h4 className="text-2xl font-black text-foreground tracking-tight">VIBE QUIZ COMPLETE</h4>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Score:</p>
            <p className="text-3xl font-black font-mono text-foreground">{score} / {VIBE_QUIZ_QUESTIONS.length}</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 inline-block text-cyan-300 font-mono text-xl font-black">
            XP EARNED: +{xpEarned} XP
          </div>

          <div className="flex items-center justify-center space-x-3 pt-3">
            <button
              onClick={restartGame}
              className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>PLAY AGAIN</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-cyan-500 text-black font-black text-xs rounded-xl transition-all"
            >
              BACK TO GAMES
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
