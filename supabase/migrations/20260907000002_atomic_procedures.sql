-- Migration: 20260907000002_atomic_procedures.sql
-- Description: Atomic stored procedures for wallet spending, experience completion, and reward redemption

-- 1. Helper function: Credit Initial Wallet (Idempotent)
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

-- 2. Atomic Spend Wallet
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
    v_balance, v_new_balance, p_source_type, p_source_id, p_idempotency_key, p_metadata
  );

  return jsonb_build_object(
    'success', true,
    'balance_before', v_balance,
    'balance_after', v_new_balance,
    'amount_spent', p_amount
  );
end;
$$ language plpgsql security definer;

-- 3. Atomic Complete Experience
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
      p_idempotency_key, jsonb_build_object('experience_id', p_experience_id, 'attempt', v_attempt_number)
    );
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

  -- Return payload
  return jsonb_build_object(
    'success', true,
    'completion_id', v_completion_id,
    'experience_id', p_experience_id,
    'experience_title', v_exp.title,
    'coin_spent', v_exp.coin_cost,
    'coin_earned', v_exp.coin_reward,
    'xp_earned', v_exp.xp_reward,
    'balance_after', v_new_balance,
    'attempt_number', v_attempt_number
  );
end;
$$ language plpgsql security definer;

-- 4. Atomic Redeem Reward
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
    v_balance, v_new_balance, 'reward', p_reward_id, p_idempotency_key,
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
