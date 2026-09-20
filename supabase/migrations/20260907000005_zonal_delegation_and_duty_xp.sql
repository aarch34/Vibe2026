-- Migration: 20260907000005_zonal_delegation_and_duty_xp.sql
-- Description: Schema and atomic procedures for Admin Zonal Delegation and Zonal Head Duty XP Rewards

-- 1. Enhance staff_zone_assignments for dynamic Zonal Head delegation
alter table staff_zone_assignments add column if not exists staff_type text not null default 'zonal_head' check (staff_type in ('zonal_head', 'zonal_staff'));
alter table staff_zone_assignments add column if not exists custom_passcode text;
alter table staff_zone_assignments add column if not exists assigned_by uuid references profiles(id) on delete set null;
alter table staff_zone_assignments add column if not exists is_active boolean not null default true;
alter table staff_zone_assignments add column if not exists updated_at timestamptz not null default now();

-- 2. Create duty_rewards table for volunteer duty XP & coin disbursement
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

-- 3. Indexes for fast retrieval
create index if not exists idx_duty_rewards_zone on duty_rewards(zone_id, created_at desc);
create index if not exists idx_duty_rewards_recipient on duty_rewards(recipient_profile_id, created_at desc);
create index if not exists idx_duty_rewards_event on duty_rewards(event_id, created_at desc);
create index if not exists idx_staff_zone_active on staff_zone_assignments(zone_id, is_active);

-- 4. Enable RLS
alter table duty_rewards enable row level security;

do $$ begin
  create policy "duty_rewards_select_all" on duty_rewards
    for select using (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "duty_rewards_service_role" on duty_rewards
    for all using (true) with check (true);
exception
  when duplicate_object then null;
end $$;

-- 5. Atomic Procedure: fn_award_duty_xp_atomic
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
      v_balance, v_new_balance, 'duty_reward', v_duty_id,
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
    p_event_id, p_recipient_profile_id, null, 1,
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
    event_id, profile_id, type, created_at
  ) values (
    p_event_id, p_recipient_profile_id, 'duty_reward', now()
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
