import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import {
  Level,
  Zone,
  Quest,
  QuestProgress,
  Achievement,
  UserPlayerStats,
} from "@/types/database";

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

export async function getUserProgression(
  eventId: string,
  profileId: string
): Promise<UserProgression> {
  let levels: Level[] = [];
  let totalZones = 6;
  let totalXP = 0;
  let completionsCount = 0;
  const visitedZoneIds = new Set<string>();

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [levelsRes, zonesRes, compsRes] = await Promise.all([
      supabaseAdmin.from("levels").select("*").order("sort_order", { ascending: true }),
      supabaseAdmin.from("zones").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("experience_completions")
        .select("xp_earned, metadata, experiences(zone_id)")
        .eq("event_id", eventId)
        .eq("profile_id", profileId),
    ]);

    levels = levelsRes.data || [];
    totalZones = zonesRes.count || 6;

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
  }

  // Fallback if no levels in db
  if (levels.length === 0) {
    levels = mockDb.levels.sort((a, b) => a.sort_order - b.sort_order);
    totalZones = 6;
    if (!isUsingLiveSupabase() || !supabaseAdmin) {
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

  return {
    totalXP,
    currentLevel,
    nextLevel,
    progressPercent,
    xpToNextLevel,
    completedExperiencesCount: completionsCount,
    zonesVisitedCount: visitedZoneIds.size,
    totalZonesCount: totalZones,
  };
}

export async function getUserPassport(
  eventId: string,
  profileId: string
): Promise<PassportZoneItem[]> {
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [zonesRes, expsRes, compsRes] = await Promise.all([
      supabaseAdmin
        .from("zones")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("experiences")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_active", true),
      supabaseAdmin
        .from("experience_completions")
        .select("*, experiences(zone_id)")
        .eq("event_id", eventId)
        .eq("profile_id", profileId),
    ]);

    const zones: Zone[] = zonesRes.data || [];
    const experiences = expsRes.data || [];
    const comps = compsRes.data || [];

    return zones.map((zone) => {
      const zoneExps = experiences.filter((e) => e.zone_id === zone.id);
      const zoneComps = comps.filter(
        (c: any) => c.experiences?.zone_id === zone.id || c.metadata?.zone_id === zone.id
      );

      const isUnlocked = zoneComps.length > 0;
      const firstCompletedAt = isUnlocked
        ? zoneComps.sort(
            (a: any, b: any) =>
              new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
          )[0].completed_at
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

  // Memory fallback - include all zones from mockDb
  const zones = Array.from(mockDb.zones.values())
    .sort((a, b) => a.sort_order - b.sort_order);

  const userComps = mockDb.completions.filter(
    (c) => c.event_id === eventId && c.profile_id === profileId
  );

  return zones.map((zone) => {
    const zoneExperiences = Array.from(mockDb.experiences.values()).filter(
      (e) => e.zone_id === zone.id && e.is_active
    );
    const completedInZone = userComps.filter((c) => {
      const exp = mockDb.experiences.get(c.experience_id);
      return (exp && exp.zone_id === zone.id) || c.metadata?.zone_id === zone.id;
    });
    const hasStamp =
      mockDb.passportStamps.get(profileId)?.has(zone.id) ||
      (zone.id === "z-arnava" && mockDb.passportStamps.get(profileId)?.has("z-arcade"));
    const isUnlocked = Boolean(hasStamp) || completedInZone.length > 0;

    return {
      zone,
      isUnlocked,
      experiencesCount: zoneExperiences.length,
      completedExperiencesCount: completedInZone.length,
      firstCompletedAt: isUnlocked ? new Date().toISOString() : null,
    };
  });
}

export async function getUserQuests(eventId: string, profileId: string) {
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [questsRes, progRes] = await Promise.all([
      supabaseAdmin
        .from("quests")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_active", true),
      supabaseAdmin
        .from("quest_progress")
        .select("*")
        .eq("event_id", eventId)
        .eq("profile_id", profileId),
    ]);

    const quests = questsRes.data || [];
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
    const [achRes, userAchRes] = await Promise.all([
      supabaseAdmin
        .from("achievements")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_active", true),
      supabaseAdmin
        .from("user_achievements")
        .select("*")
        .eq("event_id", eventId)
        .eq("profile_id", profileId),
    ]);

    const achievements = achRes.data || [];
    const unlockedMap = new Map(
      (userAchRes.data || []).map((ua: any) => [ua.achievement_id, ua.unlocked_at])
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
