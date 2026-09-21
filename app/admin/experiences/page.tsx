import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { ExperiencesClient } from "@/components/admin/experiences-client";

export const dynamic = "force-dynamic";

export default async function AdminExperiencesPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  let experiences: any[] = [];
  let zones: { id: string; name: string }[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [expsRes, zonesRes] = await Promise.all([
      supabaseAdmin
        .from("experiences")
        .select("*, zones(name), sponsors(name)")
        .eq("event_id", eventId)
        .order("coin_cost", { ascending: true }),
      supabaseAdmin
        .from("zones")
        .select("id, name")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true }),
    ]);

    experiences = (expsRes.data || []).map((exp: any) => ({
      ...exp,
      zoneName: exp.zones?.name || "Zone",
      sponsorName: exp.sponsors?.name || "Official VIBE",
    }));

    zones = (zonesRes.data || []).map((z: any) => ({
      id: z.id,
      name: z.name,
    }));
  } else {
    experiences = Array.from(mockDb.experiences.values()).map((exp) => ({
      ...exp,
      zoneName: mockDb.zones.get(exp.zone_id)?.name || "Zone",
      sponsorName: exp.sponsor_id ? mockDb.sponsors.get(exp.sponsor_id)?.name : "Official VIBE",
    }));

    zones = Array.from(mockDb.zones.values())
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((z) => ({
        id: z.id,
        name: z.name,
      }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight font-mono uppercase">
          Missions & Experiences Command
        </h1>
        <p className="text-xs text-muted-foreground font-bold">
          Live mission statuses, instant toggle activation, and coin/XP adjustment
        </p>
      </div>

      <ExperiencesClient
        initialExperiences={experiences}
        availableZones={zones}
      />
    </div>
  );
}
