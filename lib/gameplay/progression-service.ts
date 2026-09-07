import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { Level, Zone, Quest, QuestProgress, Achievement } from "@/types/database";

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
  const levels = mockDb.levels.sort((a, b) => a.sort_order - b.sort_order);
  const totalZones = mockDb.zones.size;

  let totalXP = 0;
  let completionsCount = 0;
  let visitedZoneIds = new Set<string>();

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data: comps } = await supabaseAdmin
      .from("experience_completions")
      .select("xp_earned, experiences(zone_id)")
      .eq("event_id", eventId)
      .eq("profile_id", profileId);

    if (comps) {
      completionsCount = comps.length;
      comps.forEach((c: any) => {
        totalXP += c.xp_earned || 0;
        if (c.experiences?.zone_id) {
          visitedZoneIds.add(c.experiences.zone_id);
        }
      });
    }
  } else {
    const comps = mockDb.completions.filter(
      (c) => c.event_id === eventId && c.profile_id === profileId
    );
    completionsCount = comps.length;
    comps.forEach((c) => {
      totalXP += c.xp_earned;
      const exp = mockDb.experiences.get(c.experience_id);
      if (exp) visitedZoneIds.add(exp.zone_id);
    });
  }

  // Find level
  let currentLevel = levels[0];
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
  const zones = Array.from(mockDb.zones.values()).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const userComps = mockDb.completions.filter(
    (c) => c.event_id === eventId && c.profile_id === profileId
  );

  return zones.map((zone) => {
    const zoneExperiences = Array.from(mockDb.experiences.values()).filter(
      (e) => e.zone_id === zone.id && e.is_active
    );

    const completedInZone = userComps.filter((c) => {
      const exp = mockDb.experiences.get(c.experience_id);
      return exp && exp.zone_id === zone.id;
    });

    const isUnlocked = completedInZone.length > 0;
    const firstCompletedAt = isUnlocked
      ? completedInZone.sort(
          (a, b) =>
            new Date(a.completed_at).getTime() -
            new Date(b.completed_at).getTime()
        )[0].completed_at
      : null;

    return {
      zone,
      isUnlocked,
      experiencesCount: zoneExperiences.length,
      completedExperiencesCount: completedInZone.length,
      firstCompletedAt,
    };
  });
}

export async function getUserQuests(eventId: string, profileId: string) {
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
      percent: Math.min(
        100,
        Math.round((qp.progress_value / qp.target_value) * 100)
      ),
    };
  });
}

export async function getUserAchievements(eventId: string, profileId: string) {
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
