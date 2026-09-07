import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { Gift, Coins, AlertCircle } from "lucide-react";
import { formatCoins } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminRewardsPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  let rewards: any[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("rewards")
      .select("*, sponsors(name)")
      .eq("event_id", eventId)
      .order("coin_cost", { ascending: true });

    rewards = (data || []).map((r: any) => ({
      ...r,
      sponsorName: r.sponsors?.name || "Official VIBE",
    }));
  } else {
    rewards = Array.from(mockDb.rewards.values()).map((r) => ({
      ...r,
      sponsorName: r.sponsor_id ? mockDb.sponsors.get(r.sponsor_id)?.name : "Official VIBE",
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Reward Inventory & Stock
          </h1>
          <p className="text-sm text-slate-400">
            Monitor reward stock, redemption limits, and sponsor allocation
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <th className="pb-3">Reward Item</th>
                <th className="pb-3">Sponsor</th>
                <th className="pb-3">Cost</th>
                <th className="pb-3">Stock Left</th>
                <th className="pb-3">Per-User Limit</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {rewards.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30">
                  <td className="py-3 text-white font-bold">{r.name}</td>
                  <td className="py-3 text-slate-300">
                    {r.sponsorName}
                  </td>
                  <td className="py-3 font-mono font-bold text-amber-400">
                    {formatCoins(r.coin_cost)} Coins
                  </td>
                  <td className="py-3 font-mono font-bold text-white">
                    {r.stock > 0 ? (
                      <span className="text-emerald-400">{r.stock} remaining</span>
                    ) : (
                      <span className="text-rose-400">SOLD OUT</span>
                    )}
                  </td>
                  <td className="py-3 font-mono text-slate-400">
                    {r.redemption_limit ? `${r.redemption_limit} max` : "Unlimited"}
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
