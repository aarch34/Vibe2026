"use client";

import React, { useState, useMemo } from "react";
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
  HelpCircle,
} from "lucide-react";
import { submitGameResultAction } from "@/actions/games/play";
import confetti from "canvas-confetti";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Authentic, prestigious, and challenging Rotaract & Rotary questions
const ROTARACT_MASTER_QUESTION_POOL: Question[] = [
  {
    id: "q1",
    question:
      "Which Rotary Club officially sponsored the very first chartered Rotaract Club on March 13, 1968?",
    options: [
      "Rotary Club of Charlotte, North Carolina, USA",
      "Rotary Club of Chicago, Illinois, USA",
      "Rotary Club of London, England",
      "Rotary Club of Melbourne, Australia",
    ],
    correctIndex: 0,
    explanation:
      "The first chartered Rotaract club was the Rotaract Club of the University of North Carolina at Charlotte, sponsored by the Rotary Club of Charlotte on March 13, 1968.",
  },
  {
    id: "q2",
    question:
      "Who authored 'The Four-Way Test' in 1932, which was officially adopted by Rotary International in 1943?",
    options: [
      "Herbert J. Taylor",
      "Paul P. Harris",
      "Arch C. Klumph",
      "Chesley R. Perry",
    ],
    correctIndex: 0,
    explanation:
      "Rotarian Herbert J. Taylor authored the 24-word Four-Way Test in 1932 to save the Club Aluminum Company from bankruptcy during the Great Depression.",
  },
  {
    id: "q3",
    question:
      "What historic constitutional change did the 2019 Council on Legislation (CoL) enact regarding Rotaract?",
    options: [
      "Elevated Rotaract to a distinct membership type alongside Rotary & removed the upper age limit of 30",
      "Made dual membership mandatory for all Rotaractors worldwide",
      "Restricted Rotaract membership strictly to university-based clubs",
      "Merged Rotaract and Interact into a single combined youth program",
    ],
    correctIndex: 0,
    explanation:
      "The 2019 Council on Legislation voted to elevate Rotaract from a Rotary program to an official club membership category and eliminated the upper age cap of 30.",
  },
  {
    id: "q4",
    question:
      "Rotaract District 3192 was established following the historic bifurcation of which parent Rotary District?",
    options: [
      "Rotary District 3190",
      "Rotary District 3201",
      "Rotary District 3141",
      "Rotary District 3000",
    ],
    correctIndex: 0,
    explanation:
      "Due to exponential growth across the Bangalore and surrounding Karnataka regions, District 3190 was bifurcated into District 3191 and District 3192.",
  },
  {
    id: "q5",
    question:
      "In 1989, Rotary officially adopted 'Service Above Self' as its primary motto. What was the secondary official motto adopted simultaneously?",
    options: [
      "One Profits Most Who Serves Best",
      "Fellowship Through Service",
      "Be a Gift to the World",
      "Engage Rotary, Change Lives",
    ],
    correctIndex: 0,
    explanation:
      "The 1989 Council on Legislation affirmed 'Service Above Self' and 'One Profits Most Who Serves Best' (adapted from Arthur F. Sheldon's 1910 address) as the dual official mottoes.",
  },
  {
    id: "q6",
    question:
      "On February 23, 1905, Paul P. Harris convened the first Rotary meeting in Chicago. Who were the other three founding members present?",
    options: [
      "Silvester Schiele, Gustavus Loehr, and Hiram E. Shorey",
      "Herbert J. Taylor, Arch Klumph, and Chesley Perry",
      "Frank Collins, Harry Ruggles, and Will Neff",
      "Charles Canfield, Montague Ferry, and Arthur Sheldon",
    ],
    correctIndex: 0,
    explanation:
      "The meeting was held at Gustavus Loehr's office (Room 711, Unity Building) with Paul Harris, Silvester Schiele (coal merchant), Gustavus Loehr (mining engineer), and Hiram Shorey (tailor).",
  },
  {
    id: "q7",
    question:
      "Who proposed creating an endowment fund in 1917 'for doing good in the world' with an initial $26.50, which became The Rotary Foundation?",
    options: [
      "Arch C. Klumph",
      "Paul P. Harris",
      "James Wheeler Davidson",
      "Glenn C. Mead",
    ],
    correctIndex: 0,
    explanation:
      "RI President Arch C. Klumph proposed the endowment fund at the 1917 Atlanta Convention, starting with $26.50 leftover from the Kansas City convention committee.",
  },
  {
    id: "q8",
    question:
      "In which year did Rotary International launch 'PolioPlus', the premier global initiative to eradicate polio worldwide?",
    options: ["1985", "1975", "1995", "2002"],
    correctIndex: 0,
    explanation:
      "Rotary launched PolioPlus in 1985, setting an audacious goal of universal polio immunization that has reduced global cases by over 99.9%.",
  },
  {
    id: "q9",
    question:
      "In the Rotaract District administrative structure, what is the official title of the highest-ranking executive officer leading the district?",
    options: [
      "District Rotaract Representative (DRR)",
      "District Governor (DG)",
      "Youth Service Director (YSD)",
      "Rotaract Committee Chair (RCC)",
    ],
    correctIndex: 0,
    explanation:
      "The District Rotaract Representative (DRR) is the highest-ranking youth executive elected by club presidents to represent, administer, and inspire the entire district.",
  },
  {
    id: "q10",
    question:
      "During which month is 'World Rotaract Week' celebrated annually by clubs across the globe?",
    options: [
      "March (incorporating the charter date of March 13)",
      "February (honoring Rotary's founding on Feb 23)",
      "October (commemorating World Polio Day)",
      "July (marking the start of the new administrative year)",
    ],
    correctIndex: 0,
    explanation:
      "World Rotaract Week is celebrated annually during the week containing March 13 to commemorate the official chartering of the first Rotaract club in 1968.",
  },
];

function selectRandomQuestions(count = 5): Question[] {
  const shuffled = [...ROTARACT_MASTER_QUESTION_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

interface RotaractGameProps {
  userBalance: number;
  onFinished?: () => void;
}

export function RotaractGame({ userBalance, onFinished }: RotaractGameProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<"intro" | "playing" | "summary">("intro");
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutResult, setPayoutResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function startQuiz() {
    const qList = selectRandomQuestions(5);
    setActiveQuestions(qList);
    setErrorMsg(null);
    setScore(0);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setPayoutResult(null);
    setGameState("playing");
  }

  const currentQ = activeQuestions[currentIdx];

  function handleSelectOption(idx: number) {
    if (isAnswered || !currentQ) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  }

  async function handleNextQuestion() {
    if (currentIdx + 1 < activeQuestions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      // Quiz finished, finalize score
      const finalScore = score;
      const isHighScore = finalScore >= 4; // ≥80% (4 out of 5)
      const isPassing = finalScore >= 2; // At least 2/5 (40%) to qualify for XP
      const xpPayout = isHighScore ? 25 : isPassing ? 15 : 0;
      const coinPayout = isHighScore ? 10 : 0;

      setIsSubmitting(true);
      try {
        const res = await submitGameResultAction({
          gameType: "rotaract_game",
          score: finalScore,
          maxScore: activeQuestions.length,
          coinCost: 0,
          coinReward: coinPayout,
          xpReward: xpPayout,
        });

        if (!res.success) {
          setErrorMsg(res.message || "Failed to submit result");
        } else {
          setPayoutResult(res);
          if (isHighScore) {
            confetti({ particleCount: 85, spread: 70, origin: { y: 0.6 } });
          }
          router.refresh();
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Network error submitting result");
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
          <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block font-mono">
            District 3192 • Prestige Knowledge Challenge
          </span>
          <h2 className="text-xl font-black text-foreground mt-0.5 font-mono">
            Rotaract & Rotary Masters Quiz
          </h2>
          <p className="text-xs text-foreground/80 max-w-sm mx-auto mt-1.5 leading-relaxed">
            Test your authentic mastery on Rotaract history, Rotary International governance, the Four-Way Test, and District 3192 milestones!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-mono max-w-xs mx-auto">
          <div>
            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Entry Fee</span>
            <span className="text-emerald-500 font-black">FREE</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Base XP</span>
            <span className="text-purple-400 font-black">+15 XP</span>
          </div>
        </div>

        <div className="p-2.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-bold max-w-sm mx-auto">
          🔥 <strong>Mastery Bonus:</strong> Score ≥ 80% (4/5) on these authentic questions to win <span className="font-black">+10 VIBE</span> coins and <span className="font-black">+25 total XP</span>!
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-500 font-bold">{errorMsg}</p>
        )}

        <button
          onClick={startQuiz}
          className="w-full max-w-xs py-3.5 neo-btn-primary text-sm font-black uppercase tracking-wider space-x-2 mx-auto cursor-pointer flex items-center justify-center"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Begin Challenge (5 Questions)</span>
        </button>
      </div>
    );
  }

  if (gameState === "playing" && currentQ) {
    return (
      <div className="p-5 sm:p-6 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
        {/* Progress Header */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono font-bold">
          <span>Question {currentIdx + 1} of {activeQuestions.length}</span>
          <span className="text-primary font-black">Score: {score}</span>
        </div>

        <div className="w-full h-2 bg-muted border border-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / activeQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question Title */}
        <h3 className="text-base sm:text-lg font-black text-foreground leading-snug font-mono">
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
                btnStyle = "bg-rose-500 text-white border-2 border-border shadow-[3px_3px_0px_var(--border)] font-black";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-3.5 border-2 text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
              >
                <span className="pr-2">{opt}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-black shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-white shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* In-depth educational feedback */}
        {isAnswered && (
          <div className="p-3 bg-muted border-2 border-border text-xs text-foreground/90 space-y-1">
            <span className="text-[10px] font-black text-primary uppercase tracking-wider block font-mono flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              <span>Rotary / Rotaract Fact</span>
            </span>
            <p className="leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}

        {/* Next Button */}
        {isAnswered && (
          <button
            onClick={handleNextQuestion}
            className="w-full py-3.5 neo-btn-secondary text-xs font-black uppercase tracking-wider space-x-2 cursor-pointer flex items-center justify-center"
          >
            <span>{currentIdx + 1 < activeQuestions.length ? "Next Question" : "View Results"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Summary state
  const isHighScore = score >= 4;
  return (
    <div className="p-6 rounded-none bg-card border-2 border-border shadow-neo text-center space-y-4">
      {isSubmitting ? (
        <div className="py-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground font-mono font-bold">
            Recording session & calculating rewards...
          </p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 bg-primary text-primary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto">
            {isHighScore ? (
              <Award className="w-7 h-7 text-primary-foreground animate-bounce" />
            ) : (
              <CheckCircle2 className="w-7 h-7 text-primary-foreground" />
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-primary font-mono tracking-wider">
              Quiz Completed
            </span>
            <h3 className="text-xl font-black text-foreground font-mono mt-0.5">
              Score: {score} / {activeQuestions.length} ({Math.round((score / Math.max(1, activeQuestions.length)) * 100)}%)
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {isHighScore
                ? "🎉 High Honor! You mastered the Rotaract trivia and earned the high score bonus!"
                : score >= 2
                ? "Good effort! You answered enough questions correctly to earn XP."
                : "You must answer at least 2 questions correctly to earn XP. Review the facts and try again!"}
            </p>
          </div>

          {score < 2 && (
            <div className="p-2 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold max-w-xs mx-auto">
              ⚠️ Answer ≥ 2 questions correctly to unlock XP rewards!
            </div>
          )}

          {/* Reward Breakdown */}
          <div className="grid grid-cols-2 gap-2 p-3.5 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)] max-w-xs mx-auto text-xs font-mono">
            <div>
              <span className="text-[10px] text-muted-foreground block font-bold uppercase">XP Earned</span>
              <span className={score >= 2 ? "text-purple-400 font-bold text-sm" : "text-muted-foreground font-bold text-sm"}>
                +{isHighScore ? 25 : score >= 2 ? 15 : 0} XP
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-bold uppercase">VIBE Bonus</span>
              <span className={isHighScore ? "text-amber-400 font-bold text-sm" : "text-muted-foreground font-bold text-sm"}>
                +{isHighScore ? 10 : 0} VIBE
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 pt-3">
            <button
              onClick={startQuiz}
              className="neo-btn-secondary py-2.5 px-4 text-xs font-black uppercase cursor-pointer"
            >
              Play Again
            </button>
            {onFinished && (
              <button
                onClick={onFinished}
                className="neo-btn-card py-2.5 px-4 text-xs font-black uppercase cursor-pointer"
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
