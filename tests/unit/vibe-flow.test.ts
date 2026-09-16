import { describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "@/lib/db/mock-store";
import { getLeaderboard, getZoneLeaderboard } from "@/lib/leaderboard/leaderboard-service";
import { getUserPlayerStats } from "@/lib/gameplay/progression-service";

describe("🌊 VIBE Complete User Flow Specifications", () => {
  const eventId = "a0000000-0000-0000-0000-000000000001";

  beforeEach(() => {
    mockDb.isEventFrozen = false;
    mockDb.stallPhotoSubmissions = [];
    mockDb.gameSessions = [];
  });

  describe("1. Six Official Zones & Zone Economy Rule", () => {
    it("should initialize with the 6 official oceanic zones", () => {
      const zoneSlugs = Array.from(mockDb.zones.values()).map((z) => z.slug);
      expect(zoneSlugs).toContain("arnava");
      expect(zoneSlugs).toContain("taranaga");
      expect(zoneSlugs).toContain("sagara");
      expect(zoneSlugs).toContain("pravaha");
      expect(zoneSlugs).toContain("samudhra");
      expect(zoneSlugs).toContain("varuna");
      expect(mockDb.zones.size).toBeGreaterThanOrEqual(6);
    });

    it("should transfer spent coins to target zone's collected total regardless of user's assigned zone", () => {
      // User 1 belongs to Arnava (z-arnava)
      const userArnava = mockDb.profiles.get("prof-usr-demo-1")!;
      expect(userArnava.assigned_zone_id).toBe("z-arnava");

      const taranagaZone = mockDb.zones.get("z-taranaga")!;
      const initialZoneCoins = taranagaZone.coins_collected;

      // User spends 75 coins on Taranaga Beat Drop Clash (exp-3)
      const res = mockDb.completeExperienceAtomic(
        eventId,
        userArnava.id,
        "exp-3",
        "qr-3b",
        `key-${Date.now()}`
      );

      expect(res.success).toBe(true);
      expect(res.coin_spent).toBe(75);
      expect(res.xp_earned).toBe(125);

      // Verify Taranaga collected total grew by 75
      const updatedTaranaga = mockDb.zones.get("z-taranaga")!;
      expect(updatedTaranaga.coins_collected).toBe(initialZoneCoins + 75);
    });
  });

  describe("2. Stalls System & Photo Verification", () => {
    it("should allow attendee to submit photo with Instagram ID and allow volunteer to approve", () => {
      const user = mockDb.profiles.get("prof-usr-demo-1")!;
      const stall = mockDb.stalls.get("stall-2")!;
      const initialWallet = mockDb.wallets.get(`${eventId}:${user.id}`)!;
      const initialBalance = initialWallet.balance;

      // 1. Submit photo
      const subRes = mockDb.submitStallPhoto(
        eventId,
        user.id,
        stall.id,
        "https://example.com/photo.jpg",
        "@aarcha.u"
      );

      expect(subRes.success).toBe(true);
      expect(subRes.submission?.status).toBe("pending");
      expect(subRes.submission?.instagram_id).toBe("@aarcha.u");

      // 2. Approve photo (awards +100 XP and +25 VIBE)
      const appRes = mockDb.approveStallPhoto(subRes.submission!.id, "volunteer-1");
      expect(appRes.success).toBe(true);
      expect(appRes.xpEarned).toBe(100);
      expect(appRes.coinEarned).toBe(25);

      // Verify attendee received rewards
      const updatedWallet = mockDb.wallets.get(`${eventId}:${user.id}`)!;
      expect(updatedWallet.balance).toBe(initialBalance + 25);

      // Verify stall interaction counted in stats
      const stats = mockDb.getUserPlayerStats(user.id);
      expect(stats.stalls_visited_count).toBeGreaterThanOrEqual(1);
      expect(stats.photos_approved_count).toBeGreaterThanOrEqual(1);
    });
  });

  describe("3. The Four Playable Games", () => {
    it("should record game play sessions and update player statistics", () => {
      const user = mockDb.profiles.get("prof-usr-demo-1")!;

      // Play Minion Run (score: 140, maxScore: 200, coinCost: 50, coinReward: 150, xpReward: 300)
      mockDb.recordGameSession(eventId, user.id, "minion_run", 140, 200, 50, 150, 300);

      // Play Memory Game (score: 6, maxScore: 6, coinCost: 50, coinReward: 100, xpReward: 250)
      mockDb.recordGameSession(eventId, user.id, "memory_game", 6, 6, 50, 100, 250);

      // Play VIBE Quiz (score: 5, maxScore: 5, coinCost: 50, coinReward: 100, xpReward: 250)
      mockDb.recordGameSession(eventId, user.id, "vibe_quiz", 5, 5, 50, 100, 250);

      // Play Rotaract Game (score: 5, maxScore: 5, coinCost: 50, coinReward: 100, xpReward: 200)
      mockDb.recordGameSession(eventId, user.id, "rotaract_game", 5, 5, 50, 100, 200);

      const stats = mockDb.getUserPlayerStats(user.id);
      expect(stats.games_played_count).toBeGreaterThanOrEqual(4);
      expect(stats.games_won_count).toBeGreaterThanOrEqual(4);
    });
  });

  describe("4. Dual Leaderboards", () => {
    it("should return individual leaderboard with Instagram ID, club, and assigned zone", async () => {
      const { entries } = await getLeaderboard(eventId, 10, 0);
      expect(entries.length).toBeGreaterThan(0);

      const first = entries[0];
      expect(first).toHaveProperty("instagram_id");
      expect(first).toHaveProperty("club");
      expect(first).toHaveProperty("assigned_zone_name");
      expect(first.rank).toBe(1);
    });

    it("should rank zones strictly by VIBE Coins collected in Zone Battle", async () => {
      // Add coins to Varuna
      const varuna = mockDb.zones.get("z-varuna")!;
      varuna.coins_collected = 99999;

      const zoneLeaderboard = await getZoneLeaderboard(eventId);
      expect(zoneLeaderboard.length).toBeGreaterThanOrEqual(6);

      // Varuna should now be rank 1
      expect(zoneLeaderboard[0].zone_id).toBe("z-varuna");
      expect(zoneLeaderboard[0].rank).toBe(1);

      // Verify descending order of coins
      for (let i = 0; i < zoneLeaderboard.length - 1; i++) {
        expect(zoneLeaderboard[i].coins_collected).toBeGreaterThanOrEqual(
          zoneLeaderboard[i + 1].coins_collected
        );
      }
    });
  });

  describe("5. 10-Metric Player Statistics", () => {
    it("should correctly compute all 10 player metrics for profile", async () => {
      const user = mockDb.profiles.get("prof-usr-demo-1")!;
      const stats = await getUserPlayerStats(user.id);

      expect(stats).toHaveProperty("total_vibe_earned");
      expect(stats).toHaveProperty("total_vibe_spent");
      expect(stats).toHaveProperty("total_xp_earned");
      expect(stats).toHaveProperty("zones_visited_count");
      expect(stats).toHaveProperty("experiences_completed_count");
      expect(stats).toHaveProperty("stalls_visited_count");
      expect(stats).toHaveProperty("games_played_count");
      expect(stats).toHaveProperty("games_won_count");
      expect(stats).toHaveProperty("photos_approved_count");
      expect(stats).toHaveProperty("quests_completed_count");
    });
  });
});
