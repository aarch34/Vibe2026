const { createClient } = require("d:/The Scenc Co. Projects/Vibe2026/node_modules/@supabase/supabase-js");
const fs = require("fs");

const envText = fs.readFileSync("d:/The Scenc Co. Projects/Vibe2026/.env.local", "utf8");
const env = {};
envText.split("\n").forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(url, serviceKey);

const eventId = "a0000000-0000-0000-0000-000000000001";

async function syncDatabase() {
  console.log("Synchronizing official VIBE 2026 data in Supabase...");

  // 1. Update event name
  await supabase.from("events").update({
    name: "ROCCO 2026 — Rotaract District 3192 Freshers Party",
    description: "The official gamified fresher party experience featuring 6 zones, live zone battle, mini-games, and individual XP leaderboard."
  }).eq("id", eventId);

  // 2. Official 6 Zones
  const officialZones = [
    {
      id: "d0000000-0000-0000-0000-000000000001",
      event_id: eventId,
      name: "Arnava",
      slug: "arnava",
      description: "The Rising Tide. High-intensity interactive challenges and team coordination.",
      sort_order: 1,
      is_active: true,
      map_data: { x: 120, y: 90, color: "#0284C7", icon: "Waves", coins_collected: 0 }
    },
    {
      id: "d0000000-0000-0000-0000-000000000002",
      event_id: eventId,
      name: "Taranaga",
      slug: "taranaga",
      description: "The Electric Ripple. Rapid rhythm face-offs, dance encounters and audio-visual beats.",
      sort_order: 2,
      is_active: true,
      map_data: { x: 280, y: 90, color: "#6366F1", icon: "Activity", coins_collected: 0 }
    },
    {
      id: "d0000000-0000-0000-0000-000000000003",
      event_id: eventId,
      name: "Sagara",
      slug: "sagara",
      description: "The Deep Ocean. Mystery puzzles, cryptic cipher runs and deep dive explorations.",
      sort_order: 3,
      is_active: true,
      map_data: { x: 200, y: 180, color: "#0EA5E9", icon: "Compass", coins_collected: 0 }
    },
    {
      id: "d0000000-0000-0000-0000-000000000004",
      event_id: eventId,
      name: "Pravaha",
      slug: "pravaha",
      description: "The Rushing Current. Adrenaline sports, agility obstacle courses and rapid relays.",
      sort_order: 4,
      is_active: true,
      map_data: { x: 90, y: 260, color: "#10B981", icon: "Zap", coins_collected: 0 }
    },
    {
      id: "d0000000-0000-0000-0000-000000000005",
      event_id: eventId,
      name: "Samudhra",
      slug: "samudhra",
      description: "The Endless Ocean. Fellowship arena, social bonding spots and creator photo rigs.",
      sort_order: 5,
      is_active: true,
      map_data: { x: 310, y: 260, color: "#F59E0B", icon: "Users", coins_collected: 0 }
    },
    {
      id: "d0000000-0000-0000-0000-000000000006",
      event_id: eventId,
      name: "Varuna",
      slug: "varuna",
      description: "The Celestial Waters. The festival crown zone, grand stage spectacle and midnight showdown.",
      sort_order: 6,
      is_active: true,
      map_data: { x: 200, y: 340, color: "#EC4899", icon: "Sparkles", coins_collected: 0 }
    }
  ];

  for (const z of officialZones) {
    const { error } = await supabase.from("zones").upsert(z);
    if (error) console.error("Error upserting zone", z.name, error);
    else console.log("Upserted official zone:", z.name);
  }

  // Deactivate 7th zone (Secret Vault / fake zone)
  await supabase.from("zones").update({ is_active: false }).eq("id", "d0000000-0000-0000-0000-000000000007");

  // 3. Official Experiences for each Zone
  const officialExps = [
    {
      id: "e0000000-0000-0000-0000-000000000001",
      event_id: eventId,
      zone_id: "d0000000-0000-0000-0000-000000000001",
      title: "Arnava Wave Tag & Icebreaker",
      slug: "arnava-icebreaker",
      description: "Break the ice with fellow freshers through cooperative tag and checkpoint check-in.",
      coin_cost: 0,
      xp_reward: 75,
      coin_reward: 10,
      max_attempts: 5,
      cooldown_seconds: 0,
      is_active: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000002",
      event_id: eventId,
      zone_id: "d0000000-0000-0000-0000-000000000002",
      title: "Taranaga Soundwave Rhythm Clash",
      slug: "taranaga-rhythm",
      description: "Step onto the rhythm stage and match the live DJ beats for team glory.",
      coin_cost: 0,
      xp_reward: 75,
      coin_reward: 10,
      max_attempts: 5,
      cooldown_seconds: 0,
      is_active: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000003",
      event_id: eventId,
      zone_id: "d0000000-0000-0000-0000-000000000003",
      title: "Sagara Deep Dive Riddle & Cipher",
      slug: "sagara-riddle",
      description: "Decipher the ancient ocean cipher to unlock Sagara zone prestige.",
      coin_cost: 0,
      xp_reward: 100,
      coin_reward: 15,
      max_attempts: 5,
      cooldown_seconds: 0,
      is_active: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000004",
      event_id: eventId,
      zone_id: "d0000000-0000-0000-0000-000000000004",
      title: "Pravaha Agility Rapids Sprint",
      slug: "pravaha-rapids",
      description: "Timed laser agility sprint testing rapid reflexes across the stream.",
      coin_cost: 0,
      xp_reward: 75,
      coin_reward: 10,
      max_attempts: 5,
      cooldown_seconds: 0,
      is_active: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000005",
      event_id: eventId,
      zone_id: "d0000000-0000-0000-0000-000000000005",
      title: "Samudhra 360 Glam Photo Rig",
      slug: "samudhra-glam",
      description: "Capture your signature festival vibe on the spinning neon glam platform.",
      coin_cost: 0,
      xp_reward: 75,
      coin_reward: 10,
      max_attempts: 5,
      cooldown_seconds: 0,
      is_active: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000006",
      event_id: eventId,
      zone_id: "d0000000-0000-0000-0000-000000000006",
      title: "Varuna Celestial Grand Stage Challenge",
      slug: "varuna-spectacle",
      description: "The festival mainstage challenge with live crowd cheering.",
      coin_cost: 0,
      xp_reward: 100,
      coin_reward: 20,
      max_attempts: 5,
      cooldown_seconds: 0,
      is_active: true
    },
    // Mini-Games (Free to play, modest XP)
    {
      id: "e0000000-0000-0000-0000-000000000011",
      event_id: eventId,
      zone_id: "d0000000-0000-0000-0000-000000000001",
      title: "Rotaract Trivia Game",
      slug: "rotaract-game",
      description: "Trivia challenge about Rotaract and District 3192.",
      coin_cost: 0,
      xp_reward: 20,
      coin_reward: 0,
      max_attempts: 999,
      cooldown_seconds: 0,
      is_active: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000012",
      event_id: eventId,
      zone_id: "d0000000-0000-0000-0000-000000000002",
      title: "Minion VIBE Run",
      slug: "minion-run",
      description: "3-lane reaction runner dodging waves and collecting bananas.",
      coin_cost: 0,
      xp_reward: 25,
      coin_reward: 0,
      max_attempts: 999,
      cooldown_seconds: 0,
      is_active: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000013",
      event_id: eventId,
      zone_id: "d0000000-0000-0000-0000-000000000003",
      title: "Memory Match",
      slug: "memory-game",
      description: "Card flip memory matching game.",
      coin_cost: 0,
      xp_reward: 20,
      coin_reward: 0,
      max_attempts: 999,
      cooldown_seconds: 0,
      is_active: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000014",
      event_id: eventId,
      zone_id: "d0000000-0000-0000-0000-000000000004",
      title: "ROCCO Festival Quiz",
      slug: "vibe-quiz",
      description: "Dynamic questions celebrating the spirit of ROCCO 2026.",
      coin_cost: 0,
      xp_reward: 20,
      coin_reward: 0,
      max_attempts: 999,
      cooldown_seconds: 0,
      is_active: true
    },
    // Social / Instagram Follow Connect
    {
      id: "e0000000-0000-0000-0000-000000000020",
      event_id: eventId,
      zone_id: "d0000000-0000-0000-0000-000000000001",
      title: "Instagram Friend Connect",
      slug: "insta-friend-connect",
      description: "Connect with fellow freshers on Instagram to become in-app friends and level up together.",
      coin_cost: 0,
      xp_reward: 25,
      coin_reward: 0,
      max_attempts: 9999,
      cooldown_seconds: 0,
      is_active: true
    }
  ];

  for (const exp of officialExps) {
    const { error } = await supabase.from("experiences").upsert(exp);
    if (error) console.error("Error upserting exp", exp.title, error);
    else console.log("Upserted official exp:", exp.title);
  }

  // 4. Official QR Codes
  const qrCodes = [
    // Zone Checkpoint QRs
    { id: "f0000000-0000-0000-0000-000000000001", event_id: eventId, experience_id: officialExps[0].id, code: "vibe-zone-arnava-xp", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000002", event_id: eventId, experience_id: officialExps[1].id, code: "vibe-zone-taranaga-xp", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000003", event_id: eventId, experience_id: officialExps[2].id, code: "vibe-zone-sagara-xp", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000004", event_id: eventId, experience_id: officialExps[3].id, code: "vibe-zone-pravaha-xp", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000005", event_id: eventId, experience_id: officialExps[4].id, code: "vibe-zone-samudhra-xp", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000006", event_id: eventId, experience_id: officialExps[5].id, code: "vibe-zone-varuna-xp", is_active: true },

    // Quick Aliases for easy testing
    { id: "f0000000-0000-0000-0000-000000000011", event_id: eventId, experience_id: officialExps[0].id, code: "vibe-icebreaker-arnava", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000012", event_id: eventId, experience_id: officialExps[1].id, code: "vibe-mystery-taranaga", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000013", event_id: eventId, experience_id: officialExps[2].id, code: "vibe-final-wave-sagara", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000014", event_id: eventId, experience_id: officialExps[3].id, code: "vibe-flow-pravaha", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000015", event_id: eventId, experience_id: officialExps[4].id, code: "vibe-hidden-tree-01", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000016", event_id: eventId, experience_id: officialExps[5].id, code: "vibe-stage-challenge-2026", is_active: true },

    // Stalls QRs
    { id: "f0000000-0000-0000-0000-000000000021", event_id: eventId, experience_id: officialExps[0].id, code: "vibe-stall-memory-xp", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000022", event_id: eventId, experience_id: officialExps[4].id, code: "vibe-stall-glam-xp", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000023", event_id: eventId, experience_id: officialExps[3].id, code: "vibe-stall-ring-xp", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000024", event_id: eventId, experience_id: officialExps[1].id, code: "vibe-stall-taco-xp", is_active: true },
    { id: "f0000000-0000-0000-0000-000000000025", event_id: eventId, experience_id: officialExps[2].id, code: "vibe-stall-neon-xp", is_active: true }
  ];

  for (const qr of qrCodes) {
    const { error } = await supabase.from("qr_codes").upsert(qr);
    if (error) console.error("Error upserting qr", qr.code, error);
    else console.log("Upserted official QR code:", qr.code);
  }

  console.log("Database synchronization complete!");
}

syncDatabase().catch(console.error);
