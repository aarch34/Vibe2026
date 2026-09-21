import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { RewardsClient } from "@/components/admin/rewards-client";

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
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight font-mono uppercase">
          Rewards & Swag Inventory Control
        </h1>
        <p className="text-xs text-muted-foreground font-bold">
          Live physical merchandise stock, coin prices, and redemption availability
        </p>
      </div>

      <RewardsClient initialRewards={rewards} />
    </div>
  );
}
