 -- Migration: 20260907000004_vibe_flow_alignment.sql
-- Description: Complete alignment with 🌊 VIBE — UPDATED COMPLETE USER FLOW specification

-- 1. Extend profiles with Instagram handle, contact details, registration ID, and assigned zone
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists email text;
alter table profiles add column if not exists instagram_id text;
alter table profiles add column if not exists registration_id text;
alter table profiles add column if not exists assigned_zone_id uuid references zones(id) on delete set null;

-- 2. Add coins_collected to zones for the Zone Battle competition
alter table zones add column if not exists coins_collected integer not null default 0 check (coins_collected >= 0);

-- 3. Stalls table
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

-- 4. Stall photo submissions table (Verification Queue)
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

-- 5. Game sessions table
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

-- 6. Indexes
create index if not exists idx_stall_photos_event_status on stall_photos(event_id, status);
create index if not exists idx_game_sessions_profile on game_sessions(profile_id, played_at desc);
create index if not exists idx_zones_coins on zones(event_id, coins_collected desc);

-- 7. Update fn_complete_experience_atomic to credit coins to Zone score
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
      v_balance, v_balance - v_exp.coin_cost, 'experience_unlock', p_experience_id,
      p_idempotency_key, jsonb_build_object('experience_id', p_experience_id, 'attempt', v_attempt_number, 'zone_id', v_exp.zone_id)
    );

    -- VIBE Flow Rule: Coins move to the zone!
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
      v_balance - v_exp.coin_cost, v_new_balance, 'experience_completion', p_experience_id,
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
