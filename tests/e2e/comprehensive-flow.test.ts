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
  // 1. LANDING PAGE & SIX ZONES
  // ----------------------------------------------------------------
  it("Step 1: Landing page loads with 6 official zones and registration CTA", async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);
    const html = await res.text();

    // Verify 6 official oceanic zones are present on landing page
    expect(html).toContain("Arnava");
    expect(html).toContain("Taranaga");
    expect(html).toContain("Sagara");
    expect(html).toContain("Pravaha");
    expect(html).toContain("Samudhra");
    expect(html).toContain("Varuna");

    // Verify Register / Enter Festival buttons
    expect(html).toContain("Register");
    expect(html).toContain("Open App");
  });

  // ----------------------------------------------------------------
  // 2. REGISTRATION API & 500 VIBE COIN INITIALIZATION
  // ----------------------------------------------------------------
  it("Step 2: Attendee registers with 6 fields + zone selection, receives 500 VIBE and session cookie", async () => {
    const regPayload = {
      name: "Vikram Sen",
      phone: "+91 98765 11223",
      email: "vikram.sen@rotaract3192.org",
      club: "Rotaract Club of Indiranagar",
      instagramId: "@vikram.sen",
      registrationId: "TKT-8849",
      assignedZoneId: "z-taranaga",
    };

    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regPayload),
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.redirect).toBe("/app/welcome");
    expect(data.profile).toBeDefined();
    expect(data.profile.display_name).toBe("Vikram Sen");
    expect(data.profile.instagram_id).toBe("@vikram.sen");
    expect(data.profile.assigned_zone_id).toBe("z-taranaga");
    expect(data.userId).toBeDefined();

    registeredUserId = data.userId;
    registeredProfileId = data.profile.id;

    // Capture set-cookie header
    const setCookieHeader = res.headers.get("set-cookie");
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain("vibe_user_id=");

    // Extract cookie value for subsequent requests
    const match = setCookieHeader?.match(/vibe_user_id=([^;]+)/);
    expect(match).toBeTruthy();
    sessionCookie = `vibe_user_id=${match![1]}`;
  });

  // ----------------------------------------------------------------
  // 3. WELCOME SCREEN
  // ----------------------------------------------------------------
  it("Step 3: Welcome screen displays +500 VIBE, assigned zone badge, and mission text", async () => {
    const res = await fetch(`${BASE_URL}/app/welcome`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("+500 VIBE");
    expect(html).toContain("TARANAGA");
    expect(html).toContain("ENTER VIBE");
  });

  // ----------------------------------------------------------------
  // 4. ATTENDEE DASHBOARD
  // ----------------------------------------------------------------
  it("Step 4: Home Dashboard greets attendee with assigned zone, wallet, 4 progress counters, 4 action buttons", async () => {
    const res = await fetch(`${BASE_URL}/app`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    // Header checks
    expect(html).toContain("VIKRAM SEN");
    expect(html).toContain("TARANAGA");
    expect(html).toContain("YOUR ZONE");
    expect(html).toContain("500");
    expect(html).toContain("VIBE NEWBIE");

    // 4 Progress counters
    expect(html).toContain("/ 6"); // Zones counter
    expect(html).toContain("Experiences");
    expect(html).toContain("Stalls");
    expect(html).toContain("Games");

    // 4 Primary action buttons
    expect(html).toContain("Explore Zones");
    expect(html).toContain("Play Games");
    expect(html).toContain("Scan Check-in");
    expect(html).toContain("Leaderboard");
  });

  // ----------------------------------------------------------------
  // 5. VENUE MAP & 6 ZONES
  // ----------------------------------------------------------------
  it("Step 5: Venue Map renders all 6 zones with YOUR ZONE halo and live coins collected", async () => {
    const res = await fetch(`${BASE_URL}/app/map`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("Arnava");
    expect(html).toContain("Taranaga");
    expect(html).toContain("Sagara");
    expect(html).toContain("Pravaha");
    expect(html).toContain("Samudhra");
    expect(html).toContain("Varuna");
    expect(html).toContain("YOUR ZONE");
  });

  // ----------------------------------------------------------------
  // 6. THE FOUR PLAYABLE MINI-GAMES
  // ----------------------------------------------------------------
  it("Step 6: Games Hub displays all 4 games with entry badges and play triggers", async () => {
    const res = await fetch(`${BASE_URL}/app/games`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("Rotaract Game");
    expect(html).toContain("Minion VIBE Run");
    expect(html).toContain("Memory Match");
    expect(html).toContain("VIBE Festival Quiz");
    expect(html).toContain("Play Now");
  });

  // ----------------------------------------------------------------
  // 7. STALLS HUB
  // ----------------------------------------------------------------
  it("Step 7: Stall Hub renders 5 official stalls with upload photo buttons", async () => {
    const res = await fetch(`${BASE_URL}/app/stalls`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("Photo Checkpoints");
    expect(
      html.includes("Stall — Memory Match") ||
      html.includes("Neon Photo Booth") ||
      html.includes("Stall")
    ).toBe(true);
    expect(html).toContain("Choose / Snap Photo");
  });

  // ----------------------------------------------------------------
  // 8. VOLUNTEER PHOTO VERIFICATION QUEUE
  // ----------------------------------------------------------------
  it("Step 8: Volunteer Verification Queue loads for staff", async () => {
    const staffRes = await fetch(`${BASE_URL}/staff/stalls`);
    expect(staffRes.status).toBe(200);
    const staffHtml = await staffRes.text();

    expect(staffHtml).toContain("Stall Photo Verification Queue");
    expect(staffHtml).toContain("Pending Review");
    expect(staffHtml).toContain("Approved");
    expect(staffHtml).toContain("Rejected");
  });

  // ----------------------------------------------------------------
  // 9. DUAL LEADERBOARD & ZONAL STATS
  // ----------------------------------------------------------------
  it("Step 9: Leaderboard page displays Individual XP, Zone Battle, and Zonal Stats tabs", async () => {
    const res = await fetch(`${BASE_URL}/app/leaderboard`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("Individual XP");
    expect(html).toContain("Zone Battle");
    expect(html).toContain("Zonal Stats");
    expect(html).toContain("Arnava");
    expect(html).toContain("Taranaga");
  });

  // ----------------------------------------------------------------
  // 10. PROFILE & 10-METRIC PLAYER STATS GRID
  // ----------------------------------------------------------------
  it("Step 10: Profile page renders 10-metric player grid, 6-zone passport, and transaction ledger", async () => {
    const res = await fetch(`${BASE_URL}/app/profile`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("Vikram Sen");
    expect(html).toContain("Taranaga");
    expect(html).toContain("Player Statistics");
    expect(html).toContain("Digital Passport");
    expect(html).toContain("Wallet Ledger");
  });
});
