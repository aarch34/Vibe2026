import Link from "next/link";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import {
  Users,
  CheckCircle2,
  QrCode,
  Coins,
  Gift,
  TrendingUp,
  MapPin,
  Trophy,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { formatCoins, formatXP } from "@/lib/utils";
import { EventFreezeControl } from "@/components/admin/event-freeze-control";
import { getLeaderboard, getZoneLeaderboard } from "@/lib/leaderboard/leaderboard-service";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";

  let attendeesCount = 0;
  let completionsCount = 0;
  let qrCodesCount = 0;
  let zonesCount = 0;
  let redemptionsCount = 0;
  let totalCoinsInCirculation = 0;
  let totalCoinsSpent = 0;
  let isEventFrozen = false;
  let zonesWithStats: any[] = [];

  const [leaderboardData, zoneLeaderboard] = await Promise.all([
    getLeaderboard(eventId, 5, 0),
    getZoneLeaderboard(eventId),
  ]);

  const topIndividual = leaderboardData.entries[0] || null;
  const topZone = zoneLeaderboard[0] || null;

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [
      profilesRes,
      compsRes,
      qrsRes,
      zonesRes,
      redsRes,
      walletsRes,
      txsRes,
      eventRes,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("experience_completions").select("id, experiences(zone_id)"),
      supabaseAdmin.from("qr_codes").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("zones").select("*, experiences(*)").eq("event_id", eventId).order("sort_order", { ascending: true }),
      supabaseAdmin.from("reward_redemptions").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("wallets").select("balance").eq("event_id", eventId),
      supabaseAdmin.from("wallet_transactions").select("amount, type").eq("event_id", eventId),
      supabaseAdmin.from("events").select("status").eq("id", eventId).single(),
    ]);

    attendeesCount = profilesRes.count || 0;
    const comps = compsRes.data || [];
    completionsCount = comps.length;
    qrCodesCount = qrsRes.count || 0;
    const rawZones = zonesRes.data || [];
    zonesCount = rawZones.length;
    redemptionsCount = redsRes.count || 0;

    totalCoinsInCirculation = (walletsRes.data || []).reduce((sum, w) => sum + (w.balance || 0), 0);
    totalCoinsSpent = (txsRes.data || [])
      .filter((t) => t.type === "spend" || t.type === "reward_redemption")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    isEventFrozen = eventRes.data?.status === "frozen" || eventRes.data?.status === "concluded";

    // Compute zone completions
    zonesWithStats = rawZones.map((z: any) => {
      const zoneCompletions = comps.filter((c: any) => c.experiences?.zone_id === z.id).length;
      return {
        id: z.id,
        name: z.name,
        slug: z.slug,
        experiencesCount: z.experiences?.length || 0,
        completionsCount: zoneCompletions,
      };
    });
  } else {
    attendeesCount = mockDb.profiles.size;
    completionsCount = mockDb.completions.length;
    qrCodesCount = mockDb.qrCodes.size;
    zonesCount = mockDb.zones.size;
    redemptionsCount = mockDb.rewardRedemptions.length;
    isEventFrozen = mockDb.isEventFrozen;

    totalCoinsInCirculation = Array.from(mockDb.wallets.values()).reduce(
      (sum, w) => sum + w.balance,
      0
    );
    totalCoinsSpent = mockDb.walletTransactions
      .filter((t) => t.type === "spend" || t.type === "reward_redemption")
      .reduce((sum, t) => sum + t.amount, 0);

    const zones = Array.from(mockDb.zones.values()).sort(
      (a, b) => a.sort_order - b.sort_order
    );

    zonesWithStats = zones.map((zone) => {
      const zoneExps = Array.from(mockDb.experiences.values()).filter(
        (e) => e.zone_id === zone.id
      );
      const completions = mockDb.completions.filter((c) => {
        const exp = mockDb.experiences.get(c.experience_id);
        return exp && exp.zone_id === zone.id;
      }).length;

      return {
        id: zone.id,
        name: zone.name,
        slug: zone.slug,
        experiencesCount: zoneExps.length,
        completionsCount: completions,
      };
    });
  }

  const kpis = [
    { label: "Registered Attendees", value: attendeesCount, icon: Users, color: "text-blue-400" },
    { label: "Experience Completions", value: completionsCount, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Active QR Checkpoints", value: qrCodesCount, icon: QrCode, color: "text-cyan-400" },
    { label: "Coins in Circulation", value: formatCoins(totalCoinsInCirculation), icon: Coins, color: "text-amber-400" },
    { label: "Total Coins Spent", value: formatCoins(totalCoinsSpent), icon: TrendingUp, color: "text-purple-400" },
    { label: "Rewards Claimed", value: redemptionsCount, icon: Gift, color: "text-rose-400" },
  ];

  const maxZoneCoins = Math.max(1, ...zoneLeaderboard.map((z) => z.coins_collected));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
            ROCCO 2026 • District Operations Command
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Real-time analytics, live leaderboards, and administrative controls for District 3192
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/attendees"
            className="neo-btn-primary px-3 py-2 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Attendees & Ledgers</span>
          </Link>

          <Link
            href="/admin/qr"
            className="neo-btn-secondary px-3 py-2 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Official QRs</span>
          </Link>
        </div>
      </div>

      {/* Point 39 Event Concluded / Freeze Control */}
      <EventFreezeControl initialIsFrozen={isEventFrozen} />

      {/* LIVE LEADERBOARD HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Individual Leader */}
        <div className="p-5 sm:p-6 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-primary font-mono block">
                  Individual Leaderboard
                </span>
                <h2 className="text-base font-black text-foreground uppercase">
                  #1 Overall Attendee Leader
                </h2>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] font-mono text-xs font-black">
              RANK 1
            </span>
          </div>

          {topIndividual ? (
            <div className="p-4 bg-muted border-2 border-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    {topIndividual.display_name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-bold">
                    {topIndividual.club || "Rotaract District 3192"}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-muted-foreground font-bold block">Total XP</span>
                  <span className="text-xl font-black text-foreground">
                    {formatXP(topIndividual.total_xp)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t-2 border-border text-[11px] font-mono text-muted-foreground font-bold">
                <span>VIBE ID: <strong className="text-foreground">{topIndividual.vibe_id}</strong></span>
                <span>•</span>
                <span>Level: <strong className="text-foreground">{topIndividual.level_name}</strong></span>
                <span>•</span>
                <span>Completions: <strong className="text-foreground">{topIndividual.completions_count}</strong></span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted border-2 border-border text-center text-xs text-muted-foreground font-bold">
              No participant activity yet. Leaderboard is ready.
            </div>
          )}
        </div>

        {/* Top Zone Leader */}
        <div className="p-5 sm:p-6 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
                <Crown className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-foreground font-mono block">
                  Zone Battle Championship
                </span>
                <h2 className="text-base font-black text-foreground uppercase">
                  #1 Leading Zone
                </h2>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] font-mono text-xs font-black">
              ZONE LEADER
            </span>
          </div>

          {topZone ? (
            <div className="p-4 bg-muted border-2 border-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    Zone {topZone.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-bold">
                    {topZone.slug} • 6-Zone Freshers Battle
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-muted-foreground font-bold block">Coins Collected</span>
                  <span className="text-xl font-black text-foreground">
                    {formatCoins(topZone.coins_collected)} 🪙
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t-2 border-border text-[11px] font-mono text-muted-foreground font-bold">
                <span>Completions: <strong className="text-foreground">{topZone.experiences_completed_count}</strong></span>
                <span>•</span>
                <span>Active Participants: <strong className="text-foreground">{topZone.participants_count}</strong></span>
                <span>•</span>
                <span>Generated XP: <strong className="text-foreground">{formatXP(topZone.total_xp_generated)}</strong></span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted border-2 border-border text-center text-xs text-muted-foreground font-bold">
              Zone scores are initialized at 0. Ready for attendees to cheer and explore!
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider truncate">
                  {kpi.label}
                </span>
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl font-black text-foreground font-mono">
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* 6 OFFICIAL ZONES CHAMPIONSHIP BREAKDOWN */}
      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-primary" />
            <h2 className="text-base font-black text-foreground uppercase">
              6 Official Zones Championship Battle
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono font-bold">
            Ranked by VIBE Coins Collected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {zoneLeaderboard.map((z, idx) => {
            const percent = Math.min(100, Math.round((z.coins_collected / maxZoneCoins) * 100));
            return (
              <div
                key={z.zone_id}
                className={`p-4 border-2 border-border transition-all ${
                  idx === 0
                    ? "bg-secondary/20 shadow-[3px_3px_0px_var(--border)]"
                    : "bg-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground border border-border text-xs font-mono font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <h3 className="text-sm font-black text-foreground">{z.name}</h3>
                  </div>
                  <span className="text-sm font-black font-mono text-foreground">
                    {formatCoins(z.coins_collected)} 🪙
                  </span>
                </div>

                <div className="w-full h-2.5 bg-card border border-border overflow-hidden mt-3 p-0.5">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-muted-foreground mt-2">
                  <span>{z.experiences_completed_count} completions</span>
                  <span>{z.participants_count} attendees</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone Traffic Breakdown */}
      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-base font-black text-foreground uppercase">
              Event Zones Activity Breakdown
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono font-bold">
            6 Official Zones
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-border text-muted-foreground uppercase font-mono text-[11px] font-black">
                <th className="pb-3">Zone</th>
                <th className="pb-3">Slug</th>
                <th className="pb-3">Experiences</th>
                <th className="pb-3">Total Completions</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border font-bold">
              {zonesWithStats.map((zone) => (
                <tr key={zone.id} className="hover:bg-muted/50">
                  <td className="py-3 text-foreground font-black">{zone.name}</td>
                  <td className="py-3 font-mono text-muted-foreground">{zone.slug}</td>
                  <td className="py-3 text-foreground">{zone.experiencesCount}</td>
                  <td className="py-3 font-mono text-foreground font-black">
                    {zone.completionsCount}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 text-[10px] font-black bg-secondary text-secondary-foreground border border-border">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
