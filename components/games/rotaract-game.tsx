"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Trophy, Sparkles, RotateCcw } from "lucide-react";

interface RotaractGameProps {
  onScoreSubmitted: (score: number, maxScore: number, xp: number) => void;
  onClose: () => void;
}

const QUESTIONS = [
  {
    q: "What is the motto of Rotary International?",
    options: ["Service Above Self", "Leadership First", "Youth Empowerment", "Fellowship & Beyond"],
    correct: 0,
  },
  {
    q: "Rotaract was officially founded in which year?",
    options: ["1968", "1975", "1980", "1992"],
    correct: 0,
  },
  {
    q: "Which District number does our VIBE 2026 event belong to?",
    options: ["District 3190", "District 3192", "District 3200", "District 3181"],
    correct: 1,
  },
  {
    q: "What is the primary theme of Rotaract fellowship?",
    options: ["Fellowship Through Service", "Profit & Commerce", "Strict Examination", "Solo Achievement"],
    correct: 0,
  },
  {
    q: "What is the age group traditionally served by Rotaract clubs?",
    options: ["18 to 30+", "10 to 15", "40 to 60", "Any age"],
    correct: 0,
  },
];

export function RotaractGame({ onScoreSubmitted, onClose }: RotaractGameProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const handleNext = () => {
    if (selectedOpt === null) return;

    let newScore = score;
    if (selectedOpt === QUESTIONS[currentIdx].correct) {
      newScore += 1;
      setScore(newScore);
    }

    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
    } else {
      // Calculate XP
      const pct = (newScore / QUESTIONS.length) * 100;
      let xp = 25;
      if (pct >= 81) xp = 150;
      else if (pct >= 61) xp = 100;
      else if (pct >= 31) xp = 50;

      setXpEarned(xp);
      setIsFinished(true);
      onScoreSubmitted(newScore, QUESTIONS.length, xp);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-card border border-purple-500/30 max-w-xl mx-auto shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-black text-lg text-foreground flex items-center space-x-2">
          <span>⚙️</span>
          <span>ROTARACT KNOWLEDGE GAME</span>
        </h3>
        <button onClick={onClose} className="text-xs font-bold text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {!isFinished ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-xs font-extrabold text-muted-foreground">
            <span>Question {currentIdx + 1} of {QUESTIONS.length}</span>
            <span className="font-mono text-purple-400">Score: {score}</span>
          </div>

          <h4 className="font-black text-base text-foreground">
            {QUESTIONS[currentIdx].q}
          </h4>

          <div className="space-y-2.5">
            {QUESTIONS[currentIdx].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedOpt(i)}
                className={`w-full p-3.5 rounded-2xl text-left text-sm font-bold transition-all border ${
                  selectedOpt === i
                    ? "bg-purple-600 text-white border-purple-400 shadow-md"
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
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 text-white font-extrabold text-sm rounded-xl transition-all disabled:opacity-50"
          >
            {currentIdx + 1 === QUESTIONS.length ? "SUBMIT QUIZ" : "NEXT QUESTION"}
          </button>
        </div>
      ) : (
        <div className="text-center py-6 space-y-4">
          <Trophy className="w-16 h-16 mx-auto text-amber-400 animate-bounce" />
          <h4 className="text-2xl font-black text-foreground">Quiz Completed!</h4>
          <p className="text-sm text-muted-foreground">
            You scored <span className="font-bold text-foreground">{score} / {QUESTIONS.length}</span> ({Math.round((score / QUESTIONS.length) * 100)}%)
          </p>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 inline-block text-amber-300 font-mono text-xl font-black">
            +${xpEarned} XP EARNED! ⭐
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl transition-all"
            >
              BACK TO GAMES
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
