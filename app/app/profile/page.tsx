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
        <div className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-14 h-14 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center font-black text-xl shrink-0">
              {session.profile.display_name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h1 className="text-base sm:text-lg font-black text-foreground truncate">
                  {session.profile.display_name}
                </h1>
                <span className="text-xs font-mono font-black text-primary-foreground bg-primary px-2 py-0.5 border-2 border-border shadow-[1px_1px_0px_var(--border)] shrink-0 ml-2">
                  {session.profile.vibe_id}
                </span>
              </div>

              {/* Instagram Handle */}
              <a
                href={`https://instagram.com/${instaHandle.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open @${instaHandle.replace(/^@/, "")} on Instagram`}
                className="inline-flex items-center space-x-1.5 text-xs text-primary hover:underline font-mono font-bold mt-0.5 group cursor-pointer"
              >
                <Instagram className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>{instaHandle}</span>
                <span className="text-[10px] opacity-70">↗</span>
              </a>

              {/* Club & Assigned Zone */}
              <p className="text-xs text-muted-foreground font-bold mt-1 truncate">
                {session.profile.club || session.profile.college || "Rotaract District 3192"}
              </p>

              <div className="pt-1.5">
                <span className="inline-flex items-center space-x-1 text-xs font-black text-secondary-foreground bg-secondary border-2 border-border px-2.5 py-0.5 shadow-[2px_2px_0px_var(--border)]">
                  <span>🌊</span>
                  <span>{assignedZoneName.toUpperCase()}</span>
                  <span className="text-[9px] font-bold ml-0.5">(YOUR ZONE)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Level and Coins Quick Bar */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t-2 border-border">
            <div className="p-3 bg-muted border-2 border-border">
              <span className="text-[10px] font-black uppercase text-muted-foreground block">Progression</span>
              <span className="text-xs font-black text-foreground">
                LEVEL {progression.currentLevel.sort_order} — {progression.currentLevel.name.toUpperCase()}
              </span>
              <p className="text-[10px] font-mono font-bold text-muted-foreground mt-0.5">
                {formatXP(progression.totalXP)}
              </p>
            </div>

            <div className="p-3 bg-muted border-2 border-border">
              <span className="text-[10px] font-black uppercase text-muted-foreground block">Current Balance</span>
              <span className="text-xs font-black font-mono text-foreground">
                {formatCoins(walletSummary.wallet.balance)} Coins
              </span>
              <p className="text-[10px] font-mono font-bold text-muted-foreground mt-0.5">
                Spent: {formatCoins(walletSummary.totalSpent)}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Immutable Wallet Transaction Ledger */}
        <div className="space-y-3 p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <History className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-black text-foreground uppercase tracking-tight">
                Wallet Ledger
              </h2>
            </div>
            <span className="text-[11px] font-mono font-black text-muted-foreground">
              {walletSummary.transactions.length} entries
            </span>
          </div>

          <div className="space-y-2 max-h-72 lg:max-h-80 overflow-y-auto pr-1">
            {walletSummary.transactions.map((tx) => {
              const isCredit = tx.type === "earn" || tx.type === "initial_credit";

              return (
                <div
                  key={tx.id}
                  className="p-2.5 bg-muted border-2 border-border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-6 h-6 border-2 border-border flex items-center justify-center shrink-0 ${
                        isCredit
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <span className="font-black text-foreground uppercase tracking-tight text-[11px]">
                        {tx.type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground block font-mono font-bold">
                        {new Date(tx.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span
                      className={`font-black ${
                        isCredit ? "text-foreground" : "text-primary"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCoins(tx.amount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-bold">
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
        <div className="p-4 sm:p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="text-sm sm:text-base font-black text-foreground uppercase tracking-tight">
              10 Player Statistics
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* 1. Total VIBE earned */}
            <div className="p-3 bg-muted border-2 border-border">
              <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">1. VIBE Earned</span>
              <span className="text-sm font-black font-mono text-foreground">+{formatCoins(playerStats.totalVibeEarned)}</span>
            </div>

            {/* 2. Total VIBE spent */}
            <div className="p-3 bg-muted border-2 border-border">
              <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">2. VIBE Spent</span>
              <span className="text-sm font-black font-mono text-primary">-{formatCoins(playerStats.totalVibeSpent)}</span>
            </div>

            {/* 3. XP earned */}
            <div className="p-3 bg-muted border-2 border-border">
              <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">3. XP Earned</span>
              <span className="text-sm font-black font-mono text-foreground">{formatXP(playerStats.xpEarned)}</span>
            </div>

            {/* 4. Zones visited */}
            <div className="p-3 bg-muted border-2 border-border">
              <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">4. Zones</span>
              <span className="text-sm font-black font-mono text-foreground">{playerStats.zonesVisitedCount} / 6</span>
            </div>

            {/* 5. Experiences completed */}
            <div className="p-3 bg-muted border-2 border-border">
              <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">5. Experiences</span>
              <span className="text-sm font-black font-mono text-foreground">{playerStats.experiencesCompletedCount}</span>
            </div>

            {/* 6. Stalls visited */}
            <div className="p-3 bg-muted border-2 border-border">
              <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">6. Stalls</span>
              <span className="text-sm font-black font-mono text-foreground">{playerStats.stallsVisitedCount}</span>
            </div>

            {/* 7. Games played */}
            <div className="p-3 bg-muted border-2 border-border">
              <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">7. Games</span>
              <span className="text-sm font-black font-mono text-foreground">{playerStats.gamesPlayedCount}</span>
            </div>

            {/* 8. Games won */}
            <div className="p-3 bg-muted border-2 border-border">
              <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">8. Won</span>
              <span className="text-sm font-black font-mono text-foreground">{playerStats.gamesWonCount}</span>
            </div>

            {/* 9. Photos approved */}
            <div className="p-3 bg-muted border-2 border-border">
              <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">9. Photos</span>
              <span className="text-sm font-black font-mono text-foreground">{playerStats.photosApprovedCount}</span>
            </div>

            {/* 10. Quests completed */}
            <div className="p-3 bg-muted border-2 border-border">
              <span className="text-[10px] uppercase font-black text-muted-foreground block truncate">10. Quests</span>
              <span className="text-sm font-black font-mono text-foreground">{playerStats.questsCompletedCount}</span>
            </div>
          </div>
        </div>

        {/* Digital Passport (6 Official Zones Grid) */}
        <div id="passport" className="space-y-3 p-4 sm:p-5 bg-card text-card-foreground border-2 border-border shadow-neo">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-sm sm:text-base font-black text-foreground uppercase tracking-tight">
                6-Zone Digital Passport Stamps
              </h2>
            </div>
            <span className="text-xs font-mono font-black bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] px-2.5 py-0.5">
              {progression.zonesVisitedCount} / 6 Zones
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {passportZones.map((item) => (
              <div
                key={item.zone.id}
                className={`p-3 border-2 border-border transition-all ${
                  item.isUnlocked
                    ? "bg-secondary/20 shadow-[2px_2px_0px_var(--border)]"
                    : "bg-muted opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono font-black text-muted-foreground">
                    Z{item.zone.sort_order}
                  </span>
                  {item.isUnlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-foreground" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <h4 className="text-xs font-black text-foreground truncate">
                  🌊 {item.zone.name}
                </h4>
                <span className="text-[10px] text-muted-foreground block mt-0.5 font-mono font-bold">
                  {item.isUnlocked
                    ? `${item.completedExperiencesCount} Completed`
                    : "Unvisited"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements Showcase */}
        <div className="space-y-3 p-4 sm:p-5 bg-card text-card-foreground border-2 border-border shadow-neo">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-primary" />
            <h2 className="text-sm sm:text-base font-black text-foreground uppercase tracking-tight">
              Achievements Showcase
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {achievements.map(({ achievement, isUnlocked }) => (
              <div
                key={achievement.id}
                className={`p-3.5 border-2 border-border ${
                  isUnlocked
                    ? "bg-secondary/20 shadow-[2px_2px_0px_var(--border)]"
                    : "bg-muted opacity-60"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-base">
                    {isUnlocked ? "🏆" : "🔒"}
                  </span>
                  <h4 className="text-xs font-black text-foreground truncate">
                    {achievement.name}
                  </h4>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium line-clamp-2">
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
