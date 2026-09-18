import { redirect } from "next/navigation";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { getZonalStaffSession } from "@/actions/staff/auth";
import { StaffDashboardClient } from "@/components/staff/staff-client";
import { renderQRCodeDataUrl } from "@/lib/qr/qr-service";
import { getZoneLeaderboard } from "@/lib/leaderboard/leaderboard-service";
import { Zone, Experience } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
  const staff = await getZonalStaffSession();
  if (!staff) {
    redirect("/staff/login");
  }

  const eventId = "a0000000-0000-0000-0000-000000000001";
  let assignedZone: Zone;
  let zoneExperiences: Experience[] = [];
  let recentActivity: any[] = [];
  let totalCompletions = 0;
  let zoneCoins = 0;
  let zoneRank = 1;

  // 1. Get Zone Leaderboard to know current rank & coins
  const zoneRanks = await getZoneLeaderboard(eventId);
  const currentRankEntry = zoneRanks.find(
    (z) => z.zone_id === staff.zoneId || z.slug === staff.zoneSlug
  );
  if (currentRankEntry) {
    zoneRank = currentRankEntry.rank;
    zoneCoins = currentRankEntry.coins_collected;
  }

  if (isUsingLiveSupabase() && supabaseAdmin) {
    // 2. Fetch the assigned zone details
    const { data: zData } = await supabaseAdmin
      .from("zones")
      .select("*")
      .eq("event_id", eventId)
      .eq("slug", staff.zoneSlug)
      .maybeSingle();

    assignedZone = zData || {
      id: staff.zoneId,
      event_id: eventId,
      name: staff.zoneName,
      slug: staff.zoneSlug,
      description: `Official check-in station for ${staff.zoneName}.`,
      image_media_id: null,
      map_data: null,
      sort_order: 1,
      is_active: true,
      coins_collected: zoneCoins,
    };

    // 3. Fetch experiences in this zone
    const { data: exps } = await supabaseAdmin
      .from("experiences")
      .select("*")
      .eq("zone_id", assignedZone.id)
      .eq("is_active", true);

    zoneExperiences = exps || [];
    const expIds = zoneExperiences.map((e) => e.id);

    // 4. Fetch recent completions in this zone
    if (expIds.length > 0) {
      const { data: comps, count } = await supabaseAdmin
        .from("experience_completions")
        .select(
          "id, experience_id, profile_id, xp_earned, coin_spent, completed_at, experiences(title), profiles(display_name, vibe_id)",
          { count: "exact" }
        )
        .in("experience_id", expIds)
        .order("completed_at", { ascending: false })
        .limit(15);

      totalCompletions = count || 0;
      recentActivity = (comps || []).map((c: any) => ({
        id: c.id,
        experienceTitle: c.experiences?.title || `${assignedZone.name} Check-in`,
        attendeeName: c.profiles?.display_name || "VIBE Fresher",
        vibeId: c.profiles?.vibe_id || "VIBE-0000",
        xpEarned: c.xp_earned,
        coinSpent: c.coin_spent,
        completedAt: c.completed_at,
      }));
    }
  } else {
    // Mock store
    const memZone =
      mockDb.zones.get(`z-${staff.zoneSlug}`) ||
      mockDb.zones.get(staff.zoneId) ||
      Array.from(mockDb.zones.values()).find((z) => z.slug === staff.zoneSlug) ||
      Array.from(mockDb.zones.values())[0];

    assignedZone = memZone;
    zoneCoins = memZone.coins_collected || zoneCoins;

    zoneExperiences = Array.from(mockDb.experiences.values()).filter(
      (e) => e.zone_id === assignedZone.id
    );

    const zoneCompletions = mockDb.completions.filter((c) => {
      const exp = mockDb.experiences.get(c.experience_id);
      return exp && exp.zone_id === assignedZone.id;
    });

    totalCompletions = zoneCompletions.length;
    recentActivity = zoneCompletions
      .slice(-15)
      .reverse()
      .map((c) => {
        const exp = mockDb.experiences.get(c.experience_id);
        const profile = mockDb.profiles.get(c.profile_id);
        return {
          id: c.id,
          experienceTitle: exp?.title || `${assignedZone.name} Check-in`,
          attendeeName: profile?.display_name || "VIBE Fresher",
          vibeId: profile?.vibe_id || "VIBE-0000",
          xpEarned: c.xp_earned,
          coinSpent: c.coin_spent,
          completedAt: c.completed_at,
        };
      });
  }

  // Generate real scannable QR Code Data URLs
  const checkpointCode = `vibe-zone-${assignedZone.slug}-xp`;
  const activityCode = `vibe-activity-${assignedZone.slug}`;

  const [checkpointQrDataUrl, activityQrDataUrl] = await Promise.all([
    renderQRCodeDataUrl(checkpointCode),
    renderQRCodeDataUrl(activityCode),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <StaffDashboardClient
        assignedZone={assignedZone}
        staffUser={staff}
        experiences={zoneExperiences}
        recentActivity={recentActivity}
        totalCompletions={totalCompletions}
        zoneCoins={zoneCoins}
        zoneRank={zoneRank}
        checkpointCode={checkpointCode}
        checkpointQrDataUrl={checkpointQrDataUrl}
        activityCode={activityCode}
        activityQrDataUrl={activityQrDataUrl}
      />
    </div>
  );
}
