import Link from "next/link";
import {
  Coins,
  Sparkles,
  Compass,
  QrCode,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Zap,
  Flame,
  ChevronRight,
} from "lucide-react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { getWalletSummary } from "@/lib/wallet/wallet-service";
import { getUserProgression, getUserQuests } from "@/lib/gameplay/progression-service";
import { getUserLeaderboardRank } from "@/lib/leaderboard/leaderboard-service";
import { mockDb } from "@/lib/db/supabase";
import { formatCoins, formatXP } from "@/lib/utils";

export default async function AttendeeHomePage() {
  const session = await getCurrentUserSession();
  const walletSummary = await getWalletSummary(session.eventId, session.profile.id);
  const progression = await getUserProgression(session.eventId, session.profile.id);
  const quests = await getUserQuests(session.eventId, session.profile.id);
  const userRank = await getUserLeaderboardRank(session.eventId, session.profile.id);

  // 3 Featured Experiences
  const featuredExperiences = Array.from(mockDb.experiences.values())
    .filter((e) => e.is_active)
    .slice(0, 3);

  const completedQuestsCount = quests.filter((q) => q.isCompleted).length;

  return (
    <div className="space-y-4">
      {/* 1. Attendee Hero Card */}
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-blue-950/60 to-slate-900 border border-blue-500/20 shadow-xl shadow-blue-950/30">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-400 tracking-wide uppercase">
                Welcome, Fresher
              </p>
              <h1 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                {session.profile.display_name}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {session.profile.college || "Rotaract District 3192"}
              </p>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                {session.profile.vibe_id}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                District Freshers '26
              </span>
            </div>
          </div>

          {/* Wallet & Coins Showcase */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                VIBE Coins Balance
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <Coins className="w-6 h-6 text-amber-400 animate-pulse" />
                <span className="text-2xl font-black font-mono tracking-tight text-white">
                  {formatCoins(walletSummary.wallet.balance)}
                </span>
              </div>
            </div>

            <Link
              href="/app/rewards"
              className="flex items-center space-x-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3 py-2 rounded-xl shadow-md transition-all active:scale-95"
            >
              <span>Spend Coins</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* XP & Level Progress */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold text-purple-300">
                  {progression.currentLevel.name}
                </span>
              </div>
              <span className="font-mono text-slate-300 font-semibold">
                {formatXP(progression.totalXP)}
                {progression.nextLevel && (
                  <span className="text-slate-400 text-[10px]">
                    {" "}
                    / {formatXP(progression.nextLevel.min_xp)}
                  </span>
                )}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progression.progressPercent}%` }}
              />
            </div>

            {progression.nextLevel && (
              <p className="text-[10px] text-slate-400 mt-1.5 text-right font-medium">
                {formatXP(progression.xpToNextLevel)} needed for{" "}
                <span className="text-blue-300 font-semibold">
                  {progression.nextLevel.name}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Quick Action Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href="/app/scan"
          className="flex items-center space-x-3 p-3.5 rounded-xl bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/30 hover:border-blue-400/50 active:scale-95 transition-all group shadow-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <QrCode className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white leading-tight">Scan Checkpoint</h2>
            <p className="text-[10px] text-slate-400">Unlock at zone</p>
          </div>
        </Link>

        <Link
          href="/app/map"
          className="flex items-center space-x-3 p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all group shadow-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white leading-tight">Venue Map</h2>
            <p className="text-[10px] text-slate-400">7 Interactive zones</p>
          </div>
        </Link>
      </div>

      {/* 3. Event Stats Overview */}
      <div className="grid grid-cols-3 gap-2">
        {/* Zone Exploration */}
        <Link
          href="/app/profile#passport"
          className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-center hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex justify-center mb-1">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-base font-black font-mono text-white">
            {progression.zonesVisitedCount}/{progression.totalZonesCount}
          </span>
          <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
            Passport
          </p>
        </Link>

        {/* Quests */}
        <Link
          href="/app/quests"
          className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-center hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex justify-center mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-base font-black font-mono text-white">
            {completedQuestsCount}/{quests.length}
          </span>
          <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
            Quests
          </p>
        </Link>

        {/* Leaderboard Position */}
        <Link
          href="/app/leaderboard"
          className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-center hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex justify-center mb-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="text-base font-black font-mono text-white">
            #{userRank?.rank || 1}
          </span>
          <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
            Rank
          </p>
        </Link>
      </div>

      {/* 4. Featured Experiences */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Featured Zone Missions
            </h2>
          </div>
          <Link
            href="/app/map"
            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-0.5"
          >
            <span>All Zones</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {featuredExperiences.map((exp) => {
            const zone = mockDb.zones.get(exp.zone_id);
            const sponsor = exp.sponsor_id ? mockDb.sponsors.get(exp.sponsor_id) : null;

            return (
              <div
                key={exp.id}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all flex items-center justify-between shadow-sm"
              >
                <div className="space-y-1 flex-1 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-500/20">
                      {zone?.name || "Zone"}
                    </span>
                    {sponsor && (
                      <span className="text-[9px] font-semibold text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {sponsor.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-white">{exp.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {exp.description}
                  </p>
                  <div className="flex items-center space-x-3 text-[10px] font-mono pt-1">
                    {exp.coin_cost > 0 ? (
                      <span className="text-slate-300 font-semibold">
                        Cost:{" "}
                        <span className="text-amber-400">
                          {exp.coin_cost} Coins
                        </span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">
                        Free Entry
                      </span>
                    )}
                    <span className="text-purple-300 font-semibold">
                      +{exp.xp_reward} XP
                    </span>
                  </div>
                </div>

                <Link
                  href="/app/scan"
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white transition-transform shrink-0"
                >
                  Scan QR
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
