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
          <h1 className="text-2xl font-black text-foreground tracking-tight font-mono">
            Reward Inventory & Stock
          </h1>
          <p className="text-xs text-muted-foreground font-bold">
            Monitor reward stock, redemption limits, and sponsor allocation
          </p>
        </div>
      </div>

      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b-2 border-border text-muted-foreground uppercase text-[11px]">
                <th className="pb-3 font-black">Reward Item</th>
                <th className="pb-3 font-black">Sponsor</th>
                <th className="pb-3 font-black">Cost</th>
                <th className="pb-3 font-black">Stock Left</th>
                <th className="pb-3 font-black">Per-User Limit</th>
                <th className="pb-3 font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border font-medium">
              {rewards.map((r) => (
                <tr key={r.id} className="hover:bg-muted transition-colors">
                  <td className="py-3 text-foreground font-black">{r.name}</td>
                  <td className="py-3 text-muted-foreground font-bold">
                    {r.sponsorName}
                  </td>
                  <td className="py-3 font-mono font-black text-primary">
                    {formatCoins(r.coin_cost)} Coins
                  </td>
                  <td className="py-3 font-mono font-black text-foreground">
                    {r.stock > 0 ? (
                      <span className="text-foreground">{r.stock} remaining</span>
                    ) : (
                      <span className="text-primary font-black">SOLD OUT</span>
                    )}
                  </td>
                  <td className="py-3 font-mono text-muted-foreground font-bold">
                    {r.redemption_limit ? `${r.redemption_limit} max` : "Unlimited"}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 border-2 border-border text-[10px] font-black bg-secondary text-secondary-foreground shadow-[1px_1px_0px_var(--border)]">
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
