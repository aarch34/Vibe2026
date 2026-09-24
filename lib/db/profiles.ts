import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "./supabase";
import { Profile } from "@/types/database";
import { calculateLevel } from "./mock-store";

/**
 * Normalizes a Supabase profiles table row into a frontend Profile object.
 */
export function normalizeSupabaseProfile(row: any): Profile {
  const xp = typeof row.xp === "number" ? row.xp : 100;
  const levelInfo = calculateLevel(xp);

  const displayName = row.display_name || "VIBE Member";
  const vibeId = row.vibe_id || `VB2026-${Math.floor(100 + Math.random() * 900)}`;
  const username =
    row.username ||
    (displayName.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + (row.vibe_id ? row.vibe_id.replace(/[^0-9]/g, "").slice(0, 4) : "2026")).slice(0, 20);

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

  return {
    id: row.id,
    clerk_user_id: row.clerk_user_id,
    vibe_id: vibeId,
    display_name: displayName,
    username,
    avatar_url: row.avatar_url || defaultAvatar,
    avatar_media_id: row.avatar_media_id || null,
    email: row.email || "",
    phone: row.phone || "",
    rotaract_club: row.club || row.rotaract_club || "Rotaract District 3192",
    college: row.college || "Rotaract District 3192",
    course_year: row.course_year || "Delegate • 2026",
    instagram_username: row.instagram_id || row.instagram_username || null,
    bio: row.bio || null,
    interests: Array.isArray(row.interests) ? row.interests : [],
    skills: Array.isArray(row.skills) ? row.skills : [],
    hobbies: Array.isArray(row.hobbies) ? row.hobbies : [],
    favorite_music: Array.isArray(row.favorite_music) ? row.favorite_music : [],
    favorite_movies: Array.isArray(row.favorite_movies) ? row.favorite_movies : [],
    city: row.city || "Bengaluru",
    is_discoverable: row.is_discoverable ?? true,
    xp,
    level_number: row.level_number || levelInfo.level_number,
    level_name: row.level_name || levelInfo.level_name,
    connections_count: row.connections_count ?? 0,
    posts_count: row.posts_count ?? 0,
    games_played_count: row.games_played_count ?? 0,
    registration_id: row.registration_id || null,
    profile_completed: Boolean(row.profile_completed || (row.bio && row.interests?.length > 0)),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Fetch a profile by ID, Clerk User ID, or VIBE ID.
 * Looks first in memory (mockDb), then queries Supabase if not found.
 */
export async function getProfileByIdOrClerkId(idOrClerkId: string): Promise<Profile | null> {
  if (!idOrClerkId) return null;

  // 1. Check in-memory store
  const memProfile = mockDb.getProfile(idOrClerkId) || mockDb.getProfileByClerkId(idOrClerkId);
  if (memProfile) {
    return memProfile;
  }

  // 2. Query Supabase
  if (isUsingLiveSupabase() && supabaseAdmin) {
    try {
      // Check UUID vs text search
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrClerkId);

      let query = supabaseAdmin.from("profiles").select("*");
      if (isUuid) {
        query = query.or(`id.eq.${idOrClerkId},clerk_user_id.eq.${idOrClerkId},vibe_id.eq.${idOrClerkId}`);
      } else {
        query = query.or(`clerk_user_id.eq.${idOrClerkId},vibe_id.eq.${idOrClerkId}`);
      }

      const { data, error } = await query.maybeSingle();

      if (data && !error) {
        const normalized = normalizeSupabaseProfile(data);
        mockDb.profiles.set(normalized.id, normalized);
        mockDb.clerkToProfileMap.set(normalized.clerk_user_id, normalized.id);
        return normalized;
      }
    } catch (err) {
      console.warn("Supabase profile lookup error:", err);
    }
  }

  return null;
}

/**
 * Fetch all discoverable profiles for attendees to browse, connect, and view.
 * Pulls from Supabase to ensure all registered attendees are discoverable.
 */
export async function getAllDiscoverableProfiles(excludeProfileId?: string): Promise<Profile[]> {
  const profileMap = new Map<string, Profile>();

  // 1. Pull from Supabase first
  if (isUsingLiveSupabase() && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from("profiles")
        .select("*")
        .order("xp", { ascending: false });

      if (excludeProfileId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(excludeProfileId);
        if (isUuid) {
          query = query.neq("id", excludeProfileId);
        }
      }

      const { data: dbRows, error } = await query;
      if (dbRows && !error) {
        for (const row of dbRows) {
          // Exclude blank placeholder profiles with no name or details
          if (!row.display_name || (row.display_name === "VIBE Attendee" && !row.email && !row.phone && !row.club)) {
            continue;
          }
          if (row.id === excludeProfileId || row.clerk_user_id === excludeProfileId) {
            continue;
          }

          const normalized = normalizeSupabaseProfile(row);
          profileMap.set(normalized.id, normalized);
          mockDb.profiles.set(normalized.id, normalized);
          mockDb.clerkToProfileMap.set(normalized.clerk_user_id, normalized.id);
        }
      }
    } catch (err) {
      console.warn("Supabase discoverable profiles query error:", err);
    }
  }

  // 2. Merge with any in-memory profiles
  for (const p of Array.from(mockDb.profiles.values())) {
    if (p.id !== excludeProfileId && p.clerk_user_id !== excludeProfileId && p.is_discoverable) {
      if (!profileMap.has(p.id)) {
        profileMap.set(p.id, p);
      }
    }
  }

  return Array.from(profileMap.values()).sort((a, b) => b.xp - a.xp);
}
