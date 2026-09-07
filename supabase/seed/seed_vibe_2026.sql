-- Seed data for VIBE 2026 (Rotaract District 3192 Freshers Party)

-- 1. Main Event
insert into events (id, slug, name, description, status, starts_at, ends_at, starting_coins)
values (
  'a0000000-0000-0000-0000-000000000001',
  'vibe-2026',
  'VIBE 2026 — Rotaract District 3192 Freshers Party',
  'The flagship gamified fresher party experience. Explore zones, scan QR codes, unlock experiences, earn coins, and compete on the district leaderboard!',
  'live',
  now() - interval '2 hours',
  now() + interval '12 hours',
  500
) on conflict (slug) do update set
  name = excluded.name,
  status = 'live';

-- 2. Levels
insert into levels (id, event_id, name, min_xp, max_xp, sort_order)
values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'VIBE Newbie', 0, 499, 1),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'VIBE Explorer', 500, 1199, 2),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'VIBE Seeker', 1200, 2499, 3),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'VIBE Rider', 2500, 4999, 4),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'VIBE Legend', 5000, null, 5)
on conflict do nothing;

-- 3. Sponsors
insert into sponsors (id, event_id, name, description)
values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Red Bull', 'Gives you wings for high energy party zones!'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Spotify India', 'Official Sound & DJ Experience Partner'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'OnePlus', 'Never Settle Experience Hub')
on conflict do nothing;

-- 4. 7 Zones
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

-- 5. Experiences
insert into experiences (id, event_id, zone_id, sponsor_id, title, slug, description, coin_cost, xp_reward, coin_reward, max_attempts, cooldown_seconds)
values
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'VR Cyber Flight', 'exp-vr-flight', 'Take the cockpit in a supersonic VR race through neo-Bangalore!', 50, 120, 20, 2, 300),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Neon Laser Tag Showdown', 'exp-laser-tag', 'Tactical 3v3 neon combat. Tag your rivals and capture the arena node.', 80, 250, 40, 1, 0),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'DJ Drop Face-off', 'exp-dj-drop', 'Step onto the interactive sound-floor and dance with the live DJ mix.', 0, 80, 30, 3, 600),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', null, 'Chillout Mocktail Lab', 'exp-mocktail-lab', 'Craft your signature fresher mocktail with our mixologists.', 30, 70, 10, 1, 0),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', '360 Glow Reel Booth', 'exp-360-reels', 'Step into the rotating 360 camera platform with neon light trails.', 40, 150, 20, 2, 600),
  ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', null, 'Spicy Taco Blitz', 'exp-taco-blitz', 'Taste-test the mystery spicy taco challenge and earn foodie prestige.', 40, 110, 30, 1, 0),
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

-- 7. Quests
insert into quests (id, event_id, title, description, condition_type, condition_config, xp_reward, coin_reward)
values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Trailblazer', 'Explore and visit any 3 event zones.', 'zones_visited', '{"target": 3}'::jsonb, 200, 80),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Challenge Triad', 'Complete 3 different experiences across the festival.', 'experiences_completed', '{"target": 3}'::jsonb, 350, 100),
  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Vault Breaker', 'Unlock and conquer the Cipher of District 3192.', 'specific_experience', '{"experience_id": "e0000000-0000-0000-0000-000000000007"}'::jsonb, 500, 150),
  ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'District Grand Tour', 'Visit all 7 event zones in the venue.', 'all_zones_completed', '{"target": 7}'::jsonb, 1000, 400)
on conflict do nothing;

-- 8. Achievements
insert into achievements (id, event_id, name, description, condition_type, condition_config)
values
  ('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Explorer', 'Visit your first 3 venue zones.', 'zones_visited', '{"target": 3}'::jsonb),
  ('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'World Traveller', 'Unlock all 7 zones in your digital Passport.', 'all_zones_completed', '{"target": 7}'::jsonb),
  ('20000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Challenger', 'Complete 5 event experiences successfully.', 'experiences_completed', '{"target": 5}'::jsonb),
  ('20000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'VIBE Legend', 'Ascend to Level 5: VIBE Legend status.', 'reach_level', '{"level": 5}'::jsonb)
on conflict do nothing;

-- 9. Rewards
insert into rewards (id, event_id, sponsor_id, name, description, coin_cost, stock, redemption_limit)
values
  ('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Red Bull VIP Can & Lanyard', 'Instant energy recharge pack at the Red Bull station.', 150, 100, 1),
  ('30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Spotify 3-Month Premium Voucher', 'Ad-free party playlists on Spotify for three months.', 300, 50, 1),
  ('30000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'OnePlus Nord Wireless Earbuds', 'Flagship audio gear awarded to top tier festival performers.', 850, 5, 1),
  ('30000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', null, 'VIBE Official Neon Oversized Hoodie', 'Exclusive limited-edition district freshers streetwear hoodie.', 650, 20, 1),
  ('30000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', null, 'Free Gourmet Boba or Nitro Float', 'Redeemable at the Food Bazaar dessert counter.', 120, 150, 2)
on conflict do nothing;
