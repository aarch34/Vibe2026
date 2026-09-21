import * as React from "react";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import {
  Level,
  Zone,
  Experience,
  Stall,
  Quest,
  QuestProgress,
  Achievement,
  UserPlayerStats,
} from "@/types/database";

function serverCache<T extends (...args: any[]) => any>(fn: T): T {
  if (typeof (React as any).cache === "function") {
    return (React as any).cache(fn);
  }
  return fn;
}

export interface UserProgression {
  totalXP: number;
  currentLevel: Level;
  nextLevel: Level | null;
  progressPercent: number;
  xpToNextLevel: number;
  completedExperiencesCount: number;
  zonesVisitedCount: number;
  totalZonesCount: number;
}

export interface PassportZoneItem {
  zone: Zone;
  isUnlocked: boolean;
  experiencesCount: number;
  completedExperiencesCount: number;
  firstCompletedAt: string | null;
}

// In-Memory Server Caches (eliminates remote Supabase query latency)
let cachedLevels: { eventId: string; timestamp: number; data: Level[] } | null = null;
let cachedZones: { eventId: string; timestamp: number; data: Zone[] } | null = null;
let cachedExperiences: { eventId: string; timestamp: number; data: Experience[] } | null = null;
let cachedStalls: { eventId: string; timestamp: number; data: Stall[] } | null = null;
let cachedQuests: { eventId: string; timestamp: number; data: Quest[] } | null = null;
let cachedAchievements: { eventId: string; timestamp: number; data: Achievement[] } | null = null;

const CATALOG_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const userProgressionCache = new Map<string, { timestamp: number; data: UserProgression }>();
const USER_PROGRESSION_TTL = 30 * 1000; // 30 seconds

export function invalidateUserProgressionCache(profileId?: string) {
  if (profileId) {
    userProgressionCache.forEach((_, key) => {
      if (key.endsWith(`:${profileId}`)) {
        userProgressionCache.delete(key);
      }
    });
  } else {
    userProgressionCache.clear();
  }
}

export async function getCachedEventLevels(eventId: string): Promise<Level[]> {
  if (
    cachedLevels &&
    cachedLevels.eventId === eventId &&
    Date.now() - cachedLevels.timestamp < CATALOG_CACHE_TTL
  ) {
    return cachedLevels.data;
  }

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("levels")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true });
    if (data && data.length > 0) {
      cachedLevels = { eventId, timestamp: Date.now(), data };
      return data;
    }
  }

  const fallback = mockDb.levels.sort((a, b) => a.sort_order - b.sort_order);
  cachedLevels = { eventId, timestamp: Date.now(), data: fallback };
  return fallback;
}

export async function getCachedEventZones(eventId: string): Promise<Zone[]> {
  if (
    cachedZones &&
    cachedZones.eventId === eventId &&
    Date.now() - cachedZones.timestamp < CATALOG_CACHE_TTL
  ) {
    return cachedZones.data;
  }

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("zones")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data && data.length > 0) {
      cachedZones = { eventId, timestamp: Date.now(), data };
      return data;
    }
  }

  const fallback = Array.from(mockDb.zones.values())
    .sort((a, b) => a.sort_order - b.sort_order);
  cachedZones = { eventId, timestamp: Date.now(), data: fallback };
  return fallback;
}

export async function getCachedActiveExperiences(eventId: string): Promise<Experience[]> {
  if (
    cachedExperiences &&
    cachedExperiences.eventId === eventId &&
    Date.now() - cachedExperiences.timestamp < 5 * 60 * 1000
  ) {
    return cachedExperiences.data;
  }

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("experiences")
      .select("*, zones(name), sponsors(name)")
      .eq("event_id", eventId)
      .eq("is_active", true);
    if (data && data.length > 0) {
      cachedExperiences = { eventId, timestamp: Date.now(), data };
      return data;
    }
  }

  const fallback = Array.from(mockDb.experiences.values()).filter((e) => e.is_active);
  cachedExperiences = { eventId, timestamp: Date.now(), data: fallback };
  return fallback;
}

export async function getCachedActiveStalls(eventId: string): Promise<Stall[]> {
  if (
    cachedStalls &&
    cachedStalls.eventId === eventId &&
    Date.now() - cachedStalls.timestamp < 5 * 60 * 1000
  ) {
    return cachedStalls.data;
  }

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("stalls")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_active", true);
    if (data && data.length > 0) {
      cachedStalls = { eventId, timestamp: Date.now(), data };
      return data;
    }
  }

  const fallback = Array.from(mockDb.stalls.values()).filter((s) => s.is_active);
  cachedStalls = { eventId, timestamp: Date.now(), data: fallback };
  return fallback;
}

export const getUserProgression = serverCache(async function getUserProgression(
  eventId: string,
  profileId: string
): Promise<UserProgression> {
  const cacheKey = `${eventId}:${profileId}`;
  if (isUsingLiveSupabase()) {
    const cached = userProgressionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < USER_PROGRESSION_TTL) {
      return cached.data;
    }
  }

  const [levels, zones] = await Promise.all([
    getCachedEventLevels(eventId),
    getCachedEventZones(eventId),
  ]);

  let totalZones = zones.length || 6;
  let totalXP = 0;
  let completionsCount = 0;
  const visitedZoneIds = new Set<string>();

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const compsRes = await supabaseAdmin
      .from("experience_completions")
      .select("xp_earned, metadata, experiences(zone_id)")
      .eq("event_id", eventId)
      .eq("profile_id", profileId);

    if (compsRes.data) {
      completionsCount = compsRes.data.length;
      compsRes.data.forEach((c: any) => {
        totalXP += c.xp_earned || 0;
        const zId = c.experiences?.zone_id || c.metadata?.zone_id;
        if (zId) {
          visitedZoneIds.add(zId);
        }
      });
    }
  } else {
    // Memory fallback
    const comps = mockDb.completions.filter(
      (c) => c.event_id === eventId && c.profile_id === profileId
    );
    completionsCount = comps.length;
    comps.forEach((c) => {
      totalXP += c.xp_earned;
      const exp = mockDb.experiences.get(c.experience_id);
      if (exp) visitedZoneIds.add(exp.zone_id);
      if (c.metadata?.zone_id) visitedZoneIds.add(c.metadata.zone_id);
    });

    const passportStamps = mockDb.passportStamps.get(profileId);
    if (passportStamps) {
      passportStamps.forEach((zId) => visitedZoneIds.add(zId));
    }
  }

  // Find level
  let currentLevel = levels[0] || {
    id: "lvl-1",
    event_id: eventId,
    name: "🌱 VIBE Newbie",
    min_xp: 0,
    max_xp: 249,
    badge_media_id: null,
    sort_order: 1,
  };
  let nextLevel: Level | null = levels[1] || null;

  for (let i = 0; i < levels.length; i++) {
    const lvl = levels[i];
    if (totalXP >= lvl.min_xp) {
      currentLevel = lvl;
      nextLevel = levels[i + 1] || null;
    }
  }

  let progressPercent = 100;
  let xpToNextLevel = 0;

  if (nextLevel && nextLevel.min_xp) {
    const range = nextLevel.min_xp - currentLevel.min_xp;
    const currentProgress = totalXP - currentLevel.min_xp;
    progressPercent = Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100)));
    xpToNextLevel = Math.max(0, nextLevel.min_xp - totalXP);
  }

  const result: UserProgression = {
    totalXP,
    currentLevel,
    nextLevel,
    progressPercent,
    xpToNextLevel,
    completedExperiencesCount: completionsCount,
    zonesVisitedCount: visitedZoneIds.size,
    totalZonesCount: totalZones,
  };

  if (isUsingLiveSupabase()) {
    userProgressionCache.set(cacheKey, { timestamp: Date.now(), data: result });
  }

  return result;
});

export async function getUserPassport(
  eventId: string,
  profileId: string
): Promise<PassportZoneItem[]> {
  const [zones, experiences] = await Promise.all([
    getCachedEventZones(eventId),
    getCachedActiveExperiences(eventId),
  ]);

  let completions: any[] = [];
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const compsRes = await supabaseAdmin
      .from("experience_completions")
      .select("*, experiences(zone_id)")
      .eq("event_id", eventId)
      .eq("profile_id", profileId);
    completions = compsRes.data || [];
  } else {
    completions = mockDb.completions.filter(
      (c) => c.event_id === eventId && c.profile_id === profileId
    );
  }

  return zones.map((zone) => {
    const zoneExps = experiences.filter((e) => e.zone_id === zone.id);
    const zoneComps = completions.filter(
      (c: any) =>
        c.experiences?.zone_id === zone.id ||
        c.metadata?.zone_id === zone.id ||
        (c.experience_id && mockDb.experiences.get(c.experience_id)?.zone_id === zone.id)
    );

    const hasStamp =
      mockDb.passportStamps.get(profileId)?.has(zone.id) ||
      (zone.id === "z-arnava" && mockDb.passportStamps.get(profileId)?.has("z-arcade"));

    const isUnlocked = Boolean(hasStamp) || zoneComps.length > 0;
    const firstCompletedAt = isUnlocked
      ? zoneComps.length > 0
        ? zoneComps.sort(
            (a: any, b: any) =>
              new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
          )[0].completed_at
        : new Date().toISOString()
      : null;

    return {
      zone,
      isUnlocked,
      experiencesCount: zoneExps.length,
      completedExperiencesCount: zoneComps.length,
      firstCompletedAt,
    };
  });
}

export async function getUserQuests(eventId: string, profileId: string) {
  if (isUsingLiveSupabase() && supabaseAdmin) {
    if (
      !cachedQuests ||
      cachedQuests.eventId !== eventId ||
      Date.now() - cachedQuests.timestamp > CATALOG_CACHE_TTL
    ) {
      const { data } = await supabaseAdmin
        .from("quests")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_active", true);
      cachedQuests = { eventId, timestamp: Date.now(), data: data || [] };
    }

    const [progRes] = await Promise.all([
      supabaseAdmin
        .from("quest_progress")
        .select("*")
        .eq("event_id", eventId)
        .eq("profile_id", profileId),
    ]);

    const quests = cachedQuests.data;
    const progMap = new Map((progRes.data || []).map((p: any) => [p.quest_id, p]));

    return quests.map((quest) => {
      const qp = progMap.get(quest.id) || {
        id: "",
        event_id: eventId,
        profile_id: profileId,
        quest_id: quest.id,
        progress_value: 0,
        target_value: (quest.condition_config as any)?.target || 1,
        completed_at: null,
      };

      const target = qp.target_value || 1;
      const isCompleted = Boolean(qp.completed_at) || qp.progress_value >= target;

      return {
        quest,
        progress: qp,
        isCompleted,
        percent: Math.min(100, Math.round((qp.progress_value / target) * 100)),
      };
    });
  }

  // Memory fallback
  mockDb.evaluateQuestsForProfile(eventId, profileId);
  return mockDb.quests.map((quest) => {
    const qp = mockDb.questProgress.get(`${profileId}:${quest.id}`) || {
      id: "",
      event_id: eventId,
      profile_id: profileId,
      quest_id: quest.id,
      progress_value: 0,
      target_value: quest.condition_config.target || 1,
      completed_at: null,
      updated_at: new Date().toISOString(),
    };
    return {
      quest,
      progress: qp,
      isCompleted: Boolean(qp.completed_at),
      percent: Math.min(100, Math.round((qp.progress_value / qp.target_value) * 100)),
    };
  });
}

export async function getUserAchievements(eventId: string, profileId: string) {
  if (isUsingLiveSupabase() && supabaseAdmin) {
    if (
      !cachedAchievements ||
      cachedAchievements.eventId !== eventId ||
      Date.now() - cachedAchievements.timestamp > CATALOG_CACHE_TTL
    ) {
      const { data } = await supabaseAdmin
        .from("achievements")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_active", true);
      cachedAchievements = { eventId, timestamp: Date.now(), data: data || [] };
    }

    const { data: userAchData } = await supabaseAdmin
      .from("user_achievements")
      .select("*")
      .eq("event_id", eventId)
      .eq("profile_id", profileId);

    const achievements = cachedAchievements.data;
    const unlockedMap = new Map(
      (userAchData || []).map((ua: any) => [ua.achievement_id, ua.unlocked_at])
    );

    return achievements.map((ach) => ({
      achievement: ach,
      isUnlocked: unlockedMap.has(ach.id),
      unlockedAt: unlockedMap.get(ach.id) || null,
    }));
  }

  // Memory fallback
  mockDb.evaluateAchievementsForProfile(eventId, profileId);
  const unlockedMap = new Map(
    mockDb.userAchievements
      .filter((ua) => ua.profile_id === profileId)
      .map((ua) => [ua.achievement_id, ua.unlocked_at])
  );
  return mockDb.achievements.map((ach) => ({
    achievement: ach,
    isUnlocked: unlockedMap.has(ach.id),
    unlockedAt: unlockedMap.get(ach.id) || null,
  }));
}

export async function getUserPlayerStats(profileId: string): Promise<UserPlayerStats> {
  return mockDb.getUserPlayerStats(profileId);
}
