"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Coins,
  CheckCircle2,
  XCircle,
  Trophy,
  Loader2,
  RefreshCw,
  Award,
  ArrowRight,
  Play,
} from "lucide-react";
import { submitGameResultAction } from "@/actions/games/play";
import confetti from "canvas-confetti";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const ROTARACT_QUESTIONS: Question[] = [
  {
    question: "What is the official motto of Rotary International?",
    options: [
      "Service Above Self",
      "One for All, All for One",
      "Lead, Learn, Leverage",
      "Fellowship Through Power",
    ],
    correctIndex: 0,
    explanation: "Rotary's primary official motto is 'Service Above Self'.",
  },
  {
    question: "Which Rotary District is hosting the VIBE 2026 Freshers Festival?",
    options: ["District 3141", "District 3192", "District 3201", "District 3000"],
    correctIndex: 1,
    explanation: "VIBE 2026 is proudly organized by Rotaract District 3192!",
  },
  {
    question: "In which year was Rotaract officially founded?",
    options: ["1950", "1968", "1985", "2000"],
    correctIndex: 1,
    explanation: "The first Rotaract club was certified in 1968 in North Carolina, USA.",
  },
  {
    question: "What are the four avenues of Rotaract service?",
    options: [
      "Club, Community, International, Professional",
      "Sports, Cultural, Finance, PR",
      "Design, Tech, Social, Outreach",
      "Fellowship, Fundraise, Feed, Fight",
    ],
    correctIndex: 0,
    explanation: "The four traditional avenues are Club, Community, International, and Professional Development.",
  },
  {
    question: "What is the primary objective of Rotaract worldwide?",
    options: [
      "Develop professional & leadership skills while serving communities",
      "Organize only musical concerts",
      "Compete in sports leagues exclusively",
      "Provide corporate certifications",
    ],
    correctIndex: 0,
    explanation: "Rotaract empowers youth through leadership, fellowship, and impactful community service.",
  },
];

interface RotaractGameProps {
  userBalance: number;
  onFinished?: () => void;
}

export function RotaractGame({ userBalance, onFinished }: RotaractGameProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<"intro" | "playing" | "summary">("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutResult, setPayoutResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentQ = ROTARACT_QUESTIONS[currentIdx];

  function startQuiz() {
    setErrorMsg(null);
    setScore(0);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setPayoutResult(null);
    setGameState("playing");
  }

  function handleSelectOption(idx: number) {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  }

  async function handleNextQuestion() {
    if (currentIdx + 1 < ROTARACT_QUESTIONS.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      // Game finished, finalize score
      const finalScore = score + (selectedOpt === currentQ.correctIndex ? 0 : 0);
      const isHighScore = finalScore >= 4; // ≥80%
      const xpPayout = isHighScore ? 25 : 15;
      const coinPayout = isHighScore ? 10 : 0;

      setIsSubmitting(true);
      try {
        const res = await submitGameResultAction({
          gameType: "rotaract_game",
          score: finalScore,
          maxScore: ROTARACT_QUESTIONS.length,
          coinCost: 0,
          coinReward: coinPayout,
          xpReward: xpPayout,
        });

        if (!res.success) {
          setErrorMsg(res.message || "Failed to submit result");
        } else {
          setPayoutResult(res);
          if (isHighScore) {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          }
          router.refresh();
        }
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setIsSubmitting(false);
        setGameState("summary");
      }
    }
  }

  if (gameState === "intro") {
    return (
      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo text-center space-y-5">
        <div className="w-14 h-14 bg-primary text-primary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto">
          <Trophy className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">
            Game 1 • Knowledge Challenge
          </span>
          <h2 className="text-xl font-black text-foreground mt-0.5">
            Rotaract Trivia Game
          </h2>
          <p className="text-xs text-foreground/80 max-w-sm mx-auto mt-1 leading-relaxed">
            Test your knowledge about Rotaract District 3192 history, leadership, and youth service initiatives!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-mono max-w-xs mx-auto">
          <div>
            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Entry Fee</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">FREE</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Base Reward</span>
            <span className="text-purple-600 dark:text-purple-300 font-black">+15 XP</span>
          </div>
        </div>

        <div className="p-2.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-bold max-w-sm mx-auto">
          🔥 <strong>High Score Bonus:</strong> Score ≥ 80% (4/5) to win <span className="font-black">+10 VIBE</span> and <span className="font-black">+25 total XP</span>!
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-500 font-bold">{errorMsg}</p>
        )}

        <button
          onClick={startQuiz}
          className="w-full max-w-xs py-3.5 neo-btn-primary text-sm font-black uppercase tracking-wider space-x-2 mx-auto cursor-pointer flex items-center justify-center"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start Quiz (Free)</span>
        </button>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="p-5 sm:p-6 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
        {/* Progress Header */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono font-bold">
          <span>Question {currentIdx + 1} of {ROTARACT_QUESTIONS.length}</span>
          <span className="text-primary font-black">Score: {score}</span>
        </div>

        <div className="w-full h-2 bg-muted border border-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / ROTARACT_QUESTIONS.length) * 100}%` }}
          />
        </div>

        {/* Question Title */}
        <h3 className="text-base sm:text-lg font-black text-foreground leading-snug">
          {currentQ.question}
        </h3>

        {/* Options */}
        <div className="space-y-2.5 pt-1">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOpt === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let btnStyle = "bg-card text-card-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] hover:shadow-[5px_5px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5";
            if (isAnswered) {
              if (isCorrect) {
                btnStyle = "bg-emerald-500 text-black border-2 border-border shadow-[3px_3px_0px_var(--border)] font-black";
              } else if (isSelected) {
                btnStyle = "bg-primary text-primary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] font-black";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-3.5 border-2 text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
              >
                <span>{opt}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-black shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-white shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation on Answer */}
        {isAnswered && (
          <div className="p-3 bg-muted border-2 border-border text-xs text-foreground/90 space-y-1">
            <span className="text-[10px] font-black text-primary uppercase tracking-wider block">
              Did you know?
            </span>
            <p>{currentQ.explanation}</p>
          </div>
        )}

        {/* Next Button */}
        {isAnswered && (
          <button
            onClick={handleNextQuestion}
            className="w-full py-3.5 neo-btn-secondary text-xs font-black uppercase tracking-wider space-x-2 cursor-pointer flex items-center justify-center"
          >
            <span>{currentIdx + 1 < ROTARACT_QUESTIONS.length ? "Next Question" : "Finish Quiz"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Summary state
  const isHighScore = score >= 4;
  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
      {isSubmitting ? (
        <div className="py-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-xs text-slate-400">Registering game session & rewards...</p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto text-blue-400">
            {isHighScore ? <Award className="w-7 h-7 text-amber-400 animate-bounce" /> : <CheckCircle2 className="w-7 h-7 text-emerald-400" />}
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              Quiz Completed!
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">
              Score: {score} / {ROTARACT_QUESTIONS.length} ({Math.round((score / ROTARACT_QUESTIONS.length) * 100)}%)
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {isHighScore
                ? "🎉 High Score achieved! You earned the high-score bonus!"
                : "Good effort! Practice Rotaract trivia and try again!"}
            </p>
          </div>

          {/* Reward Breakdown */}
          <div className="grid grid-cols-2 gap-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 max-w-xs mx-auto text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">XP Earned</span>
              <span className="text-purple-300 font-bold text-sm">
                +{isHighScore ? 25 : 15} XP
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Coins Earned</span>
              <span className="text-amber-400 font-bold text-sm">
                +{isHighScore ? 10 : 0} VIBE
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 pt-3">
            <button
              onClick={startQuiz}
              className="neo-btn-secondary py-2.5 px-4 text-xs font-black cursor-pointer"
            >
              Play Again (Free)
            </button>
            {onFinished && (
              <button
                onClick={onFinished}
                className="neo-btn-card py-2.5 px-4 text-xs font-black cursor-pointer"
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
