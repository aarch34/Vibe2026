import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { AttendeesClient } from "@/components/admin/attendees-client";

export const dynamic = "force-dynamic";

export default async function AdminAttendeesPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  let initialAttendees: any[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [membersRes, walletsRes, compsRes] = await Promise.all([
      supabaseAdmin
        .from("event_members")
        .select("profile_id, profiles(id, display_name, vibe_id, college)")
        .eq("event_id", eventId),
      supabaseAdmin
        .from("wallets")
        .select("profile_id, balance")
        .eq("event_id", eventId),
      supabaseAdmin
        .from("experience_completions")
        .select("profile_id, xp_earned")
        .eq("event_id", eventId),
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

    initialAttendees = (membersRes.data || []).map((m: any) => {
      const p = m.profiles;
      const progress = xpMap.get(m.profile_id) || { totalXP: 0, count: 0 };
      return {
        id: p.id,
        displayName: p.display_name,
        vibeId: p.vibe_id,
        college: p.college,
        coins: walletsMap.get(m.profile_id) || 0,
        totalXP: progress.totalXP,
        completionsCount: progress.count,
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

      return {
        id: p.id,
        displayName: p.display_name,
        vibeId: p.vibe_id,
        college: p.college,
        coins: wallet?.balance || 0,
        totalXP,
        completionsCount: userComps.length,
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
          Search attendees, view live balances, and perform audited balance adjustments
        </p>
      </div>

      <AttendeesClient initialAttendees={initialAttendees} />
    </div>
  );
}
