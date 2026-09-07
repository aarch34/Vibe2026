import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import {
  Users,
  CheckCircle2,
  QrCode,
  Coins,
  Gift,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { formatCoins } from "@/lib/utils";
import { EventFreezeControl } from "@/components/admin/event-freeze-control";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          District Operations Dashboard
        </h1>
        <p className="text-sm text-slate-400">
          Real-time metrics for Rotaract District 3192 Freshers Party
        </p>
      </div>

      {/* Point 39 Event Concluded / Freeze Control */}
      <EventFreezeControl initialIsFrozen={isEventFrozen} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {kpi.label}
                </span>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-black text-white font-mono">
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Zone Traffic Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              Event Zones Activity Breakdown
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {zonesCount} Active Zones
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <th className="pb-3">Zone</th>
                <th className="pb-3">Slug</th>
                <th className="pb-3">Experiences</th>
                <th className="pb-3">Total Completions</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {zonesWithStats.map((zone) => (
                <tr key={zone.id} className="hover:bg-slate-800/30">
                  <td className="py-3 text-white font-bold">{zone.name}</td>
                  <td className="py-3 font-mono text-slate-400">{zone.slug}</td>
                  <td className="py-3 text-slate-300">{zone.experiencesCount}</td>
                  <td className="py-3 font-mono text-cyan-400 font-bold">
                    {zone.completionsCount}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
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
