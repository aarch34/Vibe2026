-- Migration: 20260907000001_baseline_schema.sql
-- Description: Baseline schema for VIBE platform according to VIBE Engineering Bible

create extension if not exists pgcrypto;

-- Enumerated types
do $$ begin
  create type event_status as enum ('draft','live','paused','ended','archived');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type member_role as enum ('attendee','staff','admin','super_admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type wallet_tx_type as enum ('initial_credit','earn','spend','refund','admin_adjustment','reward_redemption');
exception
  when duplicate_object then null;
end $$;

-- 1. Events table
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  status event_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text not null default 'Asia/Kolkata',
  starting_coins integer not null default 500 check (starting_coins >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Profiles table (mapped to Clerk)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  vibe_id text not null unique,
  display_name text not null,
  avatar_media_id uuid,
  college text,
  club text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Event Members table
create table if not exists event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role member_role not null default 'attendee',
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  unique(event_id, profile_id)
);

-- 4. Sponsors table
create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  logo_media_id uuid,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 5. Zones table
create table if not exists zones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  image_media_id uuid,
  map_data jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  unique(event_id, slug)
);

-- 6. Experiences table
create table if not exists experiences (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  zone_id uuid not null references zones(id) on delete cascade,
  sponsor_id uuid references sponsors(id) on delete set null,
  title text not null,
  slug text not null,
  description text,
  image_media_id uuid,
  video_media_id uuid,
  coin_cost integer not null default 0 check (coin_cost >= 0),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  coin_reward integer not null default 0 check (coin_reward >= 0),
  max_attempts integer not null default 1 check (max_attempts > 0),
  cooldown_seconds integer not null default 0 check (cooldown_seconds >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  unique(event_id, slug)
);

-- 7. QR Codes table
create table if not exists qr_codes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  experience_id uuid not null references experiences(id) on delete cascade,
  code text not null unique,
  version integer not null default 1,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 8. Wallets table
create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  version bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, profile_id)
);

-- 9. Wallet Transactions ledger
create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references wallets(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  type wallet_tx_type not null,
  amount integer not null,
  balance_before integer not null check (balance_before >= 0),
  balance_after integer not null check (balance_after >= 0),
  source_type text,
  source_id uuid,
  idempotency_key text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique(profile_id, event_id, idempotency_key)
);

-- 10. Levels table
create table if not exists levels (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  min_xp integer not null check (min_xp >= 0),
  max_xp integer,
  badge_media_id uuid,
  sort_order integer not null default 0
);

-- 11. Experience Completions table
create table if not exists experience_completions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  experience_id uuid not null references experiences(id) on delete cascade,
  qr_code_id uuid references qr_codes(id) on delete set null,
  attempt_number integer not null,
  coin_spent integer not null default 0,
  xp_earned integer not null default 0,
  coin_earned integer not null default 0,
  completed_at timestamptz not null default now(),
  metadata jsonb
);

-- 12. Quests table
create table if not exists quests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text not null,
  description text,
  condition_type text not null,
  condition_config jsonb not null default '{}'::jsonb,
  xp_reward integer not null default 0,
  coin_reward integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true
);

-- 13. Quest Progress table
create table if not exists quest_progress (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  progress_value integer not null default 0,
  target_value integer not null default 1,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(profile_id, quest_id)
);

-- 14. Achievements table
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  description text,
  condition_type text not null,
  condition_config jsonb not null default '{}'::jsonb,
  badge_media_id uuid,
  is_active boolean not null default true
);

-- 15. User Achievements table
create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(profile_id, achievement_id)
);

-- 16. Rewards table
create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  sponsor_id uuid references sponsors(id) on delete set null,
  name text not null,
  description text,
  image_media_id uuid,
  coin_cost integer not null check (coin_cost >= 0),
  stock integer not null default 0 check (stock >= 0),
  redemption_limit integer,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true
);

-- 17. Reward Redemptions table
create table if not exists reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  reward_id uuid not null references rewards(id) on delete restrict,
  code text not null unique,
  coin_cost integer not null,
  status text not null default 'pending',
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 18. Sponsor Interactions table
create table if not exists sponsor_interactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  sponsor_id uuid not null references sponsors(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  experience_id uuid references experiences(id) on delete set null,
  interaction_type text not null,
  created_at timestamptz not null default now()
);

-- 19. Staff Members table
create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role member_role not null,
  created_at timestamptz not null default now(),
  unique(event_id, profile_id)
);

-- 20. Staff Zone Assignments table
create table if not exists staff_zone_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null references staff_members(id) on delete cascade,
  zone_id uuid not null references zones(id) on delete cascade,
  unique(staff_member_id, zone_id)
);

-- 21. Analytics Events table
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  event_name text not null,
  zone_id uuid references zones(id) on delete set null,
  experience_id uuid references experiences(id) on delete set null,
  sponsor_id uuid references sponsors(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 22. Notifications table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 23. Media Assets table
create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  owner_profile_id uuid references profiles(id) on delete set null,
  object_key text not null,
  bucket text not null,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  created_at timestamptz not null default now()
);

-- 24. Audit Logs table
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  actor_profile_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

-- Core indexes for performance & scale
create index if not exists idx_event_members_event on event_members(event_id);
create index if not exists idx_wallet_tx_profile_time on wallet_transactions(profile_id, created_at desc);
create index if not exists idx_wallet_tx_event on wallet_transactions(event_id);
create index if not exists idx_completion_profile_exp on experience_completions(profile_id, experience_id);
create index if not exists idx_completion_event_time on experience_completions(event_id, completed_at desc);
create index if not exists idx_analytics_event_time on analytics_events(event_id, created_at desc);
create index if not exists idx_qr_code on qr_codes(code);
create index if not exists idx_rewards_event_active on rewards(event_id, is_active);
create index if not exists idx_experience_event_zone on experiences(event_id, zone_id);
create index if not exists idx_zones_event_order on zones(event_id, sort_order asc);
