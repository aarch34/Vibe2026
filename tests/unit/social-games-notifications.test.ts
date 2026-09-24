import { describe, it, expect, beforeEach } from "vitest";
import { socialStore } from "@/lib/db/social-store";
import { mockDb, calculateLevel } from "@/lib/db/mock-store";
import { GameType } from "@/types/database";

describe("Social Feed, Instagram-like Interactions, Connections & Games XP", () => {
  const testUserA = "test-user-a";
  const testUserB = "test-user-b";

  beforeEach(() => {
    socialStore.resetForTesting();
    mockDb.profiles.set(testUserA, {
      id: testUserA,
      clerk_user_id: "clerk-a",
      vibe_id: "VB-1001",
      display_name: "Alice Delegator",
      username: "alice_vibe",
      avatar_url: null,
      email: "alice@example.com",
      phone: "9876543210",
      rotaract_club: "RC Bangalore Central",
      college: "RV College",
      course_year: "3rd Year",
      instagram_username: "alice.vibe",
      bio: "Excited for VIBE 2026!",
      interests: ["Music", "Dance"],
      is_discoverable: true,
      xp: 100,
      level_number: 1,
      level_name: "VIBE NEWBIE",
      connections_count: 0,
      posts_count: 0,
      games_played_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockDb.profiles.set(testUserB, {
      id: testUserB,
      clerk_user_id: "clerk-b",
      vibe_id: "VB-1002",
      display_name: "Bob Rotaractor",
      username: "bob_rotaract",
      avatar_url: null,
      email: "bob@example.com",
      phone: "9876543211",
      rotaract_club: "RC Koramangala",
      college: "PES University",
      course_year: "4th Year",
      instagram_username: "bob_r",
      bio: "Networking enthusiast",
      interests: ["Coding", "Gaming"],
      is_discoverable: true,
      xp: 200,
      level_number: 1,
      level_name: "VIBE NEWBIE",
      connections_count: 0,
      posts_count: 0,
      games_played_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  it("should create posts with captions, photos and award First Post XP (+50 XP)", async () => {
    const { post, xpEarned } = await socialStore.createPost(
      testUserA,
      "Excited to be part of VIBE 2026! Let's connect! #VIBE2026",
      "data:image/jpeg;base64,mockimagedata"
    );

    expect(post).toBeDefined();
    expect(post.caption).toContain("#VIBE2026");
    expect(post.image_url).toBe("data:image/jpeg;base64,mockimagedata");
    expect(xpEarned).toBe(50); // First post bonus

    const posts = await socialStore.getPostsWithAuthors();
    const created = posts.find((p) => p.id === post.id);
    expect(created).toBeDefined();
    expect(created?.author.display_name).toBe("Alice Delegator");
  });

  it("should support liking posts, toggling likes, awarding 5 XP, and double-tap like", async () => {
    const { post } = await socialStore.createPost(testUserA, "Testing likes!");

    const aliceXpBeforeLike = mockDb.getProfile(testUserA)?.xp || 0;
    const bobXpBeforeLike = mockDb.getProfile(testUserB)?.xp || 0;

    // Bob likes Alice's post
    const like1 = await socialStore.toggleLike(post.id, testUserB, "Bob Rotaractor");
    expect(like1.liked).toBe(true);
    expect(like1.likesCount).toBe(1);
    expect(like1.xpEarned).toBe(5);

    // Verify both Alice (author whose post got liked) and Bob (person who liked) get +5 XP
    const newAliceXp = mockDb.getProfile(testUserA)?.xp || 0;
    const newBobXp = mockDb.getProfile(testUserB)?.xp || 0;
    expect(newAliceXp).toBe(aliceXpBeforeLike + 5);
    expect(newBobXp).toBe(bobXpBeforeLike + 5);

    // Verify Alice received a like notification with XP mention
    const notifs = await socialStore.getNotifications(testUserA);
    const likeNotif = notifs.find((n) => n.type === "post_like");
    expect(likeNotif).toBeDefined();
    expect(likeNotif?.title).toContain("Like");
    expect(likeNotif?.title).toContain("+5 XP");

    // Bob unlikes
    const like2 = await socialStore.toggleLike(post.id, testUserB);
    expect(like2.liked).toBe(false);
    expect(like2.likesCount).toBe(0);

    // Bob likes again - like count increments but anti-exploit prevents duplicate XP farming
    const like3 = await socialStore.toggleLike(post.id, testUserB);
    expect(like3.liked).toBe(true);
    expect(like3.likesCount).toBe(1);
    expect(like3.xpEarned).toBe(0);
  });

  it("should support adding comments and notifying post author", async () => {
    const { post } = await socialStore.createPost(testUserA, "Drop your thoughts!");

    const cmtRes = await socialStore.addComment(post.id, testUserB, "See you at the festival!");
    expect(cmtRes.success).toBe(true);
    expect(cmtRes.comment?.comment).toBe("See you at the festival!");

    const comments = await socialStore.getPostComments(post.id);
    expect(comments.length).toBeGreaterThanOrEqual(1);
    expect(comments.some((c) => c.comment === "See you at the festival!")).toBe(true);

    // Verify Alice received a comment notification
    const notifs = await socialStore.getNotifications(testUserA);
    const cmtNotif = notifs.find((n) => n.type === "post_comment");
    expect(cmtNotif).toBeDefined();
    expect(cmtNotif?.message).toContain("See you at the festival");
  });

  it("should send connection requests, alert receiver with notification, and award +25 XP on accept", async () => {
    // 1. Alice sends connection request to Bob
    const sendRes = await socialStore.sendConnectionRequest(
      testUserA,
      testUserB,
      "Alice Delegator",
      "RC Bangalore Central"
    );
    expect(sendRes.success).toBe(true);
    expect(sendRes.request?.receiver_id).toBe(testUserB);

    // 2. Bob should immediately have an incoming connection request notification
    const bobNotifs = await socialStore.getNotifications(testUserB);
    const reqNotif = bobNotifs.find((n) => n.type === "connection_request");
    expect(reqNotif).toBeDefined();
    expect(reqNotif?.title).toContain("Connection Request");

    // 3. Bob checks pending requests
    const bobRequests = await socialStore.getConnectionRequestsAsync(testUserB);
    expect(bobRequests.incoming.length).toBeGreaterThanOrEqual(1);
    const pendingReq = bobRequests.incoming.find((r) => r.request.id === sendRes.request?.id);
    expect(pendingReq).toBeDefined();

    // 4. Bob accepts the connection request
    const prevAliceXp = mockDb.getProfile(testUserA)?.xp || 0;
    const prevBobXp = mockDb.getProfile(testUserB)?.xp || 0;

    const acceptRes = await socialStore.respondConnectionRequest(
      sendRes.request!.id,
      testUserB,
      "accept",
      "Bob Rotaractor"
    );
    expect(acceptRes.success).toBe(true);
    expect(acceptRes.status).toBe("accepted");

    // 5. Both Alice and Bob receive +25 XP
    const newAliceXp = mockDb.getProfile(testUserA)?.xp || 0;
    const newBobXp = mockDb.getProfile(testUserB)?.xp || 0;
    expect(newAliceXp).toBe(prevAliceXp + 25);
    expect(newBobXp).toBe(prevBobXp + 25);

    // 6. Alice receives "Connection Accepted! 🎉" notification
    const aliceNotifs = await socialStore.getNotifications(testUserA);
    const acceptNotif = aliceNotifs.find((n) => n.type === "connection_accepted");
    expect(acceptNotif).toBeDefined();

    // 7. They are now officially connected in Friends list
    const aliceConnections = await socialStore.getConnectionsAsync(testUserA);
    expect(aliceConnections.some((c) => c.id === testUserB)).toBe(true);

    const bobConnections = await socialStore.getConnectionsAsync(testUserB);
    expect(bobConnections.some((c) => c.id === testUserA)).toBe(true);
  });

  it("should calculate progressive level milestones correctly", () => {
    expect(calculateLevel(50).level_name).toBe("VIBE NEWBIE");
    expect(calculateLevel(300).level_name).toBe("VIBE EXPLORER");
    expect(calculateLevel(750).level_name).toBe("VIBE SEEKER");
    expect(calculateLevel(1200).level_name).toBe("VIBE RIDER");
    expect(calculateLevel(1800).level_name).toBe("VIBE ICON");
    expect(calculateLevel(3000).level_name).toBe("VIBE LEGEND");
  });
});
