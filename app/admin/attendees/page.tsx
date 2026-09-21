import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { AttendeesClient } from "@/components/admin/attendees-client";

export const dynamic = "force-dynamic";

export default async function AdminAttendeesPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  let initialAttendees: any[] = [];
  let availableZones: { id: string; name: string }[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [profilesRes, walletsRes, compsRes, zonesRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, display_name, vibe_id, phone, instagram_id, college, club, assigned_zone_id, created_at, zones(name)")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("wallets")
        .select("profile_id, balance")
        .eq("event_id", eventId),
      supabaseAdmin
        .from("experience_completions")
        .select("profile_id, xp_earned")
        .eq("event_id", eventId),
      supabaseAdmin
        .from("zones")
        .select("id, name")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true }),
    ]);

    availableZones = (zonesRes.data || []).map((z: any) => ({ id: z.id, name: z.name }));

    const walletsMap = new Map<string, number>();
    (walletsRes.data || []).forEach((w: any) => walletsMap.set(w.profile_id, w.balance || 0));

    const xpMap = new Map<string, { totalXP: number; count: number }>();
    (compsRes.data || []).forEach((c: any) => {
      const cur = xpMap.get(c.profile_id) || { totalXP: 0, count: 0 };
      cur.totalXP += c.xp_earned || 0;
      cur.count += 1;
      xpMap.set(c.profile_id, cur);
    });

    initialAttendees = (profilesRes.data || []).map((p: any) => {
      const progress = xpMap.get(p.id) || { totalXP: 0, count: 0 };
      const zoneName = p.zones?.name || "Arnava";
      return {
        id: p.id,
        displayName: p.display_name || "VIBE Attendee",
        vibeId: p.vibe_id || "VIBE-Attendee",
        phone: p.phone || "",
        instagramId: p.instagram_id || "",
        college: p.college || "Rotaract District 3192",
        club: p.club || "",
        assignedZoneId: p.assigned_zone_id || availableZones[0]?.id || "",
        zoneName,
        coins: walletsMap.get(p.id) || 0,
        totalXP: progress.totalXP,
        completionsCount: progress.count,
        registeredAt: p.created_at,
      };
    });
  } else {
    const profiles = Array.from(mockDb.profiles.values());
    availableZones = Array.from(mockDb.zones.values()).map((z) => ({ id: z.id, name: z.name }));

    initialAttendees = profiles.map((p) => {
      const wallet = mockDb.wallets.get(`${eventId}:${p.id}`);
      const userComps = mockDb.completions.filter(
        (c) => c.event_id === eventId && c.profile_id === p.id
      );
      const totalXP = userComps.reduce((sum, c) => sum + c.xp_earned, 0);
      const zoneName = p.assigned_zone_id ? (mockDb.zones.get(p.assigned_zone_id)?.name || "Arnava") : "Arnava";

      return {
        id: p.id,
        displayName: p.display_name,
        vibeId: p.vibe_id,
        phone: p.phone || "",
        instagramId: p.instagram_id || "",
        college: p.college || "Rotaract District 3192",
        club: p.club || "",
        assignedZoneId: p.assigned_zone_id || availableZones[0]?.id || "",
        zoneName,
        coins: wallet?.balance || 0,
        totalXP,
        completionsCount: userComps.length,
        registeredAt: p.created_at,
      };
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Attendee Directory & Ledger
        </h1>
        <p className="text-sm text-slate-400">
          Search all registered accounts, register attendees manually, edit details, and perform audited Coins & XP adjustments
        </p>
      </div>

      <AttendeesClient initialAttendees={initialAttendees} availableZones={availableZones} />
    </div>
  );
}
