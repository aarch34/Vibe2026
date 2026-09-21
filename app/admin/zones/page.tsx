import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { ZonesClient } from "@/components/admin/zones-client";

export const dynamic = "force-dynamic";

export default async function AdminZonesPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  let zonesWithStats: any[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [zonesRes, profilesRes, expsRes] = await Promise.all([
      supabaseAdmin
        .from("zones")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true }),
      supabaseAdmin.from("profiles").select("assigned_zone_id"),
      supabaseAdmin.from("experiences").select("zone_id").eq("event_id", eventId),
    ]);

    const rawZones = zonesRes.data || [];
    const profiles = profilesRes.data || [];
    const exps = expsRes.data || [];

    zonesWithStats = rawZones.map((z: any) => ({
      ...z,
      attendeesCount: profiles.filter((p: any) => p.assigned_zone_id === z.id).length,
      experiencesCount: exps.filter((e: any) => e.zone_id === z.id).length,
    }));
  } else {
    const zones = Array.from(mockDb.zones.values()).sort(
      (a, b) => a.sort_order - b.sort_order
    );

    const profiles = Array.from(mockDb.profiles.values());
    const exps = Array.from(mockDb.experiences.values());

    zonesWithStats = zones.map((z) => ({
      ...z,
      attendeesCount: profiles.filter((p) => p.assigned_zone_id === z.id).length,
      experiencesCount: exps.filter((e) => e.zone_id === z.id).length,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight font-mono uppercase">
          Zone Command & Operations
        </h1>
        <p className="text-xs text-muted-foreground font-bold">
          Live oceanic zone status, attendee distribution, and bonus coin awards
        </p>
      </div>

      <ZonesClient initialZones={zonesWithStats} />
    </div>
  );
}
