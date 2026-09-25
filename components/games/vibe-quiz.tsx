"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Sparkles, RotateCcw, ArrowRight } from "lucide-react";
import { rotaractQuestions } from "@/lib/data/quiz-questions";

interface VibeQuizProps {
  onScoreSubmitted: (score: number, maxScore: number, xp: number) => Promise<void>;
  onClose: () => void;
}

interface QuestionState {
  q: string;
  options: string[];
  correct: number;
}

export function VibeQuiz({ onScoreSubmitted, onClose }: VibeQuizProps) {
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    startNewQuiz();
  }, []);

  const startNewQuiz = () => {
    const shuffled = [...rotaractQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10).map(q => {
      // Shuffle options to prevent predictable answers
      const opts = [...q.options].sort(() => 0.5 - Math.random());
      const correctIdx = opts.findIndex(opt => opt === q.answer);
      
      return {
        q: q.question,
        options: opts,
        // Fallback to 0 if not found (shouldn't happen with clean data)
        correct: correctIdx !== -1 ? correctIdx : 0, 
      };
    });
    setQuestions(selected);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setIsFinished(false);
    setXpEarned(0);
  };

  const handleNext = async () => {
    if (selectedOpt === null || isSubmitting || questions.length === 0) return;

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

  if (questions.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-card border border-cyan-500/40 max-w-xl mx-auto shadow-2xl flex items-center justify-center min-h-[300px]">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
            <span>Question {currentIdx + 1}/{questions.length}</span>
            <span className="font-mono text-cyan-400">Score: {score}</span>
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
            <span>{currentIdx + 1 === questions.length ? (isSubmitting ? "SUBMITTING..." : "SUBMIT QUIZ") : "NEXT QUESTION"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="text-center py-6 space-y-5">
          <Trophy className="w-16 h-16 mx-auto text-cyan-400 animate-bounce" />
          <h4 className="text-2xl font-black text-foreground tracking-tight">VIBE QUIZ COMPLETE</h4>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Score:</p>
            <p className="text-3xl font-black font-mono text-foreground">{score} / {questions.length}</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 inline-block text-cyan-300 font-mono text-xl font-black">
            XP EARNED: +{xpEarned} XP
          </div>

          <div className="flex items-center justify-center space-x-3 pt-3">
            <button
              onClick={startNewQuiz}
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
