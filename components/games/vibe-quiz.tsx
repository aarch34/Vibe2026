"use client";

import React, { useState } from "react";
import { Trophy, Sparkles, HelpCircle } from "lucide-react";

interface VibeQuizProps {
  onScoreSubmitted: (score: number, maxScore: number, xp: number) => void;
  onClose: () => void;
}

const QUIZ_QUESTIONS = [
  {
    q: "What is the signature tagline of VIBE 2026?",
    options: ["Meet People. Make Connections. Earn XP.", "Buy Coins & Trade", "Zone Conquest Only", "Silent Party"],
    correct: 0,
  },
  {
    q: "Which social platform style does VIBE combine for photo introductions?",
    options: ["Instagram & X/Twitter", "LinkedIn & MySpace", "Pinterest Only", "Snapchat Stories"],
    correct: 0,
  },
  {
    q: "What is the primary gamification currency in VIBE 2026?",
    options: ["XP (Experience Points)", "VIBE Coins", "Gems", "Gold Tokens"],
    correct: 0,
  },
  {
    q: "How many levels are in the VIBE XP progression system?",
    options: ["6 Levels", "3 Levels", "10 Levels", "Unlimited Levels"],
    correct: 0,
  },
  {
    q: "What is the max tier title achieved at 2,500 XP?",
    options: ["VIBE LEGEND", "VIBE NEWBIE", "VIBE EXPLORER", "VIBE ICON"],
    correct: 0,
  },
];

export function VibeQuiz({ onScoreSubmitted, onClose }: VibeQuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const handleNext = () => {
    if (selectedOpt === null) return;

    let newScore = score;
    if (selectedOpt === QUIZ_QUESTIONS[currentIdx].correct) {
      newScore += 1;
      setScore(newScore);
    }

    if (currentIdx + 1 < QUIZ_QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
    } else {
      const pct = (newScore / QUIZ_QUESTIONS.length) * 100;
      let xp = 25;
      if (pct >= 81) xp = 150;
      else if (pct >= 61) xp = 100;
      else if (pct >= 31) xp = 50;

      setXpEarned(xp);
      setIsFinished(true);
      onScoreSubmitted(newScore, QUIZ_QUESTIONS.length, xp);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-card border border-cyan-500/40 max-w-xl mx-auto shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-black text-lg text-cyan-400 flex items-center space-x-2">
          <span>🔮</span>
          <span>VIBE POP & LORE QUIZ</span>
        </h3>
        <button onClick={onClose} className="text-xs font-bold text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {!isFinished ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-xs font-extrabold text-muted-foreground">
            <span>Question {currentIdx + 1} of {QUIZ_QUESTIONS.length}</span>
            <span className="font-mono text-cyan-400">Score: {score}</span>
          </div>

          <h4 className="font-black text-base text-foreground">
            {QUIZ_QUESTIONS[currentIdx].q}
          </h4>

          <div className="space-y-2.5">
            {QUIZ_QUESTIONS[currentIdx].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedOpt(i)}
                className={`w-full p-3.5 rounded-2xl text-left text-sm font-bold transition-all border ${
                  selectedOpt === i
                    ? "bg-cyan-500 text-black border-cyan-300 shadow-md"
                    : "bg-secondary/60 text-foreground border-border/80 hover:bg-secondary"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={selectedOpt === null}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-black font-black text-sm rounded-xl transition-all disabled:opacity-50"
          >
            {currentIdx + 1 === QUIZ_QUESTIONS.length ? "SUBMIT QUIZ" : "NEXT QUESTION"}
          </button>
        </div>
      ) : (
        <div className="text-center py-6 space-y-4">
          <Trophy className="w-16 h-16 mx-auto text-cyan-400 animate-bounce" />
          <h4 className="text-2xl font-black text-foreground">Quiz Completed!</h4>
          <p className="text-sm text-muted-foreground">
            You scored <span className="font-bold text-foreground">{score} / {QUIZ_QUESTIONS.length}</span> ({Math.round((score / QUIZ_QUESTIONS.length) * 100)}%)
          </p>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 inline-block text-cyan-300 font-mono text-xl font-black">
            +${xpEarned} XP EARNED! ⭐
          </div>

          <div className="pt-2">
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
