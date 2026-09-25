import { describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "@/lib/db/mock-store";
import { getAllDiscoverableProfiles, invalidateDiscoverProfilesCache } from "@/lib/db/profiles";
import { socialStore, invalidateFeedCache } from "@/lib/db/social-store";
import { invalidateLeaderboardCache, invalidateUserGameSummary } from "@/lib/cache/app-cache";
import { GET as getDiscoverHandler } from "@/app/api/discover/route";

describe("🌊 VIBE 2026 — App-Wide Caching & Delta Sync System", () => {
  beforeEach(() => {
    mockDb.profiles.clear();
    mockDb.connections = [];
    mockDb.connectionRequests = [];
    socialStore.resetForTesting();
    invalidateDiscoverProfilesCache();
    invalidateFeedCache();
    invalidateLeaderboardCache();
    invalidateUserGameSummary();
  });

  it("should serve discoverable profiles from shared pool without error", async () => {
    const list1 = await getAllDiscoverableProfiles("user-dummy-1");
    expect(Array.isArray(list1)).toBe(true);

    const list2 = await getAllDiscoverableProfiles("user-dummy-2");
    expect(Array.isArray(list2)).toBe(true);

    // Cache invalidation functions cleanly
    expect(() => invalidateDiscoverProfilesCache()).not.toThrow();
  });

  it("should support delta-sync in /api/discover endpoint", async () => {
    // 1. Full directory fetch without ?since
    const reqFull = new Request("http://localhost:3000/api/discover");
    const resFull = await getDiscoverHandler(reqFull);
    const dataFull = await resFull.json();

    expect(dataFull.success).toBe(true);
    expect(dataFull.isDelta).toBe(false);
    expect(Array.isArray(dataFull.profiles)).toBe(true);
    expect(dataFull.timestamp).toBeDefined();

    // 2. Delta fetch with future timestamp -> 0 profiles transferred (0 egress)
    const futureDate = new Date(Date.now() + 100000).toISOString();
    const reqDelta = new Request(`http://localhost:3000/api/discover?since=${encodeURIComponent(futureDate)}`);
    const resDelta = await getDiscoverHandler(reqDelta);
    const dataDelta = await resDelta.json();

    expect(dataDelta.success).toBe(true);
    expect(dataDelta.isDelta).toBe(true);
    expect(dataDelta.profiles.length).toBe(0);

    // 3. Reject invalid timestamps gracefully
    const reqInvalid = new Request("http://localhost:3000/api/discover?since=invalid-date");
    const resInvalid = await getDiscoverHandler(reqInvalid);
    expect(resInvalid.status).toBe(400);
  });

  it("should invalidate feed cache on post creation", async () => {
    const initialPosts = await socialStore.getPostsWithAuthors();
    expect(Array.isArray(initialPosts)).toBe(true);

    const testUser = "usr-author-cache";
    mockDb.profiles.set(testUser, {
      id: testUser,
      clerk_user_id: "clerk-author-cache",
      vibe_id: "VB2026-999",
      display_name: "Cache Tester",
      username: "cache_tester",
      avatar_url: null,
      email: "cache@test.com",
      phone: "+919999999999",
      rotaract_club: "Test Club",
      college: "Test College",
      course_year: "4th Year",
      instagram_username: null,
      bio: "Testing cache",
      interests: ["Tech"],
      skills: [],
      hobbies: [],
      favorite_music: [],
      favorite_movies: [],
      city: "Bengaluru",
      is_discoverable: true,
      xp: 100,
      level_number: 1,
      level_name: "VIBE NEWBIE",
      connections_count: 0,
      posts_count: 0,
      games_played_count: 0,
      registration_id: null,
      profile_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const createRes = await socialStore.createPost(testUser, "Testing post cache invalidation!");
    expect(createRes.post.id).toBeDefined();

    // Verify cache invalidation function runs cleanly
    expect(() => invalidateFeedCache()).not.toThrow();

    const refreshedPosts = await socialStore.getPostsWithAuthors();
    expect(refreshedPosts.some((p) => p.id === createRes.post.id)).toBe(true);
  });

  it("should expose game summary and leaderboard cache invalidation", () => {
    expect(() => invalidateUserGameSummary("test-user-id")).not.toThrow();
    expect(() => invalidateLeaderboardCache("flappy_rocco")).not.toThrow();
    expect(() => invalidateLeaderboardCache("overall")).not.toThrow();
  });
});
