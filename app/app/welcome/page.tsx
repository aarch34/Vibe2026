import React from "react";
import Link from "next/link";
import { Sparkles, Users, Gamepad2, Trophy, ArrowRight } from "lucide-react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const session = await getCurrentUserSession();
  const profile = mockDb.getProfile(session.profile.id) || session.profile;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-card/90 backdrop-blur-2xl border border-pink-500/30 rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden space-y-6">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 text-pink-400 border border-pink-500/30 text-xs font-extrabold shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>VIBE 2026 PRE-EVENT</span>
        </div>

        {/* Main Title & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400">
            WELCOME TO VIBE
          </h1>
          <p className="text-base font-bold text-foreground">
            Your journey starts here.
          </p>
        </div>

        {/* Value Proposition */}
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border/60 text-sm text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">
            Meet people. Make connections. Play games. Earn XP.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-background/60 border border-border/40">
              <Users className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
              <span className="font-bold text-foreground">Networking</span>
            </div>
            <div className="p-2 rounded-xl bg-background/60 border border-border/40">
              <Gamepad2 className="w-5 h-5 mx-auto text-pink-400 mb-1" />
              <span className="font-bold text-foreground">Mobile Games</span>
            </div>
            <div className="p-2 rounded-xl bg-background/60 border border-border/40">
              <Trophy className="w-5 h-5 mx-auto text-amber-400 mb-1" />
              <span className="font-bold text-foreground">Leaderboard</span>
            </div>
          </div>
        </div>

        {/* Starting XP Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-pink-500/10 border border-amber-500/30 text-center space-y-1 shadow-inner">
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
            Starting Gamification Balance
          </span>
          <div className="flex items-center justify-center space-x-2 text-3xl font-black text-amber-300 font-mono">
            <span>⭐</span>
            <span>{profile.xp || 75} XP</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            +75 XP awarded for completing your profile registration!
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href="/app"
          className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:brightness-110 text-white font-black text-base rounded-2xl transition-all shadow-xl shadow-pink-500/25 flex items-center justify-center space-x-2 group"
        >
          <span>ENTER VIBE</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
