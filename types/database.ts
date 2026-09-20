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
  phone?: string | null;
  email?: string | null;
  instagram_id?: string | null;
  registration_id?: string | null;
  assigned_zone_id?: string | null;
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
  tagline?: string | null;
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
  coins_collected?: number;
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
  condition_type:
    | "zones_visited"
    | "experiences_completed"
    | "specific_experience"
    | "coins_earned"
    | "all_zones_completed"
    | "stalls_visited"
    | "games_completed"
    | "vibe_master";
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

export interface Stall {
  id: string;
  event_id: string;
  name: string;
  slug: string;
  category?: string;
  description: string | null;
  entry_cost: number;
  xp_reward: number;
  coin_reward?: number;
  is_active: boolean;
  requires_photo: boolean;
}

export interface StallPhotoSubmission {
  id: string;
  event_id: string;
  profile_id: string;
  stall_id: string;
  photo_url: string;
  instagram_id: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  created_at?: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export type GameType = "rotaract_game" | "minion_run" | "memory_game" | "vibe_quiz";

export interface GameSession {
  id: string;
  event_id: string;
  profile_id: string;
  game_type: GameType;
  score: number;
  max_score: number;
  coin_spent: number;
  coin_earned: number;
  xp_earned: number;
  played_at: string;
}

export interface ZoneLeaderboardEntry {
  rank: number;
  zone_id: string;
  name: string;
  slug: string;
  coins_collected: number;
  participants_count: number;
  experiences_completed_count: number;
  stall_interactions_count: number;
  games_played_count: number;
  total_xp_generated: number;
  completion_rate_percent: number;
}

export interface UserPlayerStats {
  total_vibe_earned: number;
  total_vibe_spent: number;
  total_xp_earned: number;
  zones_visited_count: number;
  experiences_completed_count: number;
  stalls_visited_count: number;
  games_played_count: number;
  games_won_count: number;
  photos_approved_count: number;
  quests_completed_count: number;

  totalVibeEarned: number;
  totalVibeSpent: number;
  xpEarned: number;
  zonesVisitedCount: number;
  experiencesCompletedCount: number;
  stallsVisitedCount: number;
  gamesPlayedCount: number;
  gamesWonCount: number;
  photosApprovedCount: number;
  questsCompletedCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  profile_id: string;
  display_name: string;
  vibe_id: string;
  instagram_id?: string | null;
  club?: string | null;
  assigned_zone_name?: string | null;
  total_xp: number;
  level_name: string;
  level_order: number;
  completions_count: number;
}

export type ZonalStaffType = "zonal_head" | "zonal_staff";

export interface StaffMember {
  id: string;
  event_id: string;
  profile_id: string;
  role: MemberRole;
  created_at: string;
}

export interface StaffZoneAssignment {
  id: string;
  staff_member_id: string;
  zone_id: string;
  staff_type: ZonalStaffType;
  custom_passcode?: string | null;
  assigned_by?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface DutyReward {
  id: string;
  event_id: string;
  zone_id: string;
  staff_profile_id: string;
  recipient_profile_id: string;
  duty_category: string;
  description: string;
  xp_awarded: number;
  coins_awarded: number;
  created_at: string;
}

