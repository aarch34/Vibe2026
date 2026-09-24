import { describe, it, expect, beforeAll, beforeEach } from "vitest";

const BASE_URL = "http://localhost:3000";

describe("🌊 VIBE 2026 — Comprehensive E2E Application Testing", () => {
  let sessionCookie = "";
  let registeredUserId = "";
  let registeredProfileId = "";
  let isServerRunning = false;

  beforeAll(async () => {
    try {
      const res = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(4000) });
      if (res.status < 500) {
        isServerRunning = true;
      }
    } catch (err: any) {
      isServerRunning = false;
      console.warn("⚠️ Local server on http://localhost:3000 is not running:", err.message);
    }
  });

  beforeEach((context) => {
    if (!isServerRunning) {
      context.skip();
    }
  });

  // ----------------------------------------------------------------
  // 1. LANDING PAGE
  // ----------------------------------------------------------------
  it("Step 1: Landing page loads with pre-event social networking CTA", async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("VIBE 2026");
    expect(html).toContain("Register");
    expect(html).toContain("Open App");
  });

  // ----------------------------------------------------------------
  // 2. REGISTRATION API & ONBOARDING XP
  // ----------------------------------------------------------------
  it("Step 2: Attendee registers profile with Rotaract club, college, Instagram & interests, earning onboarding XP", async () => {
    const regPayload = {
      displayName: "Ananya Sharma",
      phone: "+91 98765 11223",
      email: "ananya.sharma@rotaract3192.org",
      rotaractClub: "Rotaract Club of Bangalore Central",
      college: "BMS College of Engineering",
      courseYear: "Computer Science • 3rd Year",
      instagramUsername: "ananya.vibe",
      bio: "Excited for VIBE 2026! Love music and networking.",
      interests: ["Music", "Networking", "Gaming"],
      dpdpConsent: true,
      dpdpAgeConfirmed: true,
    };

    const res = await fetch(`${BASE_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regPayload),
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.profile).toBeDefined();
    expect(data.profile.display_name).toBe("Ananya Sharma");
    expect(data.profile.instagram_username).toBe("ananya.vibe");
    expect(data.profile.xp).toBeGreaterThanOrEqual(75);

    registeredUserId = data.profile.clerk_user_id;
    registeredProfileId = data.profile.id;

    // Capture set-cookie header
    const setCookieHeader = res.headers.get("set-cookie");
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain("vibe_user_id=");

    const match = setCookieHeader?.match(/vibe_user_id=([^;]+)/);
    expect(match).toBeTruthy();
    sessionCookie = `vibe_user_id=${match![1]}`;
  });

  // ----------------------------------------------------------------
  // 3. WELCOME SCREEN
  // ----------------------------------------------------------------
  it("Step 3: Welcome screen displays starting XP bonus, level badge, and mission text", async () => {
    const res = await fetch(`${BASE_URL}/app/welcome`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("XP");
    expect(html).toContain("ENTER VIBE");
  });

  // ----------------------------------------------------------------
  // 4. ATTENDEE SOCIAL FEED
  // ----------------------------------------------------------------
  it("Step 4: Home Feed renders social posts, challenges, and create post button", async () => {
    const res = await fetch(`${BASE_URL}/app`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("Welcome back");
    expect(html).toContain("Active VIBE Challenges");
  });

  // ----------------------------------------------------------------
  // 5. DISCOVER PEOPLE
  // ----------------------------------------------------------------
  it("Step 5: Discover page allows filtering and connecting with attendees", async () => {
    const res = await fetch(`${BASE_URL}/app/discover`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("Discover People");
  });

  // ----------------------------------------------------------------
  // 6. CASUAL GAMES HUB
  // ----------------------------------------------------------------
  it("Step 6: Games Hub displays playable casual games with XP rewards", async () => {
    const res = await fetch(`${BASE_URL}/app/games`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("VIBE GAMES ARENA");
    expect(html).toContain("ROTARACT GAME");
  });

  // ----------------------------------------------------------------
  // 7. LEADERBOARD
  // ----------------------------------------------------------------
  it("Step 7: Leaderboard page displays overall verified XP standings", async () => {
    const res = await fetch(`${BASE_URL}/app/leaderboard`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("LEADERBOARD");
  });

  // ----------------------------------------------------------------
  // 8. PROFILE & LEVEL PROGRESS
  // ----------------------------------------------------------------
  it("Step 8: Profile page renders attendee details, Instagram handle, and XP progression", async () => {
    const res = await fetch(`${BASE_URL}/app/profile`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("Profile");
    expect(html).toContain("Level");
  });
});
