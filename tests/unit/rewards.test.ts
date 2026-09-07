import { describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "@/lib/db/supabase";
import { redeemReward, getRewardsCatalog } from "@/lib/rewards/reward-service";

describe("VIBE Rewards Store & Stock Invariants", () => {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  const profileId = "test-reward-user";

  beforeEach(() => {
    mockDb.rewardRedemptions = mockDb.rewardRedemptions.filter(
      (r) => r.profile_id !== profileId
    );
    mockDb.wallets.delete(`${eventId}:${profileId}`);
    mockDb.walletTransactions = mockDb.walletTransactions.filter((tx) => tx.profile_id !== profileId);
    mockDb.creditInitialWallet(eventId, profileId, 1000);
  });

  it("redeems reward, decrements stock, and returns unique voucher code", async () => {
    const reward = mockDb.rewards.get("rwd-1")!;
    const initialStock = reward.stock;

    const res = await redeemReward(eventId, profileId, "rwd-1");
    expect(res.success).toBe(true);
    expect(res.code).toMatch(/^VIBE-/);
    expect(res.coin_cost).toBe(150);
    expect(res.balance_after).toBe(850);
    expect(reward.stock).toBe(initialStock - 1);
  });

  it("strictly blocks redemption if coins are insufficient", async () => {
    // Set wallet to only 50 coins (rwd-3 costs 850)
    const wallet = mockDb.wallets.get(`${eventId}:${profileId}`)!;
    wallet.balance = 50;

    const res = await redeemReward(eventId, profileId, "rwd-3");
    expect(res.success).toBe(false);
    expect(res.code).toBe("INSUFFICIENT_COINS");
  });

  it("prevents negative stock under concurrent redemption attempts (Stock Race)", async () => {
    // Create limited edition item with only 1 item in stock
    const limitedRewardId = "rwd-limited-test";
    mockDb.rewards.set(limitedRewardId, {
      id: limitedRewardId,
      event_id: eventId,
      sponsor_id: null,
      name: "Ultra Rare Golden Pass",
      description: "Only 1 in existence",
      image_media_id: null,
      coin_cost: 100,
      stock: 1, // Only 1 in stock!
      redemption_limit: 1,
      starts_at: null,
      ends_at: null,
      is_active: true,
    });

    // Two users simultaneously attempt to claim the last unit
    mockDb.creditInitialWallet(eventId, "another-user", 500);

    const [res1, res2] = await Promise.all([
      redeemReward(eventId, profileId, limitedRewardId, "tx-red-1"),
      redeemReward(eventId, "another-user", limitedRewardId, "tx-red-2"),
    ]);

    const successes = [res1, res2].filter((r) => r.success);
    const failures = [res1, res2].filter((r) => !r.success && r.code === "REWARD_SOLD_OUT");

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    const updated = mockDb.rewards.get(limitedRewardId)!;
    expect(updated.stock).toBe(0); // Never negative!
  });

  it("enforces per-user redemption limit", async () => {
    // rwd-2 has redemption_limit: 1
    const res1 = await redeemReward(eventId, profileId, "rwd-2");
    expect(res1.success).toBe(true);

    const res2 = await redeemReward(eventId, profileId, "rwd-2");
    expect(res2.success).toBe(false);
    expect(res2.code).toBe("REDEMPTION_LIMIT_REACHED");
  });
});
