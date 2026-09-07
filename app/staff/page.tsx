import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { StaffDashboardClient } from "@/components/staff/staff-client";
import { Zone, Experience } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";

  if (isUsingLiveSupabase() && supabaseAdmin) {
    // 1. Fetch assigned zone (default to Cyber Arcade or first zone)
    const { data: zones } = await supabaseAdmin
      .from("zones")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true });

    const assignedZone: Zone = zones?.[0] || {
      id: "d0000000-0000-0000-0000-000000000001",
      event_id: eventId,
      name: "Cyber Arcade",
      slug: "zone-arcade",
      description: "Retro & VR gaming tournament hub",
      image_media_id: null,
      map_data: null,
      sort_order: 1,
      is_active: true,
    };

    // 2. Fetch experiences in this zone
    const { data: experiences } = await supabaseAdmin
      .from("experiences")
      .select("*")
      .eq("zone_id", assignedZone.id)
      .eq("is_active", true);

    const zoneExperiences: Experience[] = experiences || [];

    // 3. Fetch recent completions
    const expIds = zoneExperiences.map((e) => e.id);
    const { data: comps } = await supabaseAdmin
      .from("experience_completions")
      .select("id, experience_id, profile_id, xp_earned, coin_spent, completed_at, experiences(title), profiles(display_name, vibe_id)")
      .in("experience_id", expIds.length > 0 ? expIds : ["00000000-0000-0000-0000-000000000000"])
      .order("completed_at", { ascending: false })
      .limit(10);

    const recentActivity = (comps || []).map((c: any) => ({
      id: c.id,
      experienceTitle: c.experiences?.title || "Zone Mission",
      attendeeName: c.profiles?.display_name || "Attendee",
      vibeId: c.profiles?.vibe_id || "VIBE-0000",
      xpEarned: c.xp_earned,
      coinSpent: c.coin_spent,
      completedAt: c.completed_at,
    }));

    const { count: totalCompletions } = await supabaseAdmin
      .from("experience_completions")
      .select("*", { count: "exact", head: true })
      .in("experience_id", expIds.length > 0 ? expIds : ["00000000-0000-0000-0000-000000000000"]);

    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 max-w-lg mx-auto">
        <StaffDashboardClient
          assignedZone={assignedZone}
          experiences={zoneExperiences}
          recentActivity={recentActivity}
          totalCompletions={totalCompletions || 0}
        />
      </div>
    );
  }

  // Memory fallback
  const assignedZone = mockDb.zones.get("z-arcade")!;
  const zoneExperiences = Array.from(mockDb.experiences.values()).filter(
    (e) => e.zone_id === assignedZone.id
  );

  const zoneCompletions = mockDb.completions.filter((c) => {
    const exp = mockDb.experiences.get(c.experience_id);
    return exp && exp.zone_id === assignedZone.id;
  });

  const recentActivity = zoneCompletions
    .slice(-10)
    .reverse()
    .map((c) => {
      const exp = mockDb.experiences.get(c.experience_id);
      const profile = mockDb.profiles.get(c.profile_id);
      return {
        id: c.id,
        experienceTitle: exp?.title || "Mission",
        attendeeName: profile?.display_name || "Attendee",
        vibeId: profile?.vibe_id || "VIBE-0000",
        xpEarned: c.xp_earned,
        coinSpent: c.coin_spent,
        completedAt: c.completed_at,
      };
    });

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 max-w-lg mx-auto">
      <StaffDashboardClient
        assignedZone={assignedZone}
        experiences={zoneExperiences}
        recentActivity={recentActivity}
        totalCompletions={zoneCompletions.length}
      />
    </div>
  );
}
