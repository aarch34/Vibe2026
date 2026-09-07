import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { Reward, RewardRedemption } from "@/types/database";

export interface RewardWithUserStatus extends Reward {
  userRedemptionsCount: number;
  canRedeem: boolean;
  sponsorName?: string;
}

export async function getRewardsCatalog(
  eventId: string,
  profileId: string
): Promise<RewardWithUserStatus[]> {
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [rewardsRes, redemptionsRes] = await Promise.all([
      supabaseAdmin
        .from("rewards")
        .select("*, sponsors(name)")
        .eq("event_id", eventId)
        .eq("is_active", true)
        .order("coin_cost", { ascending: true }),
      supabaseAdmin
        .from("reward_redemptions")
        .select("reward_id")
        .eq("event_id", eventId)
        .eq("profile_id", profileId)
        .neq("status", "cancelled"),
    ]);

    const rewards = rewardsRes.data || [];
    const redemptionsCountMap = new Map<string, number>();
    (redemptionsRes.data || []).forEach((r: any) => {
      redemptionsCountMap.set(r.reward_id, (redemptionsCountMap.get(r.reward_id) || 0) + 1);
    });

    return rewards.map((r: any) => {
      const userRedemptions = redemptionsCountMap.get(r.id) || 0;
      const limitReached = r.redemption_limit !== null && userRedemptions >= r.redemption_limit;
      const canRedeem = r.stock > 0 && !limitReached;

      return {
        ...r,
        userRedemptionsCount: userRedemptions,
        canRedeem,
        sponsorName: r.sponsors?.name,
      };
    });
  }

  // Memory fallback
  const rewards = Array.from(mockDb.rewards.values()).filter(
    (r) => r.event_id === eventId && r.is_active
  );

  return rewards.map((r) => {
    const userRedemptions = mockDb.rewardRedemptions.filter(
      (red) => red.profile_id === profileId && red.reward_id === r.id && red.status !== "cancelled"
    ).length;

    const sponsor = r.sponsor_id ? mockDb.sponsors.get(r.sponsor_id) : undefined;
    const limitReached = r.redemption_limit !== null && userRedemptions >= r.redemption_limit;
    const canRedeem = r.stock > 0 && !limitReached;

    return {
      ...r,
      userRedemptionsCount: userRedemptions,
      canRedeem,
      sponsorName: sponsor?.name,
    };
  });
}

export async function getUserRedemptions(
  eventId: string,
  profileId: string
): Promise<(RewardRedemption & { rewardName: string })[]> {
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data: redemptions } = await supabaseAdmin
      .from("reward_redemptions")
      .select("*, rewards(name)")
      .eq("event_id", eventId)
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    return (redemptions || []).map((r: any) => ({
      ...r,
      rewardName: r.rewards?.name || "VIBE Reward",
    }));
  }

  // Memory fallback
  const redemptions = mockDb.rewardRedemptions.filter(
    (r) => r.event_id === eventId && r.profile_id === profileId
  );

  return redemptions.map((r) => {
    const reward = mockDb.rewards.get(r.reward_id);
    return {
      ...r,
      rewardName: reward?.name || "VIBE Reward",
    };
  });
}

export async function redeemReward(
  eventId: string,
  profileId: string,
  rewardId: string,
  idempotencyKey?: string | null
) {
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.rpc("fn_redeem_reward_atomic", {
      p_event_id: eventId,
      p_profile_id: profileId,
      p_reward_id: rewardId,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;
    return data;
  }

  return mockDb.redeemRewardAtomic(eventId, profileId, rewardId, idempotencyKey);
}
