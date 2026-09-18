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
  Music,
  ArrowRight,
  Flame,
} from "lucide-react";
import { submitGameResultAction } from "@/actions/games/play";
import confetti from "canvas-confetti";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const VIBE_QUESTIONS: Question[] = [
  {
    question: "What is the overarching theme connecting the 6 official zones of VIBE 2026?",
    options: [
      "The Ocean & Water Dynamics (Arnava, Taranaga, Sagara, Pravaha, Samudhra, Varuna)",
      "Solar Flares & Deep Space",
      "Mountain Climbing & Treks",
      "Retro 80s Synthesizers",
    ],
    correctIndex: 0,
    explanation: "All 6 official zones represent oceanic forces: Arnava, Taranaga, Sagara, Pravaha, Samudhra, and Varuna!",
  },
  {
    question: "In the VIBE Zone Battle, how does a zone climb the championship leaderboard?",
    options: [
      "By collecting VIBE Coins spent by attendees on activities in that zone",
      "By the number of social media likes only",
      "By random lottery selection at midnight",
      "By whichever zone is physically biggest",
    ],
    correctIndex: 0,
    explanation: "Any coins spent by attendees on experiences in a zone are transferred to that zone's collected total!",
  },
  {
    question: "What happens to your personal accumulated XP when you spend VIBE Coins?",
    options: [
      "XP never decreases — Coins measure choices, XP measures your journey",
      "XP drops by half",
      "Your rank is reset to 0",
      "You lose your passport stamps",
    ],
    correctIndex: 0,
    explanation: "XP is immutable! Spending coins does not reduce your accumulated XP or drop your rank.",
  },
  {
    question: "How many VIBE Coins does every attendee receive upon registering for VIBE?",
    options: ["50 VIBE", "100 VIBE", "500 VIBE", "1,000 VIBE"],
    correctIndex: 2,
    explanation: "Every attendee's wallet is loaded with 500 VIBE Coins on initial registration.",
  },
  {
    question: "What reward do you unlock when a volunteer approves your stall photo?",
    options: [
      "⭐ +100 XP and 🪙 +25 VIBE",
      "5 VIBE Coins only",
      "No rewards, just a sticker",
      "Free DJ booth entry",
    ],
    correctIndex: 0,
    explanation: "Approved stall photo submissions automatically award ⭐ +100 XP and 🪙 +25 VIBE!",
  },
];

interface VibeQuizProps {
  userBalance: number;
  onFinished?: () => void;
}

export function VibeQuiz({ userBalance, onFinished }: VibeQuizProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<"intro" | "playing" | "summary">("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutResult, setPayoutResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentQ = VIBE_QUESTIONS[currentIdx];

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

    if (idx === currentQ.correctIndex) {
      setScore((s) => s + 1);
    }
  }

  async function handleNextQuestion() {
    if (currentIdx + 1 < VIBE_QUESTIONS.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      // Calculate tiered reward (10 - 25 XP)
      const percent = Math.round((score / VIBE_QUESTIONS.length) * 100);
      let xpPayout = 10;
      if (percent >= 81) xpPayout = 25;
      else if (percent >= 61) xpPayout = 20;
      else if (percent >= 31) xpPayout = 15;

      const isPerfectScore = score === VIBE_QUESTIONS.length;
      const coinPayout = isPerfectScore ? 10 : 0;

      setIsSubmitting(true);
      try {
        const res = await submitGameResultAction({
          gameType: "vibe_quiz",
          score,
          maxScore: VIBE_QUESTIONS.length,
          coinCost: 0,
          coinReward: coinPayout,
          xpReward: xpPayout,
        });

        if (!res.success) {
          setErrorMsg(res.message);
        } else {
          setPayoutResult(res);
          if (percent >= 80) {
            confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
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
      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo text-center space-y-5 max-w-md mx-auto">
        <div className="w-14 h-14 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto">
          <Flame className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-black text-primary tracking-wider">
            Game 4 • Festival Culture & Mechanics
          </span>
          <h2 className="text-xl font-black text-foreground mt-0.5 font-mono">
            ROCCO Festival Quiz
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed font-bold">
            Answer 5 questions on festival lore, zone mechanics, and district competition for tiered XP!
          </p>
        </div>

        {/* Tiered Payout Table */}
        <div className="p-3 bg-muted text-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-left space-y-1.5 text-[11px] font-mono max-w-xs mx-auto font-bold">
          <span className="text-[10px] uppercase font-black text-muted-foreground block text-center pb-1 border-b-2 border-border font-sans">
            Tiered XP Rewards (Free Entry)
          </span>
          <div className="flex justify-between">
            <span className="text-muted-foreground">0 – 30% Score:</span>
            <span className="text-foreground font-black">+10 XP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">31 – 60% Score:</span>
            <span className="text-foreground font-black">+15 XP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">61 – 80% Score:</span>
            <span className="text-foreground font-black">+20 XP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">81 – 100% Score:</span>
            <span className="text-primary font-black">+25 XP</span>
          </div>
        </div>

        <div className="p-2.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] text-xs max-w-sm mx-auto font-bold">
          🌟 <strong>100% Perfect Score Bonus:</strong> Get 5/5 correct to win a <span className="font-black">+10 VIBE Coins bonus</span>!
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-500 font-bold">{errorMsg}</p>
        )}

        <button
          onClick={startQuiz}
          className="neo-btn-primary w-full max-w-xs py-3.5 text-sm font-black uppercase tracking-wider mx-auto cursor-pointer flex items-center justify-center"
        >
          Start Festival Quiz (Free)
        </button>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="p-5 sm:p-6 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4 max-w-lg mx-auto">
        {/* Progress Header */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono font-bold">
          <span>Question {currentIdx + 1} of {VIBE_QUESTIONS.length}</span>
          <span className="text-primary font-black">Score: {score}</span>
        </div>

        <div className="w-full h-2.5 bg-muted border-2 border-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / VIBE_QUESTIONS.length) * 100}%` }}
          />
        </div>

        {/* Question Title */}
        <h3 className="text-base sm:text-lg font-black text-foreground leading-snug">
          {currentQ.question}
        </h3>

        {/* Options */}
        <div className="space-y-2 pt-1">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOpt === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let btnStyle = "bg-card text-card-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] cursor-pointer";
            if (isAnswered) {
              if (isCorrect) {
                btnStyle = "bg-primary text-primary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] font-black";
              } else if (isSelected) {
                btnStyle = "bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] font-bold";
              } else {
                btnStyle = "bg-muted text-muted-foreground border-2 border-border opacity-60";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-3.5 border-2 text-xs font-bold transition-all flex items-center justify-between ${btnStyle}`}
              >
                <span>{opt}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-primary-foreground shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-secondary-foreground shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation on Answer */}
        {isAnswered && (
          <div className="p-3.5 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs text-foreground space-y-1 font-bold">
            <span className="text-[10px] font-black text-primary uppercase tracking-wider block font-mono">
              VIBE Breakdown
            </span>
            <p>{currentQ.explanation}</p>
          </div>
        )}

        {/* Next Button */}
        {isAnswered && (
          <button
            onClick={handleNextQuestion}
            className="neo-btn-primary w-full py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>{currentIdx + 1 < VIBE_QUESTIONS.length ? "Next Question" : "View Results"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Summary State
  const percent = Math.round((score / VIBE_QUESTIONS.length) * 100);
  const isPerfect = score === VIBE_QUESTIONS.length;
  let xpAwarded = 50;
  if (percent >= 81) xpAwarded = 250;
  else if (percent >= 61) xpAwarded = 150;
  else if (percent >= 31) xpAwarded = 100;

  return (
    <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo text-center space-y-4 max-w-md mx-auto">
      {isSubmitting ? (
        <div className="py-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground font-bold">Saving quiz rewards...</p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto">
            <Trophy className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] uppercase font-black text-primary tracking-wider">
              Quiz Completed!
            </span>
            <h3 className="text-xl font-black text-foreground mt-0.5 font-mono">
              Score: {score} / {VIBE_QUESTIONS.length} ({percent}%)
            </h3>
            <p className="text-xs text-muted-foreground mt-1 font-bold">
              {isPerfect
                ? "🌟 PERFECT SCORE! 100% bonus coins credited to your wallet!"
                : percent >= 80
                ? "Excellent job! You unlocked the top tier (+25 XP)!"
                : "Good attempt! You unlocked tiered XP for your journey!"}
            </p>
          </div>

          {/* Reward Breakdown */}
          <div className="grid grid-cols-2 gap-2 p-3.5 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-mono font-bold text-foreground">
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">XP Earned</span>
              <span className="text-primary font-black text-sm">
                +{xpAwarded} XP
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">Coins Earned</span>
              <span className="text-foreground font-black text-sm">
                +{isPerfect ? 10 : 0} VIBE
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
