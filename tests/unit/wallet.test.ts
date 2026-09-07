import { describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "@/lib/db/supabase";
import {
  getWalletSummary,
  spendCoinsAtomic,
  reconcileWallet,
} from "@/lib/wallet/wallet-service";

describe("VIBE Wallet Engine & Concurrency Invariants", () => {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  const profileId = "test-user-wallet-1";

  beforeEach(() => {
    // Reset test user wallet
    const key = `${eventId}:${profileId}`;
    mockDb.wallets.delete(key);
    mockDb.walletTransactions = mockDb.walletTransactions.filter(
      (tx) => tx.profile_id !== profileId
    );
  });

  it("credits initial starting balance exactly once", async () => {
    const res1 = mockDb.creditInitialWallet(eventId, profileId, 500);
    expect(res1.success).toBe(true);
    expect(res1.credited).toBe(true);
    expect(res1.balance).toBe(500);

    // Second credit attempt must be idempotent
    const res2 = mockDb.creditInitialWallet(eventId, profileId, 500);
    expect(res2.success).toBe(true);
    expect(res2.credited).toBe(false);
    expect(res2.balance).toBe(500);

    const summary = await getWalletSummary(eventId, profileId);
    expect(summary.wallet.balance).toBe(500);
    expect(summary.transactions.filter((t) => t.type === "initial_credit").length).toBe(1);
  });

  it("allows valid coin spend and produces immutable ledger entry", async () => {
    mockDb.creditInitialWallet(eventId, profileId, 500);

    const res = await spendCoinsAtomic(
      eventId,
      profileId,
      150,
      "test_spend",
      null,
      "idemp-spend-1"
    );

    expect(res.success).toBe(true);
    expect(res.balance_before).toBe(500);
    expect(res.balance_after).toBe(350);

    const summary = await getWalletSummary(eventId, profileId);
    expect(summary.wallet.balance).toBe(350);
  });

  it("strictly prevents negative balance", async () => {
    mockDb.creditInitialWallet(eventId, profileId, 100);

    const res = await spendCoinsAtomic(
      eventId,
      profileId,
      150,
      "overspend_test",
      null
    );

    expect(res.success).toBe(false);
    expect(res.code).toBe("INSUFFICIENT_COINS");

    const summary = await getWalletSummary(eventId, profileId);
    expect(summary.wallet.balance).toBe(100); // Unchanged
  });

  it("prevents double-spending during concurrent requests (Race Condition Defense)", async () => {
    // User has 100 Coins
    mockDb.creditInitialWallet(eventId, profileId, 100);

    // Two requests both attempt to spend 80 Coins concurrently
    const [res1, res2] = await Promise.all([
      spendCoinsAtomic(eventId, profileId, 80, "race_spend_1", null, "tx_1"),
      spendCoinsAtomic(eventId, profileId, 80, "race_spend_2", null, "tx_2"),
    ]);

    // Exactly one must succeed, the other must fail with INSUFFICIENT_COINS
    const successCount = [res1, res2].filter((r) => r.success).length;
    const failCount = [res1, res2].filter((r) => !r.success && r.code === "INSUFFICIENT_COINS").length;

    expect(successCount).toBe(1);
    expect(failCount).toBe(1);

    const summary = await getWalletSummary(eventId, profileId);
    expect(summary.wallet.balance).toBe(20); // 100 - 80 = 20 (Never negative!)
  });

  it("replays idempotent requests without duplicating debits", async () => {
    mockDb.creditInitialWallet(eventId, profileId, 500);
    const key = "unique-key-12345";

    const res1 = await spendCoinsAtomic(eventId, profileId, 50, "test", null, key);
    expect(res1.success).toBe(true);
    expect(res1.balance_after).toBe(450);

    // Same idempotency key replayed
    const res2 = await spendCoinsAtomic(eventId, profileId, 50, "test", null, key);
    expect(res2.success).toBe(true);
    expect(res2.idempotent_replay).toBe(true);

    // Balance remains 450, not deducted twice
    const summary = await getWalletSummary(eventId, profileId);
    expect(summary.wallet.balance).toBe(450);
  });

  it("passes ledger mathematical reconciliation check", async () => {
    mockDb.creditInitialWallet(eventId, profileId, 500);
    await spendCoinsAtomic(eventId, profileId, 100, "spend_1", null);
    await spendCoinsAtomic(eventId, profileId, 50, "spend_2", null);

    const rec = await reconcileWallet(eventId, profileId);
    expect(rec.isReconciled).toBe(true);
    expect(rec.currentBalance).toBe(350);
    expect(rec.calculatedBalance).toBe(350);
  });
});
