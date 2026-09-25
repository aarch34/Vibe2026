// TypeScript definitions for VIBE 2026 Social Networking & Games Platform

export type MemberRole = "attendee" | "staff" | "admin" | "super_admin";
export type ConnectionStatus = "pending" | "accepted" | "declined";

export interface EventMember {
  id: string;
  event_id: string;
  profile_id: string;
  role: MemberRole;
  status: string;
  joined_at: string;
}


export interface Profile {
  id: string;
  clerk_user_id: string;
  vibe_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  avatar_media_id?: string | null;
  email: string;
  phone: string;
  rotaract_club: string;
  college: string;
  course_year: string;
  instagram_username: string | null;
  bio: string | null;
  interests: string[];
  skills?: string[];
  hobbies?: string[];
  favorite_music?: string[];
  favorite_movies?: string[];
  city?: string | null;
  is_discoverable: boolean;
  xp: number;
  level_number: number;
  level_name: string;
  connections_count: number;
  posts_count: number;
  games_played_count: number;
  registration_id?: string | null;
  profile_completed?: boolean;
  is_banned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Level {
  id: string;
  level_number: number;
  name: string;
  min_xp: number;
  max_xp: number | null;
  badge_icon: string;
}

export const VIBE_LEVELS: Level[] = [
  { id: "lvl-1", level_number: 1, name: "VIBE NEWBIE", min_xp: 0, max_xp: 249, badge_icon: "🌱" },
  { id: "lvl-2", level_number: 2, name: "VIBE EXPLORER", min_xp: 250, max_xp: 749, badge_icon: "✨" },
  { id: "lvl-3", level_number: 3, name: "VIBE SEEKER", min_xp: 750, max_xp: 1499, badge_icon: "🔥" },
  { id: "lvl-4", level_number: 4, name: "VIBE RIDER", min_xp: 1500, max_xp: 2499, badge_icon: "⚡" },
  { id: "lvl-5", level_number: 5, name: "VIBE ICON", min_xp: 2500, max_xp: 3999, badge_icon: "💫" },
  { id: "lvl-6", level_number: 6, name: "VIBE LEGEND", min_xp: 4000, max_xp: null, badge_icon: "👑" },
];

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  user_id_1: string;
  user_id_2: string;
  connected_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  caption: string;
  image_url?: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  profile_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  profile_id: string;
  comment: string;
  created_at: string;
}

export interface SocialChallenge {
  id: string;
  title: string;
  description: string;
  reward_xp: number;
  challenge_type: "introduce_yourself" | "find_someone_new" | "vibe_intro" | "game_master";
  is_active: boolean;
}

export interface ChallengeCompletion {
  id: string;
  profile_id: string;
  challenge_id: string;
  completed_at: string;
  xp_earned: number;
}

export type GameType = "flappy_rocco" | "rotaract_quiz" | "sanjay_run";

export interface GameSession {
  id: string;
  profile_id: string;
  game_type: GameType;
  score: number;
  max_score: number;
  xp_earned: number;
  played_at: string;
}

export type NotificationType =
  | "connection_request"
  | "connection_accepted"
  | "post_like"
  | "post_comment"
  | "xp_earned"
  | "level_unlocked"
  | "achievement_unlocked"
  | "high_score"
  | "new_challenge";

export interface Notification {
  id: string;
  profile_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string | null;
  created_at: string;
}

export interface AdminXpAdjustment {
  id: string;
  target_profile_id: string;
  admin_profile_id: string;
  admin_name: string;
  amount: number;
  reason: string;
  timestamp: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  icon: string;
}

export interface UserAchievement {
  id: string;
  profile_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  profile_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  college: string;
  rotaract_club: string;
  total_xp: number;
  level_name: string;
  level_number: number;
  connections_count: number;
}

export interface GameLeaderboardEntry {
  rank: number;
  profile_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  high_score: number;
  games_played: number;
  played_at: string;
}


