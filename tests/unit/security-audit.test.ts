import { describe, it, expect } from "vitest";
import {
  adminAdjustBalanceAction,
  adminDeleteAttendeeAction,
  adminToggleEventFreezeAction,
  adminPurgeTestDataAction,
} from "@/actions/admin/manage";
import { checkinAttendeeAtZoneAction } from "@/actions/staff/checkin";
import { approveChallengeStaffAction } from "@/actions/experiences/complete";
import { approveStallPhotoAction, rejectStallPhotoAction } from "@/actions/stalls/verify";
import { submitGameResultAction } from "@/actions/games/play";
import { sendCoinsToZoneAction } from "@/actions/zones/contribute";

describe("🛡️ Security Audit & Access Control Boundary Tests", () => {
  describe("Admin Actions RBAC Guard", () => {
    it("should reject adminAdjustBalanceAction without admin credentials", async () => {
      const result = await adminAdjustBalanceAction({
        targetProfileId: "prof-victim-1",
        amount: 5000,
        reason: "Unauthorized exploit attempt",
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Unauthorized/i);
    });

    it("should reject adminDeleteAttendeeAction without admin credentials", async () => {
      const result = await adminDeleteAttendeeAction({
        targetProfileId: "prof-victim-1",
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Unauthorized/i);
    });

    it("should reject adminToggleEventFreezeAction without admin credentials", async () => {
      const result = await adminToggleEventFreezeAction(true);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Unauthorized/i);
    });

    it("should reject adminPurgeTestDataAction without admin credentials", async () => {
      const result = await adminPurgeTestDataAction();

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Unauthorized/i);
    });
  });

  describe("Staff & Verification Actions Guard", () => {
    it("should reject checkinAttendeeAtZoneAction without active staff or admin session", async () => {
      const result = await checkinAttendeeAtZoneAction({
        targetProfileId: "prof-victim-1",
        zoneId: "z-arnava",
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Unauthorized/i);
    });

    it("should reject approveChallengeStaffAction without staff or admin session", async () => {
      const result = await approveChallengeStaffAction("prof-victim-1", "exp-1");

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Unauthorized/i);
    });

    it("should reject approveStallPhotoAction without staff or admin session", async () => {
      const result = await approveStallPhotoAction("sub-1");

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Unauthorized/i);
    });

    it("should reject rejectStallPhotoAction without staff or admin session", async () => {
      const result = await rejectStallPhotoAction("sub-1");

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Unauthorized/i);
    });
  });

  describe("Economy & Anti-Cheat Validation", () => {
    it("should reject submitGameResultAction when coinReward exceeds permitted cap (>50)", async () => {
      const result = await submitGameResultAction({
        gameType: "minion_run",
        score: 150,
        maxScore: 200,
        coinCost: 0,
        coinReward: 500, // Exploit attempt
        xpReward: 25,
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Coin reward exceeds permitted/i);
    });

    it("should reject submitGameResultAction when xpReward exceeds permitted cap (>50)", async () => {
      const result = await submitGameResultAction({
        gameType: "rotaract_game",
        score: 5,
        maxScore: 5,
        coinCost: 0,
        coinReward: 10,
        xpReward: 9999, // Exploit attempt
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/XP reward exceeds permitted/i);
    });

    it("should reject zone contribution when amount exceeds 10,000 VIBE coins", async () => {
      const result = await sendCoinsToZoneAction({
        zoneId: "z-arnava",
        amount: 500000,
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Maximum contribution is 10,000/i);
    });
  });
});
