import { describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "@/lib/db/supabase";
import { verifyQRScan } from "@/lib/qr/qr-service";
import {
  getUserProgression,
  getUserPassport,
  getUserQuests,
  getUserAchievements,
} from "@/lib/gameplay/progression-service";

describe("VIBE Gameplay, QR & Progression Engine", () => {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  const profileId = "test-attendee-gameplay";

  beforeEach(() => {
    mockDb.completions = mockDb.completions.filter((c) => c.profile_id !== profileId);
    mockDb.userAchievements = mockDb.userAchievements.filter((ua) => ua.profile_id !== profileId);
    mockDb.questProgress.clear();
    mockDb.wallets.delete(`${eventId}:${profileId}`);
    mockDb.walletTransactions = mockDb.walletTransactions.filter((tx) => tx.profile_id !== profileId);
    mockDb.creditInitialWallet(eventId, profileId, 500);
  });

  it("verifies a valid QR code and returns experience preview", async () => {
    const res = await verifyQRScan("vibe-arcade-vr-2026", eventId, profileId);
    expect(res.valid).toBe(true);
    expect(res.experience?.title).toBe("VR Cyber Flight");
    expect(res.zone?.name).toBe("Cyber Arcade");
    expect(res.coinCost).toBe(50);
    expect(res.xpReward).toBe(120);
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
    expect(res.xp_earned).toBe(120);
    expect(res.coin_spent).toBe(50);
    expect(res.coin_earned).toBe(20);
    // 500 - 50 + 20 = 470
    expect(res.balance_after).toBe(470);

    const progression = await getUserProgression(eventId, profileId);
    expect(progression.totalXP).toBe(120);
    expect(progression.completedExperiencesCount).toBe(1);
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

  it("stamps the digital Passport when a zone is explored", async () => {
    const passportBefore = await getUserPassport(eventId, profileId);
    const arcadeBefore = passportBefore.find((p) => p.zone.slug === "zone-arcade");
    expect(arcadeBefore?.isUnlocked).toBe(false);

    // Complete mission in Cyber Arcade (exp-1)
    mockDb.completeExperienceAtomic(eventId, profileId, "exp-1");

    const passportAfter = await getUserPassport(eventId, profileId);
    const arcadeAfter = passportAfter.find((p) => p.zone.slug === "zone-arcade");
    expect(arcadeAfter?.isUnlocked).toBe(true);
    expect(arcadeAfter?.completedExperiencesCount).toBe(1);
  });

  it("evaluates quests dynamically and awards quest rewards", async () => {
    const questsBefore = await getUserQuests(eventId, profileId);
    const triadQuest = questsBefore.find((q) => q.quest.id === "q-2");
    expect(triadQuest?.isCompleted).toBe(false);

    // Complete 3 different experiences
    mockDb.completeExperienceAtomic(eventId, profileId, "exp-1");
    mockDb.completeExperienceAtomic(eventId, profileId, "exp-2");
    mockDb.completeExperienceAtomic(eventId, profileId, "exp-3");

    const questsAfter = await getUserQuests(eventId, profileId);
    const triadAfter = questsAfter.find((q) => q.quest.id === "q-2");
    expect(triadAfter?.isCompleted).toBe(true);
  });

  it("unlocks achievements automatically when condition thresholds are met", async () => {
    // Visit 3 zones to trigger "Explorer" achievement
    mockDb.completeExperienceAtomic(eventId, profileId, "exp-1"); // Arcade
    mockDb.completeExperienceAtomic(eventId, profileId, "exp-2"); // Arena
    mockDb.completeExperienceAtomic(eventId, profileId, "exp-3"); // Stage

    const achievements = await getUserAchievements(eventId, profileId);
    const explorerAch = achievements.find((a) => a.achievement.name === "Explorer");
    expect(explorerAch?.isUnlocked).toBe(true);
  });
});
