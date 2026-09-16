import { getCurrentUserSession } from "@/lib/auth/session";
import { getWalletSummary } from "@/lib/wallet/wallet-service";
import {
  getUserProgression,
  getUserPassport,
  getUserAchievements,
  getUserPlayerStats,
} from "@/lib/gameplay/progression-service";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import {
  User,
  Coins,
  ShieldCheck,
  Trophy,
  History,
  Lock,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Instagram,
  BarChart3,
  Waves,
  Sparkles,
  Camera,
  Gamepad2,
} from "lucide-react";
import { formatCoins, formatXP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getCurrentUserSession();
  const [walletSummary, progression, passportZones, achievements, playerStats] =
    await Promise.all([
      getWalletSummary(session.eventId, session.profile.id),
      getUserProgression(session.eventId, session.profile.id),
      getUserPassport(session.eventId, session.profile.id),
      getUserAchievements(session.eventId, session.profile.id),
      getUserPlayerStats(session.profile.id),
    ]);

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

  const instaHandle =
    session.profile.instagram_id ||
    `@${session.profile.display_name.toLowerCase().replace(/\s+/g, ".")}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Profile Card & Transaction Ledger */}
      <div className="lg:col-span-5 space-y-5">
        {/* 1. Attendee Profile Header Card (Section 29) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-md shrink-0">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-black text-lg text-white">
                {session.profile.display_name.charAt(0)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h1 className="text-base sm:text-lg font-black text-white truncate">
                  {session.profile.display_name}
                </h1>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 shrink-0 ml-2">
                  {session.profile.vibe_id}
                </span>
              </div>

              {/* Instagram Handle */}
              <div className="flex items-center space-x-1 text-xs text-pink-400 font-mono mt-0.5">
                <Instagram className="w-3.5 h-3.5" />
                <span>{instaHandle}</span>
              </div>

              {/* Club & Assigned Zone */}
              <p className="text-xs text-slate-400 mt-1 truncate">
                {session.profile.club || session.profile.college || "Rotaract District 3192"}
              </p>

              <div className="pt-1.5">
                <span className="inline-flex items-center space-x-1 text-xs font-black text-cyan-300 bg-cyan-950/80 border border-cyan-400/40 px-2.5 py-0.5 rounded-full shadow-sm">
                  <span>🌊</span>
                  <span>{assignedZoneName.toUpperCase()}</span>
                  <span className="text-[9px] text-cyan-400 font-normal ml-0.5">(YOUR ZONE)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Level and Coins Quick Bar */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Progression</span>
              <span className="text-xs font-bold text-purple-300">
                LEVEL {progression.currentLevel.sort_order} — {progression.currentLevel.name.toUpperCase()}
              </span>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                {formatXP(progression.totalXP)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Current Balance</span>
              <span className="text-xs font-black font-mono text-amber-400">
                {formatCoins(walletSummary.wallet.balance)} Coins
              </span>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Spent: {formatCoins(walletSummary.totalSpent)}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Immutable Wallet Transaction Ledger */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <History className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                Wallet Ledger
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {walletSummary.transactions.length} entries
            </span>
          </div>

          <div className="space-y-1.5 max-h-72 lg:max-h-80 overflow-y-auto pr-1">
            {walletSummary.transactions.map((tx) => {
              const isCredit = tx.type === "earn" || tx.type === "initial_credit";

              return (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isCredit
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-950 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-white uppercase tracking-tight text-[11px]">
                        {tx.type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(tx.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span
                      className={`font-bold ${
                        isCredit ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCoins(tx.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Bal: {formatCoins(tx.balance_after)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: 10-Metric Stats Grid, Passport & Badges */}
      <div className="lg:col-span-7 space-y-5">
        {/* Section 30: THE 10-METRIC PLAYER STATS GRID */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-blue-500/30 space-y-3 shadow-xl">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
              10 Player Statistics
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* 1. Total VIBE earned */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">1. VIBE Earned</span>
              <span className="text-sm font-black font-mono text-amber-400">+{formatCoins(playerStats.totalVibeEarned)}</span>
            </div>

            {/* 2. Total VIBE spent */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">2. VIBE Spent</span>
              <span className="text-sm font-black font-mono text-rose-400">-{formatCoins(playerStats.totalVibeSpent)}</span>
            </div>

            {/* 3. XP earned */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">3. XP Earned</span>
              <span className="text-sm font-black font-mono text-purple-300">{formatXP(playerStats.xpEarned)}</span>
            </div>

            {/* 4. Zones visited */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">4. Zones (0/6)</span>
              <span className="text-sm font-black font-mono text-cyan-300">{playerStats.zonesVisitedCount} / 6</span>
            </div>

            {/* 5. Experiences completed */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">5. Experiences</span>
              <span className="text-sm font-black font-mono text-white">{playerStats.experiencesCompletedCount}</span>
            </div>

            {/* 6. Stalls visited */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">6. Stalls Visited</span>
              <span className="text-sm font-black font-mono text-white">{playerStats.stallsVisitedCount}</span>
            </div>

            {/* 7. Games played */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">7. Games Played</span>
              <span className="text-sm font-black font-mono text-white">{playerStats.gamesPlayedCount}</span>
            </div>

            {/* 8. Games won */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">8. Games Won</span>
              <span className="text-sm font-black font-mono text-emerald-400">{playerStats.gamesWonCount}</span>
            </div>

            {/* 9. Photos approved */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">9. Photos Approved</span>
              <span className="text-sm font-black font-mono text-cyan-400">{playerStats.photosApprovedCount}</span>
            </div>

            {/* 10. Quests completed */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">10. Quests Done</span>
              <span className="text-sm font-black font-mono text-amber-300">{playerStats.questsCompletedCount}</span>
            </div>
          </div>
        </div>

        {/* Digital Passport (6 Official Zones Grid) */}
        <div id="passport" className="space-y-3 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                6-Zone Digital Passport Stamps
              </h2>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-md">
              {progression.zonesVisitedCount} / 6 Zones
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {passportZones.map((item) => (
              <div
                key={item.zone.id}
                className={`p-3 rounded-xl border transition-all ${
                  item.isUnlocked
                    ? "bg-emerald-950/20 border-emerald-500/40"
                    : "bg-slate-950/60 border-slate-800/80 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono font-bold text-slate-400">
                    Z{item.zone.sort_order}
                  </span>
                  {item.isUnlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-white truncate">
                  🌊 {item.zone.name}
                </h4>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                  {item.isUnlocked
                    ? `${item.completedExperiencesCount} Completed`
                    : "Unvisited"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements Showcase */}
        <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Achievements Showcase
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {achievements.map(({ achievement, isUnlocked }) => (
              <div
                key={achievement.id}
                className={`p-3.5 rounded-xl border ${
                  isUnlocked
                    ? "bg-purple-950/20 border-purple-500/40"
                    : "bg-slate-950/40 border-slate-800/60 opacity-60"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-base">
                    {isUnlocked ? "🏆" : "🔒"}
                  </span>
                  <h4 className="text-xs font-bold text-white truncate">
                    {achievement.name}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
