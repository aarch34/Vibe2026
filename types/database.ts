// TypeScript definitions for VIBE Database Schema and Domain Models

export type EventStatus = "draft" | "live" | "paused" | "ended" | "archived";
export type MemberRole = "attendee" | "staff" | "admin" | "super_admin";
export type WalletTxType =
  | "initial_credit"
  | "earn"
  | "spend"
  | "refund"
  | "admin_adjustment"
  | "reward_redemption";

export interface Event {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: EventStatus;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  starting_coins: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  clerk_user_id: string;
  vibe_id: string;
  display_name: string;
  avatar_media_id: string | null;
  college: string | null;
  club: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventMember {
  id: string;
  event_id: string;
  profile_id: string;
  role: MemberRole;
  status: string;
  joined_at: string;
}

export interface Sponsor {
  id: string;
  event_id: string;
  name: string;
  logo_media_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Zone {
  id: string;
  event_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_media_id: string | null;
  map_data: {
    x: number;
    y: number;
    color?: string;
    icon?: string;
    path?: string;
  } | null;
  sort_order: number;
  is_active: boolean;
}

export interface Experience {
  id: string;
  event_id: string;
  zone_id: string;
  sponsor_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  image_media_id: string | null;
  video_media_id: string | null;
  coin_cost: number;
  xp_reward: number;
  coin_reward: number;
  max_attempts: number;
  cooldown_seconds: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export interface QRCodeRecord {
  id: string;
  event_id: string;
  experience_id: string;
  code: string;
  version: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  event_id: string;
  profile_id: string;
  balance: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  event_id: string;
  profile_id: string;
  type: WalletTxType;
  amount: number;
  balance_before: number;
  balance_after: number;
  source_type: string | null;
  source_id: string | null;
  idempotency_key: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface Level {
  id: string;
  event_id: string;
  name: string;
  min_xp: number;
  max_xp: number | null;
  badge_media_id: string | null;
  sort_order: number;
}

export interface ExperienceCompletion {
  id: string;
  event_id: string;
  profile_id: string;
  experience_id: string;
  qr_code_id: string | null;
  attempt_number: number;
  coin_spent: number;
  xp_earned: number;
  coin_earned: number;
  completed_at: string;
  metadata: Record<string, any> | null;
}

export interface Quest {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  condition_type: "zones_visited" | "experiences_completed" | "specific_experience" | "coins_earned" | "all_zones_completed";
  condition_config: Record<string, any>;
  xp_reward: number;
  coin_reward: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export interface QuestProgress {
  id: string;
  event_id: string;
  profile_id: string;
  quest_id: string;
  progress_value: number;
  target_value: number;
  completed_at: string | null;
  updated_at: string;
}

export interface Achievement {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  condition_type: string;
  condition_config: Record<string, any>;
  badge_media_id: string | null;
  is_active: boolean;
}

export interface UserAchievement {
  id: string;
  event_id: string;
  profile_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface Reward {
  id: string;
  event_id: string;
  sponsor_id: string | null;
  name: string;
  description: string | null;
  image_media_id: string | null;
  coin_cost: number;
  stock: number;
  redemption_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export interface RewardRedemption {
  id: string;
  event_id: string;
  profile_id: string;
  reward_id: string;
  code: string;
  coin_cost: number;
  status: "pending" | "claimed" | "cancelled" | "expired";
  redeemed_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  event_id: string | null;
  actor_profile_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Record<string, any> | null;
  after_data: Record<string, any> | null;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  profile_id: string;
  display_name: string;
  vibe_id: string;
  total_xp: number;
  level_name: string;
  level_order: number;
  completions_count: number;
}
