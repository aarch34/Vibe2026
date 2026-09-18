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
  Award,
  Info,
  Gift,
  Gamepad2,
  Camera,
  Waves,
  Users,
} from "lucide-react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { getWalletSummary } from "@/lib/wallet/wallet-service";
import {
  getUserProgression,
  getUserQuests,
  getUserAchievements,
  getUserPlayerStats,
} from "@/lib/gameplay/progression-service";
import { getUserLeaderboardRank } from "@/lib/leaderboard/leaderboard-service";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { formatCoins, formatXP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AttendeeHomePage() {
  const session = await getCurrentUserSession();
  const walletSummary = await getWalletSummary(session.eventId, session.profile.id);
  const progression = await getUserProgression(session.eventId, session.profile.id);
  const quests = await getUserQuests(session.eventId, session.profile.id);
  const achievements = await getUserAchievements(session.eventId, session.profile.id);
  const userRank = await getUserLeaderboardRank(session.eventId, session.profile.id);
  const playerStats = await getUserPlayerStats(session.profile.id);

  // Resolve assigned zone name
  let assignedZoneName = "Arnava";
  if (session.profile.assigned_zone_id) {
    const memZone = mockDb.zones.get(session.profile.assigned_zone_id);
    if (memZone) {
      assignedZoneName = memZone.name;
    } else if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const { data: z } = await supabaseAdmin
          .from("zones")
          .select("name")
          .eq("id", session.profile.assigned_zone_id)
          .maybeSingle();
        if (z) assignedZoneName = z.name;
      } catch {}
    }
  }

  const unlockedBadgesCount = achievements.filter((a) => a.isUnlocked).length;
  const userStampsCount = progression.zonesVisitedCount;

  // 4 Featured Experiences from the 6 official zones
  let featuredExperiences: any[] = [];
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data: exps } = await supabaseAdmin
      .from("experiences")
      .select("*, zones(name), sponsors(name)")
      .eq("event_id", session.eventId)
      .eq("is_active", true)
      .limit(4);
    featuredExperiences = exps || [];
  }

  if (
    !featuredExperiences ||
    featuredExperiences.length === 0 ||
    !featuredExperiences.some(
      (e) => e.slug?.includes("arnava") || e.slug?.includes("taranaga")
    )
  ) {
    featuredExperiences = Array.from(mockDb.experiences.values())
      .filter(
        (e) =>
          e.is_active &&
          e.zone_id.startsWith("z-") &&
          e.zone_id !== "z-arcade" &&
          e.zone_id !== "z-stage"
      )
      .slice(0, 4)
      .map((e) => ({
        ...e,
        zones: { name: mockDb.zones.get(e.zone_id)?.name },
        sponsors: e.sponsor_id ? { name: mockDb.sponsors.get(e.sponsor_id)?.name } : null,
      }));
  }

  const isNewRegistration = walletSummary.transactions.length <= 1;

  return (
    <div className="space-y-6">
      {/* 1. Welcome to VIBE Banner (Loaded with 500 Coins) */}
      {isNewRegistration && (
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-blue-900/60 via-indigo-900/50 to-blue-950 border border-blue-400/30 shadow-lg shadow-blue-950/40">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <span className="text-2xl sm:text-3xl">🎉</span>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Welcome to VIBE, {session.profile.display_name}!
              </h2>
              <p className="text-xs sm:text-sm text-blue-200/90 leading-relaxed">
                Your VIBE Wallet has been loaded with <span className="font-bold text-amber-300">500 VIBE Coins</span>. You are part of <strong className="text-cyan-300">🌊 {assignedZoneName.toUpperCase()}</strong>. Explore zones, play games, and conquer the festival leaderboard!
              </p>
              <div className="pt-1 flex items-center space-x-2 text-[10px] sm:text-xs text-cyan-300 font-medium tracking-wide">
                <span>Explore</span> • <span>Experience</span> • <span>Earn</span> • <span>Spend</span> • <span>Repeat</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Responsive Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Attendee Identity & Core Metrics */}
        <div className="lg:col-span-5 space-y-5">
          {/* Attendee Profile Hero Card (Fulfilling Section 4 Header Specs) */}
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-blue-950/60 to-slate-900 border border-blue-500/20 shadow-xl shadow-blue-950/30">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-400 tracking-wide uppercase">
                    HEY {session.profile.display_name.toUpperCase()} 👋
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center space-x-1 text-xs font-black text-cyan-300 bg-cyan-950/80 border border-cyan-400/40 px-2.5 py-0.5 rounded-full shadow-sm">
                      <span>🌊</span>
                      <span>{assignedZoneName.toUpperCase()}</span>
                      <span className="text-[9px] text-cyan-400 font-normal ml-0.5">(YOUR ZONE)</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {session.profile.club || session.profile.college || "Rotaract District 3192"}
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

              {/* XP & Level Progression Bar */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-bold text-purple-300">
                      LEVEL {progression.currentLevel.sort_order} — {progression.currentLevel.name.toUpperCase()}
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

          {/* Section 4: 4 PROGRESS COUNTERS */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-sm shrink-0">
                🗺️
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Zone Progress</span>
                <span className="text-sm sm:text-base font-black font-mono text-white">
                  {playerStats.zonesVisitedCount} / 6
                </span>
                <span className="text-[9px] text-slate-400 block">explored</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-sm shrink-0">
                ⚡
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Experiences</span>
                <span className="text-sm sm:text-base font-black font-mono text-white">
                  {playerStats.experiencesCompletedCount}
                </span>
                <span className="text-[9px] text-slate-400 block">completed</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-sm shrink-0">
                📸
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Stalls</span>
                <span className="text-sm sm:text-base font-black font-mono text-white">
                  {playerStats.stallsVisitedCount}
                </span>
                <span className="text-[9px] text-slate-400 block">visited</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-sm shrink-0">
                🎮
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Games</span>
                <span className="text-sm sm:text-base font-black font-mono text-white">
                  {playerStats.gamesPlayedCount}
                </span>
                <span className="text-[9px] text-slate-400 block">played</span>
              </div>
            </div>
          </div>

          {/* THE TWO CORE WALLET & XP PILLARS */}
          <div className="grid grid-cols-2 gap-3">
            {/* Metric 1: Spendable Coins */}
            <Link
              href="/app/rewards"
              className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-amber-500/20 hover:border-amber-400/50 hover:bg-slate-900 transition-all flex flex-col justify-between shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  🪙 VIBE Coins
                </span>
                <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {formatCoins(walletSummary.wallet.balance)}
                </span>
                <p className="text-[10px] text-amber-400/90 font-medium mt-0.5">
                  Spendable Balance →
                </p>
              </div>
            </Link>

            {/* Metric 2: Overall XP */}
            <Link
              href="/app/leaderboard"
              className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-purple-500/20 hover:border-purple-400/50 hover:bg-slate-900 transition-all flex flex-col justify-between shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  ⭐ VIBE XP
                </span>
                <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {formatXP(progression.totalXP)}
                </span>
                <p className="text-[10px] text-purple-400/90 font-medium mt-0.5">
                  Rank #{userRank?.rank || 1} • Never Decreases
                </p>
              </div>
            </Link>
          </div>

          {/* Strategic Principle Callout */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-medium">
              <strong className="text-white">Zone Battle Rule:</strong> Any VIBE Coins you spend on activities belonging to a zone are transferred to that zone's collected total for the championship!
            </p>
          </div>
        </div>

        {/* Right Column: 4 Primary Action Buttons & Featured Missions */}
        <div className="lg:col-span-7 space-y-5">
          {/* Networking & Instagram Friends Banner */}
          <Link
            href="/app/friends"
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-pink-950/40 to-slate-900 border border-purple-500/30 hover:border-purple-400/60 active:scale-98 transition-all flex items-center justify-between group shadow-md"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">Networking</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">+25 XP Each</span>
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-pink-300 transition-colors truncate">
                  Connect & Follow Friends on Instagram
                </h3>
                <p className="text-[11px] text-slate-300 truncate">
                  Find fellow attendees, follow on IG & level up together
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-xs font-bold text-pink-400 shrink-0 ml-2">
              <span className="hidden sm:inline">Connect</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Section 4: THE FOUR PRIMARY ACTION BUTTONS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              href="/app/map"
              className="flex items-center space-x-3 p-3.5 rounded-xl bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-900 border border-blue-500/30 hover:border-blue-400/60 active:scale-95 transition-all group shadow-sm"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Compass className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-extrabold text-white leading-tight truncate">Explore Zones</h2>
                <p className="text-[10px] text-slate-400 truncate">6 Official Zones</p>
              </div>
            </Link>

            <Link
              href="/app/games"
              className="flex items-center space-x-3 p-3.5 rounded-xl bg-gradient-to-br from-amber-900/30 via-slate-900 to-slate-900 border border-amber-500/30 hover:border-amber-400/60 active:scale-95 transition-all group shadow-sm"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Gamepad2 className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-extrabold text-white leading-tight truncate">Play Games</h2>
                <p className="text-[10px] text-slate-400 truncate">4 Mini-Games</p>
              </div>
            </Link>

            <Link
              href="/app/scan"
              className="flex items-center space-x-3 p-3.5 rounded-xl bg-gradient-to-br from-cyan-900/30 via-slate-900 to-slate-900 border border-cyan-500/30 hover:border-cyan-400/60 active:scale-95 transition-all group shadow-sm"
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <QrCode className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-extrabold text-white leading-tight truncate">Scan Check-in</h2>
                <p className="text-[10px] text-slate-400 truncate">QR Scanner</p>
              </div>
            </Link>

            <Link
              href="/app/leaderboard"
              className="flex items-center space-x-3 p-3.5 rounded-xl bg-gradient-to-br from-purple-900/30 via-slate-900 to-slate-900 border border-purple-500/30 hover:border-purple-400/60 active:scale-95 transition-all group shadow-sm"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Trophy className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-extrabold text-white leading-tight truncate">Leaderboard</h2>
                <p className="text-[10px] text-slate-400 truncate">XP & Zone Battle</p>
              </div>
            </Link>
          </div>

          {/* Quick Ways to Earn VIBE Coins (Section 9) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 border border-blue-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Ways to Earn More Coins</span>
              </span>
              <Link href="/app/quests" className="text-[11px] text-blue-400 hover:text-cyan-300 font-semibold">
                View Quests →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-amber-400 font-bold block">+50 VIBE</span>
                <span className="text-[10px] text-slate-400">Discover new zone</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-amber-400 font-bold block">+25 VIBE</span>
                <span className="text-[10px] text-slate-400">Stall photo approve</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-amber-400 font-bold block">+100-500 VIBE</span>
                <span className="text-[10px] text-slate-400">Games & Hidden QRs</span>
              </div>
            </div>
          </div>

          {/* Featured Zone Missions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Featured Zone Missions
                </h2>
              </div>
              <Link
                href="/app/map"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-0.5"
              >
                <span>View All 6 Zones</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredExperiences.map((exp: any) => {
                const zoneName = exp.zones?.name || "Event Zone";
                const sponsorName = exp.sponsors?.name;

                return (
                  <div
                    key={exp.id}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/20">
                          🌊 {zoneName}
                        </span>
                        {sponsorName && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/20">
                            {sponsorName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors leading-snug">
                        {exp.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {exp.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-amber-400 font-mono font-bold text-xs bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        <Coins className="w-3 h-3" />
                        <span>{exp.coin_cost} VIBE</span>
                      </div>
                      <Link
                        href={`/app/scan?code=vibe-${exp.slug}`}
                        className="flex items-center space-x-1 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                      >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-purple-300">+{exp.xp_reward} XP</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
