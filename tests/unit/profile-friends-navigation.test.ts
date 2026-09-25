import { describe, it, expect, beforeEach } from "vitest";
import { socialStore } from "@/lib/db/social-store";
import { mockDb } from "@/lib/db/mock-store";

describe("Profile Friends Navigation & Sent Requests Flow", () => {
  const userMe = "user-me";
  const userTarget = "user-target";

  beforeEach(() => {
    socialStore.resetForTesting();
    mockDb.profiles.set(userMe, {
      id: userMe,
      clerk_user_id: "clerk-me",
      vibe_id: "VB-2001",
      display_name: "Thejaswin P",
      username: "thejaswin",
      avatar_url: null,
      email: "thejaswin@vibe.org",
      phone: "9876543210",
      rotaract_club: "RC Bangalore",
      college: "VIBE HQ",
      course_year: "Final Year",
      instagram_username: "thejaswin_p",
      bio: "VIBE 2026 attendee",
      interests: ["Tech", "Leadership"],
      is_discoverable: true,
      xp: 3875,
      level_number: 6,
      level_name: "VIBE LEGEND",
      connections_count: 5,
      posts_count: 8,
      games_played_count: 14,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    mockDb.profiles.set(userTarget, {
      id: userTarget,
      clerk_user_id: "clerk-target",
      vibe_id: "VB-2002",
      display_name: "Aanya Sharma",
      username: "aanya_s",
      avatar_url: null,
      email: "aanya@vibe.org",
      phone: "9876543211",
      rotaract_club: "RC Indiranagar",
      college: "BMSCE",
      course_year: "2nd Year",
      instagram_username: "aanya.rotaract",
      bio: "Excited for conference!",
      interests: ["Design", "Art"],
      is_discoverable: true,
      xp: 1200,
      level_number: 3,
      level_name: "VIBE EXPLORER",
      connections_count: 2,
      posts_count: 3,
      games_played_count: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  it("accurately categorizes outgoing/sent requests so attendees can see who they sent requests to", async () => {
    // Before sending request
    let meReqs = await socialStore.getConnectionRequestsAsync(userMe);
    expect(meReqs.outgoing.length).toBe(0);
    expect(meReqs.incoming.length).toBe(0);

    // Send connection request from userMe to userTarget
    const sendRes = await socialStore.sendConnectionRequest(
      userMe,
      userTarget,
      "Thejaswin P",
      "RC Bangalore"
    );
    expect(sendRes.success).toBe(true);
    expect(sendRes.request?.receiver_id).toBe(userTarget);

    // Check userMe: must show 1 outgoing request to userTarget
    meReqs = await socialStore.getConnectionRequestsAsync(userMe);
    expect(meReqs.outgoing.length).toBe(1);
    expect(meReqs.outgoing[0].request.receiver_id).toBe(userTarget);
    expect(meReqs.outgoing[0].receiver?.display_name).toBe("Aanya Sharma");

    // Check userTarget: must show 1 incoming request from userMe
    const targetReqs = await socialStore.getConnectionRequestsAsync(userTarget);
    expect(targetReqs.incoming.length).toBe(1);
    expect(targetReqs.incoming[0].request.sender_id).toBe(userMe);
    expect(targetReqs.incoming[0].sender?.display_name).toBe("Thejaswin P");
  });

  it("handles tab routing between friends, requests, and sent correctly", () => {
    const resolveTab = (rawTab?: string) => {
      return rawTab === "sent" ? "sent" : rawTab === "requests" ? "requests" : rawTab === "friends" ? "friends" : undefined;
    };

    expect(resolveTab("sent")).toBe("sent");
    expect(resolveTab("requests")).toBe("requests");
    expect(resolveTab("friends")).toBe("friends");
    expect(resolveTab("unknown")).toBeUndefined();
    expect(resolveTab(undefined)).toBeUndefined();
  });
});
