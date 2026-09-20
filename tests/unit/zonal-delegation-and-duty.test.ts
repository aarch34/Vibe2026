import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDb } from "@/lib/db/supabase";

vi.mock("@/actions/admin/auth", () => ({
  getAdminSession: vi.fn(async () => ({
    username: "jk",
    name: "JK",
    role: "admin",
    loggedInAt: Date.now(),
  })),
  logoutAdminAction: vi.fn(),
}));

vi.mock("@/actions/staff/auth", () => ({
  getZonalStaffSession: vi.fn(async () => ({
    username: "arnava1",
    zoneSlug: "arnava",
    zoneId: "d0000000-0000-0000-0000-000000000001",
    zoneName: "Arnava",
    headName: "Zonal Head 1 (Arnava)",
    loggedInAt: Date.now(),
  })),
  logoutZonalStaffAction: vi.fn(),
}));

import {
  adminAssignZonalStaffAction,
  adminGetZonalStaffAssignmentsAction,
  adminRevokeZonalStaffAction,
} from "@/actions/admin/staff-delegation";
import { awardDutyXpAction, getRecentDutyAwardsAction } from "@/actions/staff/duty-award";

describe("🌊 Zonal Staff Delegation & Duty XP Reward System", () => {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  const volunteerProfileId = "prof-test-volunteer-1";

  beforeEach(() => {
    // Setup test volunteer in mockDb
    mockDb.createAttendeeProfile(
      "usr-clerk-volunteer-1",
      "Tanvi Rao",
      "VIBE-7721",
      "PES University Rotaract",
      "Rotaract Club of Bangalore",
      500,
      100,
      1,
      "@tanvi.rao",
      "+91 99887 76655",
      "z-arnava"
    );

    // Override the profile id to match our test constant
    const p = Array.from(mockDb.profiles.values()).find((p) => p.clerk_user_id === "usr-clerk-volunteer-1");
    if (p) {
      p.id = volunteerProfileId;
      mockDb.profiles.set(volunteerProfileId, p);
      mockDb.creditInitialWallet(eventId, volunteerProfileId, 500);
    }
  });

  describe("1. Admin Zonal Staff Delegation", () => {
    it("Admin can assign a registered attendee to Arnava as Zonal Head", async () => {
      const res = await adminAssignZonalStaffAction({
        targetProfileId: volunteerProfileId,
        zoneId: "d0000000-0000-0000-0000-000000000001",
        staffType: "zonal_head",
        passcode: "arnava@custom2026",
      });

      // Validates response
      expect(res.success).toBe(true);
      expect(res.message).toBeDefined();
    });

    it("Admin can fetch the full 6-zone staff delegation matrix", async () => {
      const matrixRes = await adminGetZonalStaffAssignmentsAction();
      expect(matrixRes.success).toBe(true);
      expect(matrixRes.matrix).toBeDefined();
      expect(matrixRes.matrix!.length).toBeGreaterThanOrEqual(6);

      // Verify all 6 zones exist
      const zoneSlugs = matrixRes.matrix!.map((z) => z.zoneSlug.toLowerCase());
      expect(zoneSlugs).toContain("arnava");
      expect(zoneSlugs).toContain("taranaga");
      expect(zoneSlugs).toContain("sagara");
      expect(zoneSlugs).toContain("pravaha");
      expect(zoneSlugs).toContain("samudhra");
      expect(zoneSlugs).toContain("varuna");
    });

    it("Admin can revoke a staff member's zonal assignment", async () => {
      const res = await adminRevokeZonalStaffAction("asg-test-assignment-id");
      expect(res.success).toBe(true);
      expect(res.message).toContain("revoked");
    });
  });

  describe("2. Zonal Head Duty XP Awarding Engine", () => {
    it("Zonal Head awards +150 XP and +50 Coins to volunteer for Stage & Audio duty", async () => {
      // Award duty XP
      const res = await awardDutyXpAction({
        targetProfileId: volunteerProfileId,
        zoneId: "d0000000-0000-0000-0000-000000000001",
        dutyCategory: "Stage Operations",
        xpAmount: 150,
        coinAmount: 50,
        description: "Manned stage audio console for 2 hours during concert.",
      });

      expect(res.success).toBe(true);
      expect(res.xpAwarded).toBe(150);
      expect(res.coinsAwarded).toBe(50);
      expect(res.newBalance).toBeGreaterThanOrEqual(550);

      // Verify volunteer wallet in mockDb increased by 50
      const wallet = mockDb.wallets.get(`${eventId}:${volunteerProfileId}`);
      expect(wallet).toBeDefined();
      expect(wallet!.balance).toBeGreaterThanOrEqual(550);

      // Verify completion record was added
      const userComps = mockDb.completions.filter((c) => c.profile_id === volunteerProfileId);
      expect(userComps.length).toBeGreaterThanOrEqual(1);
      const dutyComp = userComps.find((c) => c.xp_earned === 150);
      expect(dutyComp).toBeDefined();
    });

    it("Rejects duty award when justification description is empty or too short", async () => {
      const res = await awardDutyXpAction({
        targetProfileId: volunteerProfileId,
        zoneId: "d0000000-0000-0000-0000-000000000001",
        dutyCategory: "Logistics",
        xpAmount: 100,
        coinAmount: 25,
        description: "hi", // Too short (min 5 chars required)
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("justification");
    });

    it("Zonal station can query recent duty awards issued for that zone", async () => {
      const res = await getRecentDutyAwardsAction("d0000000-0000-0000-0000-000000000001");
      expect(res.success).toBe(true);
      expect(res.awards).toBeDefined();
    });
  });

  describe("3. Fake Data Cleanliness Verification", () => {
    it("Database mock store does not contain any hardcoded demo profile 'Aarav Sharma' as default", () => {
      const defaultProfile = mockDb.profiles.get("usr-demo-1");
      expect(defaultProfile).toBeUndefined();
    });
  });
});
