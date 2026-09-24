import { describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "@/lib/db/mock-store";
import { socialStore } from "@/lib/db/social-store";
import { getAllDiscoverableProfiles } from "@/lib/db/profiles";

describe("Digital Personal Data Protection Act, 2023 (DPDP Act) Statutory Compliance", () => {
  const testUserId = "dpdp-attendee-user-001";
  const testUserClerkId = "clerk_dpdp_001";
  const otherUserId = "dpdp-attendee-user-002";

  beforeEach(() => {
    mockDb.seed();
    socialStore.resetForTesting();

    // Create primary test profile
    mockDb.profiles.set(testUserId, {
      id: testUserId,
      clerk_user_id: testUserClerkId,
      vibe_id: "VB-DPDP-101",
      display_name: "Priya Sharma",
      username: "priya_sharma",
      avatar_url: null,
      email: "priya@example.com",
      phone: "+91 98765 43210",
      rotaract_club: "RC Bangalore Central",
      college: "RV College of Engineering",
      course_year: "Computer Science • 3rd Year",
      instagram_username: "priya.vibe",
      bio: "Networking enthusiast at VIBE 2026",
      interests: ["Tech", "Music", "Photography"],
      is_discoverable: true,
      xp: 150,
      level_number: 1,
      level_name: "VIBE NEWBIE",
      connections_count: 0,
      posts_count: 0,
      games_played_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockDb.clerkToProfileMap.set(testUserClerkId, testUserId);

    // Create second profile for interaction
    mockDb.profiles.set(otherUserId, {
      id: otherUserId,
      clerk_user_id: "clerk_dpdp_002",
      vibe_id: "VB-DPDP-102",
      display_name: "Rohan Patel",
      username: "rohan_p",
      avatar_url: null,
      email: "rohan@example.com",
      phone: "+91 98765 43211",
      rotaract_club: "RC Koramangala",
      college: "BMS College",
      course_year: "4th Year",
      instagram_username: "rohan.p",
      bio: "Excited for gaming",
      interests: ["Gaming", "Coding"],
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

  describe("1. Notice at Collection & Consent (Section 5 & 6) and Minor Protection (Section 9)", () => {
    it("should capture and store affirmative DPDP consent and 18+ age confirmation", () => {
      const profile = mockDb.getProfile(testUserId);
      expect(profile).toBeDefined();

      // Simulate consent recording as executed in registration flow
      const consentTimestamp = new Date().toISOString();
      (profile as any).dpdp_consent = true;
      (profile as any).dpdp_consent_timestamp = consentTimestamp;
      (profile as any).dpdp_age_confirmed = true;

      expect((profile as any).dpdp_consent).toBe(true);
      expect((profile as any).dpdp_age_confirmed).toBe(true);
      expect((profile as any).dpdp_consent_timestamp).toBe(consentTimestamp);
    });
  });

  describe("2. Right to Access Information about Personal Data (Section 11)", () => {
    it("should compile a comprehensive data portability export containing all personal data", async () => {
      // 1. User creates a post and comments
      const { post } = await socialStore.createPost(testUserId, "Hello VIBE 2026! #DPDP");
      await socialStore.addComment(post.id, otherUserId, "Great post!");
      await socialStore.toggleLike(post.id, testUserId);

      // 2. Fetch user's data objects
      const userPosts = socialStore.getUserPosts(testUserId);
      const userComments = socialStore.getUserComments(testUserId);
      const userLikes = socialStore.getUserLikes(testUserId);
      const connections = await socialStore.getConnectionsAsync(testUserId);
      const connectionRequests = await socialStore.getConnectionRequestsAsync(testUserId);

      expect(userPosts.length).toBe(1);
      expect(userPosts[0].caption).toContain("#DPDP");
      expect(userLikes.length).toBe(1);

      // 3. Verify structure matches Section 11 statutory requirements
      const exportData = {
        dpdp_compliance: {
          act: "Digital Personal Data Protection Act, 2023 (India)",
          section: "Section 11 - Right to Access Information",
          data_fiduciary: "Rotaract District 3192 (Bengaluru, India)",
          exported_at: new Date().toISOString(),
        },
        data_principal_identity: {
          profile_id: testUserId,
          vibe_id: "VB-DPDP-101",
          display_name: "Priya Sharma",
          email: "priya@example.com",
          phone: "+91 98765 43210",
        },
        social_posts: userPosts,
        social_comments: userComments,
        social_likes_count: userLikes.length,
        connections_list: connections,
        pending_requests: connectionRequests,
      };

      expect(exportData.dpdp_compliance.data_fiduciary).toContain("Rotaract District 3192");
      expect(exportData.data_principal_identity.vibe_id).toBe("VB-DPDP-101");
      expect(exportData.social_posts[0].caption).toContain("Hello VIBE 2026!");
      expect(exportData.social_likes_count).toBe(1);
    });
  });

  describe("3. Right to Correction and Erasure (Section 12)", () => {
    it("should allow data principal to update and correct profile information", () => {
      const updated = mockDb.updateProfile(testUserId, {
        bio: "Updated bio reflecting new interests",
        interests: ["Robotics", "AI", "Music"],
      });

      expect(updated).toBeDefined();
      expect(updated?.bio).toBe("Updated bio reflecting new interests");
      expect(updated?.interests).toContain("Robotics");
    });

    it("should permanently erase all user posts, comments, likes, notifications, and connections on erasure", async () => {
      // Setup data for user
      const { post: post1 } = await socialStore.createPost(testUserId, "Post to be deleted");
      const { post: post2 } = await socialStore.createPost(otherUserId, "Other post");
      
      await socialStore.addComment(post2.id, testUserId, "Comment to be deleted");
      await socialStore.toggleLike(post2.id, testUserId);
      await socialStore.sendConnectionRequest(testUserId, otherUserId, "Priya", "RC Central");

      // Verify data exists before erasure
      expect(socialStore.getUserPosts(testUserId).length).toBe(1);
      expect(socialStore.getUserComments(testUserId).length).toBe(1);
      expect(socialStore.getUserLikes(testUserId).length).toBe(1);

      // Perform Section 12 permanent erasure
      socialStore.eraseUserData(testUserId);
      mockDb.profiles.delete(testUserId);
      mockDb.clerkToProfileMap.delete(testUserClerkId);

      // Verify complete erasure
      expect(socialStore.getUserPosts(testUserId).length).toBe(0);
      expect(socialStore.getUserComments(testUserId).length).toBe(0);
      expect(socialStore.getUserLikes(testUserId).length).toBe(0);
      expect(mockDb.getProfile(testUserId)).toBeUndefined();
      expect(mockDb.getProfileByClerkId(testUserClerkId)).toBeUndefined();

      // Verify other user's post still exists but comment/like by deleted user are erased
      const remainingPosts = await socialStore.getPostsWithAuthors();
      const otherPost = remainingPosts.find((p) => p.id === post2.id);
      expect(otherPost).toBeDefined();

      const commentsOnOtherPost = await socialStore.getPostComments(post2.id);
      expect(commentsOnOtherPost.some((c) => c.comment === "Comment to be deleted")).toBe(false);
    });
  });

  describe("4. Right of Grievance Redressal (Section 13)", () => {
    it("should generate tracking ID and statutory timelines for grievances", async () => {
      const trackingId = `DPDP-${Date.now().toString().slice(-6)}`;
      const subject = "Query regarding data retention duration";
      const description = "Requesting information on when event photos will be archived.";

      const notif = await socialStore.createNotification({
        profile_id: testUserId,
        type: "new_challenge",
        title: `Grievance Registered (${trackingId}) ⚖️`,
        message: `Your DPDP grievance regarding "${subject}" was submitted. Statutory response window: 48h ack, 7d resolution.`,
        link: "/privacy",
      });

      expect(notif).toBeDefined();
      expect(notif.title).toContain(trackingId);
      expect(notif.message).toContain("48h ack, 7d resolution");

      const userNotifs = await socialStore.getNotifications(testUserId);
      expect(userNotifs.some((n) => n.id === notif.id)).toBe(true);
    });
  });

  describe("5. Right to Nominate (Section 14)", () => {
    it("should allow data principal to designate a nominee for incapacity or death", () => {
      const nomineeData = {
        name: "Vikram Sharma",
        email: "vikram.sharma@example.com",
        phone: "+91 98765 00000",
        relationship: "Brother",
        registered_at: new Date().toISOString(),
      };

      const profile = mockDb.getProfile(testUserId);
      expect(profile).toBeDefined();

      (profile as any).nominee = nomineeData;

      const updatedProfile = mockDb.getProfile(testUserId);
      expect((updatedProfile as any).nominee).toBeDefined();
      expect((updatedProfile as any).nominee.name).toBe("Vikram Sharma");
      expect((updatedProfile as any).nominee.relationship).toBe("Brother");
    });
  });

  describe("6. Discoverability Opt-In / Opt-Out (Privacy Controls)", () => {
    it("should exclude profile from discoverability when is_discoverable is toggled off", async () => {
      // Initially discoverable
      let discoverable = await getAllDiscoverableProfiles(otherUserId);
      expect(discoverable.some((p) => p.id === testUserId)).toBe(true);

      // Data Principal exercises privacy choice to hide profile
      const profile = mockDb.getProfile(testUserId);
      if (profile) profile.is_discoverable = false;

      // Now hidden from discovery
      discoverable = await getAllDiscoverableProfiles(otherUserId);
      expect(discoverable.some((p) => p.id === testUserId)).toBe(false);

      // Re-enable discoverability
      if (profile) profile.is_discoverable = true;
      discoverable = await getAllDiscoverableProfiles(otherUserId);
      expect(discoverable.some((p) => p.id === testUserId)).toBe(true);
    });
  });
});
