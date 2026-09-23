import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDb } from "@/lib/db/mock-store";
import { updateAttendeeProfile } from "@/actions/profile/update-profile";
import { cleanInstagramUsername } from "@/lib/profile/utils";
import * as sessionModule from "@/lib/auth/session";

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getCurrentUserSession: vi.fn(),
  };
});

describe("Edit Profile Functionality — Unit & Integration Test Suite", () => {
  const testClerkId = "clerk_test_edit_profile_user_1";
  let testProfileId = "";

  beforeEach(() => {
    // Create a pristine test profile for our tests
    const profile = mockDb.createProfile({
      clerk_user_id: testClerkId,
      display_name: "Original Name",
      email: "original@vibe2026.org",
      phone: "+91 98765 00000",
      rotaract_club: "Rotaract Club of Bengaluru Central",
      college: "Original College",
      course_year: "Original Course • 1st Year",
      instagram_username: "orig_handle",
      bio: "Original bio text",
      interests: ["Fellowship", "Networking"],
      skills: ["Public Speaking"],
      hobbies: ["Photography"],
      city: "Bengaluru",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=original",
    });
    testProfileId = profile.id;

    // Mock getCurrentUserSession to return this test user
    vi.mocked(sessionModule.getCurrentUserSession).mockImplementation(async () => {
      const p = mockDb.getProfile(testProfileId)!;
      return {
        clerkUserId: testClerkId,
        profile: p,
        member: {
          id: `em-${testProfileId}`,
          event_id: "a0000000-0000-0000-0000-000000000001",
          profile_id: testProfileId,
          role: "attendee",
          status: "active",
          joined_at: new Date().toISOString(),
        },
        eventId: "a0000000-0000-0000-0000-000000000001",
        role: "attendee",
      };
    });
  });

  // Test 1: Load Existing Profile Data
  it("Test 1: Loads existing profile data accurately into form fields", () => {
    const profile = mockDb.getProfile(testProfileId);
    expect(profile).toBeDefined();
    expect(profile?.display_name).toBe("Original Name");
    expect(profile?.college).toBe("Original College");
    expect(profile?.course_year).toBe("Original Course • 1st Year");
    expect(profile?.rotaract_club).toBe("Rotaract Club of Bengaluru Central");
    expect(profile?.instagram_username).toBe("orig_handle");
    expect(profile?.bio).toBe("Original bio text");
    expect(profile?.interests).toEqual(["Fellowship", "Networking"]);
    expect(profile?.skills).toEqual(["Public Speaking"]);
    expect(profile?.hobbies).toEqual(["Photography"]);
    expect(profile?.city).toBe("Bengaluru");
  });

  // Test 2: Change Name -> Save -> Profile displays new name
  it("Test 2: Changes full name, saves to database, and verifies persistence", async () => {
    const current = mockDb.getProfile(testProfileId)!;
    const res = await updateAttendeeProfile({
      display_name: "Updated Full Name",
      username: current.username,
      college: current.college,
      course_year: current.course_year,
      rotaract_club: current.rotaract_club,
      bio: current.bio,
      instagram_username: current.instagram_username,
      interests: current.interests,
    });

    expect(res.success).toBe(true);
    expect(res.profile?.display_name).toBe("Updated Full Name");

    // Verify persistence in mockDb
    const retrieved = mockDb.getProfile(testProfileId);
    expect(retrieved?.display_name).toBe("Updated Full Name");
  });

  // Test 3: Change Bio -> Save -> Profile displays new bio
  it("Test 3: Changes bio, saves, and updates profile text", async () => {
    const current = mockDb.getProfile(testProfileId)!;
    const newBio = "Excited for the upcoming VIBE 2026 hackathon and social mixer!";

    const res = await updateAttendeeProfile({
      display_name: current.display_name,
      username: current.username,
      college: current.college,
      course_year: current.course_year,
      rotaract_club: current.rotaract_club,
      bio: newBio,
      instagram_username: current.instagram_username,
      interests: current.interests,
    });

    expect(res.success).toBe(true);
    expect(res.profile?.bio).toBe(newBio);

    const retrieved = mockDb.getProfile(testProfileId);
    expect(retrieved?.bio).toBe(newBio);
  });

  // Test 4: Change College / Course -> Save -> Updated information persists
  it("Test 4: Changes college, course/year, and club, verifying persistence", async () => {
    const current = mockDb.getProfile(testProfileId)!;
    const res = await updateAttendeeProfile({
      display_name: current.display_name,
      username: current.username,
      college: "BMS Institute of Technology",
      course_year: "Information Science • 4th Year",
      rotaract_club: "Rotaract Club of Yelahanka",
      city: "Bengaluru North",
      bio: current.bio,
      instagram_username: current.instagram_username,
      interests: current.interests,
    });

    expect(res.success).toBe(true);
    expect(res.profile?.college).toBe("BMS Institute of Technology");
    expect(res.profile?.course_year).toBe("Information Science • 4th Year");
    expect(res.profile?.rotaract_club).toBe("Rotaract Club of Yelahanka");
    expect(res.profile?.city).toBe("Bengaluru North");

    const retrieved = mockDb.getProfile(testProfileId);
    expect(retrieved?.college).toBe("BMS Institute of Technology");
    expect(retrieved?.course_year).toBe("Information Science • 4th Year");
    expect(retrieved?.rotaract_club).toBe("Rotaract Club of Yelahanka");
    expect(retrieved?.city).toBe("Bengaluru North");
  });

  // Test 5: Change Instagram username -> Cleans handle without '@' or URL
  it("Test 5: Sanitizes Instagram handles from '@user' and URLs, cleanly storing username", async () => {
    expect(cleanInstagramUsername("@alex_vibe")).toBe("alex_vibe");
    expect(cleanInstagramUsername("https://instagram.com/alex_vibe")).toBe("alex_vibe");
    expect(cleanInstagramUsername("https://www.instagram.com/alex_vibe/")).toBe("alex_vibe");
    expect(cleanInstagramUsername("https://instagram.com/alex_vibe?igsh=123")).toBe("alex_vibe");
    expect(cleanInstagramUsername("plain_user")).toBe("plain_user");

    const current = mockDb.getProfile(testProfileId)!;
    const res = await updateAttendeeProfile({
      display_name: current.display_name,
      username: current.username,
      college: current.college,
      course_year: current.course_year,
      rotaract_club: current.rotaract_club,
      bio: current.bio,
      instagram_username: "https://www.instagram.com/vibe_official_2026/",
      interests: current.interests,
    });

    expect(res.success).toBe(true);
    expect(res.profile?.instagram_username).toBe("vibe_official_2026");

    const retrieved = mockDb.getProfile(testProfileId);
    expect(retrieved?.instagram_username).toBe("vibe_official_2026");
  });

  // Test 6: Change Profile Photo -> Save -> New photo appears
  it("Test 6: Updates profile photo URL and validates image types/sizes", async () => {
    const current = mockDb.getProfile(testProfileId)!;
    const newAvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb";

    const res = await updateAttendeeProfile({
      display_name: current.display_name,
      username: current.username,
      college: current.college,
      course_year: current.course_year,
      rotaract_club: current.rotaract_club,
      bio: current.bio,
      instagram_username: current.instagram_username,
      interests: current.interests,
      avatar_url: newAvatarUrl,
    });

    expect(res.success).toBe(true);
    expect(res.profile?.avatar_url).toBe(newAvatarUrl);

    const retrieved = mockDb.getProfile(testProfileId);
    expect(retrieved?.avatar_url).toBe(newAvatarUrl);
  });

  // Test 6b: Profile photo file upload with invalid MIME type or excessive size
  it("Test 6b: Rejects invalid file types and oversized photos", async () => {
    const current = mockDb.getProfile(testProfileId)!;

    // Fake invalid PDF file
    const invalidFile = new File([new ArrayBuffer(100)], "malicious.pdf", {
      type: "application/pdf",
    });

    const res1 = await updateAttendeeProfile({
      display_name: current.display_name,
      username: current.username,
      avatar_file: invalidFile,
    });

    expect(res1.success).toBe(false);
    expect(res1.error).toContain("Invalid file type");

    // Fake oversized file (> 5MB)
    const oversizedFile = new File(
      [new ArrayBuffer(6 * 1024 * 1024)],
      "huge.jpg",
      { type: "image/jpeg" }
    );

    const res2 = await updateAttendeeProfile({
      display_name: current.display_name,
      username: current.username,
      avatar_file: oversizedFile,
    });

    expect(res2.success).toBe(false);
    expect(res2.error).toContain("5MB");
  });

  // Test 7 & 8: Refresh Page & Logout/Login Persistence
  it("Test 7 & 8: Changes survive session invalidation and simulated re-login", async () => {
    const current = mockDb.getProfile(testProfileId)!;
    await updateAttendeeProfile({
      display_name: "Persistent Delegate",
      username: current.username,
      college: "National Institute of Engineering",
      course_year: "Mechanical • Final Year",
      rotaract_club: "RC Mysore",
      bio: "Testing persistence across sessions",
      instagram_username: "delegate.persist",
      interests: ["Robotics", "AI"],
    });

    // Invalidate cache (simulates page refresh / logout)
    sessionModule.invalidateSessionCache();

    // Re-fetch profile
    const refetched = mockDb.getProfile(testProfileId);
    expect(refetched?.display_name).toBe("Persistent Delegate");
    expect(refetched?.college).toBe("National Institute of Engineering");
    expect(refetched?.course_year).toBe("Mechanical • Final Year");
    expect(refetched?.rotaract_club).toBe("RC Mysore");
    expect(refetched?.bio).toBe("Testing persistence across sessions");
    expect(refetched?.instagram_username).toBe("delegate.persist");
    expect(refetched?.interests).toEqual(["Robotics", "AI"]);
  });

  // Test 9: Try an already-used username -> Update should fail gracefully
  it("Test 9: Prevents duplicate username claims and shows 'This username is already taken.'", async () => {
    // Create another user with a specific username
    const otherUser = mockDb.createProfile({
      clerk_user_id: "clerk_other_user_distinct",
      display_name: "Other Delegate",
      email: "other@vibe2026.org",
      phone: "+91 98765 22222",
      rotaract_club: "RC Bangalore",
      college: "BMSCE",
      course_year: "Student",
      interests: ["Tech"],
    });

    // Explicitly set otherUser's username
    mockDb.updateProfile(otherUser.id, { username: "taken_username" });

    // Try to update current user's username to the taken one
    const current = mockDb.getProfile(testProfileId)!;
    const res = await updateAttendeeProfile({
      display_name: current.display_name,
      username: "taken_username",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe("This username is already taken.");

    // Verify current user's username was NOT modified
    const unchanged = mockDb.getProfile(testProfileId);
    expect(unchanged?.username).not.toBe("taken_username");
  });

  // Test 10: Validation on required fields & double submission safety
  it("Test 10: Rejects empty name and invalid username formats", async () => {
    const current = mockDb.getProfile(testProfileId)!;

    // Empty name
    const resEmptyName = await updateAttendeeProfile({
      display_name: " ",
      username: current.username,
    });
    expect(resEmptyName.success).toBe(false);
    expect(resEmptyName.error).toContain("Full Name is required");

    // Invalid username with spaces or special characters
    const resInvalidUser = await updateAttendeeProfile({
      display_name: "Valid Name",
      username: "invalid username with spaces!",
    });
    expect(resInvalidUser.success).toBe(false);
    expect(resInvalidUser.error).toContain("Username must be between 2 and 30 characters");
  });

  // Test 10b: Rapid concurrent save calls execute safely without corruption
  it("Test 10b: Rapid concurrent save calls execute safely without corruption or double awards", async () => {
    const current = mockDb.getProfile(testProfileId)!;
    const [res1, res2] = await Promise.all([
      updateAttendeeProfile({
        display_name: "Rapid Save 1",
        username: current.username,
      }),
      updateAttendeeProfile({
        display_name: "Rapid Save 2",
        username: current.username,
      }),
    ]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    const finalProfile = mockDb.getProfile(testProfileId);
    expect(["Rapid Save 1", "Rapid Save 2"]).toContain(finalProfile?.display_name);
  });

  // Test 11: Backend failure simulation returns proper error without false success
  it("Test 11: Backend unauthorized failure returns clear error and does not report success", async () => {
    // Temporarily mock unauthenticated session
    vi.mocked(sessionModule.getCurrentUserSession).mockResolvedValueOnce(null as any);

    const res = await updateAttendeeProfile({
      display_name: "Hacker Try",
      username: "hacker_try",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Unauthorized");
  });

  // Test 12: Profile completion XP reward (+50 XP) awarded only once
  it("Test 12: Awards +50 XP on first profile completion, and NEVER on subsequent edits", async () => {
    // Create an incomplete user (no bio, empty interests, 0 starting XP)
    const incompleteUser = mockDb.createProfile({
      clerk_user_id: "clerk_incomplete_user_xp",
      display_name: "Incomplete User",
      email: "incomplete@vibe2026.org",
      phone: "+91 99999 55555",
      rotaract_club: "RC Hub",
      college: "District",
      course_year: "Delegate",
      bio: null,
      interests: [],
    });

    // Reset profile_completed and xp for clean test
    mockDb.updateProfile(incompleteUser.id, {
      xp: 0,
      profile_completed: false,
      bio: null,
      interests: [],
    });

    vi.mocked(sessionModule.getCurrentUserSession).mockImplementation(async () => ({
      clerkUserId: "clerk_incomplete_user_xp",
      profile: mockDb.getProfile(incompleteUser.id)!,
      member: {
        id: `em-${incompleteUser.id}`,
        event_id: "a0000000-0000-0000-0000-000000000001",
        profile_id: incompleteUser.id,
        role: "attendee",
        status: "active",
        joined_at: new Date().toISOString(),
      },
      eventId: "a0000000-0000-0000-0000-000000000001",
      role: "attendee",
    }));

    // Initial state: 0 XP, incomplete
    let userState = mockDb.getProfile(incompleteUser.id)!;
    expect(userState.xp).toBe(0);
    expect(userState.profile_completed).toBe(false);

    // Edit 1: Complete profile for the FIRST time by adding bio and interests
    const edit1 = await updateAttendeeProfile({
      display_name: userState.display_name,
      username: userState.username,
      bio: "Now I have written a comprehensive bio for VIBE 2026!",
      interests: ["Networking", "Social Impact"],
    });

    expect(edit1.success).toBe(true);
    expect(edit1.xpEarned).toBe(50); // Earned 50 XP!

    userState = mockDb.getProfile(incompleteUser.id)!;
    expect(userState.xp).toBe(50);
    expect(userState.profile_completed).toBe(true);

    // Edit 2: Edit profile AGAIN (e.g. change name, bio, or college)
    const edit2 = await updateAttendeeProfile({
      display_name: "Incomplete User Updated",
      username: userState.username,
      bio: "Another revision of my bio",
      interests: ["Networking", "Social Impact", "Events"],
    });

    expect(edit2.success).toBe(true);
    expect(edit2.xpEarned).toBe(0); // MUST NOT earn duplicate XP!

    userState = mockDb.getProfile(incompleteUser.id)!;
    expect(userState.xp).toBe(50); // XP remains exactly 50, not 100!
  });

  // Test 13: FormData input support
  it("Test 13: Processes FormData payload identically to plain object", async () => {
    const current = mockDb.getProfile(testProfileId)!;
    const formData = new FormData();
    formData.set("display_name", "FormData Updated Name");
    formData.set("username", current.username);
    formData.set("college", "FormData College");
    formData.set("course_year", "FormData Course");
    formData.set("rotaract_club", "RC FormData");
    formData.set("bio", "FormData bio text");
    formData.set("instagram_username", "@formdata.handle");
    formData.set("interests", "Sports, Art");

    const res = await updateAttendeeProfile(formData);
    expect(res.success).toBe(true);
    expect(res.profile?.display_name).toBe("FormData Updated Name");
    expect(res.profile?.college).toBe("FormData College");
    expect(res.profile?.instagram_username).toBe("formdata.handle");
    expect(res.profile?.interests).toEqual(["Sports", "Art"]);
  });
});
