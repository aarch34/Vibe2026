// In-Memory Database Store providing exact atomic stored procedure semantics
// Used when local Supabase credentials are placeholder tokens, ensuring zero-configuration local dev & tests.
// Aligned with the 43-point VIBE Complete Game Economy specification.

import {
  Event,
  Profile,
  EventMember,
  Zone,
  Experience,
  QRCodeRecord,
  Wallet,
  WalletTransaction,
  Level,
  ExperienceCompletion,
  Quest,
  QuestProgress,
  Achievement,
  UserAchievement,
  Reward,
  RewardRedemption,
  Sponsor,
  AuditLog,
} from "@/types/database";

export interface LeaderboardEntry {
  rank: number;
  profile_id: string;
  vibe_id: string;
  display_name: string;
  college: string;
  club: string;
  xp: number;
  coins: number;
  level: string;
  level_number: number;
  zones_visited_count: number;
  experiences_completed_count: number;
  created_at: string;
}

class VibeMemoryDatabase {
  events: Map<string, Event> = new Map();
  profiles: Map<string, Profile> = new Map();
  eventMembers: Map<string, EventMember> = new Map();
  zones: Map<string, Zone> = new Map();
  experiences: Map<string, Experience> = new Map();
  qrCodes: Map<string, QRCodeRecord> = new Map();
  wallets: Map<string, Wallet> = new Map(); // key: `${event_id}:${profile_id}`
  walletTransactions: WalletTransaction[] = [];
  levels: Level[] = [];
  completions: ExperienceCompletion[] = [];
  quests: Quest[] = [];
  questProgress: Map<string, QuestProgress> = new Map(); // key: `${profile_id}:${quest_id}`
  achievements: Achievement[] = [];
  userAchievements: UserAchievement[] = [];
  rewards: Map<string, Reward> = new Map();
  rewardRedemptions: RewardRedemption[] = [];
  sponsors: Map<string, Sponsor> = new Map();
  auditLogs: AuditLog[] = [];
  passportStamps: Map<string, Set<string>> = new Map(); // key: profileId -> Set of zoneIds
  isEventFrozen: boolean = false;

  constructor() {
    this.seed();
  }

  seed() {
    // 1. Event
    const eventId = "a0000000-0000-0000-0000-000000000001";
    this.events.set(eventId, {
      id: eventId,
      slug: "vibe-2026",
      name: "VIBE 2026 — Rotaract District 3192 Freshers Party",
      description: "The flagship gamified fresher party experience. Explore zones, scan QR codes, unlock experiences, earn coins, and compete on the district leaderboard!",
      status: "live",
      starts_at: new Date(Date.now() - 3600000).toISOString(),
      ends_at: new Date(Date.now() + 86400000).toISOString(),
      timezone: "Asia/Kolkata",
      starting_coins: 500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 2. 6-Tier Level Progression
    this.levels = [
      { id: "lvl-1", event_id: eventId, name: "🌱 VIBE Newbie", min_xp: 0, max_xp: 249, badge_media_id: null, sort_order: 1 },
      { id: "lvl-2", event_id: eventId, name: "✨ VIBE Explorer", min_xp: 250, max_xp: 599, badge_media_id: null, sort_order: 2 },
      { id: "lvl-3", event_id: eventId, name: "🔥 VIBE Seeker", min_xp: 600, max_xp: 999, badge_media_id: null, sort_order: 3 },
      { id: "lvl-4", event_id: eventId, name: "⚡ VIBE Rider", min_xp: 1000, max_xp: 1499, badge_media_id: null, sort_order: 4 },
      { id: "lvl-5", event_id: eventId, name: "💫 VIBE Addict", min_xp: 1500, max_xp: 2499, badge_media_id: null, sort_order: 5 },
      { id: "lvl-6", event_id: eventId, name: "👑 VIBE Legend", min_xp: 2500, max_xp: null, badge_media_id: null, sort_order: 6 },
    ];

    // 3. Sponsors
    const sponsorsList: Sponsor[] = [
      { id: "sp-1", event_id: eventId, name: "Red Bull", logo_media_id: null, description: "Gives you wings for high energy party zones!", is_active: true, created_at: new Date().toISOString() },
      { id: "sp-2", event_id: eventId, name: "Spotify India", logo_media_id: null, description: "Official Sound & DJ Experience Partner", is_active: true, created_at: new Date().toISOString() },
      { id: "sp-3", event_id: eventId, name: "OnePlus", logo_media_id: null, description: "Never Settle Experience Hub", is_active: true, created_at: new Date().toISOString() },
    ];
    sponsorsList.forEach((s) => this.sponsors.set(s.id, s));

    // 4. 7 Event Zones
    const zonesList: Zone[] = [
      { id: "z-arcade", event_id: eventId, name: "Cyber Arcade", slug: "zone-arcade", description: "Futuristic gaming rigs, retro arcade consoles and VR simulations.", image_media_id: null, sort_order: 1, is_active: true, map_data: { x: 120, y: 90, color: "#3B82F6", icon: "Gamepad2" } },
      { id: "z-arena", event_id: eventId, name: "Neon Arena", slug: "zone-arena", description: "Fast-paced laser tag, glow team challenges and tactical arenas.", image_media_id: null, sort_order: 2, is_active: true, map_data: { x: 280, y: 90, color: "#8B5CF6", icon: "Zap" } },
      { id: "z-stage", event_id: eventId, name: "Pulse Stage", slug: "zone-stage", description: "The main festival beat, live DJ battles, EDM beats and dance face-offs.", image_media_id: null, sort_order: 3, is_active: true, map_data: { x: 200, y: 180, color: "#EC4899", icon: "Music" } },
      { id: "z-lounge", event_id: eventId, name: "Chillout Lounge", slug: "zone-lounge", description: "Acoustic corners, mocktails, hammocks and social bonding spots.", image_media_id: null, sort_order: 4, is_active: true, map_data: { x: 90, y: 250, color: "#10B981", icon: "Coffee" } },
      { id: "z-creator", event_id: eventId, name: "Creator Studio", slug: "zone-creator", description: "360 glam cam, neon photo rigs, content capture and reels zone.", image_media_id: null, sort_order: 5, is_active: true, map_data: { x: 310, y: 250, color: "#06B6D4", icon: "Camera" } },
      { id: "z-bazaar", event_id: eventId, name: "Food Bazaar", slug: "zone-bazaar", description: "Gourmet sliders, nitro ice creams, boba teas and foodie quests.", image_media_id: null, sort_order: 6, is_active: true, map_data: { x: 130, y: 330, color: "#F59E0B", icon: "Utensils" } },
      { id: "z-vault", event_id: eventId, name: "Secret Vault", slug: "zone-vault", description: "The hidden puzzle vault. Crack the riddles to claim legendary XP.", image_media_id: null, sort_order: 7, is_active: true, map_data: { x: 270, y: 330, color: "#E11D48", icon: "Lock" } },
    ];
    zonesList.forEach((z) => this.zones.set(z.id, z));

    // 5. Experiences (5 Pricing Tiers: 25, 50, 75, 100, 150)
    const experiencesList: Experience[] = [
      // Quick Interaction: 25 Coins, +40 XP
      { id: "exp-4", event_id: eventId, zone_id: "z-lounge", sponsor_id: null, title: "Chillout Quick Sip Check-in", slug: "exp-mocktail-lab", description: "Craft your signature fresher mocktail with our mixologists.", image_media_id: null, video_media_id: null, coin_cost: 25, xp_reward: 40, coin_reward: 10, max_attempts: 1, cooldown_seconds: 0, starts_at: null, ends_at: null, is_active: true },
      // Easy Challenge: 50 Coins, +75 XP
      { id: "exp-6", event_id: eventId, zone_id: "z-bazaar", sponsor_id: null, title: "Spicy Taco Blitz Challenge", slug: "exp-taco-blitz", description: "Taste-test the mystery spicy taco challenge and earn foodie prestige.", image_media_id: null, video_media_id: null, coin_cost: 50, xp_reward: 75, coin_reward: 20, max_attempts: 1, cooldown_seconds: 0, starts_at: null, ends_at: null, is_active: true },
      // Standard Challenge: 75 Coins, +125 XP
      { id: "exp-3", event_id: eventId, zone_id: "z-stage", sponsor_id: "sp-2", title: "DJ Drop Dance Face-off", slug: "exp-dj-drop", description: "Step onto the interactive sound-floor and dance with the live DJ mix.", image_media_id: null, video_media_id: null, coin_cost: 75, xp_reward: 125, coin_reward: 25, max_attempts: 2, cooldown_seconds: 600, starts_at: null, ends_at: null, is_active: true },
      { id: "exp-5", event_id: eventId, zone_id: "z-creator", sponsor_id: "sp-3", title: "360 Glow Reel Booth", slug: "exp-360-reels", description: "Step into the rotating 360 camera platform with neon light trails.", image_media_id: null, video_media_id: null, coin_cost: 75, xp_reward: 125, coin_reward: 25, max_attempts: 2, cooldown_seconds: 600, starts_at: null, ends_at: null, is_active: true },
      // Major Experience: 100 Coins, +175 XP
      { id: "exp-1", event_id: eventId, zone_id: "z-arcade", sponsor_id: "sp-3", title: "VR Cyber Flight Simulator", slug: "exp-vr-flight", description: "Take the cockpit in a supersonic VR race through neo-Bangalore!", image_media_id: null, video_media_id: null, coin_cost: 100, xp_reward: 175, coin_reward: 35, max_attempts: 2, cooldown_seconds: 300, starts_at: null, ends_at: null, is_active: true },
      // Premium Experience: 150 Coins, +250 XP
      { id: "exp-2", event_id: eventId, zone_id: "z-arena", sponsor_id: "sp-1", title: "Neon Laser Tag Showdown", slug: "exp-laser-tag", description: "Tactical 3v3 neon combat. Tag your rivals and capture the arena node.", image_media_id: null, video_media_id: null, coin_cost: 150, xp_reward: 250, coin_reward: 50, max_attempts: 1, cooldown_seconds: 0, starts_at: null, ends_at: null, is_active: true },
      // Mystery / Secret Vault: 100 Coins, +500 XP
      { id: "exp-7", event_id: eventId, zone_id: "z-vault", sponsor_id: null, title: "Cipher of District 3192", slug: "exp-vault-cipher", description: "Solve the 3-part cipher concealed inside the secret vault.", image_media_id: null, video_media_id: null, coin_cost: 100, xp_reward: 500, coin_reward: 100, max_attempts: 1, cooldown_seconds: 0, starts_at: null, ends_at: null, is_active: true },
    ];
    experiencesList.forEach((e) => this.experiences.set(e.id, e));

    // 6. QR Codes
    const qrList: QRCodeRecord[] = [
      { id: "qr-1", event_id: eventId, experience_id: "exp-1", code: "vibe-arcade-vr-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-2", event_id: eventId, experience_id: "exp-2", code: "vibe-arena-laser-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-3", event_id: eventId, experience_id: "exp-3", code: "vibe-stage-dj-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-4", event_id: eventId, experience_id: "exp-4", code: "vibe-lounge-mocktail-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-5", event_id: eventId, experience_id: "exp-5", code: "vibe-creator-360-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-6", event_id: eventId, experience_id: "exp-6", code: "vibe-bazaar-taco-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-7", event_id: eventId, experience_id: "exp-7", code: "vibe-vault-cipher-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
    ];
    qrList.forEach((q) => this.qrCodes.set(q.code, q));

    // 7. Quests (Aligned with Game Economy specs)
    this.quests = [
      { id: "q-1", event_id: eventId, title: "The Explorer", description: "Visit 3 different event zones.", condition_type: "zones_visited", condition_config: { target: 3 }, xp_reward: 200, coin_reward: 150, starts_at: null, ends_at: null, is_active: true },
      { id: "q-2", event_id: eventId, title: "Social Butterfly", description: "Complete experiences at 5 different stalls across the venue.", condition_type: "experiences_completed", condition_config: { target: 5 }, xp_reward: 250, coin_reward: 200, starts_at: null, ends_at: null, is_active: true },
      { id: "q-3", event_id: eventId, title: "Challenge Accepted", description: "Complete 5 event challenges.", condition_type: "experiences_completed", condition_config: { target: 5 }, xp_reward: 300, coin_reward: 150, starts_at: null, ends_at: null, is_active: true },
      { id: "q-4", event_id: eventId, title: "VIBE Master (Grand Tour)", description: "Visit and conquer all 7 venue zones.", condition_type: "all_zones_completed", condition_config: { target: 7 }, xp_reward: 500, coin_reward: 500, starts_at: null, ends_at: null, is_active: true },
    ];

    // 8. Achievements
    this.achievements = [
      { id: "ach-1", event_id: eventId, name: "Explorer", description: "Visit your first 3 venue zones.", condition_type: "zones_visited", condition_config: { target: 3 }, badge_media_id: null, is_active: true },
      { id: "ach-2", event_id: eventId, name: "VIBE Explorer (Grand Tour)", description: "Unlock all 7 zones in your digital Passport.", condition_type: "all_zones_completed", condition_config: { target: 7 }, badge_media_id: null, is_active: true },
      { id: "ach-3", event_id: eventId, name: "Challenger", description: "Complete 5 event experiences successfully.", condition_type: "experiences_completed", condition_config: { target: 5 }, badge_media_id: null, is_active: true },
      { id: "ach-4", event_id: eventId, name: "VIBE Legend", description: "Ascend to Level 6: 👑 VIBE Legend status.", condition_type: "reach_level", condition_config: { level: 6 }, badge_media_id: null, is_active: true },
      { id: "ach-5", event_id: eventId, name: "Secret Cipher Cracker", description: "Conquer the Cipher of District 3192.", condition_type: "specific_experience", condition_config: { experience_id: "exp-7" }, badge_media_id: null, is_active: true },
    ];

    // 9. Rewards (Tiers: 100, 150, 250, 300, 500, 750)
    const rewardsList: Reward[] = [
      { id: "rwd-1", event_id: eventId, sponsor_id: null, name: "Official VIBE Sticker Pack", description: "High-gloss holographic vinyl sticker pack for laptop & phone.", image_media_id: null, coin_cost: 100, stock: 200, redemption_limit: 1, starts_at: null, ends_at: null, is_active: true },
      { id: "rwd-2", event_id: eventId, sponsor_id: null, name: "Commemorative District 3192 Enamel Pin", description: "Exclusive metal collector badge with rotaract freshers insignia.", image_media_id: null, coin_cost: 150, stock: 150, redemption_limit: 1, starts_at: null, ends_at: null, is_active: true },
      { id: "rwd-3", event_id: eventId, sponsor_id: "sp-1", name: "Red Bull VIP Food & Drink Coupon", description: "20% discount coupon redeemable across all festival food bazaar counters.", image_media_id: null, coin_cost: 250, stock: 100, redemption_limit: 2, starts_at: null, ends_at: null, is_active: true },
      { id: "rwd-4", event_id: eventId, sponsor_id: "sp-2", name: "Mystery Festival Gift Box", description: "Curated box containing headphones, wristbands and surprise swag.", image_media_id: null, coin_cost: 300, stock: 50, redemption_limit: 1, starts_at: null, ends_at: null, is_active: true },
      { id: "rwd-5", event_id: eventId, sponsor_id: null, name: "Limited-Edition VIBE T-Shirt", description: "Official festival streetwear heavyweight tee with neon screenprint.", image_media_id: null, coin_cost: 500, stock: 30, redemption_limit: 1, starts_at: null, ends_at: null, is_active: true },
      { id: "rwd-6", event_id: eventId, sponsor_id: "sp-3", name: "VIP All-Access & After-Party Pass", description: "Backstage artist lounge access + premium after-party entry.", image_media_id: null, coin_cost: 750, stock: 10, redemption_limit: 1, starts_at: null, ends_at: null, is_active: true },
    ];
    rewardsList.forEach((r) => this.rewards.set(r.id, r));

    // 10. Sample Seed Users for Leaderboard Realism (incorporating tie-breaking fields)
    this.createAttendeeProfile("usr-demo-1", "Aarav Sharma", "VIBE-1001", "BMS College of Engineering", "Rotaract Club of BMSCE", 2850, 6, 7);
    this.createAttendeeProfile("usr-demo-2", "Ananya Rao", "VIBE-1002", "PES University", "Rotaract Club of PESU", 3420, 7, 9);
    this.createAttendeeProfile("usr-demo-3", "Rohan Iyer", "VIBE-1003", "RVCE Bangalore", "Rotaract Club of RVCE", 1950, 4, 5);
    this.createAttendeeProfile("usr-demo-4", "Sneha Nair", "VIBE-1004", "Christ University", "Rotaract Club of Christ", 1400, 3, 4);
  }

  createAttendeeProfile(
    clerkId: string,
    name: string,
    vibeId: string,
    college: string,
    club: string,
    initialXP = 0,
    zonesCount = 0,
    completionsCount = 0
  ): Profile {
    const profileId = `prof-${clerkId}`;
    const profile: Profile = {
      id: profileId,
      clerk_user_id: clerkId,
      vibe_id: vibeId,
      display_name: name,
      avatar_media_id: null,
      college,
      club,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(profileId, profile);

    const eventId = "a0000000-0000-0000-0000-000000000001";
    this.eventMembers.set(`${eventId}:${profileId}`, {
      id: `em-${profileId}`,
      event_id: eventId,
      profile_id: profileId,
      role: "attendee",
      status: "active",
      joined_at: new Date().toISOString(),
    });

    // Initialize wallet with 500 starting coins
    const walletKey = `${eventId}:${profileId}`;
    this.wallets.set(walletKey, {
      id: `wal-${profileId}`,
      event_id: eventId,
      profile_id: profileId,
      balance: 500,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.walletTransactions.push({
      id: `tx-init-${profileId}`,
      wallet_id: `wal-${profileId}`,
      event_id: eventId,
      profile_id: profileId,
      type: "initial_credit",
      amount: 500,
      balance_before: 0,
      balance_after: 500,
      source_type: "event_signup",
      source_id: null,
      idempotency_key: `init_${profileId}`,
      metadata: { initial_coins: 500 },
      created_at: new Date().toISOString(),
    });

    // Seed sample passport stamps
    const zoneKeys = Array.from(this.zones.keys());
    const stamps = new Set<string>();
    for (let i = 0; i < Math.min(zonesCount, zoneKeys.length); i++) {
      stamps.add(zoneKeys[i]);
    }
    this.passportStamps.set(profileId, stamps);

    // If initial XP given, register sample completions
    if (initialXP > 0) {
      for (let i = 0; i < Math.max(1, completionsCount); i++) {
        this.completions.push({
          id: `comp-init-${profileId}-${i}`,
          event_id: eventId,
          profile_id: profileId,
          experience_id: "exp-1",
          qr_code_id: "qr-1",
          attempt_number: i + 1,
          coin_spent: 50,
          xp_earned: Math.floor(initialXP / Math.max(1, completionsCount)),
          coin_earned: 20,
          completed_at: new Date(Date.now() - (completionsCount - i) * 60000).toISOString(),
          metadata: { title: "Seeded Experience" },
        });
      }
    }

    return profile;
  }

  // --- ATOMIC STORED PROCEDURE EMULATIONS ---

  creditInitialWallet(eventId: string, profileId: string, initialCoins = 500) {
    const key = `${eventId}:${profileId}`;
    let wallet = this.wallets.get(key);
    const hasInit = this.walletTransactions.some(
      (tx) => tx.event_id === eventId && tx.profile_id === profileId && tx.type === "initial_credit"
    );

    if (wallet && hasInit) {
      return { success: true, credited: false, balance: wallet.balance, message: "Initial wallet credit already applied" };
    }

    if (!wallet) {
      wallet = {
        id: `wal-${profileId}`,
        event_id: eventId,
        profile_id: profileId,
        balance: 0,
        version: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.wallets.set(key, wallet);
    }

    const balBefore = wallet.balance;
    wallet.balance += initialCoins;
    wallet.version += 1;
    wallet.updated_at = new Date().toISOString();

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      wallet_id: wallet.id,
      event_id: eventId,
      profile_id: profileId,
      type: "initial_credit",
      amount: initialCoins,
      balance_before: balBefore,
      balance_after: wallet.balance,
      source_type: "event_signup",
      source_id: null,
      idempotency_key: `init_${profileId}`,
      metadata: { initial_coins: initialCoins },
      created_at: new Date().toISOString(),
    };
    this.walletTransactions.unshift(tx);

    return { success: true, credited: true, balance: wallet.balance };
  }

  spendWalletAtomic(
    eventId: string,
    profileId: string,
    amount: number,
    sourceType: string,
    sourceId: string | null,
    idempotencyKey?: string | null,
    metadata?: Record<string, any>
  ) {
    if (this.isEventFrozen) {
      return { success: false, code: "EVENT_FROZEN", message: "VIBE has concluded. Experience unlocks and coin transactions are closed." };
    }

    if (amount < 0) {
      return { success: false, code: "INVALID_AMOUNT", message: "Spend amount must be positive" };
    }

    if (idempotencyKey) {
      const existing = this.walletTransactions.find(
        (tx) => tx.profile_id === profileId && tx.event_id === eventId && tx.idempotency_key === idempotencyKey
      );
      if (existing) {
        return {
          success: true,
          idempotent_replay: true,
          transaction_id: existing.id,
          balance_before: existing.balance_before,
          balance_after: existing.balance_after,
        };
      }
    }

    const key = `${eventId}:${profileId}`;
    const wallet = this.wallets.get(key);
    if (!wallet) {
      return { success: false, code: "WALLET_NOT_FOUND", message: "Wallet not found" };
    }

    if (wallet.balance < amount) {
      return {
        success: false,
        code: "INSUFFICIENT_COINS",
        message: "You do not have enough VIBE Coins",
        current_balance: wallet.balance,
        required_balance: amount,
      };
    }

    const balBefore = wallet.balance;
    wallet.balance -= amount;
    wallet.version += 1;
    wallet.updated_at = new Date().toISOString();

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      wallet_id: wallet.id,
      event_id: eventId,
      profile_id: profileId,
      type: "spend",
      amount,
      balance_before: balBefore,
      balance_after: wallet.balance,
      source_type: sourceType,
      source_id: sourceId,
      idempotency_key: idempotencyKey || null,
      metadata: metadata || null,
      created_at: new Date().toISOString(),
    };
    this.walletTransactions.unshift(tx);

    return {
      success: true,
      balance_before: balBefore,
      balance_after: wallet.balance,
      amount_spent: amount,
    };
  }

  // --- ZONE DISCOVERY (First Visit: +50 VIBE, +100 XP, Passport Stamp) ---
  discoverZone(eventId: string, profileId: string, zoneId: string) {
    if (this.isEventFrozen) {
      return { success: false, code: "EVENT_FROZEN", message: "VIBE has concluded." };
    }

    const zone = this.zones.get(zoneId);
    if (!zone || !zone.is_active) {
      return { success: false, code: "ZONE_NOT_FOUND", message: "Zone not found or inactive." };
    }

    let userStamps = this.passportStamps.get(profileId);
    if (!userStamps) {
      userStamps = new Set();
      this.passportStamps.set(profileId, userStamps);
    }

    if (userStamps.has(zoneId)) {
      return {
        success: true,
        alreadyDiscovered: true,
        zoneName: zone.name,
        message: `You have already stamped ${zone.name} in your Passport!`,
      };
    }

    // First-time visit: record stamp
    userStamps.add(zoneId);

    // Credit +50 VIBE Coins
    const walletKey = `${eventId}:${profileId}`;
    let wallet = this.wallets.get(walletKey);
    if (!wallet) {
      this.creditInitialWallet(eventId, profileId, 500);
      wallet = this.wallets.get(walletKey)!;
    }

    const balBefore = wallet.balance;
    const coinsEarned = 50;
    wallet.balance += coinsEarned;
    wallet.version += 1;
    wallet.updated_at = new Date().toISOString();

    this.walletTransactions.unshift({
      id: `tx-zd-${Date.now()}`,
      wallet_id: wallet.id,
      event_id: eventId,
      profile_id: profileId,
      type: "earn",
      amount: coinsEarned,
      balance_before: balBefore,
      balance_after: wallet.balance,
      source_type: "zone_discovery",
      source_id: zoneId,
      idempotency_key: `zd_${profileId}_${zoneId}`,
      metadata: { zone_name: zone.name, discovery_coins: coinsEarned },
      created_at: new Date().toISOString(),
    });

    // Record +100 XP in completions record for zone discovery
    const xpEarned = 100;
    this.completions.push({
      id: `comp-zd-${Date.now()}`,
      event_id: eventId,
      profile_id: profileId,
      experience_id: `zd-${zoneId}`,
      qr_code_id: null,
      attempt_number: 1,
      coin_spent: 0,
      xp_earned: xpEarned,
      coin_earned: coinsEarned,
      completed_at: new Date().toISOString(),
      metadata: { title: `${zone.name} Discovery`, zone_id: zoneId, type: "zone_discovery" },
    });

    // Evaluate Quests and Achievements
    const newAchievements = this.evaluateAchievementsForProfile(eventId, profileId);
    const updatedQuests = this.evaluateQuestsForProfile(eventId, profileId);

    return {
      success: true,
      newlyDiscovered: true,
      zoneName: zone.name,
      coinsEarned,
      xpEarned,
      newBalance: wallet.balance,
      totalZonesVisited: userStamps.size,
      newAchievements,
      updatedQuests,
      message: `🎉 ${zone.name} Discovered! +50 VIBE Coins, +100 XP earned!`,
    };
  }

  completeExperienceAtomic(
    eventId: string,
    profileId: string,
    experienceId: string,
    qrCodeId?: string | null,
    idempotencyKey?: string | null
  ) {
    if (this.isEventFrozen) {
      return { success: false, code: "EVENT_FROZEN", message: "VIBE has concluded. Leaderboard is locked." };
    }

    const exp = this.experiences.get(experienceId);
    if (!exp || !exp.is_active) {
      return { success: false, code: "EXPERIENCE_UNAVAILABLE", message: "Experience is unavailable or inactive" };
    }

    const now = Date.now();
    if (exp.starts_at && new Date(exp.starts_at).getTime() > now) {
      return { success: false, code: "EXPERIENCE_NOT_STARTED", message: "Experience has not started yet" };
    }
    if (exp.ends_at && new Date(exp.ends_at).getTime() < now) {
      return { success: false, code: "EXPERIENCE_ENDED", message: "Experience has ended" };
    }

    // Check attempts & cooldown
    const userComps = this.completions.filter(
      (c) => c.profile_id === profileId && c.experience_id === experienceId
    );
    if (userComps.length >= exp.max_attempts) {
      return { success: false, code: "MAX_ATTEMPTS_REACHED", message: "Maximum attempts reached for this experience" };
    }

    if (exp.cooldown_seconds > 0 && userComps.length > 0) {
      const last = Math.max(...userComps.map((c) => new Date(c.completed_at).getTime()));
      if (now < last + exp.cooldown_seconds * 1000) {
        return { success: false, code: "COOLDOWN_ACTIVE", message: "Experience is on cooldown. Please wait." };
      }
    }

    const key = `${eventId}:${profileId}`;
    const wallet = this.wallets.get(key);
    if (!wallet) {
      return { success: false, code: "WALLET_NOT_FOUND", message: "Wallet not found" };
    }

    if (exp.coin_cost > 0 && wallet.balance < exp.coin_cost) {
      return {
        success: false,
        code: "INSUFFICIENT_COINS",
        message: `You need ${exp.coin_cost} Coins to unlock this experience`,
        current_balance: wallet.balance,
        required_balance: exp.coin_cost,
      };
    }

    const balBefore = wallet.balance;
    const newBal = wallet.balance - exp.coin_cost + exp.coin_reward;
    wallet.balance = newBal;
    wallet.version += 1;
    wallet.updated_at = new Date().toISOString();

    const attemptNumber = userComps.length + 1;

    if (exp.coin_cost > 0) {
      this.walletTransactions.unshift({
        id: `tx-sp-${Date.now()}`,
        wallet_id: wallet.id,
        event_id: eventId,
        profile_id: profileId,
        type: "spend",
        amount: exp.coin_cost,
        balance_before: balBefore,
        balance_after: balBefore - exp.coin_cost,
        source_type: "experience_unlock",
        source_id: experienceId,
        idempotency_key: idempotencyKey || null,
        metadata: { title: exp.title, attempt: attemptNumber },
        created_at: new Date().toISOString(),
      });
    }

    if (exp.coin_reward > 0) {
      this.walletTransactions.unshift({
        id: `tx-earn-${Date.now()}`,
        wallet_id: wallet.id,
        event_id: eventId,
        profile_id: profileId,
        type: "earn",
        amount: exp.coin_reward,
        balance_before: balBefore - exp.coin_cost,
        balance_after: newBal,
        source_type: "experience_completion",
        source_id: experienceId,
        idempotency_key: null,
        metadata: { title: exp.title, attempt: attemptNumber },
        created_at: new Date().toISOString(),
      });
    }

    const completion: ExperienceCompletion = {
      id: `comp-${Date.now()}`,
      event_id: eventId,
      profile_id: profileId,
      experience_id: experienceId,
      qr_code_id: qrCodeId || null,
      attempt_number: attemptNumber,
      coin_spent: exp.coin_cost,
      xp_earned: exp.xp_reward,
      coin_earned: exp.coin_reward,
      completed_at: new Date().toISOString(),
      metadata: { experience_title: exp.title, zone_id: exp.zone_id },
    };
    this.completions.push(completion);

    // Also ensure zone is marked visited in passport
    let userStamps = this.passportStamps.get(profileId);
    if (!userStamps) {
      userStamps = new Set();
      this.passportStamps.set(profileId, userStamps);
    }
    userStamps.add(exp.zone_id);

    // Evaluate Quests & Achievements
    const newAchievements = this.evaluateAchievementsForProfile(eventId, profileId);
    const updatedQuests = this.evaluateQuestsForProfile(eventId, profileId);

    return {
      success: true,
      completion_id: completion.id,
      experience_id: exp.id,
      experience_title: exp.title,
      coin_spent: exp.coin_cost,
      coin_earned: exp.coin_reward,
      xp_earned: exp.xp_reward,
      balance_after: newBal,
      attempt_number: attemptNumber,
      new_achievements: newAchievements,
      updated_quests: updatedQuests,
    };
  }

  // --- MANUAL VERIFICATION FOR PHYSICAL CHALLENGES BY STAFF ---
  approvePhysicalChallenge(
    eventId: string,
    staffId: string,
    attendeeProfileId: string,
    experienceId: string
  ) {
    if (this.isEventFrozen) {
      return { success: false, code: "EVENT_FROZEN", message: "VIBE has concluded." };
    }

    const exp = this.experiences.get(experienceId);
    if (!exp || !exp.is_active) {
      return { success: false, code: "EXPERIENCE_UNAVAILABLE", message: "Experience is invalid" };
    }

    const profile = this.profiles.get(attendeeProfileId);
    if (!profile) {
      return { success: false, code: "PROFILE_NOT_FOUND", message: "Attendee profile not found" };
    }

    const walletKey = `${eventId}:${attendeeProfileId}`;
    const wallet = this.wallets.get(walletKey);
    if (!wallet) {
      return { success: false, code: "WALLET_NOT_FOUND", message: "Attendee wallet not found" };
    }

    // Award completion
    const completion: ExperienceCompletion = {
      id: `comp-manual-${Date.now()}`,
      event_id: eventId,
      profile_id: attendeeProfileId,
      experience_id: experienceId,
      qr_code_id: null,
      attempt_number: 1,
      coin_spent: 0,
      xp_earned: exp.xp_reward,
      coin_earned: exp.coin_reward,
      completed_at: new Date().toISOString(),
      metadata: {
        verified_by_staff_id: staffId,
        verification_type: "volunteer_manual_approval",
        experience_title: exp.title,
      },
    };
    this.completions.push(completion);

    if (exp.coin_reward > 0) {
      const balBefore = wallet.balance;
      wallet.balance += exp.coin_reward;
      wallet.version += 1;
      this.walletTransactions.unshift({
        id: `tx-staff-${Date.now()}`,
        wallet_id: wallet.id,
        event_id: eventId,
        profile_id: attendeeProfileId,
        type: "earn",
        amount: exp.coin_reward,
        balance_before: balBefore,
        balance_after: wallet.balance,
        source_type: "staff_approval",
        source_id: experienceId,
        idempotency_key: null,
        metadata: { staff_id: staffId, title: exp.title },
        created_at: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: `Challenge verified for ${profile.display_name}! Awarded +${exp.xp_reward} XP and +${exp.coin_reward} Coins.`,
      xp_awarded: exp.xp_reward,
      coins_awarded: exp.coin_reward,
    };
  }

  // --- ADMIN WALLET ADJUSTMENTS (Audit Logged, No Direct Balance Tampering) ---
  adjustWalletBalance(
    eventId: string,
    profileId: string,
    amount: number,
    reason: string,
    adminId: string
  ) {
    if (!reason || reason.trim().length === 0) {
      return { success: false, code: "REASON_REQUIRED", message: "Audit reason is required for any manual adjustment." };
    }

    if (amount === 0) {
      return { success: false, code: "ZERO_AMOUNT", message: "Adjustment amount cannot be zero." };
    }

    const key = `${eventId}:${profileId}`;
    const wallet = this.wallets.get(key);
    if (!wallet) {
      return { success: false, code: "WALLET_NOT_FOUND", message: "Wallet not found." };
    }

    if (wallet.balance + amount < 0) {
      return {
        success: false,
        code: "NEGATIVE_BALANCE_PREVENTED",
        message: `Adjustment would result in negative balance (${wallet.balance + amount}). Action blocked.`,
      };
    }

    const balBefore = wallet.balance;
    wallet.balance += amount;
    wallet.version += 1;
    wallet.updated_at = new Date().toISOString();

    const tx: WalletTransaction = {
      id: `tx-adj-${Date.now()}`,
      wallet_id: wallet.id,
      event_id: eventId,
      profile_id: profileId,
      type: "admin_adjustment",
      amount: Math.abs(amount),
      balance_before: balBefore,
      balance_after: wallet.balance,
      source_type: "admin_action",
      source_id: adminId,
      idempotency_key: `adj_${Date.now()}_${adminId}`,
      metadata: { reason, adjusted_by_admin: adminId, delta: amount },
      created_at: new Date().toISOString(),
    };
    this.walletTransactions.unshift(tx);

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      event_id: eventId,
      actor_profile_id: adminId,
      action: "wallet.manual_adjustment",
      entity_type: "wallets",
      entity_id: wallet.id,
      before_data: { balance: balBefore },
      after_data: { balance: wallet.balance, delta: amount, reason },
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      balance_before: balBefore,
      balance_after: wallet.balance,
      delta: amount,
      reason,
    };
  }

  redeemRewardAtomic(eventId: string, profileId: string, rewardId: string, idempotencyKey?: string | null) {
    if (this.isEventFrozen) {
      return { success: false, code: "EVENT_FROZEN", message: "VIBE has concluded. Reward redemptions are closed." };
    }

    const reward = this.rewards.get(rewardId);
    if (!reward || !reward.is_active) {
      return { success: false, code: "REWARD_UNAVAILABLE", message: "Reward is unavailable or inactive" };
    }

    if (reward.stock <= 0) {
      return { success: false, code: "REWARD_SOLD_OUT", message: "Reward is sold out" };
    }

    if (reward.redemption_limit) {
      const userRedemptions = this.rewardRedemptions.filter(
        (r) => r.profile_id === profileId && r.reward_id === rewardId && r.status !== "cancelled"
      ).length;
      if (userRedemptions >= reward.redemption_limit) {
        return { success: false, code: "REDEMPTION_LIMIT_REACHED", message: "Redemption limit reached for this reward" };
      }
    }

    const key = `${eventId}:${profileId}`;
    const wallet = this.wallets.get(key);
    if (!wallet) {
      return { success: false, code: "WALLET_NOT_FOUND", message: "Wallet not found" };
    }

    if (wallet.balance < reward.coin_cost) {
      return { success: false, code: "INSUFFICIENT_COINS", message: "Insufficient Coins for redemption" };
    }

    // Atomic deductions
    reward.stock -= 1;
    const balBefore = wallet.balance;
    wallet.balance -= reward.coin_cost;
    wallet.version += 1;
    wallet.updated_at = new Date().toISOString();

    const voucherCode = `VIBE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    this.walletTransactions.unshift({
      id: `tx-rwd-${Date.now()}`,
      wallet_id: wallet.id,
      event_id: eventId,
      profile_id: profileId,
      type: "reward_redemption",
      amount: reward.coin_cost,
      balance_before: balBefore,
      balance_after: wallet.balance,
      source_type: "reward",
      source_id: rewardId,
      idempotency_key: idempotencyKey || null,
      metadata: { reward_name: reward.name, code: voucherCode },
      created_at: new Date().toISOString(),
    });

    const redemption: RewardRedemption = {
      id: `rdm-${Date.now()}`,
      event_id: eventId,
      profile_id: profileId,
      reward_id: rewardId,
      code: voucherCode,
      coin_cost: reward.coin_cost,
      status: "pending",
      redeemed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    this.rewardRedemptions.unshift(redemption);

    return {
      success: true,
      redemption_id: redemption.id,
      code: voucherCode,
      reward_name: reward.name,
      coin_cost: reward.coin_cost,
      balance_after: wallet.balance,
      remaining_stock: reward.stock,
    };
  }

  // --- 3-TIER LEADERBOARD TIE-BREAKER ENGINE ---
  // 1. Highest XP
  // 2. Most zones completed (passport stamps)
  // 3. Most experiences completed
  // 4. Earliest to achieve final XP
  getLeaderboard(eventId: string, limit = 50): LeaderboardEntry[] {
    const list: LeaderboardEntry[] = [];

    this.profiles.forEach((profile) => {
      const userComps = this.completions.filter((c) => c.profile_id === profile.id);
      const totalXP = userComps.reduce((sum, c) => sum + c.xp_earned, 0);

      const stamps = this.passportStamps.get(profile.id);
      const zonesCount = stamps ? stamps.size : 0;
      const experiencesCount = userComps.length;

      const wallet = this.wallets.get(`${eventId}:${profile.id}`);
      const coins = wallet ? wallet.balance : 0;

      // Calculate level based on 6 tiers
      let userLevel = this.levels[0];
      for (const lvl of this.levels) {
        if (totalXP >= lvl.min_xp) {
          if (lvl.max_xp === null || totalXP <= lvl.max_xp) {
            userLevel = lvl;
          }
        }
      }

      list.push({
        rank: 0,
        profile_id: profile.id,
        vibe_id: profile.vibe_id,
        display_name: profile.display_name,
        college: profile.college || "District 3192",
        club: profile.club || "General Attendee",
        xp: totalXP,
        coins,
        level: userLevel.name,
        level_number: userLevel.sort_order,
        zones_visited_count: zonesCount,
        experiences_completed_count: experiencesCount,
        created_at: profile.created_at,
      });
    });

    // Sort by 3 tie-breaker rules
    list.sort((a, b) => {
      // Primary: XP descending
      if (b.xp !== a.xp) return b.xp - a.xp;
      // Tie-breaker 1: Most zones completed descending
      if (b.zones_visited_count !== a.zones_visited_count) {
        return b.zones_visited_count - a.zones_visited_count;
      }
      // Tie-breaker 2: Most experiences completed descending
      if (b.experiences_completed_count !== a.experiences_completed_count) {
        return b.experiences_completed_count - a.experiences_completed_count;
      }
      // Tie-breaker 3: Earliest timestamp ascending
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Assign final ranks
    return list.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  evaluateAchievementsForProfile(eventId: string, profileId: string): Achievement[] {
    const userComps = this.completions.filter((c) => c.profile_id === profileId);
    const userStamps = this.passportStamps.get(profileId) || new Set();
    const totalXP = userComps.reduce((sum, c) => sum + c.xp_earned, 0);

    const unlockedNow: Achievement[] = [];

    for (const ach of this.achievements) {
      const alreadyUnlocked = this.userAchievements.some(
        (ua) => ua.profile_id === profileId && ua.achievement_id === ach.id
      );
      if (alreadyUnlocked) continue;

      let qualified = false;
      if (ach.condition_type === "zones_visited") {
        qualified = userStamps.size >= (ach.condition_config.target || 3);
      } else if (ach.condition_type === "all_zones_completed") {
        qualified = userStamps.size >= (ach.condition_config.target || 7);
      } else if (ach.condition_type === "experiences_completed") {
        qualified = userComps.length >= (ach.condition_config.target || 5);
      } else if (ach.condition_type === "reach_level") {
        qualified = totalXP >= 2500; // Level 6 VIBE Legend
      } else if (ach.condition_type === "specific_experience") {
        qualified = userComps.some((c) => c.experience_id === ach.condition_config.experience_id);
      }

      if (qualified) {
        this.userAchievements.push({
          id: `ua-${Date.now()}-${ach.id}`,
          event_id: eventId,
          profile_id: profileId,
          achievement_id: ach.id,
          unlocked_at: new Date().toISOString(),
        });
        unlockedNow.push(ach);
      }
    }

    return unlockedNow;
  }

  evaluateQuestsForProfile(eventId: string, profileId: string): QuestProgress[] {
    const userComps = this.completions.filter((c) => c.profile_id === profileId);
    const userStamps = this.passportStamps.get(profileId) || new Set();

    const updated: QuestProgress[] = [];

    for (const quest of this.quests) {
      const progressKey = `${profileId}:${quest.id}`;
      let qp = this.questProgress.get(progressKey);
      if (!qp) {
        qp = {
          id: `qp-${profileId}-${quest.id}`,
          event_id: eventId,
          profile_id: profileId,
          quest_id: quest.id,
          progress_value: 0,
          target_value: quest.condition_config.target || 1,
          completed_at: null,
          updated_at: new Date().toISOString(),
        };
        this.questProgress.set(progressKey, qp);
      }

      if (qp.completed_at) continue;

      if (quest.condition_type === "zones_visited") {
        qp.progress_value = Math.min(userStamps.size, qp.target_value);
      } else if (quest.condition_type === "experiences_completed") {
        qp.progress_value = Math.min(userComps.length, qp.target_value);
      } else if (quest.condition_type === "specific_experience") {
        const hasSpecific = userComps.some(
          (c) => c.experience_id === quest.condition_config.experience_id
        );
        qp.progress_value = hasSpecific ? 1 : 0;
      } else if (quest.condition_type === "all_zones_completed") {
        qp.progress_value = Math.min(userStamps.size, qp.target_value);
      }

      if (qp.progress_value >= qp.target_value && !qp.completed_at) {
        qp.completed_at = new Date().toISOString();
        // Award quest rewards
        const wallet = this.wallets.get(`${eventId}:${profileId}`);
        if (wallet && quest.coin_reward > 0) {
          const balBefore = wallet.balance;
          wallet.balance += quest.coin_reward;
          wallet.version += 1;
          this.walletTransactions.unshift({
            id: `tx-quest-${Date.now()}`,
            wallet_id: wallet.id,
            event_id: eventId,
            profile_id: profileId,
            type: "earn",
            amount: quest.coin_reward,
            balance_before: balBefore,
            balance_after: wallet.balance,
            source_type: "quest_completion",
            source_id: quest.id,
            idempotency_key: null,
            metadata: { quest_title: quest.title },
            created_at: new Date().toISOString(),
          });
        }
      }

      qp.updated_at = new Date().toISOString();
      updated.push(qp);
    }

    return updated;
  }
}

// Global Singleton for in-process memory database
const globalForStore = globalThis as unknown as { vibeStore: VibeMemoryDatabase };
export const mockDb = globalForStore.vibeStore || new VibeMemoryDatabase();
if (process.env.NODE_ENV !== "production") globalForStore.vibeStore = mockDb;
