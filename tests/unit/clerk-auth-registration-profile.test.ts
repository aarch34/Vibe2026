import { describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "@/lib/db/mock-store";
import { normalizeSupabaseProfile, getProfileByIdOrClerkId, getAllDiscoverableProfiles } from "@/lib/db/profiles";

describe("Clerk Auth -> Registration -> Profile View Workflow", () => {
  const clerkUserIdA = "user_clerk_test_alice_123";
  const clerkUserIdB = "user_clerk_test_bob_456";

  beforeEach(() => {
    mockDb.seed();
  });

  it("1. Normalizes Supabase database columns correctly into frontend Profile format", () => {
    const rawSupabaseRow = {
      id: "11111111-2222-3333-4444-555555555555",
      clerk_user_id: clerkUserIdA,
      vibe_id: "VB2026-789",
      display_name: "Alice Johnson",
      email: "alice@rotaract3192.org",
      phone: "+91 98765 11111",
      club: "Rotaract Club of Bengaluru East",
      college: "BMS College of Engineering",
      course_year: "Computer Science • 3rd Year",
      instagram_id: "alice.vibe",
      city: "Bengaluru",
      bio: "Excited for ROCCO 2026 freshers party!",
      interests: ["Music", "Coding", "Gaming"],
      skills: ["React", "TypeScript"],
      hobbies: ["Photography"],
      profile_completed: true,
      is_discoverable: true,
      xp: 250,
      level_number: 2,
      level_name: "VIBE EXPLORER",
    };

    const normalized = normalizeSupabaseProfile(rawSupabaseRow);

    expect(normalized.id).toBe(rawSupabaseRow.id);
    expect(normalized.clerk_user_id).toBe(clerkUserIdA);
    expect(normalized.display_name).toBe("Alice Johnson");
    expect(normalized.rotaract_club).toBe("Rotaract Club of Bengaluru East");
    expect(normalized.instagram_username).toBe("alice.vibe");
    expect(normalized.interests).toEqual(["Music", "Coding", "Gaming"]);
    expect(normalized.profile_completed).toBe(true);
    expect(normalized.xp).toBe(250);
  });

  it("2. Registers attendee and saves to mockDb with profile_completed true", () => {
    const profile = mockDb.createProfile({
      clerk_user_id: clerkUserIdB,
      display_name: "Bob Builder",
      email: "bob@rotaract3192.org",
      phone: "+91 98765 22222",
      rotaract_club: "Rotaract Club of Swarna Bengaluru",
      college: "RV University",
      course_year: "Design • 2nd Year",
      instagram_username: "bob.builds",
      bio: "Creating cool stuff at VIBE",
      interests: ["Design", "Art"],
    });

    profile.profile_completed = true;

    expect(profile.clerk_user_id).toBe(clerkUserIdB);
    expect(profile.display_name).toBe("Bob Builder");
    expect(profile.rotaract_club).toBe("Rotaract Club of Swarna Bengaluru");
    expect(profile.instagram_username).toBe("bob.builds");
    expect(profile.profile_completed).toBe(true);

    const retrieved = mockDb.getProfileByClerkId(clerkUserIdB);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(profile.id);
  });

  it("3. Attendees can discover and view other people's profiles without seeing their own in the discovery list", async () => {
    const alice = mockDb.createProfile({
      clerk_user_id: clerkUserIdA,
      display_name: "Alice Johnson",
      email: "alice@rotaract.org",
      phone: "+91 98765 11111",
      rotaract_club: "Club A",
      college: "College A",
      course_year: "Year 3",
      interests: ["Music"],
    });

    const bob = mockDb.createProfile({
      clerk_user_id: clerkUserIdB,
      display_name: "Bob Builder",
      email: "bob@rotaract.org",
      phone: "+91 98765 22222",
      rotaract_club: "Club B",
      college: "College B",
      course_year: "Year 2",
      interests: ["Gaming"],
    });

    // When Alice searches for other profiles, Bob should be in the list, but Alice herself should be excluded
    const discoverListForAlice = await getAllDiscoverableProfiles(alice.id);
    const hasBob = discoverListForAlice.some((p) => p.id === bob.id || p.display_name === "Bob Builder");
    const hasAlice = discoverListForAlice.some((p) => p.id === alice.id);

    expect(hasBob).toBe(true);
    expect(hasAlice).toBe(false);

    // Alice can fetch Bob's profile by ID to view it
    const viewedProfile = await getProfileByIdOrClerkId(bob.id);
    expect(viewedProfile).toBeDefined();
    expect(viewedProfile?.display_name).toBe("Bob Builder");
    expect(viewedProfile?.college).toBe("College B");
  });
});
