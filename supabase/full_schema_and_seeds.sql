-- ============================================================================
-- VIBE / ROCCO 2026 — COMPLETE CONSOLIDATED SUPABASE MASTER SCRIPT
-- ============================================================================
-- Fully idempotent (safe to run on fresh or existing Supabase instances)
-- Contains: Extensions, Enums, Tables, Indexes, RLS Policies, Atomic Stored
--           Procedures (PL/pgSQL), and Official 2026 Seed Catalogs.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 2. CUSTOM ENUM TYPES
-- ----------------------------------------------------------------------------
do $$ begin
  create type event_status as enum ('draft', 'live', 'paused', 'ended', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type member_role as enum ('attendee', 'staff', 'admin', 'super_admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type wallet_tx_type as enum (
    'initial_credit',
    'earn',
    'spend',
    'refund',
    'admin_adjustment',
    'reward_redemption',
    'duty_reward'
  );
exception
  when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- 3. CORE SCHEMA TABLES
-- ----------------------------------------------------------------------------

-- 3.1 Events
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

-- 3.2 Zones (The 6 Oceanic Teams)
create table if not exists zones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  image_media_id uuid,
  map_data jsonb,
  sort_order integer not null default 0,
  coins_collected integer not null default 0 check (coins_collected >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(event_id, slug)
);

-- Ensure coins_collected column exists if table already existed
alter table zones add column if not exists coins_collected integer not null default 0 check (coins_collected >= 0);

-- 3.3 Profiles (Unified Attendee Identity)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  vibe_id text not null unique,
  display_name text not null,
  avatar_media_id uuid,
  college text,
  club text,
  phone text,
  email text,
  instagram_id text,
  registration_id text,
  assigned_zone_id uuid references zones(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure extended profile fields exist
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists email text;
alter table profiles add column if not exists instagram_id text;
alter table profiles add column if not exists registration_id text;
alter table profiles add column if not exists assigned_zone_id uuid references zones(id) on delete set null;

-- 3.4 Event Members
create table if not exists event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role member_role not null default 'attendee',
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  unique(event_id, profile_id)
);

-- 3.5 Sponsors
create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  logo_media_id uuid,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3.6 Experiences (Zone checkpoints, mini-games, challenges)
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
  created_at timestamptz not null default now(),
  unique(event_id, slug)
);

-- 3.7 QR Codes
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

-- 3.8 Wallets
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

-- 3.9 Wallet Transactions (Double-Entry Ledger)
create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references wallets(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  amount integer not null,
  balance_before integer not null check (balance_before >= 0),
  balance_after integer not null check (balance_after >= 0),
  source_type text,
  source_id text,
  idempotency_key text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique(profile_id, event_id, idempotency_key)
);

-- Ensure source_id is text for flexible polymorphic referencing
do $$ begin
  alter table wallet_transactions alter column source_id type text using source_id::text;
exception when others then null; end $$;

-- 3.10 Levels
create table if not exists levels (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  min_xp integer not null check (min_xp >= 0),
  max_xp integer,
  badge_media_id uuid,
  sort_order integer not null default 0
);

-- 3.11 Experience Completions
create table if not exists experience_completions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  experience_id uuid references experiences(id) on delete set null,
  qr_code_id uuid references qr_codes(id) on delete set null,
  attempt_number integer not null,
  coin_spent integer not null default 0,
  xp_earned integer not null default 0,
  coin_earned integer not null default 0,
  completed_at timestamptz not null default now(),
  metadata jsonb
);

-- Ensure experience_id is nullable for duty rewards and freeform activities
do $$ begin
  alter table experience_completions alter column experience_id drop not null;
exception when others then null; end $$;

-- 3.12 Quests
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

-- 3.13 Quest Progress
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

-- 3.14 Achievements
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

-- 3.15 User Achievements
create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(profile_id, achievement_id)
);

-- 3.16 Rewards
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

-- 3.17 Reward Redemptions
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

-- 3.18 Sponsor Interactions
create table if not exists sponsor_interactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  sponsor_id uuid not null references sponsors(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  experience_id uuid references experiences(id) on delete set null,
  interaction_type text not null,
  created_at timestamptz not null default now()
);

-- 3.19 Staff Members
create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role member_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique(event_id, profile_id)
);

-- 3.20 Staff Zone Assignments (Dynamic Admin Delegation)
create table if not exists staff_zone_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null references staff_members(id) on delete cascade,
  zone_id uuid not null references zones(id) on delete cascade,
  staff_type text not null default 'zonal_head' check (staff_type in ('zonal_head', 'zonal_staff')),
  custom_passcode text,
  assigned_by uuid references profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(staff_member_id, zone_id)
);

-- Ensure staff_zone_assignments fields exist
alter table staff_zone_assignments add column if not exists staff_type text not null default 'zonal_head' check (staff_type in ('zonal_head', 'zonal_staff'));
alter table staff_zone_assignments add column if not exists custom_passcode text;
alter table staff_zone_assignments add column if not exists assigned_by uuid references profiles(id) on delete set null;
alter table staff_zone_assignments add column if not exists is_active boolean not null default true;
alter table staff_zone_assignments add column if not exists updated_at timestamptz not null default now();

-- 3.21 Duty Rewards (Volunteer XP & Coins Ledger)
create table if not exists duty_rewards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  zone_id uuid not null references zones(id) on delete cascade,
  staff_profile_id uuid not null references profiles(id) on delete cascade,
  recipient_profile_id uuid not null references profiles(id) on delete cascade,
  duty_category text not null,
  description text not null,
  xp_awarded integer not null check (xp_awarded >= 0),
  coins_awarded integer not null default 0 check (coins_awarded >= 0),
  created_at timestamptz not null default now()
);

-- 3.22 Stalls & Verification Queue
create table if not exists stalls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  entry_cost integer not null default 50 check (entry_cost >= 0),
  xp_reward integer not null default 100 check (xp_reward >= 0),
  coin_reward integer not null default 0 check (coin_reward >= 0),
  requires_photo boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(event_id, slug)
);

create table if not exists stall_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  stall_id uuid not null references stalls(id) on delete cascade,
  photo_url text not null,
  instagram_id text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id) on delete set null
);

-- 3.23 Game Sessions
create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  game_type text not null,
  score integer not null default 0,
  max_score integer not null default 100,
  coin_spent integer not null default 0 check (coin_spent >= 0),
  coin_earned integer not null default 0 check (coin_earned >= 0),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  played_at timestamptz not null default now()
);

-- 3.24 Analytics Events
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

-- 3.25 Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3.26 Media Assets
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

-- 3.27 Audit Logs
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  actor_profile_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

-- Ensure entity_id is text for versatile auditing
do $$ begin
  alter table audit_logs alter column entity_id type text using entity_id::text;
exception when others then null; end $$;

-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE & LOOKUP INDEXES
-- ----------------------------------------------------------------------------
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
create index if not exists idx_zones_coins on zones(event_id, coins_collected desc);
create index if not exists idx_stall_photos_event_status on stall_photos(event_id, status);
create index if not exists idx_game_sessions_profile on game_sessions(profile_id, played_at desc);
create index if not exists idx_duty_rewards_zone on duty_rewards(zone_id, created_at desc);
create index if not exists idx_duty_rewards_recipient on duty_rewards(recipient_profile_id, created_at desc);
create index if not exists idx_duty_rewards_event on duty_rewards(event_id, created_at desc);
create index if not exists idx_staff_zone_active on staff_zone_assignments(zone_id, is_active);

-- ----------------------------------------------------------------------------
-- 5. ATOMIC STORED PROCEDURES (SECURITY DEFINER)
-- ----------------------------------------------------------------------------

-- 5.1 Credit Initial Wallet
create or replace function fn_credit_initial_wallet(
  p_event_id uuid,
  p_profile_id uuid,
  p_initial_amount integer default 500
) returns jsonb as $$
declare
  v_wallet_id uuid;
  v_balance integer;
  v_existing_tx_id uuid;
begin
  -- Ensure wallet exists
  insert into wallets (event_id, profile_id, balance, version)
  values (p_event_id, p_profile_id, 0, 0)
  on conflict (event_id, profile_id) do nothing;

  -- Lock wallet
  select id, balance into v_wallet_id, v_balance
  from wallets
  where event_id = p_event_id and profile_id = p_profile_id
  for update;

  -- Check if initial credit already issued
  select id into v_existing_tx_id
  from wallet_transactions
  where profile_id = p_profile_id and event_id = p_event_id and type = 'initial_credit'
  limit 1;

  if v_existing_tx_id is not null then
    return jsonb_build_object(
      'success', true,
      'credited', false,
      'wallet_id', v_wallet_id,
      'balance', v_balance,
      'message', 'Initial wallet credit already applied'
    );
  end if;

  -- Apply credit
  update wallets
  set balance = balance + p_initial_amount,
      version = version + 1,
      updated_at = now()
  where id = v_wallet_id;

  insert into wallet_transactions (
    wallet_id, event_id, profile_id, type, amount,
    balance_before, balance_after, source_type, idempotency_key, metadata
  ) values (
    v_wallet_id, p_event_id, p_profile_id, 'initial_credit', p_initial_amount,
    v_balance, v_balance + p_initial_amount, 'event_signup', 'init_' || p_profile_id::text,
    jsonb_build_object('initial_coins', p_initial_amount)
  );

  return jsonb_build_object(
    'success', true,
    'credited', true,
    'wallet_id', v_wallet_id,
    'balance', v_balance + p_initial_amount
  );
end;
$$ language plpgsql security definer;

-- 5.2 Atomic Spend Wallet
create or replace function fn_spend_wallet_atomic(
  p_event_id uuid,
  p_profile_id uuid,
  p_amount integer,
  p_source_type text,
  p_source_id uuid,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb as $$
declare
  v_wallet_id uuid;
  v_balance integer;
  v_new_balance integer;
  v_existing_tx record;
begin
  if p_amount < 0 then
    return jsonb_build_object('success', false, 'code', 'INVALID_AMOUNT', 'message', 'Spend amount must be positive');
  end if;

  -- Check idempotency
  if p_idempotency_key is not null then
    select * into v_existing_tx
    from wallet_transactions
    where profile_id = p_profile_id and event_id = p_event_id and idempotency_key = p_idempotency_key;

    if found then
      return jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'transaction_id', v_existing_tx.id,
        'balance_before', v_existing_tx.balance_before,
        'balance_after', v_existing_tx.balance_after
      );
    end if;
  end if;

  -- Lock wallet
  select id, balance into v_wallet_id, v_balance
  from wallets
  where event_id = p_event_id and profile_id = p_profile_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'WALLET_NOT_FOUND', 'message', 'Wallet does not exist');
  end if;

  if v_balance < p_amount then
    return jsonb_build_object(
      'success', false,
      'code', 'INSUFFICIENT_COINS',
      'message', 'You do not have enough VIBE Coins',
      'current_balance', v_balance,
      'required_balance', p_amount
    );
  end if;

  v_new_balance := v_balance - p_amount;

  update wallets
  set balance = v_new_balance,
      version = version + 1,
      updated_at = now()
  where id = v_wallet_id;

  insert into wallet_transactions (
    wallet_id, event_id, profile_id, type, amount,
    balance_before, balance_after, source_type, source_id, idempotency_key, metadata
  ) values (
    v_wallet_id, p_event_id, p_profile_id, 'spend', p_amount,
    v_balance, v_new_balance, p_source_type, p_source_id::text, p_idempotency_key, p_metadata
  );

  return jsonb_build_object(
    'success', true,
    'balance_before', v_balance,
    'balance_after', v_new_balance,
    'amount_spent', p_amount
  );
end;
$$ language plpgsql security definer;

-- 5.3 Atomic Complete Experience (Earn XP + Zone Coins Allocation)
create or replace function fn_complete_experience_atomic(
  p_event_id uuid,
  p_profile_id uuid,
  p_experience_id uuid,
  p_qr_code_id uuid default null,
  p_idempotency_key text default null
) returns jsonb as $$
declare
  v_exp record;
  v_wallet_id uuid;
  v_balance integer;
  v_new_balance integer;
  v_completion_count integer;
  v_last_completion timestamptz;
  v_attempt_number integer;
  v_completion_id uuid;
begin
  -- Validate Experience
  select * into v_exp
  from experiences
  where id = p_experience_id and event_id = p_event_id;

  if not found or not v_exp.is_active then
    return jsonb_build_object('success', false, 'code', 'EXPERIENCE_UNAVAILABLE', 'message', 'Experience is unavailable or inactive');
  end if;

  -- Validate Time Window
  if v_exp.starts_at is not null and now() < v_exp.starts_at then
    return jsonb_build_object('success', false, 'code', 'EXPERIENCE_NOT_STARTED', 'message', 'Experience has not started yet');
  end if;
  if v_exp.ends_at is not null and now() > v_exp.ends_at then
    return jsonb_build_object('success', false, 'code', 'EXPERIENCE_ENDED', 'message', 'Experience has already ended');
  end if;

  -- Validate Attempts and Cooldown
  select count(*), max(completed_at)
  into v_completion_count, v_last_completion
  from experience_completions
  where profile_id = p_profile_id and experience_id = p_experience_id;

  if v_completion_count >= v_exp.max_attempts then
    return jsonb_build_object('success', false, 'code', 'MAX_ATTEMPTS_REACHED', 'message', 'You have already completed the maximum attempts for this experience');
  end if;

  if v_exp.cooldown_seconds > 0 and v_last_completion is not null then
    if now() < (v_last_completion + (v_exp.cooldown_seconds || ' seconds')::interval) then
      return jsonb_build_object('success', false, 'code', 'COOLDOWN_ACTIVE', 'message', 'Experience is on cooldown. Please wait before attempting again.');
    end if;
  end if;

  v_attempt_number := v_completion_count + 1;

  -- Lock Wallet
  select id, balance into v_wallet_id, v_balance
  from wallets
  where event_id = p_event_id and profile_id = p_profile_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'WALLET_NOT_FOUND', 'message', 'Wallet not found');
  end if;

  -- Balance check
  if v_exp.coin_cost > 0 and v_balance < v_exp.coin_cost then
    return jsonb_build_object('success', false, 'code', 'INSUFFICIENT_COINS', 'message', 'You need ' || v_exp.coin_cost || ' coins to unlock this experience');
  end if;

  -- Compute new balance
  v_new_balance := v_balance - v_exp.coin_cost + v_exp.coin_reward;

  update wallets
  set balance = v_new_balance,
      version = version + 1,
      updated_at = now()
  where id = v_wallet_id;

  -- Ledger for spend
  if v_exp.coin_cost > 0 then
    insert into wallet_transactions (
      wallet_id, event_id, profile_id, type, amount,
      balance_before, balance_after, source_type, source_id, idempotency_key, metadata
    ) values (
      v_wallet_id, p_event_id, p_profile_id, 'spend', v_exp.coin_cost,
      v_balance, v_balance - v_exp.coin_cost, 'experience_unlock', p_experience_id::text,
      p_idempotency_key, jsonb_build_object('experience_id', p_experience_id, 'attempt', v_attempt_number, 'zone_id', v_exp.zone_id)
    );

    -- VIBE Rule: Spent coins move directly to the Zone score!
    update zones
    set coins_collected = coins_collected + v_exp.coin_cost
    where id = v_exp.zone_id;
  end if;

  -- Ledger for earn
  if v_exp.coin_reward > 0 then
    insert into wallet_transactions (
      wallet_id, event_id, profile_id, type, amount,
      balance_before, balance_after, source_type, source_id, metadata
    ) values (
      v_wallet_id, p_event_id, p_profile_id, 'earn', v_exp.coin_reward,
      v_balance - v_exp.coin_cost, v_new_balance, 'experience_completion', p_experience_id::text,
      jsonb_build_object('experience_id', p_experience_id, 'attempt', v_attempt_number)
    );
  end if;

  -- Insert completion
  insert into experience_completions (
    event_id, profile_id, experience_id, qr_code_id, attempt_number,
    coin_spent, xp_earned, coin_earned, metadata
  ) values (
    p_event_id, p_profile_id, p_experience_id, p_qr_code_id, v_attempt_number,
    v_exp.coin_cost, v_exp.xp_reward, v_exp.coin_reward,
    jsonb_build_object('experience_title', v_exp.title, 'zone_id', v_exp.zone_id)
  ) returning id into v_completion_id;

  return jsonb_build_object(
    'success', true,
    'completion_id', v_completion_id,
    'experience_id', p_experience_id,
    'experience_title', v_exp.title,
    'zone_id', v_exp.zone_id,
    'coin_spent', v_exp.coin_cost,
    'coin_earned', v_exp.coin_reward,
    'xp_earned', v_exp.xp_reward,
    'balance_after', v_new_balance,
    'attempt_number', v_attempt_number
  );
end;
$$ language plpgsql security definer;

-- 5.4 Atomic Redeem Reward
create or replace function fn_redeem_reward_atomic(
  p_event_id uuid,
  p_profile_id uuid,
  p_reward_id uuid,
  p_idempotency_key text default null
) returns jsonb as $$
declare
  v_reward record;
  v_wallet_id uuid;
  v_balance integer;
  v_new_balance integer;
  v_user_redemptions integer;
  v_code text;
  v_redemption_id uuid;
begin
  -- Lock reward row
  select * into v_reward
  from rewards
  where id = p_reward_id and event_id = p_event_id
  for update;

  if not found or not v_reward.is_active then
    return jsonb_build_object('success', false, 'code', 'REWARD_UNAVAILABLE', 'message', 'Reward is inactive or unavailable');
  end if;

  -- Stock check
  if v_reward.stock <= 0 then
    return jsonb_build_object('success', false, 'code', 'REWARD_SOLD_OUT', 'message', 'Reward is sold out');
  end if;

  -- Active window check
  if v_reward.starts_at is not null and now() < v_reward.starts_at then
    return jsonb_build_object('success', false, 'code', 'REWARD_NOT_ACTIVE', 'message', 'Reward redemption has not opened yet');
  end if;
  if v_reward.ends_at is not null and now() > v_reward.ends_at then
    return jsonb_build_object('success', false, 'code', 'REWARD_EXPIRED', 'message', 'Reward redemption has expired');
  end if;

  -- Check user redemption limit
  if v_reward.redemption_limit is not null then
    select count(*) into v_user_redemptions
    from reward_redemptions
    where profile_id = p_profile_id and reward_id = p_reward_id and status != 'cancelled';

    if v_user_redemptions >= v_reward.redemption_limit then
      return jsonb_build_object('success', false, 'code', 'REDEMPTION_LIMIT_REACHED', 'message', 'You have reached the redemption limit for this reward');
    end if;
  end if;

  -- Lock Wallet
  select id, balance into v_wallet_id, v_balance
  from wallets
  where event_id = p_event_id and profile_id = p_profile_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'WALLET_NOT_FOUND', 'message', 'Wallet not found');
  end if;

  if v_balance < v_reward.coin_cost then
    return jsonb_build_object('success', false, 'code', 'INSUFFICIENT_COINS', 'message', 'Insufficient Coins for redemption');
  end if;

  -- Deduct stock
  update rewards
  set stock = stock - 1
  where id = p_reward_id;

  -- Deduct Coins
  v_new_balance := v_balance - v_reward.coin_cost;
  update wallets
  set balance = v_new_balance,
      version = version + 1,
      updated_at = now()
  where id = v_wallet_id;

  -- Generate unique voucher code
  v_code := 'VIBE-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

  -- Insert wallet transaction
  insert into wallet_transactions (
    wallet_id, event_id, profile_id, type, amount,
    balance_before, balance_after, source_type, source_id, idempotency_key, metadata
  ) values (
    v_wallet_id, p_event_id, p_profile_id, 'reward_redemption', v_reward.coin_cost,
    v_balance, v_new_balance, 'reward', p_reward_id::text, p_idempotency_key,
    jsonb_build_object('reward_name', v_reward.name, 'redemption_code', v_code)
  );

  -- Insert redemption
  insert into reward_redemptions (
    event_id, profile_id, reward_id, code, coin_cost, status, redeemed_at
  ) values (
    p_event_id, p_profile_id, p_reward_id, v_code, v_reward.coin_cost, 'pending', now()
  ) returning id into v_redemption_id;

  return jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'code', v_code,
    'reward_name', v_reward.name,
    'coin_cost', v_reward.coin_cost,
    'balance_after', v_new_balance
  );
end;
$$ language plpgsql security definer;

-- 5.5 Atomic Award Duty XP & Coins (Zonal Head -> Attendee)
create or replace function fn_award_duty_xp_atomic(
  p_event_id uuid,
  p_zone_id uuid,
  p_staff_profile_id uuid,
  p_recipient_profile_id uuid,
  p_duty_category text,
  p_description text,
  p_xp_awarded integer,
  p_coins_awarded integer default 0,
  p_idempotency_key text default null
) returns jsonb as $$
declare
  v_duty_id uuid;
  v_wallet_id uuid;
  v_balance integer;
  v_new_balance integer;
  v_zone_name text;
  v_staff_name text;
  v_recipient_name text;
  v_completion_id uuid;
  v_exp_id uuid;
begin
  -- Validate inputs
  if p_xp_awarded < 0 or p_coins_awarded < 0 then
    return jsonb_build_object('success', false, 'code', 'INVALID_AMOUNT', 'message', 'XP and Coins awarded cannot be negative');
  end if;

  if trim(p_description) = '' then
    return jsonb_build_object('success', false, 'code', 'DESCRIPTION_REQUIRED', 'message', 'A description of the duty performed is required for auditing');
  end if;

  -- Validate Zone
  select name into v_zone_name from zones where id = p_zone_id and event_id = p_event_id;
  if not found then
    return jsonb_build_object('success', false, 'code', 'ZONE_NOT_FOUND', 'message', 'Specified Oceanic Zone does not exist');
  end if;

  -- Resolve zone primary experience for reference and foreign key compatibility
  select id into v_exp_id from experiences where zone_id = p_zone_id and event_id = p_event_id limit 1;

  -- Validate Staff Profile
  select display_name into v_staff_name from profiles where id = p_staff_profile_id;
  if not found then
    return jsonb_build_object('success', false, 'code', 'STAFF_NOT_FOUND', 'message', 'Staff profile not found');
  end if;

  -- Validate Recipient Profile
  select display_name into v_recipient_name from profiles where id = p_recipient_profile_id;
  if not found then
    return jsonb_build_object('success', false, 'code', 'RECIPIENT_NOT_FOUND', 'message', 'Recipient attendee profile not found');
  end if;

  -- Lock and Update Recipient Wallet
  select id, balance into v_wallet_id, v_balance
  from wallets
  where event_id = p_event_id and profile_id = p_recipient_profile_id
  for update;

  if not found then
    -- Create wallet if missing with starting balance
    insert into wallets (event_id, profile_id, balance, version)
    values (p_event_id, p_recipient_profile_id, 500, 1)
    returning id, balance into v_wallet_id, v_balance;
  end if;

  v_new_balance := v_balance + p_coins_awarded;

  update wallets
  set balance = v_new_balance,
      version = version + 1,
      updated_at = now()
  where id = v_wallet_id;

  -- Insert duty reward record
  insert into duty_rewards (
    event_id, zone_id, staff_profile_id, recipient_profile_id,
    duty_category, description, xp_awarded, coins_awarded
  ) values (
    p_event_id, p_zone_id, p_staff_profile_id, p_recipient_profile_id,
    p_duty_category, p_description, p_xp_awarded, p_coins_awarded
  ) returning id into v_duty_id;

  -- Ledger transaction for coins earned
  if p_coins_awarded > 0 then
    insert into wallet_transactions (
      wallet_id, event_id, profile_id, type, amount,
      balance_before, balance_after, source_type, source_id, idempotency_key, metadata
    ) values (
      v_wallet_id, p_event_id, p_recipient_profile_id, 'earn', p_coins_awarded,
      v_balance, v_new_balance, 'duty_reward', v_duty_id::text,
      p_idempotency_key,
      jsonb_build_object(
        'duty_id', v_duty_id,
        'category', p_duty_category,
        'zone_id', p_zone_id,
        'awarded_by', v_staff_name
      )
    );
  end if;

  -- Record in experience_completions so total XP and leaderboards register immediately
  insert into experience_completions (
    event_id, profile_id, experience_id, attempt_number,
    coin_spent, xp_earned, coin_earned, metadata
  ) values (
    p_event_id, p_recipient_profile_id, v_exp_id, 1,
    0, p_xp_awarded, p_coins_awarded,
    jsonb_build_object(
      'duty_reward_id', v_duty_id,
      'duty_category', p_duty_category,
      'zone_name', v_zone_name,
      'awarded_by', v_staff_name,
      'description', p_description
    )
  ) returning id into v_completion_id;

  -- Add to Zone Coins Score
  if p_coins_awarded > 0 then
    update zones
    set coins_collected = coins_collected + p_coins_awarded
    where id = p_zone_id;
  end if;

  -- Send In-App Notification to Recipient
  insert into notifications (
    event_id, profile_id, type, title, body, created_at
  ) values (
    p_event_id, p_recipient_profile_id, 'duty_reward',
    'Duty XP Awarded!',
    'You received ' || p_xp_awarded || ' XP from ' || v_zone_name || ' for ' || p_duty_category || '.',
    now()
  );

  -- Record in Immutable Audit Log
  insert into audit_logs (
    event_id, actor_profile_id, action, entity_type, entity_id,
    before_data, after_data
  ) values (
    p_event_id, p_staff_profile_id, 'STAFF_DUTY_XP_AWARDED', 'duty_reward', v_duty_id::text,
    jsonb_build_object('recipient_profile_id', p_recipient_profile_id, 'balance_before', v_balance),
    jsonb_build_object(
      'recipient_name', v_recipient_name,
      'xp_awarded', p_xp_awarded,
      'coins_awarded', p_coins_awarded,
      'balance_after', v_new_balance,
      'duty_category', p_duty_category,
      'zone_name', v_zone_name,
      'description', p_description
    )
  );

  return jsonb_build_object(
    'success', true,
    'duty_id', v_duty_id,
    'recipient_id', p_recipient_profile_id,
    'recipient_name', v_recipient_name,
    'xp_awarded', p_xp_awarded,
    'coins_awarded', p_coins_awarded,
    'balance_after', v_new_balance,
    'zone_name', v_zone_name
  );
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
alter table events enable row level security;
alter table profiles enable row level security;
alter table event_members enable row level security;
alter table sponsors enable row level security;
alter table zones enable row level security;
alter table experiences enable row level security;
alter table qr_codes enable row level security;
alter table wallets enable row level security;
alter table wallet_transactions enable row level security;
alter table levels enable row level security;
alter table experience_completions enable row level security;
alter table quests enable row level security;
alter table quest_progress enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table rewards enable row level security;
alter table reward_redemptions enable row level security;
alter table sponsor_interactions enable row level security;
alter table staff_members enable row level security;
alter table staff_zone_assignments enable row level security;
alter table duty_rewards enable row level security;
alter table stalls enable row level security;
alter table stall_photos enable row level security;
alter table game_sessions enable row level security;
alter table analytics_events enable row level security;
alter table notifications enable row level security;
alter table media_assets enable row level security;
alter table audit_logs enable row level security;

-- Permissive read/write policies for Service Role & Application API access
do $$ begin
  create policy "service_role_all_events" on events for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_read_events" on events for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_profiles" on profiles for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_read_profiles" on profiles for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_zones" on zones for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_read_zones" on zones for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_experiences" on experiences for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_read_experiences" on experiences for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_wallets" on wallets for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_read_wallets" on wallets for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_wallet_tx" on wallet_transactions for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_read_wallet_tx" on wallet_transactions for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_levels" on levels for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_read_levels" on levels for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_completions" on experience_completions for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_read_completions" on experience_completions for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_qr" on qr_codes for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_duty" on duty_rewards for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_read_duty" on duty_rewards for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_stalls" on stalls for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_read_stalls" on stalls for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_stall_photos" on stall_photos for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_games" on game_sessions for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_read_games" on game_sessions for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_staff_asg" on staff_zone_assignments for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_staff_mem" on staff_members for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_audit" on audit_logs for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service_role_all_notifications" on notifications for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_read_notifications" on notifications for select using (true);
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 7. SEED DATA CATALOG: ROCCO 2026 OFFICIAL EVENT & GAME ECONOMY
-- ----------------------------------------------------------------------------

-- 7.1 Master Event Record
insert into events (
  id, slug, name, description, status, starts_at, ends_at, timezone, starting_coins
) values (
  'a0000000-0000-0000-0000-000000000001',
  'vibe-2026',
  'ROCCO 2026 — Rotaract District 3192 Freshers Party',
  'The official gamified fresher party experience featuring 6 oceanic zones, live zone battle, mini-games, and individual XP leaderboard.',
  'live',
  '2026-09-07 10:00:00+00',
  '2026-09-07 22:00:00+00',
  'Asia/Kolkata',
  500
) on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  status = 'live';

-- 7.2 Six Progression Levels
insert into levels (id, event_id, name, min_xp, max_xp, sort_order)
values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '🌱 VIBE Newbie', 0, 249, 1),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '✨ VIBE Explorer', 250, 599, 2),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '🔥 VIBE Seeker', 600, 999, 3),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '⚡ VIBE Rider', 1000, 1499, 4),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '💫 VIBE Addict', 1500, 2499, 5),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '👑 VIBE Legend', 2500, null, 6)
on conflict (id) do update set
  name = excluded.name,
  min_xp = excluded.min_xp,
  max_xp = excluded.max_xp;

-- 7.3 The 6 Official Oceanic Zones
insert into zones (id, event_id, name, slug, description, sort_order, is_active, map_data, coins_collected)
values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Arnava', 'arnava', 'The Rising Tide. High-intensity interactive challenges and team coordination.', 1, true, '{"x": 120, "y": 90, "color": "#0284C7", "icon": "Waves"}'::jsonb, 0),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Taranaga', 'taranaga', 'The Electric Ripple. Rapid rhythm face-offs, dance encounters and audio-visual beats.', 2, true, '{"x": 280, "y": 90, "color": "#A855F7", "icon": "Activity"}'::jsonb, 0),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Sagara', 'sagara', 'The Deep Ocean. Mystery puzzles, cryptic cipher runs and deep dive explorations.', 3, true, '{"x": 200, "y": 180, "color": "#00D2FF", "icon": "Compass"}'::jsonb, 0),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Pravaha', 'pravaha', 'The Rushing Current. Adrenaline sports, agility obstacle courses and rapid relays.', 4, true, '{"x": 90, "y": 260, "color": "#10B981", "icon": "Zap"}'::jsonb, 0),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Samudhra', 'samudhra', 'The Endless Ocean. Fellowship arena, social bonding spots and creator photo rigs.', 5, true, '{"x": 310, "y": 260, "color": "#F59E0B", "icon": "Users"}'::jsonb, 0),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Varuna', 'varuna', 'The Celestial Waters. The festival crown zone, grand stage spectacle and midnight showdown.', 6, true, '{"x": 200, "y": 340, "color": "#FF2E93", "icon": "Sparkles"}'::jsonb, 0)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  map_data = excluded.map_data;

-- Deactivate any legacy/fake 7th zones
update zones set is_active = false where slug not in ('arnava', 'taranaga', 'sagara', 'pravaha', 'samudhra', 'varuna');

-- 7.4 Experiences & Activities
insert into experiences (id, event_id, zone_id, title, slug, description, coin_cost, xp_reward, coin_reward, max_attempts, cooldown_seconds, is_active)
values
  -- Zone 1: Arnava
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Arnava Wave Tag & Icebreaker', 'arnava-icebreaker', 'Break the ice with fellow freshers through cooperative tag and checkpoint check-in.', 0, 75, 10, 5, 0, true),
  -- Zone 2: Taranaga
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Taranaga Soundwave Rhythm Clash', 'taranaga-rhythm', 'Step onto the rhythm stage and match the live DJ beats for team glory.', 0, 75, 10, 5, 0, true),
  -- Zone 3: Sagara
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'Sagara Deep Dive Riddle & Cipher', 'sagara-riddle', 'Decipher the ancient ocean cipher to unlock Sagara zone prestige.', 0, 100, 15, 5, 0, true),
  -- Zone 4: Pravaha
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'Pravaha Agility Rapids Sprint', 'pravaha-rapids', 'Timed laser agility sprint testing rapid reflexes across the stream.', 0, 75, 10, 5, 0, true),
  -- Zone 5: Samudhra
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'Samudhra 360 Glam Photo Rig', 'samudhra-glam', 'Capture your signature festival vibe on the spinning neon glam platform.', 0, 75, 10, 5, 0, true),
  -- Zone 6: Varuna
  ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', 'Varuna Celestial Grand Stage Challenge', 'varuna-spectacle', 'The festival mainstage challenge with live crowd cheering.', 0, 100, 20, 5, 0, true),
  -- Mini-Games
  ('e0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Rotaract Trivia Game', 'rotaract-game', 'Trivia challenge about Rotaract and District 3192.', 0, 20, 0, 999, 0, true),
  ('e0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Minion VIBE Run', 'minion-run', '3-lane reaction runner dodging waves and collecting bananas.', 0, 25, 0, 999, 0, true),
  ('e0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'Memory Match', 'memory-game', 'Card flip memory matching game.', 0, 20, 0, 999, 0, true),
  ('e0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'ROCCO Festival Quiz', 'vibe-quiz', 'Dynamic questions celebrating the spirit of ROCCO 2026.', 0, 20, 0, 999, 0, true),
  ('e0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Instagram Friend Connect', 'insta-friend-connect', 'Connect with fellow freshers on Instagram to become in-app friends and level up together.', 0, 25, 0, 9999, 0, true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  xp_reward = excluded.xp_reward,
  coin_reward = excluded.coin_reward,
  is_active = true;

-- 7.5 QR Codes for Live Scanning
insert into qr_codes (id, event_id, experience_id, code, is_active)
values
  -- Zone Checkpoint QRs
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'vibe-zone-arnava-xp', true),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'vibe-zone-taranaga-xp', true),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'vibe-zone-sagara-xp', true),
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004', 'vibe-zone-pravaha-xp', true),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 'vibe-zone-samudhra-xp', true),
  ('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006', 'vibe-zone-varuna-xp', true),

  -- Quick Aliases
  ('f0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'vibe-icebreaker-arnava', true),
  ('f0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'vibe-mystery-taranaga', true),
  ('f0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'vibe-final-wave-sagara', true),
  ('f0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004', 'vibe-flow-pravaha', true),
  ('f0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 'vibe-hidden-tree-01', true),
  ('f0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006', 'vibe-stage-challenge-2026', true),

  -- Stalls QRs
  ('f0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'vibe-stall-memory-xp', true),
  ('f0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 'vibe-stall-glam-xp', true),
  ('f0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004', 'vibe-stall-ring-xp', true),
  ('f0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'vibe-stall-taco-xp', true),
  ('f0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'vibe-stall-neon-xp', true)
on conflict (id) do update set
  code = excluded.code,
  is_active = true;

-- 7.6 Official Stalls Catalog
insert into stalls (id, event_id, name, slug, description, entry_cost, xp_reward, coin_reward, requires_photo, is_active)
values
  ('80000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Neon Photo Booth', 'neon-photo', 'Snap your coolest festival look under ultraviolet lights.', 50, 100, 20, true, true),
  ('80000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'VR Experience Zone', 'vr-zone', 'Immerse yourself in virtual reality gaming challenges.', 75, 150, 30, true, true),
  ('80000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Face Painting & Glitter', 'face-paint', 'Get festival-ready glow paint from creative artists.', 30, 75, 10, true, true),
  ('80000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Mocktail Lounge', 'mocktail-lounge', 'Try custom non-alcoholic fresher blends.', 60, 80, 15, true, true),
  ('80000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Spin & Win Wheel', 'spin-wheel', 'Test your luck on the grand festival wheel.', 40, 60, 50, true, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true;

-- 7.7 Quests
insert into quests (id, event_id, title, description, condition_type, condition_config, xp_reward, coin_reward)
values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'The Explorer', 'Visit 3 different event zones.', 'zones_visited', '{"target": 3}'::jsonb, 200, 150),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Social Butterfly', 'Complete experiences at 5 different stalls across the venue.', 'experiences_completed', '{"target": 5}'::jsonb, 250, 200),
  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Challenge Accepted', 'Complete 5 event challenges.', 'experiences_completed', '{"target": 5}'::jsonb, 300, 150),
  ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'VIBE Master (Grand Tour)', 'Visit and conquer all 6 venue zones.', 'all_zones_completed', '{"target": 6}'::jsonb, 500, 500)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description;

-- 7.8 Achievements
insert into achievements (id, event_id, name, description, condition_type, condition_config)
values
  ('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Explorer', 'Visit your first 3 venue zones.', 'zones_visited', '{"target": 3}'::jsonb),
  ('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'VIBE Explorer (Grand Tour)', 'Unlock all 6 zones in your digital Passport.', 'all_zones_completed', '{"target": 6}'::jsonb),
  ('20000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Challenger', 'Complete 5 event experiences successfully.', 'experiences_completed', '{"target": 5}'::jsonb),
  ('20000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'VIBE Legend', 'Ascend to Level 6: 👑 VIBE Legend status.', 'reach_level', '{"level": 6}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description;

-- ============================================================================
-- SCRIPT EXECUTION COMPLETE
-- All schemas, tables, stored procedures, RLS policies, and official seeds
-- are synchronized for ROCCO 2026.
-- ============================================================================
