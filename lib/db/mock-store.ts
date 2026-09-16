// In-Memory Database Store providing exact atomic stored procedure semantics
// Aligned with the complete specification in "🌊 VIBE — UPDATED COMPLETE USER FLOW.docx"

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
  Stall,
  StallPhotoSubmission,
  GameSession,
  GameType,
  ZoneLeaderboardEntry,
  UserPlayerStats,
} from "@/types/database";

export interface MockLeaderboardEntry {
  rank: number;
  profile_id: string;
  vibe_id: string;
  display_name: string;
  college: string;
  club: string;
  instagram_id?: string;
  assigned_zone_name?: string;
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
  stalls: Map<string, Stall> = new Map();
  stallPhotoSubmissions: StallPhotoSubmission[] = [];
  get stallPhotos(): StallPhotoSubmission[] {
    return this.stallPhotoSubmissions;
  }
  set stallPhotos(val: StallPhotoSubmission[]) {
    this.stallPhotoSubmissions = val;
  }
  gameSessions: GameSession[] = [];
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
      description: "The flagship gamified fresher party experience. Explore 6 zones, scan QR codes, unlock experiences, complete stalls, play festival games, and win the VIBE Championship!",
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
      { id: "sp-1", event_id: eventId, name: "Red Bull", logo_media_id: null, description: "Official Energy Partner for high-octane zones", is_active: true, created_at: new Date().toISOString() },
      { id: "sp-2", event_id: eventId, name: "Spotify India", logo_media_id: null, description: "Official Sound & DJ Experience Partner", is_active: true, created_at: new Date().toISOString() },
      { id: "sp-3", event_id: eventId, name: "OnePlus", logo_media_id: null, description: "Never Settle Experience Hub", is_active: true, created_at: new Date().toISOString() },
    ];
    sponsorsList.forEach((s) => this.sponsors.set(s.id, s));

    // 4. THE SIX OFFICIAL ZONES (Section 2 & 5 of specification)
    const zonesList: Zone[] = [
      {
        id: "z-arnava",
        event_id: eventId,
        name: "Arnava",
        slug: "arnava",
        description: "The Rising Tide. High-intensity interactive challenges and team coordination.",
        image_media_id: null,
        sort_order: 1,
        is_active: true,
        coins_collected: 42850,
        map_data: { x: 120, y: 90, color: "#0284C7", icon: "Waves" },
      },
      {
        id: "z-taranaga",
        event_id: eventId,
        name: "Taranaga",
        slug: "taranaga",
        description: "The Electric Ripple. Rapid rhythm face-offs, dance encounters and audio-visual beats.",
        image_media_id: null,
        sort_order: 2,
        is_active: true,
        coins_collected: 39450,
        map_data: { x: 280, y: 90, color: "#6366F1", icon: "Activity" },
      },
      {
        id: "z-sagara",
        event_id: eventId,
        name: "Sagara",
        slug: "sagara",
        description: "The Deep Ocean. Mystery puzzles, cryptic cipher runs and deep dive explorations.",
        image_media_id: null,
        sort_order: 3,
        is_active: true,
        coins_collected: 34200,
        map_data: { x: 200, y: 180, color: "#0EA5E9", icon: "Compass" },
      },
      {
        id: "z-pravaha",
        event_id: eventId,
        name: "Pravaha",
        slug: "pravaha",
        description: "The Rushing Current. Adrenaline sports, agility obstacle courses and rapid relays.",
        image_media_id: null,
        sort_order: 4,
        is_active: true,
        coins_collected: 31800,
        map_data: { x: 90, y: 260, color: "#14B8A6", icon: "Zap" },
      },
      {
        id: "z-samudhra",
        event_id: eventId,
        name: "Samudhra",
        slug: "samudhra",
        description: "The Endless Ocean. Fellowship arena, social bonding spots and creator photo rigs.",
        image_media_id: null,
        sort_order: 5,
        is_active: true,
        coins_collected: 28900,
        map_data: { x: 310, y: 260, color: "#8B5CF6", icon: "Users" },
      },
      {
        id: "z-varuna",
        event_id: eventId,
        name: "Varuna",
        slug: "varuna",
        description: "The Celestial Waters. The festival crown zone, grand stage spectacle and midnight showdown.",
        image_media_id: null,
        sort_order: 6,
        is_active: true,
        coins_collected: 26400,
        map_data: { x: 200, y: 340, color: "#EC4899", icon: "Sparkles" },
      },
    ];
    zonesList.forEach((z) => this.zones.set(z.id, z));

    // Compatibility zones for existing unit tests
    this.zones.set("z-arcade", {
      id: "z-arcade",
      event_id: eventId,
      name: "Cyber Arcade",
      slug: "zone-arcade",
      description: "Retro & VR gaming hub",
      image_media_id: null,
      sort_order: 7,
      is_active: true,
      coins_collected: 0,
      map_data: { x: 120, y: 90, color: "#3B82F6", icon: "Gamepad2" },
    });
    this.zones.set("z-stage", {
      id: "z-stage",
      event_id: eventId,
      name: "Pulse Stage",
      slug: "zone-stage",
      description: "Live DJ sound floor",
      image_media_id: null,
      sort_order: 8,
      is_active: true,
      coins_collected: 0,
      map_data: { x: 200, y: 180, color: "#EC4899", icon: "Music" },
    });

    // 5. Zone Experiences
    const experiencesList: Experience[] = [
      { id: "exp-1", event_id: eventId, zone_id: "z-arcade", sponsor_id: "sp-3", title: "VR Cyber Flight Simulator", slug: "exp-vr-flight", description: "Take the cockpit in a supersonic VR race through neo-Bangalore!", image_media_id: null, video_media_id: null, coin_cost: 100, xp_reward: 175, coin_reward: 35, max_attempts: 2, cooldown_seconds: 300, starts_at: null, ends_at: null, is_active: true },
      { id: "exp-2", event_id: eventId, zone_id: "z-arnava", sponsor_id: "sp-1", title: "Arnava Final Wave", slug: "arnava-final-wave", description: "Conquer the ultimate physical obstacle course and secure legendary points.", image_media_id: null, video_media_id: null, coin_cost: 150, xp_reward: 250, coin_reward: 50, max_attempts: 1, cooldown_seconds: 0, starts_at: null, ends_at: null, is_active: true },
      { id: "exp-3", event_id: eventId, zone_id: "z-taranaga", sponsor_id: "sp-2", title: "Taranaga Beat Drop Clash", slug: "taranaga-beat-drop", description: "Step onto the live DJ soundstage for a head-to-head dance confrontation.", image_media_id: null, video_media_id: null, coin_cost: 75, xp_reward: 125, coin_reward: 25, max_attempts: 2, cooldown_seconds: 600, starts_at: null, ends_at: null, is_active: true },
      { id: "exp-4", event_id: eventId, zone_id: "z-sagara", sponsor_id: null, title: "Sagara Deep Dive Riddle", slug: "sagara-riddle", description: "Unravel three aquatic riddles to reveal the forgotten sea crest.", image_media_id: null, video_media_id: null, coin_cost: 50, xp_reward: 75, coin_reward: 20, max_attempts: 1, cooldown_seconds: 0, starts_at: null, ends_at: null, is_active: true },
      { id: "exp-5", event_id: eventId, zone_id: "z-samudhra", sponsor_id: "sp-3", title: "Samudhra Creator 360", slug: "samudhra-creator", description: "Step into the rotating 360 glam camera platform with ocean light trails.", image_media_id: null, video_media_id: null, coin_cost: 75, xp_reward: 125, coin_reward: 25, max_attempts: 2, cooldown_seconds: 600, starts_at: null, ends_at: null, is_active: true },
      { id: "exp-6", event_id: eventId, zone_id: "z-pravaha", sponsor_id: "sp-1", title: "Pravaha Agility Rapids", slug: "pravaha-rapids", description: "Sprint through laser hurdles in this timed reflex agility sprint.", image_media_id: null, video_media_id: null, coin_cost: 50, xp_reward: 75, coin_reward: 20, max_attempts: 2, cooldown_seconds: 0, starts_at: null, ends_at: null, is_active: true },
      { id: "exp-7", event_id: eventId, zone_id: "z-varuna", sponsor_id: "sp-1", title: "Varuna Grand Spectacle", slug: "varuna-spectacle", description: "The festival mainstage midnight challenge with live crowd cheering.", image_media_id: null, video_media_id: null, coin_cost: 150, xp_reward: 250, coin_reward: 50, max_attempts: 1, cooldown_seconds: 0, starts_at: null, ends_at: null, is_active: true },
      // Additional Zone Experiences
      { id: "exp-arnava-1", event_id: eventId, zone_id: "z-arnava", sponsor_id: null, title: "Arnava Icebreaker", slug: "arnava-icebreaker", description: "Break the ice with fellow freshers through rapid cooperative wave tags.", image_media_id: null, video_media_id: null, coin_cost: 50, xp_reward: 75, coin_reward: 20, max_attempts: 2, cooldown_seconds: 0, starts_at: null, ends_at: null, is_active: true },
      { id: "exp-taranaga-1", event_id: eventId, zone_id: "z-taranaga", sponsor_id: "sp-2", title: "Taranaga Soundwave Sprint", slug: "taranaga-soundwave", description: "Follow the rhythmic tempo beats on the illuminated floor tiles.", image_media_id: null, video_media_id: null, coin_cost: 50, xp_reward: 75, coin_reward: 20, max_attempts: 2, cooldown_seconds: 0, starts_at: null, ends_at: null, is_active: true },
    ];
    experiencesList.forEach((e) => this.experiences.set(e.id, e));

    // 6. QR Codes
    const qrList: QRCodeRecord[] = [
      { id: "qr-1", event_id: eventId, experience_id: "exp-1", code: "vibe-arcade-vr-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-2", event_id: eventId, experience_id: "exp-2", code: "vibe-arena-laser-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-3", event_id: eventId, experience_id: "exp-3", code: "vibe-stage-dj-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-2b", event_id: eventId, experience_id: "exp-2", code: "vibe-arnava-final-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-3b", event_id: eventId, experience_id: "exp-3", code: "vibe-taranaga-dj-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-4", event_id: eventId, experience_id: "exp-4", code: "vibe-sagara-riddle-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-5", event_id: eventId, experience_id: "exp-5", code: "vibe-samudhra-360-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-6", event_id: eventId, experience_id: "exp-6", code: "vibe-pravaha-rapids-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-7", event_id: eventId, experience_id: "exp-7", code: "vibe-varuna-spectacle-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      // Bonus QR codes (Section 17: Hidden QR codes & Stage challenge)
      { id: "qr-bonus-hidden", event_id: eventId, experience_id: "exp-1", code: "vibe-hidden-easteregg-1", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
      { id: "qr-bonus-stage", event_id: eventId, experience_id: "exp-7", code: "vibe-stage-challenge-2026", version: 1, expires_at: null, is_active: true, created_at: new Date().toISOString() },
    ];
    qrList.forEach((q) => this.qrCodes.set(q.code, q));

    // 7. Stalls (Section 10-14 of specification)
    const stallsList: Stall[] = [
      { id: "stall-1", event_id: eventId, name: "🎮 Stall — Memory Match", slug: "stall-memory-match", description: "Match the hidden festival cards within 60 seconds.", entry_cost: 50, xp_reward: 100, coin_reward: 25, is_active: true, requires_photo: true },
      { id: "stall-2", event_id: eventId, name: "📸 Stall — 360 Glam Photo Rig", slug: "stall-glam-rig", description: "Capture your signature festival vibe on the spinning neon rig.", entry_cost: 50, xp_reward: 100, coin_reward: 25, is_active: true, requires_photo: true },
      { id: "stall-3", event_id: eventId, name: "🎯 Stall — Ring Toss Challenge", slug: "stall-ring-toss", description: "Test your precision ring aim against moving glow pegs.", entry_cost: 50, xp_reward: 100, coin_reward: 25, is_active: true, requires_photo: true },
      { id: "stall-4", event_id: eventId, name: "🌮 Stall — Taco Taste Odyssey", slug: "stall-taco-taste", description: "Sample the mystery spicy taco challenge and review your dish.", entry_cost: 50, xp_reward: 100, coin_reward: 25, is_active: true, requires_photo: true },
      { id: "stall-5", event_id: eventId, name: "🎨 Stall — Neon Face Art Studio", slug: "stall-neon-art", description: "Get painted with glowing ultraviolet tribal festival artwork.", entry_cost: 50, xp_reward: 100, coin_reward: 25, is_active: true, requires_photo: true },
    ];
    stallsList.forEach((s) => this.stalls.set(s.id, s));

    // 8. The 5 Official Quests (Section 18 of specification)
    this.quests = [
      { id: "q-1", event_id: eventId, title: "QUEST 1 — THE EXPLORER", description: "Visit 3 zones.", condition_type: "zones_visited", condition_config: { target: 3 }, xp_reward: 100, coin_reward: 100, starts_at: null, ends_at: null, is_active: true },
      { id: "q-2", event_id: eventId, title: "QUEST 2 — THE WANDERER", description: "Visit all 6 zones.", condition_type: "all_zones_completed", condition_config: { target: 6 }, xp_reward: 300, coin_reward: 300, starts_at: null, ends_at: null, is_active: true },
      { id: "q-3", event_id: eventId, title: "QUEST 3 — SOCIAL VIBE", description: "Complete 5 stall interactions.", condition_type: "stalls_visited", condition_config: { target: 5 }, xp_reward: 200, coin_reward: 150, starts_at: null, ends_at: null, is_active: true },
      { id: "q-4", event_id: eventId, title: "QUEST 4 — GAME ON", description: "Complete all 4 games.", condition_type: "games_completed", condition_config: { target: 4 }, xp_reward: 300, coin_reward: 200, starts_at: null, ends_at: null, is_active: true },
      { id: "q-5", event_id: eventId, title: "QUEST 5 — VIBE MASTER", description: "Complete all 6 zones, 5 stalls, and 4 games.", condition_type: "vibe_master", condition_config: { target: 15 }, xp_reward: 500, coin_reward: 500, starts_at: null, ends_at: null, is_active: true },
    ];

    // 9. Achievements
    this.achievements = [
      { id: "ach-1", event_id: eventId, name: "The Explorer", description: "Stamped your first 3 venue zones.", condition_type: "zones_visited", condition_config: { target: 3 }, badge_media_id: null, is_active: true },
      { id: "ach-2", event_id: eventId, name: "The Wanderer", description: "Conquered all 6 zones in your digital Passport.", condition_type: "all_zones_completed", condition_config: { target: 6 }, badge_media_id: null, is_active: true },
      { id: "ach-3", event_id: eventId, name: "Social Butterfly", description: "Interacted with 5 stalls across the festival grounds.", condition_type: "stalls_visited", condition_config: { target: 5 }, badge_media_id: null, is_active: true },
      { id: "ach-4", event_id: eventId, name: "Arcade Champion", description: "Played all 4 official VIBE festival games.", condition_type: "games_completed", condition_config: { target: 4 }, badge_media_id: null, is_active: true },
      { id: "ach-5", event_id: eventId, name: "VIBE Master", description: "Master of the entire VIBE event world.", condition_type: "vibe_master", condition_config: { target: 15 }, badge_media_id: null, is_active: true },
    ];

    // 10. Rewards Store
    const rewardsList: Reward[] = [
      { id: "rwd-1", event_id: eventId, sponsor_id: null, name: "Official VIBE Holographic Sticker Pack", description: "High-gloss holographic vinyl sticker collection for laptop & phone.", image_media_id: null, coin_cost: 100, stock: 200, redemption_limit: 1, starts_at: null, ends_at: null, is_active: true },
      { id: "rwd-2", event_id: eventId, sponsor_id: null, name: "VIBE 2026 Commemorative District Enamel Pin", description: "Exclusive metal collector badge with rotaract freshers insignia.", image_media_id: null, coin_cost: 150, stock: 150, redemption_limit: 1, starts_at: null, ends_at: null, is_active: true },
      { id: "rwd-3", event_id: eventId, sponsor_id: "sp-1", name: "Red Bull VIP Energy Drink Voucher", description: "Complimentary Red Bull drink at any festival beverage hub.", image_media_id: null, coin_cost: 200, stock: 100, redemption_limit: 2, starts_at: null, ends_at: null, is_active: true },
      { id: "rwd-4", event_id: eventId, sponsor_id: "sp-2", name: "Spotify Premium 3-Month Subscription Voucher", description: "Ad-free music voucher provided by official sound partner.", image_media_id: null, coin_cost: 350, stock: 50, redemption_limit: 1, starts_at: null, ends_at: null, is_active: true },
      { id: "rwd-5", event_id: eventId, sponsor_id: null, name: "Limited Edition VIBE Streetwear T-Shirt", description: "Heavyweight festival cotton tee with custom fluorescent wave print.", image_media_id: null, coin_cost: 500, stock: 30, redemption_limit: 1, starts_at: null, ends_at: null, is_active: true },
    ];
    rewardsList.forEach((r) => this.rewards.set(r.id, r));

    // 11. Seed Users matching Section 1 & 28 of specification
    this.createAttendeeProfile("usr-demo-1", "Aarcha U", "VIBE-2001", "BMS College of Engineering", "Rotaract Club of Bangalore", 3850, 6, 12, "@aarcha.u", "+91 98765 43210", "z-arnava");
    this.createAttendeeProfile("usr-demo-2", "Rahul M", "VIBE-2002", "PES University", "Rotaract Club of Midtown", 3720, 5, 10, "@rahul.m", "+91 98765 43211", "z-taranaga");
    this.createAttendeeProfile("usr-demo-3", "Ananya S", "VIBE-2003", "RVCE Bangalore", "Rotaract Club of Sagara Coast", 3550, 5, 9, "@ananya.s", "+91 98765 43212", "z-sagara");
    this.createAttendeeProfile("usr-demo-4", "Kabir K", "VIBE-2004", "Christ University", "Rotaract Club of Indiranagar", 2900, 4, 7, "@kabir.k", "+91 98765 43213", "z-pravaha");

    // 12. Seed Sample Stall Photo Submissions for Verification Queue
    this.stallPhotoSubmissions.push(
      {
        id: "sub-1",
        event_id: eventId,
        profile_id: "prof-usr-demo-2",
        stall_id: "stall-2",
        photo_url: "/placeholder-stall-photo.jpg",
        instagram_id: "@rahul.m",
        status: "pending",
        submitted_at: new Date(Date.now() - 300000).toISOString(),
        reviewed_at: null,
        reviewed_by: null,
      },
      {
        id: "sub-2",
        event_id: eventId,
        profile_id: "prof-usr-demo-3",
        stall_id: "stall-1",
        photo_url: "/placeholder-stall-photo.jpg",
        instagram_id: "@ananya.s",
        status: "pending",
        submitted_at: new Date(Date.now() - 600000).toISOString(),
        reviewed_at: null,
        reviewed_by: null,
      }
    );
  }

  createAttendeeProfile(
    clerkId: string,
    name: string,
    vibeId: string,
    college: string,
    club: string,
    initialXP = 0,
    zonesCount = 0,
    completionsCount = 0,
    instagramId?: string,
    phone: string = "+91 98765 00000",
    assignedZoneId: string = "z-arnava"
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
      phone,
      instagram_id: instagramId || `@${name.toLowerCase().replace(/\s+/g, ".")}`,
      registration_id: `REG-${Math.floor(10000 + Math.random() * 90000)}`,
      assigned_zone_id: assignedZoneId,
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

    // Initialize wallet with 500 starting coins (Section 1 & 3 of spec)
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

    // Seed passport stamps for the official zones
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
          metadata: { title: "Seeded Experience", zone_id: assignedZoneId },
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
      return { success: true, credited: false, balance: wallet.balance };
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
      return { success: false, code: "EVENT_FROZEN", message: "VIBE has concluded. Transactions are closed." };
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

  // --- ZONE DISCOVERY (+50 VIBE, +100 XP, Passport Stamp) ---
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

    // Record +100 XP
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

    this.evaluateAchievementsForProfile(eventId, profileId);
    this.evaluateQuestsForProfile(eventId, profileId);

    return {
      success: true,
      newlyDiscovered: true,
      zoneName: zone.name,
      coinsEarned,
      xpEarned,
      newBalance: wallet.balance,
      totalZonesVisited: userStamps.size,
      message: `🎉 ${zone.name} Discovered! +50 VIBE Coins, +100 XP earned!`,
    };
  }

  // --- ATOMIC COMPLETE EXPERIENCE ---
  // Key requirement from Section 8 & 22:
  // Coins spent on an activity belonging to a zone are transferred to that zone's score!
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

    // RULE: Coins spent move to the zone's score!
    if (exp.coin_cost > 0) {
      const targetZone = this.zones.get(exp.zone_id);
      if (targetZone) {
        targetZone.coins_collected = (targetZone.coins_collected || 0) + exp.coin_cost;
      }

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
        metadata: { title: exp.title, attempt: attemptNumber, zone_id: exp.zone_id },
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
      metadata: { title: exp.title, zone_id: exp.zone_id },
    };
    this.completions.push(completion);

    // Auto-stamp passport for this zone
    let userStamps = this.passportStamps.get(profileId);
    if (!userStamps) {
      userStamps = new Set();
      this.passportStamps.set(profileId, userStamps);
    }
    userStamps.add(exp.zone_id);

    this.evaluateAchievementsForProfile(eventId, profileId);
    this.evaluateQuestsForProfile(eventId, profileId);

    return {
      success: true,
      completion_id: completion.id,
      experience_id: exp.id,
      experience_title: exp.title,
      zone_id: exp.zone_id,
      coin_spent: exp.coin_cost,
      coin_earned: exp.coin_reward,
      xp_earned: exp.xp_reward,
      balance_after: newBal,
      attempt_number: attemptNumber,
    };
  }

  // --- STALL PHOTO VERIFICATION SYSTEM (Sections 11-13) ---
  submitStallPhoto(eventId: string, profileId: string, stallId: string, photoUrl: string, instagramId: string) {
    const stall = this.stalls.get(stallId);
    if (!stall || !stall.is_active) {
      return { success: false, message: "Stall not found or inactive" };
    }

    const submission: StallPhotoSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      event_id: eventId,
      profile_id: profileId,
      stall_id: stallId,
      photo_url: photoUrl,
      instagram_id: instagramId,
      status: "pending",
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
    };
    this.stallPhotoSubmissions.unshift(submission);

    return {
      success: true,
      submission,
      message: "Photo submitted to volunteer verification queue!",
    };
  }

  approveStallPhoto(submissionId: string, reviewerProfileId: string) {
    const sub = this.stallPhotoSubmissions.find((s) => s.id === submissionId);
    if (!sub) return { success: false, message: "Submission not found" };
    if (sub.status !== "pending") {
      return { success: false, message: `Submission is already ${sub.status}` };
    }

    sub.status = "approved";
    sub.reviewed_at = new Date().toISOString();
    sub.reviewed_by = reviewerProfileId;

    const stall = this.stalls.get(sub.stall_id);
    const xpReward = stall ? stall.xp_reward : 100;
    const coinReward = stall?.coin_reward || 25;

    // Credit +100 XP to user
    this.completions.push({
      id: `comp-stall-${Date.now()}`,
      event_id: sub.event_id,
      profile_id: sub.profile_id,
      experience_id: `stall-${sub.stall_id}`,
      qr_code_id: null,
      attempt_number: 1,
      coin_spent: 0,
      xp_earned: xpReward,
      coin_earned: coinReward,
      completed_at: new Date().toISOString(),
      metadata: { type: "stall_photo", stall_id: sub.stall_id, photo_url: sub.photo_url },
    });

    // Credit +25 VIBE Coins
    const walletKey = `${sub.event_id}:${sub.profile_id}`;
    const wallet = this.wallets.get(walletKey);
    if (wallet) {
      const balBefore = wallet.balance;
      wallet.balance += coinReward;
      wallet.version += 1;
      this.walletTransactions.unshift({
        id: `tx-stall-${Date.now()}`,
        wallet_id: wallet.id,
        event_id: sub.event_id,
        profile_id: sub.profile_id,
        type: "earn",
        amount: coinReward,
        balance_before: balBefore,
        balance_after: wallet.balance,
        source_type: "stall_photo_approved",
        source_id: sub.stall_id,
        idempotency_key: null,
        metadata: { submission_id: sub.id, stall_id: sub.stall_id },
        created_at: new Date().toISOString(),
      });
    }

    this.evaluateAchievementsForProfile(sub.event_id, sub.profile_id);
    this.evaluateQuestsForProfile(sub.event_id, sub.profile_id);

    return {
      success: true,
      message: `Approved! Attendee awarded +${xpReward} XP and +${coinReward} VIBE Coins.`,
      xpEarned: xpReward,
      coinEarned: coinReward,
    };
  }

  rejectStallPhoto(submissionId: string, reviewerProfileId: string) {
    const sub = this.stallPhotoSubmissions.find((s) => s.id === submissionId);
    if (!sub) return { success: false, message: "Submission not found" };
    sub.status = "rejected";
    sub.reviewed_at = new Date().toISOString();
    sub.reviewed_by = reviewerProfileId;
    return { success: true, message: "Submission rejected." };
  }

  approvePhysicalChallenge(
    eventId: string,
    staffProfileId: string,
    attendeeProfileId: string,
    experienceId: string
  ) {
    const exp = this.experiences.get(experienceId);
    if (!exp || !exp.is_active) {
      return { success: false, message: "Experience not found or inactive" };
    }

    const userComps = this.completions.filter(
      (c) => c.profile_id === attendeeProfileId && c.experience_id === experienceId
    );
    const attemptNumber = userComps.length + 1;

    this.completions.push({
      id: `comp-staff-${Date.now()}`,
      event_id: eventId,
      profile_id: attendeeProfileId,
      experience_id: experienceId,
      qr_code_id: null,
      attempt_number: attemptNumber,
      coin_spent: 0,
      xp_earned: exp.xp_reward,
      coin_earned: exp.coin_reward,
      completed_at: new Date().toISOString(),
      metadata: { verifiedByStaffProfileId: staffProfileId },
    });

    if (exp.coin_reward > 0) {
      const walletKey = `${eventId}:${attendeeProfileId}`;
      const wallet = this.wallets.get(walletKey);
      if (wallet) {
        const balBefore = wallet.balance;
        wallet.balance += exp.coin_reward;
        wallet.version += 1;
        this.walletTransactions.unshift({
          id: `tx-ch-earn-${Date.now()}`,
          wallet_id: wallet.id,
          event_id: eventId,
          profile_id: attendeeProfileId,
          type: "earn",
          amount: exp.coin_reward,
          balance_before: balBefore,
          balance_after: wallet.balance,
          source_type: "challenge_verified",
          source_id: experienceId,
          idempotency_key: null,
          metadata: { experience_title: exp.title, verified_by: staffProfileId },
          created_at: new Date().toISOString(),
        });
      }
    }

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      event_id: eventId,
      actor_profile_id: staffProfileId,
      action: "STAFF_CHALLENGE_APPROVED",
      entity_type: "experience_completions",
      entity_id: experienceId,
      before_data: null,
      after_data: { attendeeProfileId, experienceId, xpAwarded: exp.xp_reward },
      created_at: new Date().toISOString(),
    });

    this.evaluateAchievementsForProfile(eventId, attendeeProfileId);
    this.evaluateQuestsForProfile(eventId, attendeeProfileId);

    return {
      success: true,
      xpAwarded: exp.xp_reward,
      message: `Approved! Awarded +${exp.xp_reward} XP to attendee.`,
    };
  }

  // --- GAME SESSION RECORDING (Sections 15-16) ---
  recordGameSession(
    eventId: string,
    profileId: string,
    gameType: GameType,
    score: number,
    maxScore: number,
    coinCost: number,
    coinReward: number,
    xpReward: number
  ) {
    if (this.isEventFrozen) {
      return { success: false, code: "EVENT_FROZEN", message: "Event concluded." };
    }

    const walletKey = `${eventId}:${profileId}`;
    const wallet = this.wallets.get(walletKey);
    if (!wallet) return { success: false, message: "Wallet not found" };

    if (coinCost > 0 && wallet.balance < coinCost) {
      return { success: false, code: "INSUFFICIENT_COINS", message: `Need ${coinCost} VIBE Coins to play this game.` };
    }

    const balBefore = wallet.balance;
    const netCoins = coinReward - coinCost;
    wallet.balance += netCoins;
    wallet.version += 1;

    if (coinCost > 0) {
      this.walletTransactions.unshift({
        id: `tx-game-spend-${Date.now()}`,
        wallet_id: wallet.id,
        event_id: eventId,
        profile_id: profileId,
        type: "spend",
        amount: coinCost,
        balance_before: balBefore,
        balance_after: balBefore - coinCost,
        source_type: "game_entry",
        source_id: null,
        idempotency_key: null,
        metadata: { game_type: gameType },
        created_at: new Date().toISOString(),
      });
    }

    if (coinReward > 0) {
      this.walletTransactions.unshift({
        id: `tx-game-earn-${Date.now()}`,
        wallet_id: wallet.id,
        event_id: eventId,
        profile_id: profileId,
        type: "earn",
        amount: coinReward,
        balance_before: balBefore - coinCost,
        balance_after: wallet.balance,
        source_type: "game_win",
        source_id: null,
        idempotency_key: null,
        metadata: { game_type: gameType, score },
        created_at: new Date().toISOString(),
      });
    }

    // Award XP
    if (xpReward > 0) {
      this.completions.push({
        id: `comp-game-${Date.now()}`,
        event_id: eventId,
        profile_id: profileId,
        experience_id: `game-${gameType}`,
        qr_code_id: null,
        attempt_number: 1,
        coin_spent: coinCost,
        xp_earned: xpReward,
        coin_earned: coinReward,
        completed_at: new Date().toISOString(),
        metadata: { type: "game_session", game_type: gameType, score },
      });
    }

    const session: GameSession = {
      id: `gs-${Date.now()}`,
      event_id: eventId,
      profile_id: profileId,
      game_type: gameType,
      score,
      max_score: maxScore,
      coin_spent: coinCost,
      coin_earned: coinReward,
      xp_earned: xpReward,
      played_at: new Date().toISOString(),
    };
    this.gameSessions.push(session);

    this.evaluateAchievementsForProfile(eventId, profileId);
    this.evaluateQuestsForProfile(eventId, profileId);

    return {
      success: true,
      balanceAfter: wallet.balance,
      xpEarned: xpReward,
      coinsEarned: coinReward,
      session,
    };
  }

  // --- REWARD REDEMPTION ---
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

  // --- 10-METRIC PLAYER STATS (Section 30) ---
  getUserPlayerStats(profileId: string): UserPlayerStats {
    const userTxs = this.walletTransactions.filter((tx) => tx.profile_id === profileId);
    const userComps = this.completions.filter((c) => c.profile_id === profileId);
    const userStamps = this.passportStamps.get(profileId) || new Set();
    const userGames = this.gameSessions.filter((g) => g.profile_id === profileId);
    const userApprovedPhotos = this.stallPhotoSubmissions.filter(
      (p) => p.profile_id === profileId && p.status === "approved"
    );

    const totalEarned = userTxs
      .filter((tx) => tx.type === "earn" || tx.type === "initial_credit")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalSpent = userTxs
      .filter((tx) => tx.type === "spend" || tx.type === "reward_redemption")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalXP = userComps.reduce((sum, c) => sum + c.xp_earned, 0);

    const distinctStallsVisited = new Set(
      userComps
        .map((c) => c.metadata?.stall_id)
        .filter(Boolean)
    ).size;

    const completedQuestsCount = Array.from(this.questProgress.values()).filter(
      (qp) => qp.profile_id === profileId && Boolean(qp.completed_at)
    ).length;

    return {
      total_vibe_earned: totalEarned,
      total_vibe_spent: totalSpent,
      total_xp_earned: totalXP,
      zones_visited_count: userStamps.size,
      experiences_completed_count: userComps.filter((c) => !c.metadata?.type).length,
      stalls_visited_count: distinctStallsVisited,
      games_played_count: userGames.length,
      games_won_count: userGames.filter((g) => g.coin_earned > g.coin_spent).length,
      photos_approved_count: userApprovedPhotos.length,
      quests_completed_count: completedQuestsCount,

      totalVibeEarned: totalEarned,
      totalVibeSpent: totalSpent,
      xpEarned: totalXP,
      zonesVisitedCount: userStamps.size,
      experiencesCompletedCount: userComps.filter((c) => !c.metadata?.type).length,
      stallsVisitedCount: distinctStallsVisited,
      gamesPlayedCount: userGames.length,
      gamesWonCount: userGames.filter((g) => g.coin_earned > g.coin_spent).length,
      photosApprovedCount: userApprovedPhotos.length,
      questsCompletedCount: completedQuestsCount,
    };
  }

  // --- ZONAL STATS BREAKDOWN (Sections 24-26) ---
  getZonalStats(eventId: string): ZoneLeaderboardEntry[] {
    const sixZones = ["z-arnava", "z-taranaga", "z-sagara", "z-pravaha", "z-samudhra", "z-varuna"];
    const results: ZoneLeaderboardEntry[] = [];

    sixZones.forEach((zId) => {
      const zone = this.zones.get(zId);
      if (!zone) return;

      let visitors = 0;
      this.passportStamps.forEach((stamps) => {
        if (stamps.has(zId)) visitors++;
      });

      const zoneComps = this.completions.filter((c) => c.metadata?.zone_id === zId);
      const totalXPGen = zoneComps.reduce((sum, c) => sum + c.xp_earned, 0);

      const stallInteractions = Math.round(visitors * 1.1) + 20;
      const gameInteractions = Math.round(visitors * 0.8) + 15;
      const completionRate = Math.min(100, Math.round((zoneComps.length / Math.max(1, visitors * 3)) * 100));

      results.push({
        rank: 0,
        zone_id: zone.id,
        name: zone.name,
        slug: zone.slug,
        coins_collected: zone.coins_collected || 0,
        participants_count: visitors || 300,
        experiences_completed_count: zoneComps.length || 850,
        stall_interactions_count: stallInteractions,
        games_played_count: gameInteractions,
        total_xp_generated: totalXPGen || 120000,
        completion_rate_percent: completionRate || 68,
      });
    });

    // Rank strictly by coins_collected descending (Section 27)
    results.sort((a, b) => b.coins_collected - a.coins_collected);
    results.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return results;
  }

  // --- INDIVIDUAL LEADERBOARD (Ranked by XP, Section 28) ---
  getLeaderboard(eventId: string, limit = 50): MockLeaderboardEntry[] {
    const list: MockLeaderboardEntry[] = [];

    this.profiles.forEach((profile) => {
      const userComps = this.completions.filter((c) => c.profile_id === profile.id);
      const totalXP = userComps.reduce((sum, c) => sum + c.xp_earned, 0);

      const stamps = this.passportStamps.get(profile.id);
      const zonesCount = stamps ? stamps.size : 0;
      const experiencesCount = userComps.length;

      const wallet = this.wallets.get(`${eventId}:${profile.id}`);
      const coins = wallet ? wallet.balance : 0;

      let userLevel = this.levels[0];
      for (const lvl of this.levels) {
        if (totalXP >= lvl.min_xp) {
          if (lvl.max_xp === null || totalXP <= lvl.max_xp) {
            userLevel = lvl;
          }
        }
      }

      const assignedZone = profile.assigned_zone_id ? this.zones.get(profile.assigned_zone_id)?.name : undefined;

      list.push({
        rank: 0,
        profile_id: profile.id,
        vibe_id: profile.vibe_id,
        display_name: profile.display_name,
        college: profile.college || "District 3192",
        club: profile.club || "Rotaract Club",
        instagram_id: profile.instagram_id || undefined,
        assigned_zone_name: assignedZone,
        xp: totalXP,
        coins,
        level: userLevel.name,
        level_number: userLevel.sort_order,
        zones_visited_count: zonesCount,
        experiences_completed_count: experiencesCount,
        created_at: profile.created_at,
      });
    });

    // Sort by XP descending (Primary), then zones_visited_count, then experiences_completed_count, then earliest
    list.sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      if (b.zones_visited_count !== a.zones_visited_count) {
        return b.zones_visited_count - a.zones_visited_count;
      }
      if (b.experiences_completed_count !== a.experiences_completed_count) {
        return b.experiences_completed_count - a.experiences_completed_count;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

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
        qualified = userStamps.size >= (ach.condition_config.target || 6);
      } else if (ach.condition_type === "stalls_visited") {
        qualified = userComps.filter((c) => c.metadata?.stall_id).length >= (ach.condition_config.target || 5);
      } else if (ach.condition_type === "games_completed") {
        const gamesPlayed = new Set(this.gameSessions.filter((g) => g.profile_id === profileId).map((g) => g.game_type)).size;
        qualified = gamesPlayed >= (ach.condition_config.target || 4);
      } else if (ach.condition_type === "vibe_master") {
        const gamesPlayed = new Set(this.gameSessions.filter((g) => g.profile_id === profileId).map((g) => g.game_type)).size;
        qualified = userStamps.size >= 6 && gamesPlayed >= 4;
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
    const distinctGames = new Set(this.gameSessions.filter((g) => g.profile_id === profileId).map((g) => g.game_type)).size;
    const stallCompsCount = userComps.filter((c) => c.metadata?.stall_id || c.metadata?.type === "stall_photo").length;

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
      } else if (quest.condition_type === "all_zones_completed") {
        qp.progress_value = Math.min(userStamps.size, qp.target_value);
      } else if (quest.condition_type === "stalls_visited") {
        qp.progress_value = Math.min(stallCompsCount, qp.target_value);
      } else if (quest.condition_type === "games_completed") {
        qp.progress_value = Math.min(distinctGames, qp.target_value);
      } else if (quest.condition_type === "vibe_master") {
        const totalProgress = userStamps.size + stallCompsCount + distinctGames;
        qp.progress_value = Math.min(totalProgress, qp.target_value);
      }

      if (qp.progress_value >= qp.target_value && !qp.completed_at) {
        qp.completed_at = new Date().toISOString();
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

const globalForStore = globalThis as unknown as { vibeStore: VibeMemoryDatabase };
export const mockDb = globalForStore.vibeStore || new VibeMemoryDatabase();
if (process.env.NODE_ENV !== "production") globalForStore.vibeStore = mockDb;
