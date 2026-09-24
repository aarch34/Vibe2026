"use client";

import React from "react";
import { calculateLevel } from "@/lib/db/mock-store";
import { useLiveStats } from "@/components/providers/live-stats-provider";

interface DashboardWelcomeProps {
  initialDisplayName: string;
  initialConnectionsCount: number;
  initialXp: number;
}

export function DashboardWelcome({
  initialDisplayName,
  initialConnectionsCount,
}: DashboardWelcomeProps) {
  const { xp } = useLiveStats();
  const connectionsCount = initialConnectionsCount; // Or could be derived from global state if needed, but keeping it simple

  const levelInfo = calculateLevel(xp);
  const minXp = levelInfo.min_xp;
  const maxXp = levelInfo.max_xp || 3000;
  const currentLevelXp = Math.max(0, xp - minXp);
  const totalLevelRange = Math.max(1, maxXp - minXp);
  const progressPercent = Math.min(100, Math.floor((currentLevelXp / totalLevelRange) * 100));

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 border border-pink-500/20 shadow-xl relative overflow-hidden space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">{initialDisplayName}</span> 👋
          </h1>
          <p className="text-xs text-muted-foreground">
            Rotaract District 3192 Pre-Event Social Hub • Connect, post & level up!
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-3 rounded-2xl bg-card border border-border text-center">
            <span className="text-xs font-extrabold uppercase text-muted-foreground block">Connections</span>
            <span className="text-lg font-black text-cyan-400 font-mono">{connectionsCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border text-center">
            <span className="text-xs font-extrabold uppercase text-muted-foreground block">XP Balance</span>
            <span className="text-lg font-black text-amber-400 font-mono">⭐ {xp}</span>
          </div>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center justify-between text-xs font-extrabold">
          <span className="flex items-center space-x-1.5 text-foreground">
            <span>{levelInfo.badge}</span>
            <span>{levelInfo.level_name}</span>
          </span>
          <span className="text-muted-foreground font-mono text-[11px]">
            {xp} / {levelInfo.max_xp ? `${levelInfo.max_xp + 1} XP` : "MAX"}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-secondary/80 overflow-hidden p-0.5 border border-border/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
