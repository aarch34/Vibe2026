import { describe, it, expect } from "vitest";
import { mockDb, calculateLevel } from "@/lib/db/mock-store";

describe("VIBE 2026 XP Social Networking & Games Platform", () => {
  it("calculates level thresholds correctly", () => {
    expect(calculateLevel(0).level_name).toBe("VIBE NEWBIE");
    expect(calculateLevel(250).level_name).toBe("VIBE EXPLORER");
    expect(calculateLevel(500).level_name).toBe("VIBE SEEKER");
    expect(calculateLevel(1000).level_name).toBe("VIBE RIDER");
    expect(calculateLevel(1500).level_name).toBe("VIBE ICON");
    expect(calculateLevel(2500).level_name).toBe("VIBE LEGEND");
  });

  it("handles profile creation and onboarding XP bonus", () => {
    const profile = mockDb.createProfile({
      clerk_user_id: "test_clerk_123",
      display_name: "Test User",
      email: "test@vibe.org",
      phone: "+91 99999 88888",
      rotaract_club: "Rotaract Club of Bengaluru",
      college: "RVCE",
      course_year: "CS • 3rd Year",
      instagram_username: "test.insta",
      interests: ["Music", "Gaming"],
    });

    expect(profile.xp).toBe(75); // 50 (profile) + 25 (instagram)
    expect(profile.level_name).toBe("VIBE NEWBIE");
  });

  it("processes connection requests and milestone XP", () => {
    const ts = Date.now();
    const p1 = mockDb.createProfile({
      clerk_user_id: `test_clerk_conn_1_${ts}`,
      display_name: "Alice Test",
      email: `alice_${ts}@vibe.org`,
      phone: "+91 99999 11111",
      rotaract_club: "RC Bangalore",
      college: "BMSCE",
      course_year: "ISE • 2nd Year",
      interests: ["Music"],
    });

    const p2 = mockDb.createProfile({
      clerk_user_id: `test_clerk_conn_2_${ts}`,
      display_name: "Bob Test",
      email: `bob_${ts}@vibe.org`,
      phone: "+91 99999 22222",
      rotaract_club: "RC Central",
      college: "MSRIT",
      course_year: "ECE • 3rd Year",
      interests: ["Gaming"],
    });

    const req = mockDb.sendConnectionRequest(p1.id, p2.id);
    expect(req.success).toBe(true);

    const acceptRes = mockDb.acceptConnectionRequest(req.request!.id, p2.id);
    expect(acceptRes.success).toBe(true);
  });

  it("records game sessions and awards XP according to score tiers", () => {
    const ts = Date.now();
    const p1 = mockDb.createProfile({
      clerk_user_id: `test_clerk_game_1_${ts}`,
      display_name: "Gamer Test",
      email: `gamer_${ts}@vibe.org`,
      phone: "+91 99999 33333",
      rotaract_club: "RC North",
      college: "REVA",
      course_year: "CSE • 1st Year",
      interests: ["Gaming"],
    });
    
    const res = mockDb.submitGameScore(p1.id, "rotaract_game", 5, 5); // 100%
    expect(res.xpEarned).toBe(150);
  });

  it("enforces audit logs on admin XP adjustments", () => {
    const ts = Date.now();
    const target = mockDb.createProfile({
      clerk_user_id: `test_clerk_admin_target_${ts}`,
      display_name: "Target User",
      email: `target_${ts}@vibe.org`,
      phone: "+91 99999 44444",
      rotaract_club: "RC South",
      college: "PESU",
      course_year: "ME • 4th Year",
      interests: ["Sports"],
    });

    const adj = mockDb.adminAdjustXp(target.id, "admin-1", "Admin John", 100, "Challenge Winner");
    expect(adj.success).toBe(true);
    expect(adj.newXp).toBeGreaterThan(0);

    const logs = mockDb.getAdminXpAdjustments();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].reason).toBe("Challenge Winner");
  });
});
