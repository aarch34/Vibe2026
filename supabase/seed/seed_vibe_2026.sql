-- VIBE 2026 Seed Data — Complete Game Economy Architecture
-- Initial Event: Rotaract District 3192 Freshers Party
-- Philosophy: "Coins measure your choices. XP measures your journey."

-- 1. Initial Event
insert into events (id, name, slug, description, start_time, end_time, status, config)
values (
  'a0000000-0000-0000-0000-000000000001',
  'VIBE 2026 — Rotaract District 3192 Freshers Party',
  'vibe-2026',
  'The flagship mobile-first gamified freshers party transforming the physical venue into an interactive digital universe.',
  '2026-09-07 10:00:00+00',
  '2026-09-07 22:00:00+00',
  'live',
  '{"starting_coins": 500, "allow_redemptions": true, "leaderboard_public": true, "zone_discovery_coins": 50, "zone_discovery_xp": 100}'::jsonb
)
on conflict (slug) do update set 
  name = excluded.name,
  status = 'live';

-- 2. 6 Levels Progression
insert into levels (id, event_id, name, min_xp, max_xp, sort_order)
values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '🌱 VIBE Newbie', 0, 249, 1),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '✨ VIBE Explorer', 250, 599, 2),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '🔥 VIBE Seeker', 600, 999, 3),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '⚡ VIBE Rider', 1000, 1499, 4),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '💫 VIBE Addict', 1500, 2499, 5),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '👑 VIBE Legend', 2500, null, 6)
on conflict do nothing;

-- 3. Sponsors
insert into sponsors (id, event_id, name, description)
values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Red Bull', 'Gives you wings for high energy party zones!'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Spotify India', 'Official Sound & DJ Experience Partner'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'OnePlus', 'Never Settle Experience Hub')
on conflict do nothing;

-- 4. 7 Event Zones
insert into zones (id, event_id, name, slug, description, sort_order, map_data)
values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Cyber Arcade', 'zone-arcade', 'Futuristic gaming rigs, retro arcade consoles and VR simulations.', 1, '{"x": 120, "y": 80, "color": "#3B82F6", "icon": "Gamepad2"}'::jsonb),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Neon Arena', 'zone-arena', 'Fast-paced laser tag, glow team challenges and tactical arenas.', 2, '{"x": 280, "y": 90, "color": "#8B5CF6", "icon": "Zap"}'::jsonb),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Pulse Stage', 'zone-stage', 'The main festival beat, live DJ battles, EDM beats and dance face-offs.', 3, '{"x": 200, "y": 180, "color": "#EC4899", "icon": "Music"}'::jsonb),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Chillout Lounge', 'zone-lounge', 'Acoustic corners, mocktails, hammocks and social bonding spots.', 4, '{"x": 80, "y": 240, "color": "#10B981", "icon": "Coffee"}'::jsonb),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Creator Studio', 'zone-creator', '360 glam cam, neon photo rigs, content capture and reels zone.', 5, '{"x": 320, "y": 240, "color": "#06B6D4", "icon": "Camera"}'::jsonb),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Food Bazaar', 'zone-bazaar', 'Gourmet sliders, nitro ice creams, boba teas and foodie quests.', 6, '{"x": 140, "y": 320, "color": "#F59E0B", "icon": "Utensils"}'::jsonb),
  ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Secret Vault', 'zone-vault', 'The hidden puzzle vault. Crack the riddles to claim legendary XP.', 7, '{"x": 260, "y": 320, "color": "#E11D48", "icon": "Lock"}'::jsonb)
on conflict (event_id, slug) do nothing;

-- 5. Experiences (Tiered Pricing: 25, 50, 75, 100, 150)
insert into experiences (id, event_id, zone_id, sponsor_id, title, slug, description, coin_cost, xp_reward, coin_reward, max_attempts, cooldown_seconds)
values
  -- Quick Interaction (25 Coins, +40 XP)
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', null, 'Chillout Quick Sip Check-in', 'exp-mocktail-lab', 'Craft your signature fresher mocktail with our mixologists.', 25, 40, 10, 1, 0),
  -- Easy Challenge (50 Coins, +75 XP)
  ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', null, 'Spicy Taco Blitz Challenge', 'exp-taco-blitz', 'Taste-test the mystery spicy taco challenge and earn foodie prestige.', 50, 75, 20, 1, 0),
  -- Standard Challenge (75 Coins, +125 XP)
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'DJ Drop Dance Face-off', 'exp-dj-drop', 'Step onto the interactive sound-floor and dance with the live DJ mix.', 75, 125, 30, 2, 600),
  -- Major Experience (100 Coins, +175 XP)
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'VR Cyber Flight Simulator', 'exp-vr-flight', 'Take the cockpit in a supersonic VR race through neo-Bangalore!', 100, 175, 35, 2, 300),
  -- Premium Experience (150 Coins, +250 XP)
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Neon Laser Tag Showdown', 'exp-laser-tag', 'Tactical 3v3 neon combat. Tag your rivals and capture the arena node.', 150, 250, 50, 1, 0),
  -- Creator Experience (75 Coins, +125 XP)
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', '360 Glow Reel Booth', 'exp-360-reels', 'Step into the rotating 360 camera platform with neon light trails.', 75, 125, 25, 2, 600),
  -- Mystery Secret Challenge (100 Coins, +500 XP)
  ('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000007', null, 'Cipher of District 3192', 'exp-vault-cipher', 'Solve the 3-part cipher concealed inside the secret vault.', 100, 500, 100, 1, 0)
on conflict (event_id, slug) do nothing;

-- 6. QR Codes for Experiences
insert into qr_codes (id, event_id, experience_id, code)
values
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'vibe-arcade-vr-2026'),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'vibe-arena-laser-2026'),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'vibe-stage-dj-2026'),
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004', 'vibe-lounge-mocktail-2026'),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 'vibe-creator-360-2026'),
  ('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006', 'vibe-bazaar-taco-2026'),
  ('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000007', 'vibe-vault-cipher-2026')
on conflict (code) do nothing;

-- 7. Quests (Exploration, Social, Challenge & Grand Tour)
insert into quests (id, event_id, title, description, condition_type, condition_config, xp_reward, coin_reward)
values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'The Explorer', 'Visit 3 different event zones.', 'zones_visited', '{"target": 3}'::jsonb, 200, 150),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Social Butterfly', 'Complete experiences at 5 different stalls across the venue.', 'experiences_completed', '{"target": 5}'::jsonb, 250, 200),
  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Challenge Accepted', 'Complete 5 event challenges.', 'experiences_completed', '{"target": 5}'::jsonb, 300, 150),
  ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'VIBE Master (Grand Tour)', 'Visit and conquer all 7 venue zones.', 'all_zones_completed', '{"target": 7}'::jsonb, 500, 500)
on conflict do nothing;

-- 8. Achievements
insert into achievements (id, event_id, name, description, condition_type, condition_config)
values
  ('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Explorer', 'Visit your first 3 venue zones.', 'zones_visited', '{"target": 3}'::jsonb),
  ('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'VIBE Explorer (Grand Tour)', 'Unlock all 7 zones in your digital Passport.', 'all_zones_completed', '{"target": 7}'::jsonb),
  ('20000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Challenger', 'Complete 5 event experiences successfully.', 'experiences_completed', '{"target": 5}'::jsonb),
  ('20000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'VIBE Legend', 'Ascend to Level 6: 👑 VIBE Legend status.', 'reach_level', '{"level": 6}'::jsonb),
  ('20000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Secret Cipher Cracker', 'Conquer the Cipher of District 3192.', 'specific_experience', '{"experience_id": "e0000000-0000-0000-0000-000000000007"}'::jsonb)
on conflict do nothing;

-- 9. Reward Store (Tiers: 100, 150, 250, 300, 500, 750)
insert into rewards (id, event_id, sponsor_id, name, description, coin_cost, stock, redemption_limit)
values
  ('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', null, 'Official VIBE Sticker Pack', 'High-gloss holographic vinyl sticker pack for laptop & phone.', 100, 200, 1),
  ('30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', null, 'Commemorative District 3192 Enamel Pin', 'Exclusive metal collector badge with rotaract freshers insignia.', 150, 150, 1),
  ('30000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Red Bull VIP Food & Drink Coupon', '20% discount coupon redeemable across all festival food bazaar counters.', 250, 100, 2),
  ('30000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Mystery Festival Gift Box', 'Curated box containing headphones, wristbands and surprise swag.', 300, 50, 1),
  ('30000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', null, 'Limited-Edition VIBE T-Shirt', 'Official festival streetwear heavyweight tee with neon screenprint.', 500, 30, 1),
  ('30000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'VIP All-Access & After-Party Pass', 'Backstage artist lounge access + premium after-party entry.', 750, 10, 1)
on conflict do nothing;
