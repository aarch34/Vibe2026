"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Sparkles, RotateCcw, ArrowRight, Loader2 } from "lucide-react";

interface RotaractGameProps {
  onScoreSubmitted: (score: number, maxScore: number, xp: number) => Promise<void>;
  onClose: () => void;
}

interface Question {
  q: string;
  options: string[];
  correct: number;
}

const FALLBACK_QUESTIONS: Question[] = [
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
];

export function RotaractGame({ onScoreSubmitted, onClose }: RotaractGameProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/data/rotaract_questions.json");
      if (res.ok) {
        const allQuestions: Question[] = await res.json();
        // Pick 10 random questions
        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        setQuestions(shuffled.slice(0, 10));
      } else {
        setQuestions(FALLBACK_QUESTIONS);
      }
    } catch {
      setQuestions(FALLBACK_QUESTIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (selectedOpt === null || isSubmitting) return;

    let newScore = score;
    if (selectedOpt === questions[currentIdx].correct) {
      newScore += 1;
      setScore(newScore);
    }

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
    } else {
      setIsSubmitting(true);
      const pct = (newScore / questions.length) * 100;
      let xp = 25;
      if (pct >= 81) xp = 150;
      else if (pct >= 61) xp = 100;
      else if (pct >= 31) xp = 50;

      setXpEarned(xp);
      setIsFinished(true);
      try {
        await onScoreSubmitted(newScore, questions.length, xp);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const restartGame = () => {
    fetchQuestions();
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setIsFinished(false);
    setXpEarned(0);
  };

  if (loading) {
    return (
      <div className="p-12 rounded-3xl bg-card border border-purple-500/30 max-w-xl mx-auto shadow-2xl flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading Quiz Questions...</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-card border border-purple-500/30 max-w-xl mx-auto shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-black text-lg text-foreground flex items-center space-x-2">
          <span>⚙️</span>
          <span>ROTARACT QUIZ</span>
        </h3>
        <button onClick={onClose} className="text-xs font-bold text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {!isFinished ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-xs font-extrabold text-muted-foreground">
            <span>Question {currentIdx + 1}/{questions.length}</span>
            <span className="font-mono text-purple-400">Score: {score}</span>
          </div>

          <h4 className="font-black text-base text-foreground leading-snug">
            {questions[currentIdx].q}
          </h4>

          <div className="space-y-2.5">
            {questions[currentIdx].options.map((opt, i) => (
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
            <span>{currentIdx + 1 === questions.length ? (isSubmitting ? "SUBMITTING..." : "SUBMIT QUIZ") : "NEXT QUESTION"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="text-center py-6 space-y-5">
          <Trophy className="w-16 h-16 mx-auto text-amber-400 animate-bounce" />
          <h4 className="text-2xl font-black text-foreground tracking-tight">ROTARACT GAME COMPLETE</h4>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Score:</p>
            <p className="text-3xl font-black font-mono text-foreground">{score} / {questions.length}</p>
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
