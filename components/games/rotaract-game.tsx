"use client";

import React, { useState } from "react";
import { Trophy, Sparkles, RotateCcw, ArrowRight } from "lucide-react";

interface RotaractGameProps {
  onScoreSubmitted: (score: number, maxScore: number, xp: number) => Promise<void>;
  onClose: () => void;
}

const ROTARACT_QUESTIONS = [
  {
    q: "What is the official motto of Rotary International and Rotaract?",
    options: ["Service Above Self", "Leadership First", "Youth Empowerment", "Fellowship & Beyond"],
    correct: 0,
  },
  {
    q: "In which year was Rotaract officially founded by Rotary International?",
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
    options: ["Fellowship Through Service", "Commercial Trading", "Strict Examinations", "Solo Achievements"],
    correct: 0,
  },
  {
    q: "What is the traditional age group served by Rotaract clubs worldwide?",
    options: ["18 to 30+", "10 to 15", "40 to 60", "Under 12"],
    correct: 0,
  },
  {
    q: "What is the Four-Way Test's first question?",
    options: ["Is it the TRUTH?", "Is it FAIR to all concerned?", "Will it build GOODWILL?", "Will it be BENEFICIAL?"],
    correct: 0,
  },
  {
    q: "What is the emblem/symbol of Rotary International?",
    options: ["Wheel with 24 cogs", "Anchor", "Star", "Torch of Light"],
    correct: 0,
  },
  {
    q: "What is the primary annual gathering event for Rotaract District 3192?",
    options: ["VIBE 2026 & District Conference", "Global Summit", "Winter Festival", "Youth Expo"],
    correct: 0,
  },
  {
    q: "Which of the following is one of Rotary's 7 Areas of Focus?",
    options: ["Peacebuilding and Conflict Prevention", "Space Exploration", "Stock Trading", "Automobile Racing"],
    correct: 0,
  },
  {
    q: "What key avenue of service focuses on international understanding and peace?",
    options: ["International Service", "Club Service", "Community Service", "Vocational Service"],
    correct: 0,
  },
];

export function RotaractGame({ onScoreSubmitted, onClose }: RotaractGameProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    if (selectedOpt === null || isSubmitting) return;

    let newScore = score;
    if (selectedOpt === ROTARACT_QUESTIONS[currentIdx].correct) {
      newScore += 1;
      setScore(newScore);
    }

    if (currentIdx + 1 < ROTARACT_QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
    } else {
      setIsSubmitting(true);
      const pct = (newScore / ROTARACT_QUESTIONS.length) * 100;
      let xp = 25;
      if (pct >= 81) xp = 150;
      else if (pct >= 61) xp = 100;
      else if (pct >= 31) xp = 50;

      setXpEarned(xp);
      setIsFinished(true);
      try {
        await onScoreSubmitted(newScore, ROTARACT_QUESTIONS.length, xp);
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
    <div className="p-6 rounded-3xl bg-card border border-purple-500/30 max-w-xl mx-auto shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-black text-lg text-foreground flex items-center space-x-2">
          <span>⚙️</span>
          <span>ROTARACT GAME</span>
        </h3>
        <button onClick={onClose} className="text-xs font-bold text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {!isFinished ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-xs font-extrabold text-muted-foreground">
            <span>Question {currentIdx + 1}/{ROTARACT_QUESTIONS.length}</span>
            <span className="font-mono text-purple-400">Score: {score}</span>
          </div>

          <h4 className="font-black text-base text-foreground leading-snug">
            {ROTARACT_QUESTIONS[currentIdx].q}
          </h4>

          <div className="space-y-2.5">
            {ROTARACT_QUESTIONS[currentIdx].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedOpt(i)}
                className={`w-full p-3.5 rounded-2xl text-left text-sm font-bold transition-all border ${
                  selectedOpt === i
                    ? "bg-purple-600 text-white border-purple-400 shadow-md"
                    : "bg-secondary/60 text-foreground border-border/80 hover:bg-secondary"
                }`}
              >
                <span className="font-mono mr-2 text-purple-400">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={selectedOpt === null || isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 text-white font-extrabold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{currentIdx + 1 === ROTARACT_QUESTIONS.length ? (isSubmitting ? "SUBMITTING..." : "SUBMIT QUIZ") : "NEXT QUESTION"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="text-center py-6 space-y-5">
          <Trophy className="w-16 h-16 mx-auto text-amber-400 animate-bounce" />
          <h4 className="text-2xl font-black text-foreground tracking-tight">ROTARACT GAME COMPLETE</h4>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Score:</p>
            <p className="text-3xl font-black font-mono text-foreground">{score} / {ROTARACT_QUESTIONS.length}</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 inline-block text-purple-300 font-mono text-xl font-black">
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
