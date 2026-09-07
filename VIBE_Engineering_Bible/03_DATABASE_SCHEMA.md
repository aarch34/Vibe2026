# Database Schema

## Core tables

### events
id, slug, name, description, status, starts_at, ends_at, starting_coins, timezone, created_at, updated_at

### profiles
id, clerk_user_id, vibe_id, display_name, avatar_media_id, college, club, created_at, updated_at

### event_members
id, event_id, profile_id, role, status, joined_at

### zones
id, event_id, name, slug, description, image_media_id, map_data, sort_order, is_active

### experiences
id, event_id, zone_id, sponsor_id, title, slug, description, image_media_id, video_media_id, coin_cost, xp_reward, coin_reward, max_attempts, cooldown_seconds, starts_at, ends_at, is_active

### qr_codes
id, event_id, experience_id, code, version, expires_at, is_active, created_at

### wallets
id, event_id, profile_id, balance, version, created_at, updated_at

### wallet_transactions
id, wallet_id, event_id, profile_id, type, amount, balance_before, balance_after, source_type, source_id, idempotency_key, metadata, created_at

### levels
id, event_id, name, min_xp, max_xp, badge_media_id, sort_order

### experience_completions
id, event_id, profile_id, experience_id, qr_code_id, attempt_number, coin_spent, xp_earned, coin_earned, completed_at, metadata

### quests
id, event_id, title, description, condition_type, condition_config, xp_reward, coin_reward, achievement_id, starts_at, ends_at, is_active

### quest_progress
id, event_id, profile_id, quest_id, progress_value, target_value, completed_at, updated_at

### achievements
id, event_id, name, description, condition_type, condition_config, badge_media_id, is_active

### user_achievements
id, event_id, profile_id, achievement_id, unlocked_at

### rewards
id, event_id, sponsor_id, name, description, image_media_id, coin_cost, stock, redemption_limit, starts_at, ends_at, is_active

### reward_redemptions
id, event_id, profile_id, reward_id, code, coin_cost, status, redeemed_at, created_at

### sponsors
id, event_id, name, logo_media_id, description, is_active

### sponsor_interactions
id, event_id, sponsor_id, profile_id, experience_id, interaction_type, created_at

### staff_members
id, event_id, profile_id, role, created_at

### staff_zone_assignments
id, staff_member_id, zone_id

### analytics_events
id, event_id, profile_id, event_name, zone_id, experience_id, sponsor_id, metadata, created_at

### notifications
id, event_id, profile_id, type, title, body, read_at, created_at

### media_assets
id, event_id, owner_profile_id, object_key, bucket, file_name, mime_type, byte_size, created_at

### audit_logs
id, event_id, actor_profile_id, action, entity_type, entity_id, before_data, after_data, created_at

## Indexes
Index event_id on every event-owned table. Add composite indexes for:
- wallet_transactions(profile_id, created_at desc)
- experience_completions(profile_id, experience_id)
- analytics_events(event_id, created_at desc)
- leaderboard query fields
- rewards(event_id, is_active)
- qr_codes(code)
- event_members(event_id, profile_id)

## Constraints
- profiles.clerk_user_id unique.
- profiles.vibe_id unique.
- wallet unique(event_id, profile_id).
- experience completion uniqueness according to max-attempt rules.
- reward redemption code unique.
- QR code unique.
