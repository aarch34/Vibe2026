"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle, Zap } from "lucide-react";
import { SocialChallenge } from "@/types/database";

interface SocialChallengesCardProps {
  challenges: SocialChallenge[];
  completedIds: string[];
  currentProfileId: string;
}

export function SocialChallengesCard({
  challenges,
  completedIds: initialCompleted,
  currentProfileId,
}: SocialChallengesCardProps) {
  const [completed, setCompleted] = useState<string[]>(initialCompleted);

  const handleClaimChallenge = async (challengeId: string) => {
    if (completed.includes(challengeId)) return;

    try {
      const res = await fetch("/api/challenges/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });

      if (res.ok) {
        setCompleted([...completed, challengeId]);
      } else {
        setCompleted([...completed, challengeId]);
      }
    } catch {
      setCompleted([...completed, challengeId]);
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-card border border-amber-500/30 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          <h3 className="font-black text-base text-foreground">Active VIBE Challenges</h3>
        </div>
        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
          Limited Bonus XP
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {challenges.map((ch) => {
          const isDone = completed.includes(ch.id);

          return (
            <div
              key={ch.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                isDone
                  ? "bg-emerald-500/10 border-emerald-500/30 opacity-90"
                  : "bg-secondary/40 border-border/80 hover:border-amber-500/50"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-foreground">{ch.title}</span>
                  <span className="text-xs font-black text-amber-400 font-mono">+${ch.reward_xp} XP</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{ch.description}</p>
              </div>

              <button
                onClick={() => handleClaimChallenge(ch.id)}
                disabled={isDone}
                className={`w-full mt-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-1 ${
                  isDone
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 shadow-sm active:scale-95"
                }`}
              >
                {isDone ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>COMPLETED</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>CLAIM +{ch.reward_xp} XP</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
