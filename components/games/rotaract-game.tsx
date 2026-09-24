"use client";

import React, { useState } from "react";
import { Trophy, Sparkles, RotateCcw, ArrowRight } from "lucide-react";

interface RotaractGameProps {
  onScoreSubmitted: (score: number, maxScore: number, xp: number) => Promise<void>;
  onClose: () => void;
}

const ROTARACT_QUESTIONS = [
  {
    q: "When and where was the very first Rotaract club chartered?",
    options: ["March 13, 1968 at University of North Carolina", "February 23, 1905 in Chicago", "May 1, 1965 in Evanston", "January 10, 1970 at Oxford University"],
    correct: 0,
  },
  {
    q: "Who was the Rotary International President who spearheaded the creation of Rotaract?",
    options: ["Paul P. Harris", "Arch C. Klumph", "Luther H. Hodges", "Chesley R. Perry"],
    correct: 2,
  },
  {
    q: "What does the name 'Rotaract' specifically stand for?",
    options: ["Rotary Actors", "Rotary in Action", "Rotation and Action", "Rotary Activities"],
    correct: 1,
  },
  {
    q: "In what year did Rotary International's Council on Legislation elevate Rotaract from a 'program' to a recognized 'membership type'?",
    options: ["1989", "1999", "2010", "2019"],
    correct: 3,
  },
  {
    q: "What was the original age limit set for Rotaract members when it was founded in 1968?",
    options: ["18 to 30", "16 to 25", "17 to 25", "21 to 35"],
    correct: 2,
  },
  {
    q: "Which country was home to the very first Rotaract club chartered outside the United States?",
    options: ["India", "Mexico", "United Kingdom", "Canada"],
    correct: 1,
  },
  {
    q: "World Rotaract Day is celebrated annually on which date?",
    options: ["March 13", "February 23", "July 1", "October 24"],
    correct: 0,
  },
  {
    q: "In 2020, what historic change did Rotary International enact regarding Rotaract membership?",
    options: ["Required all Rotaractors to pay full Rotary dues", "Eliminated the upper age limit of 30", "Allowed high school students to join", "Merged Rotaract with Interact"],
    correct: 1,
  },
  {
    q: "How many charter members were required to officially start the first Rotaract Club in 1968?",
    options: ["15", "25", "21", "10"],
    correct: 2,
  },
  {
    q: "In 2022, Rotary International expanded the Rotary Foundation rules to allow Rotaract clubs to do what?",
    options: ["Become Rotary Foundation Trustees", "Sponsor Rotary Foundation global grants", "Automatically become Paul Harris Fellows", "Issue their own Rotary currency"],
    correct: 1, 
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
