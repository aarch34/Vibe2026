import { mockDb, calculateLevel } from "@/lib/db/mock-store";
import { Profile, VIBE_LEVELS } from "@/types/database";

export async function getUserProgression(eventId: string, profileId: string) {
  const profile = mockDb.getProfile(profileId);
  const xp = profile?.xp || 0;
  const levelInfo = calculateLevel(xp);

  return {
    profile,
    currentLevel: {
      name: levelInfo.level_name,
      level_number: levelInfo.level_number,
      min_xp: levelInfo.min_xp,
      max_xp: levelInfo.max_xp,
      badge: levelInfo.badge,
    },
    totalXp: xp,
    levels: VIBE_LEVELS,
  };
}

export async function getCachedEventZones(eventId: string) {
  return [];
}

export async function getCachedActiveExperiences(eventId: string) {
  return [];
}
