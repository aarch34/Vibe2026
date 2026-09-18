import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { AttendeesClient } from "@/components/admin/attendees-client";

export const dynamic = "force-dynamic";

export default async function AdminAttendeesPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  let initialAttendees: any[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [profilesRes, walletsRes, compsRes, zonesRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, display_name, vibe_id, college, created_at")
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
        .select("id, name"),
    ]);

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
      return {
        id: p.id,
        displayName: p.display_name || "VIBE Attendee",
        vibeId: p.vibe_id || "VIBE-Attendee",
        college: p.college || "Rotaract District 3192",
        coins: walletsMap.get(p.id) || 0,
        totalXP: progress.totalXP,
        completionsCount: progress.count,
        zoneName: "Arnava",
        registeredAt: p.created_at,
      };
    });
  } else {
    const profiles = Array.from(mockDb.profiles.values());

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
        college: p.club || p.college,
        instagramId: p.instagram_id,
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
          Search all registered accounts, view live balances, and perform audited Coins & XP adjustments
        </p>
      </div>

      <AttendeesClient initialAttendees={initialAttendees} />
    </div>
  );
}
