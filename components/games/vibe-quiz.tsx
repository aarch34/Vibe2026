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
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/30 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400">
          <Flame className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
            Game 4 • Festival Culture & Mechanics
          </span>
          <h2 className="text-xl font-extrabold text-white mt-0.5">
            ROCCO Festival Quiz
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed">
            Answer 5 questions on festival lore, zone mechanics, and district competition for tiered XP!
          </p>
        </div>

        {/* Tiered Payout Table */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-1.5 text-[11px] font-mono max-w-xs mx-auto">
          <span className="text-[10px] uppercase font-bold text-slate-400 block text-center pb-1 border-b border-slate-800">
            Tiered XP Rewards (Free Entry)
          </span>
          <div className="flex justify-between">
            <span className="text-slate-400">0 – 30% Score:</span>
            <span className="text-purple-300 font-bold">+10 XP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">31 – 60% Score:</span>
            <span className="text-purple-300 font-bold">+15 XP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">61 – 80% Score:</span>
            <span className="text-purple-300 font-bold">+20 XP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">81 – 100% Score:</span>
            <span className="text-purple-300 font-bold">+25 XP</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs max-w-sm mx-auto">
          🌟 <strong>100% Perfect Score Bonus:</strong> Get 5/5 correct to win a <span className="font-bold text-amber-400">+10 VIBE Coins bonus</span>!
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
        )}

        <button
          onClick={startQuiz}
          className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/30 active:scale-95 transition-all cursor-pointer"
        >
          Start Festival Quiz (Free)
        </button>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-w-lg mx-auto">
        {/* Progress Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Question {currentIdx + 1} of {VIBE_QUESTIONS.length}</span>
          <span className="text-cyan-400 font-bold">Score: {score}</span>
        </div>

        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / VIBE_QUESTIONS.length) * 100}%` }}
          />
        </div>

        {/* Question Title */}
        <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
          {currentQ.question}
        </h3>

        {/* Options */}
        <div className="space-y-2 pt-1">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOpt === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let btnStyle = "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700";
            if (isAnswered) {
              if (isCorrect) {
                btnStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold";
              } else if (isSelected) {
                btnStyle = "bg-rose-950/60 border-rose-500 text-rose-200";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
              >
                <span>{opt}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation on Answer */}
        {isAnswered && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
              VIBE Breakdown
            </span>
            <p>{currentQ.explanation}</p>
          </div>
        )}

        {/* Next Button */}
        {isAnswered && (
          <button
            onClick={handleNextQuestion}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center justify-center space-x-1.5 transition-colors"
          >
            <span>{currentIdx + 1 < VIBE_QUESTIONS.length ? "Next Question" : "View Results"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-md mx-auto">
      {isSubmitting ? (
        <div className="py-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
          <p className="text-xs text-slate-400">Saving quiz rewards...</p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400">
            <Trophy className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              Quiz Completed!
            </span>
            <h3 className="text-xl font-black text-white mt-0.5 font-mono">
              Score: {score} / {VIBE_QUESTIONS.length} ({percent}%)
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {isPerfect
                ? "🌟 PERFECT SCORE! 100% bonus coins credited to your wallet!"
                : percent >= 80
                ? "Excellent job! You unlocked the top tier (+25 XP)!"
                : "Good attempt! You unlocked tiered XP for your journey!"}
            </p>
          </div>

          {/* Reward Breakdown */}
          <div className="grid grid-cols-2 gap-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">XP Earned</span>
              <span className="text-purple-300 font-bold text-sm">
                +{xpAwarded} XP
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Coins Earned</span>
              <span className="text-amber-400 font-bold text-sm">
                +{isPerfect ? 10 : 0} VIBE
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 pt-2">
            <button
              onClick={startQuiz}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
            >
              Play Again (Free)
            </button>
            {onFinished && (
              <button
                onClick={onFinished}
                className="py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-colors"
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
