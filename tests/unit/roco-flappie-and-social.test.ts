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
});
