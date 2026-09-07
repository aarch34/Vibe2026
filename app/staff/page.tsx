import { mockDb } from "@/lib/db/supabase";
import { StaffDashboardClient } from "@/components/staff/staff-client";

export default function StaffDashboardPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";

  // Zone Staff assigned to Zone A (Cyber Arcade)
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
