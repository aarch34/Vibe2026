import { mockDb } from "@/lib/db/supabase";
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

export default function AdminDashboardPage() {
  const attendeesCount = mockDb.profiles.size;
  const completionsCount = mockDb.completions.length;
  const qrCodesCount = mockDb.qrCodes.size;
  const zonesCount = mockDb.zones.size;
  const redemptionsCount = mockDb.rewardRedemptions.length;

  const totalCoinsInCirculation = Array.from(mockDb.wallets.values()).reduce(
    (sum, w) => sum + w.balance,
    0
  );
  const totalCoinsSpent = mockDb.walletTransactions
    .filter((t) => t.type === "spend" || t.type === "reward_redemption")
    .reduce((sum, t) => sum + t.amount, 0);

  const kpis = [
    { label: "Registered Attendees", value: attendeesCount, icon: Users, color: "text-blue-400" },
    { label: "Experience Completions", value: completionsCount, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Active QR Checkpoints", value: qrCodesCount, icon: QrCode, color: "text-cyan-400" },
    { label: "Coins in Circulation", value: formatCoins(totalCoinsInCirculation), icon: Coins, color: "text-amber-400" },
    { label: "Total Coins Spent", value: formatCoins(totalCoinsSpent), icon: TrendingUp, color: "text-purple-400" },
    { label: "Rewards Claimed", value: redemptionsCount, icon: Gift, color: "text-rose-400" },
  ];

  const zones = Array.from(mockDb.zones.values()).sort(
    (a, b) => a.sort_order - b.sort_order
  );

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
              {zones.map((zone) => {
                const zoneExps = Array.from(mockDb.experiences.values()).filter(
                  (e) => e.zone_id === zone.id
                );
                const completions = mockDb.completions.filter((c) => {
                  const exp = mockDb.experiences.get(c.experience_id);
                  return exp && exp.zone_id === zone.id;
                }).length;

                return (
                  <tr key={zone.id} className="hover:bg-slate-800/30">
                    <td className="py-3 text-white font-bold">{zone.name}</td>
                    <td className="py-3 font-mono text-slate-400">{zone.slug}</td>
                    <td className="py-3 text-slate-300">{zoneExps.length}</td>
                    <td className="py-3 font-mono text-cyan-400 font-bold">
                      {completions}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
