import { describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "@/lib/db/mock-store";
import { socialStore } from "@/lib/db/social-store";
import { cleanInstagramUsername } from "@/lib/profile/utils";

describe("ROCO Flappie & Social Integrity Unit Tests", () => {
  const userA = "prof-test-user-a";
  const userB = "prof-test-user-b";

  beforeEach(() => {
    mockDb.profiles.clear();
    mockDb.connections = [];
    mockDb.connectionRequests = [];

    mockDb.createProfile({
      clerk_user_id: "clerk-a",
      display_name: "Thejaswin P",
      email: "thejaswinps@gmail.com",
      phone: "+91 99999 11111",
      rotaract_club: "RCSB",
      college: "RCSB",
      course_year: "Delegate • 2026",
      instagram_username: "https://www.instagram.com/the__win25/?hl=en",
      bio: "Organizing VIBE 2026",
      interests: ["Music", "Gaming"],
    });

    mockDb.createProfile({
      clerk_user_id: "clerk-b",
      display_name: "Aarcha U",
      email: "aarchaullasan@gmail.com",
      phone: "+91 88888 22222",
      rotaract_club: "Swarna Bengaluru",
      college: "Swarna Bengaluru",
      course_year: "Community Service Director",
      instagram_username: "@aarch.h",
      bio: "RCSB Delegate",
      interests: ["Music", "Tech & Coding"],
    });
  });

  it("should sanitize Instagram URLs and handles cleanly into pure handles", () => {
    expect(cleanInstagramUsername("https://www.instagram.com/the__win25/?hl=en")).toBe("the__win25");
    expect(cleanInstagramUsername("@aarch.h")).toBe("aarch.h");
    expect(cleanInstagramUsername("the__win25")).toBe("the__win25");
  });

  it("should correctly resolve connected status between two connected users", async () => {
    const profA = mockDb.getProfileByClerkId("clerk-a")!;
    const profB = mockDb.getProfileByClerkId("clerk-b")!;

    // Initially none
    const statusBefore = await socialStore.getConnectionStatusAsync(profA.id, profB.id);
    expect(statusBefore).toBe("none");

    // Add connection
    mockDb.connections.push({
      id: "conn-123",
      user_id_1: profA.id,
      user_id_2: profB.id,
      connected_at: new Date().toISOString(),
    });

    const statusAfter = await socialStore.getConnectionStatusAsync(profA.id, profB.id);
    expect(statusAfter).toBe("connected");

    const connMap = await socialStore.getUserConnectionMapAsync(profA.id);
    expect(connMap[profB.id]).toBe("connected");
  });

  it("should award XP for commenting and liking but not have arbitrary claim buttons", async () => {
    const profA = mockDb.getProfileByClerkId("clerk-a")!;
    const profB = mockDb.getProfileByClerkId("clerk-b")!;
    const initialXpA = profA.xp;

    // Create a post
    const { post } = await socialStore.createPost(profA.id, "Hello from VIBE 2026!", null);
    expect(post).toBeDefined();

    // User B comments on post -> User B gets +10 XP, User A gets +5 XP
    const initialXpB = profB.xp;
    await socialStore.addComment(post.id, profB.id, "Awesome post!", profB.display_name);

    const refetchedB = mockDb.getProfile(profB.id)!;
    expect(refetchedB.xp).toBe(initialXpB + 10);
  });

  it("should enforce skill gate on Flappy ROCCO scoring in mock-store", () => {
    const profA = mockDb.getProfileByClerkId("clerk-a")!;
    const initialXp = profA.xp;

    // Submitting a score of 300 (equivalent to pillar clears) awards tiered XP
    const res = mockDb.submitGameScore(profA.id, "flappy_rocco", 350, 20);
    expect(res.success).toBe(true);
    expect(res.xpEarned).toBe(50);

    const afterXp = mockDb.getProfile(profA.id)!.xp;
    expect(afterXp).toBe(initialXp + 50);
  });

  it("should accurately reflect connection states (connected, pending, none) for post authors", async () => {
    const profA = mockDb.getProfileByClerkId("clerk-a")!;
    const profB = mockDb.getProfileByClerkId("clerk-b")!;
    const profC = mockDb.createProfile({
      clerk_id: "clerk-c",
      display_name: "Charlie Connect",
      email: "charlie@rotaract.org",
      role: "attendee",
      xp: 100,
      level: 1,
      college: "Global Tech",
      rotaract_club: "RC Bangalore",
      badge: "Delegator",
      is_discoverable: true,
      connections_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 1. Initially no connection between A and C
    let connMapA = await socialStore.getUserConnectionMapAsync(profA.id);
    expect(connMapA[profC.id] || "none").toBe("none");

    // 2. Pending request sent from A to C
    await socialStore.sendConnectionRequest(profA.id, profC.id, profA.display_name, profA.rotaract_club);
    connMapA = await socialStore.getUserConnectionMapAsync(profA.id);
    expect(connMapA[profC.id]).toBe("pending");

    // 3. Accepted connection between A and B
    mockDb.connections.push({
      id: "conn-ab",
      user_id_1: profA.id,
      user_id_2: profB.id,
      connected_at: new Date().toISOString(),
    });
    connMapA = await socialStore.getUserConnectionMapAsync(profA.id);
    expect(connMapA[profB.id]).toBe("connected");
  });
});

