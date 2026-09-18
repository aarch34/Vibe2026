import { describe, it, expect } from "vitest";
import { mockDb } from "@/lib/db/supabase";
import { getWalletSummary } from "@/lib/wallet/wallet-service";
import { verifyQRScan } from "@/lib/qr/qr-service";
import { getLeaderboard } from "@/lib/leaderboard/leaderboard-service";
import { redeemReward } from "@/lib/rewards/reward-service";

function calculatePercentiles(latencies: number[]) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  return { p50, p95, p99 };
}

describe("VIBE 2,000+ Concurrent User Load Simulation", () => {
  const eventId = "a0000000-0000-0000-0000-000000000001";

  it("Scenario A: 2,000 users open Home & fetch wallet summaries", async () => {
    const userCount = 2000;
    const latencies: number[] = [];
    let errorCount = 0;

    const startTime = performance.now();

    for (let i = 0; i < userCount; i++) {
      const profileId = `load-user-${i}`;
      // Ensure initial credit
      mockDb.creditInitialWallet(eventId, profileId, 500);

      const reqStart = performance.now();
      try {
        const summary = await getWalletSummary(eventId, profileId);
        if (!summary || summary.wallet.balance < 500) errorCount++;
      } catch (err) {
        errorCount++;
      }
      latencies.push(performance.now() - reqStart);
    }

    const totalDuration = performance.now() - startTime;
    const throughput = Math.round((userCount / totalDuration) * 1000);
    const { p50, p95, p99 } = calculatePercentiles(latencies);

    console.log(`[Scenario A: 2,000 Home Opens] Total: ${totalDuration.toFixed(1)}ms | Throughput: ${throughput} req/s | p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | p99: ${p99.toFixed(2)}ms | Errors: ${errorCount}`);

    expect(errorCount).toBe(0);
    expect(p95).toBeLessThan(10); // Ultra fast in-memory execution
  });

  it("Scenario B: 1,000 users scan QR checkpoints within a burst period", async () => {
    const scanCount = 1000;
    const latencies: number[] = [];
    let errorCount = 0;

    const codes = ["vibe-zone-arnava-xp", "vibe-zone-taranaga-xp", "vibe-zone-sagara-xp"];
    const startTime = performance.now();

    for (let i = 0; i < scanCount; i++) {
      const profileId = `load-user-${i % 500}`;
      const code = codes[i % codes.length];

      const reqStart = performance.now();
      try {
        const res = await verifyQRScan(code, eventId, profileId);
        if (!res.valid) errorCount++;
      } catch (err) {
        errorCount++;
      }
      latencies.push(performance.now() - reqStart);
    }

    const totalDuration = performance.now() - startTime;
    const throughput = Math.round((scanCount / totalDuration) * 1000);
    const { p50, p95 } = calculatePercentiles(latencies);

    console.log(`[Scenario B: 1,000 QR Scans] Total: ${totalDuration.toFixed(1)}ms | Throughput: ${throughput} req/s | p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | Errors: ${errorCount}`);

    expect(errorCount).toBe(0);
  });

  it("Scenario C: 500 users complete experiences simultaneously", async () => {
    const userCount = 500;
    const latencies: number[] = [];
    let errorCount = 0;

    const startTime = performance.now();

    const promises = Array.from({ length: userCount }).map(async (_, idx) => {
      const profileId = `comp-user-${idx}`;
      mockDb.creditInitialWallet(eventId, profileId, 500);

      const reqStart = performance.now();
      try {
        const res = mockDb.completeExperienceAtomic(
          eventId,
          profileId,
          "exp-3", // DJ drop (free entry, awards XP & coins)
          "qr-3",
          `key-${idx}`
        );
        if (!res.success) errorCount++;
      } catch (err) {
        errorCount++;
      }
      latencies.push(performance.now() - reqStart);
    });

    await Promise.all(promises);

    const totalDuration = performance.now() - startTime;
    const throughput = Math.round((userCount / totalDuration) * 1000);
    const { p50, p95 } = calculatePercentiles(latencies);

    console.log(`[Scenario C: 500 Simultaneous Completions] Total: ${totalDuration.toFixed(1)}ms | Throughput: ${throughput} req/s | p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | Errors: ${errorCount}`);

    expect(errorCount).toBe(0);
  });

  it("Scenario D: 200 users redeem rewards simultaneously", async () => {
    const userCount = 200;
    // Set stock of food voucher to 300 so all 200 can claim
    const reward = mockDb.rewards.get("rwd-5")!;
    reward.stock = 300;

    const latencies: number[] = [];
    let errorCount = 0;

    const startTime = performance.now();

    const promises = Array.from({ length: userCount }).map(async (_, idx) => {
      const profileId = `rdm-user-${idx}`;
      mockDb.creditInitialWallet(eventId, profileId, 500);

      const reqStart = performance.now();
      try {
        const res = await redeemReward(eventId, profileId, "rwd-5", `rdm-key-${idx}`);
        if (!res.success) errorCount++;
      } catch (err) {
        errorCount++;
      }
      latencies.push(performance.now() - reqStart);
    });

    await Promise.all(promises);

    const totalDuration = performance.now() - startTime;
    const throughput = Math.round((userCount / totalDuration) * 1000);
    const { p50, p95 } = calculatePercentiles(latencies);

    console.log(`[Scenario D: 200 Concurrent Redemptions] Total: ${totalDuration.toFixed(1)}ms | Throughput: ${throughput} req/s | p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | Errors: ${errorCount}`);

    expect(errorCount).toBe(0);
  });

  it("Scenario E: 2,000 users query the Leaderboard", async () => {
    const queryCount = 2000;
    const latencies: number[] = [];
    let errorCount = 0;

    const startTime = performance.now();

    for (let i = 0; i < queryCount; i++) {
      const reqStart = performance.now();
      try {
        const lb = await getLeaderboard(eventId, 20, 0);
        if (!lb || !Array.isArray(lb.entries)) errorCount++;
      } catch (err) {
        errorCount++;
      }
      latencies.push(performance.now() - reqStart);
    }

    const totalDuration = performance.now() - startTime;
    const throughput = Math.round((queryCount / totalDuration) * 1000);
    const { p50, p95 } = calculatePercentiles(latencies);

    console.log(`[Scenario E: 2,000 Leaderboard Views] Total: ${totalDuration.toFixed(1)}ms | Throughput: ${throughput} req/s | p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | Errors: ${errorCount}`);

    expect(errorCount).toBe(0);
  });
});
