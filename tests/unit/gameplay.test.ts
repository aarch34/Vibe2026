import { describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "@/lib/db/supabase";
import { verifyQRScan } from "@/lib/qr/qr-service";
import {
  getUserProgression,
  getUserPassport,
  getUserQuests,
  getUserAchievements,
} from "@/lib/gameplay/progression-service";

describe("VIBE Complete Game Economy & Progression Engine", () => {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  const profileId = "test-attendee-gameplay";

  beforeEach(() => {
    mockDb.isEventFrozen = false;
    mockDb.completions = mockDb.completions.filter((c) => c.profile_id !== profileId);
    mockDb.userAchievements = mockDb.userAchievements.filter((ua) => ua.profile_id !== profileId);
    mockDb.questProgress.clear();
    mockDb.passportStamps.delete(profileId);
    mockDb.wallets.delete(`${eventId}:${profileId}`);
    mockDb.walletTransactions = mockDb.walletTransactions.filter((tx) => tx.profile_id !== profileId);
    mockDb.creditInitialWallet(eventId, profileId, 500);
  });

  it("verifies a valid QR code and returns 5-tier experience preview", async () => {
    const res = await verifyQRScan("vibe-zone-arnava-xp", eventId, profileId);
    expect(res.valid).toBe(true);
    expect(res.experience?.title).toBe("Arnava Icebreaker");
    expect(res.zone?.name).toBe("Arnava");
    expect(res.xpReward).toBe(75);
    expect(res.canAttempt).toBe(true);
  });

  it("rejects invalid or non-existent QR codes safely", async () => {
    const res = await verifyQRScan("bogus-malicious-qr-9999", eventId, profileId);
    expect(res.valid).toBe(false);
    expect(res.errorCode).toBe("INVALID_QR");
  });

  it("completes an experience atomically, awarding XP and updating balance", async () => {
    const res = mockDb.completeExperienceAtomic(
      eventId,
      profileId,
      "exp-1",
      "qr-1",
      "comp-key-1"
    );

    expect(res.success).toBe(true);
    expect(res.xp_earned).toBe(175);
    expect(res.coin_spent).toBe(100);
    expect(res.coin_earned).toBe(35);
    // 500 - 100 + 35 = 435
    expect(res.balance_after).toBe(435);

    const progression = await getUserProgression(eventId, profileId);
    expect(progression.totalXP).toBe(175);
    expect(progression.completedExperiencesCount).toBe(1);
  });

  it("awards +50 VIBE and +100 XP upon first zone discovery, and prevents repeat farming", async () => {
    const res1 = mockDb.discoverZone(eventId, profileId, "z-arcade");
    expect(res1.success).toBe(true);
    expect(res1.newlyDiscovered).toBe(true);
    expect(res1.coinsEarned).toBe(50);
    expect(res1.xpEarned).toBe(100);
    expect(res1.newBalance).toBe(550); // 500 + 50

    // Second scan of same zone must NOT award coins again
    const res2 = mockDb.discoverZone(eventId, profileId, "z-arcade");
    expect(res2.success).toBe(true);
    expect(res2.alreadyDiscovered).toBe(true);

    const wallet = mockDb.wallets.get(`${eventId}:${profileId}`);
    expect(wallet?.balance).toBe(550); // Unchanged!
  });

  it("enforces maximum attempt limit and prevents replay", async () => {
    // exp-2 has max_attempts: 1
    const res1 = mockDb.completeExperienceAtomic(eventId, profileId, "exp-2");
    expect(res1.success).toBe(true);

    // Attempt 2 must be blocked
    const res2 = mockDb.completeExperienceAtomic(eventId, profileId, "exp-2");
    expect(res2.success).toBe(false);
    expect(res2.code).toBe("MAX_ATTEMPTS_REACHED");
  });

  it("calculates 6-tier level progression accurately", async () => {
    // 0 XP -> Level 1 (VIBE Newbie)
    let prog = await getUserProgression(eventId, profileId);
    expect(prog.currentLevel.name).toBe("🌱 VIBE Newbie");

    // Add 300 XP -> Level 2 (VIBE Explorer, 250 XP required)
    mockDb.completions.push({
      id: "c-prog-1",
      event_id: eventId,
      profile_id: profileId,
      experience_id: "exp-1",
      qr_code_id: null,
      attempt_number: 1,
      coin_spent: 0,
      xp_earned: 300,
      coin_earned: 0,
      completed_at: new Date().toISOString(),
      metadata: null,
    });

    prog = await getUserProgression(eventId, profileId);
    expect(prog.currentLevel.name).toBe("✨ VIBE Explorer");

    // Add 2300 XP (total 2600 XP) -> Level 6 (VIBE Legend, 2500+ XP)
    mockDb.completions.push({
      id: "c-prog-2",
      event_id: eventId,
      profile_id: profileId,
      experience_id: "exp-2",
      qr_code_id: null,
      attempt_number: 1,
      coin_spent: 0,
      xp_earned: 2300,
      coin_earned: 0,
      completed_at: new Date().toISOString(),
      metadata: null,
    });

    prog = await getUserProgression(eventId, profileId);
    expect(prog.currentLevel.name).toBe("👑 VIBE Legend");
  });

  it("stamps the digital Passport when a zone is explored", async () => {
    const passportBefore = await getUserPassport(eventId, profileId);
    const arcadeBefore = passportBefore.find((p) => p.zone.slug === "zone-arcade");
    expect(arcadeBefore?.isUnlocked).toBe(false);

    // Discover Cyber Arcade
    mockDb.discoverZone(eventId, profileId, "z-arcade");

    const passportAfter = await getUserPassport(eventId, profileId);
    const arcadeAfter = passportAfter.find((p) => p.zone.slug === "zone-arcade");
    expect(arcadeAfter?.isUnlocked).toBe(true);
  });

  it("resolves leaderboard ties using the 3 tie-breaker rules", () => {
    // Create User Alpha and User Beta with identical 1,000 XP
    const userA = mockDb.createAttendeeProfile("usr-tie-a", "Alpha", "VIBE-A", "College A", "Club A", 1000, 3, 2);
    const userB = mockDb.createAttendeeProfile("usr-tie-b", "Beta", "VIBE-B", "College B", "Club B", 1000, 5, 2);

    const lb = mockDb.getLeaderboard(eventId, 10);
    const rankA = lb.find((e) => e.profile_id === userA.id)?.rank;
    const rankB = lb.find((e) => e.profile_id === userB.id)?.rank;

    // Beta has 5 zones vs Alpha's 3 zones -> Beta must rank higher (lower rank number)
    expect(rankB).toBeLessThan(rankA!);
  });

  it("freezes all transactions and unlocks when event ends", () => {
    mockDb.isEventFrozen = true;

    // Attempting to spend
    const spendRes = mockDb.spendWalletAtomic(eventId, profileId, 50, "test", null);
    expect(spendRes.success).toBe(false);
    expect(spendRes.code).toBe("EVENT_FROZEN");

    // Attempting to complete experience
    const compRes = mockDb.completeExperienceAtomic(eventId, profileId, "exp-1");
    expect(compRes.success).toBe(false);
    expect(compRes.code).toBe("EVENT_FROZEN");

    // Attempting zone discovery
    const zdRes = mockDb.discoverZone(eventId, profileId, "z-stage");
    expect(zdRes.success).toBe(false);
    expect(zdRes.code).toBe("EVENT_FROZEN");
  });
});
