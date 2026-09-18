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
        <div className="relative overflow-hidden p-4 sm:p-5 bg-card text-card-foreground border-2 border-border shadow-neo">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <span className="text-2xl sm:text-3xl">🎉</span>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-black text-foreground tracking-tight uppercase">
                Welcome to VIBE, {session.profile.display_name}!
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                Your VIBE Wallet has been loaded with <strong className="text-foreground font-black font-mono">500 VIBE Coins</strong>. You are part of <span className="bg-secondary text-secondary-foreground px-2 py-0.5 font-black border border-border">🌊 {assignedZoneName.toUpperCase()}</span>. Explore zones, play games, and conquer the festival leaderboard!
              </p>
              <div className="pt-1 flex items-center space-x-2 text-[10px] sm:text-xs font-black tracking-wider uppercase text-muted-foreground">
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
          {/* Attendee Profile Hero Card */}
          <div className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-black text-muted-foreground tracking-wider uppercase">
                    HEY {session.profile.display_name.toUpperCase()} 👋
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center space-x-1 text-xs font-black text-secondary-foreground bg-secondary border-2 border-border px-2.5 py-0.5 shadow-[2px_2px_0px_var(--border)]">
                      <span>🌊</span>
                      <span>{assignedZoneName.toUpperCase()}</span>
                      <span className="text-[9px] font-bold ml-0.5">(YOUR ZONE)</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-bold mt-1">
                    {session.profile.club || session.profile.college || "Rotaract District 3192"}
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-xs font-mono font-black text-primary-foreground bg-primary border-2 border-border px-2.5 py-0.5 shadow-[2px_2px_0px_var(--border)]">
                    {session.profile.vibe_id}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground mt-1">
                    District Freshers '26
                  </span>
                </div>
              </div>

              {/* XP & Level Progression Bar */}
              <div className="pt-3 border-t-2 border-border">
                <div className="flex items-center justify-between text-xs mb-1.5 font-black">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-foreground">
                      LEVEL {progression.currentLevel.sort_order} — {progression.currentLevel.name.toUpperCase()}
                    </span>
                  </div>
                  <span className="font-mono text-foreground">
                    {formatXP(progression.totalXP)}
                    {progression.nextLevel && (
                      <span className="text-muted-foreground text-[10px]">
                        {" "}
                        / {formatXP(progression.nextLevel.min_xp)}
                      </span>
                    )}
                  </span>
                </div>

                <div className="w-full h-3 bg-muted border-2 border-border p-0.5 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${progression.progressPercent}%` }}
                  />
                </div>

                {progression.nextLevel && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-right font-bold">
                    {formatXP(progression.xpToNextLevel)} needed for{" "}
                    <span className="text-foreground font-black">
                      {progression.nextLevel.name}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: 4 PROGRESS COUNTERS */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-card text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center space-x-3">
              <div className="w-9 h-9 bg-accent text-accent-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center text-sm shrink-0">
                🗺️
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">Zone Progress</span>
                <span className="text-sm sm:text-base font-black font-mono text-foreground">
                  {playerStats.zonesVisitedCount} / 6
                </span>
                <span className="text-[9px] text-muted-foreground font-bold block">explored</span>
              </div>
            </div>

            <div className="p-3 bg-card text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center space-x-3">
              <div className="w-9 h-9 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center text-sm shrink-0">
                ⚡
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">Experiences</span>
                <span className="text-sm sm:text-base font-black font-mono text-foreground">
                  {playerStats.experiencesCompletedCount}
                </span>
                <span className="text-[9px] text-muted-foreground font-bold block">completed</span>
              </div>
            </div>

            <div className="p-3 bg-card text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center space-x-3">
              <div className="w-9 h-9 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center text-sm shrink-0">
                📸
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">Stalls</span>
                <span className="text-sm sm:text-base font-black font-mono text-foreground">
                  {playerStats.stallsVisitedCount}
                </span>
                <span className="text-[9px] text-muted-foreground font-bold block">visited</span>
              </div>
            </div>

            <div className="p-3 bg-card text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center space-x-3">
              <div className="w-9 h-9 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center text-sm shrink-0">
                🎮
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">Games</span>
                <span className="text-sm sm:text-base font-black font-mono text-foreground">
                  {playerStats.gamesPlayedCount}
                </span>
                <span className="text-[9px] text-muted-foreground font-bold block">played</span>
              </div>
            </div>
          </div>

          {/* THE TWO CORE WALLET & XP PILLARS */}
          <div className="grid grid-cols-2 gap-3">
            {/* Metric 1: Spendable Coins */}
            <Link
              href="/app/rewards"
              className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-black text-foreground">
                  🪙 VIBE Coins
                </span>
                <Coins className="w-4 h-4 text-foreground group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                  {formatCoins(walletSummary.wallet.balance)}
                </span>
                <p className="text-[10px] text-foreground font-black mt-0.5 flex items-center space-x-1">
                  <span>Spendable Balance →</span>
                </p>
              </div>
            </Link>

            {/* Metric 2: Overall XP */}
            <Link
              href="/app/leaderboard"
              className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-black text-foreground">
                  ⭐ VIBE XP
                </span>
                <Sparkles className="w-4 h-4 text-foreground group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                  {formatXP(progression.totalXP)}
                </span>
                <p className="text-[10px] text-foreground font-black mt-0.5 flex items-center space-x-1">
                  <span>Rank #{userRank?.rank || 1} • Permanent</span>
                </p>
              </div>
            </Link>
          </div>

          {/* Strategic Principle Callout */}
          <div className="p-3.5 bg-muted border-2 border-border text-foreground flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-foreground leading-relaxed font-bold">
              <span className="font-black underline">Zone Battle Rule:</span> Any VIBE Coins you spend on activities belonging to a zone are transferred to that zone's collected total for the championship!
            </p>
          </div>
        </div>

        {/* Right Column: 4 Primary Action Buttons & Featured Missions */}
        <div className="lg:col-span-7 space-y-5">
          {/* Networking & Instagram Friends Banner */}
          <Link
            href="/app/friends"
            className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-10 h-10 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">Networking</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-secondary text-secondary-foreground border border-border font-black">+25 XP Each</span>
                </div>
                <h3 className="text-xs sm:text-sm font-black text-foreground group-hover:text-primary transition-colors truncate">
                  Connect & Follow Friends on Instagram
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium truncate">
                  Find fellow attendees, follow on IG & level up together
                </p>
              </div>
            </div>
            <div className="neo-btn-primary px-3 py-1.5 text-xs font-black uppercase tracking-wider shrink-0 ml-2">
              Connect →
            </div>
          </Link>

          {/* Section 4: THE FOUR PRIMARY ACTION BUTTONS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              href="/app/map"
              className="flex items-center space-x-3 p-3.5 bg-card text-card-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] transition-all group"
            >
              <div className="w-9 h-9 bg-accent text-accent-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-black text-foreground leading-tight truncate">Explore Zones</h2>
                <p className="text-[10px] text-muted-foreground font-bold truncate">6 Official Zones</p>
              </div>
            </Link>

            <Link
              href="/app/games"
              className="flex items-center space-x-3 p-3.5 bg-card text-card-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] transition-all group"
            >
              <div className="w-9 h-9 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center shrink-0">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-black text-foreground leading-tight truncate">Play Games</h2>
                <p className="text-[10px] text-muted-foreground font-bold truncate">4 Mini-Games</p>
              </div>
            </Link>

            <Link
              href="/app/scan"
              className="flex items-center space-x-3 p-3.5 bg-card text-card-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] transition-all group"
            >
              <div className="w-9 h-9 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-black text-foreground leading-tight truncate">Scan Check-in</h2>
                <p className="text-[10px] text-muted-foreground font-bold truncate">QR Scanner</p>
              </div>
            </Link>

            <Link
              href="/app/leaderboard"
              className="flex items-center space-x-3 p-3.5 bg-card text-card-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] transition-all group"
            >
              <div className="w-9 h-9 bg-accent text-accent-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-black text-foreground leading-tight truncate">Leaderboard</h2>
                <p className="text-[10px] text-muted-foreground font-bold truncate">XP & Zone Battle</p>
              </div>
            </Link>
          </div>

          {/* Quick Ways to Earn VIBE Coins (Section 9) */}
          <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground uppercase tracking-wider flex items-center space-x-1.5">
                <Coins className="w-4 h-4 text-foreground" />
                <span>Ways to Earn More Coins</span>
              </span>
              <Link href="/app/quests" className="neo-btn-card px-2.5 py-1 text-xs font-black">
                View Quests →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold">
              <div className="p-2.5 bg-muted border-2 border-border">
                <span className="text-foreground font-black font-mono block">+50 VIBE</span>
                <span className="text-[10px] text-muted-foreground font-bold">Discover new zone</span>
              </div>
              <div className="p-2.5 bg-muted border-2 border-border">
                <span className="text-foreground font-black font-mono block">+25 VIBE</span>
                <span className="text-[10px] text-muted-foreground font-bold">Stall photo approve</span>
              </div>
              <div className="p-2.5 bg-muted border-2 border-border">
                <span className="text-foreground font-black font-mono block">+100-500 VIBE</span>
                <span className="text-[10px] text-muted-foreground font-bold">Games & Hidden QRs</span>
              </div>
            </div>
          </div>

          {/* Featured Zone Missions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-primary" />
                <h2 className="text-sm sm:text-base font-black text-foreground tracking-tight uppercase">
                  Featured Zone Missions
                </h2>
              </div>
              <Link
                href="/app/map"
                className="neo-btn-card px-3 py-1 text-xs font-black"
              >
                <span>View All 6 Zones →</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredExperiences.map((exp: any) => {
                const zoneName = exp.zones?.name || "Event Zone";
                const sponsorName = exp.sponsors?.name;

                return (
                  <div
                    key={exp.id}
                    className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-foreground bg-muted border border-border px-2 py-0.5">
                          🌊 {zoneName}
                        </span>
                        {sponsorName && (
                          <span className="text-[10px] font-black text-secondary-foreground bg-secondary border border-border px-2 py-0.5">
                            {sponsorName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-foreground leading-snug">
                        {exp.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium line-clamp-2">
                        {exp.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t-2 border-border flex items-center justify-between">
                      <div className="flex items-center space-x-1 bg-secondary text-secondary-foreground font-mono font-black text-xs border-2 border-border px-2 py-1 shadow-[2px_2px_0px_var(--border)]">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{exp.coin_cost} VIBE</span>
                      </div>
                      <Link
                        href={`/app/scan?code=vibe-${exp.slug}`}
                        className="neo-btn-primary px-3 py-1.5 text-xs font-black flex items-center space-x-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>+{exp.xp_reward} XP</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
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
