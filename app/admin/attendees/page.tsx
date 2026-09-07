import { mockDb } from "@/lib/db/supabase";
import { AttendeesClient } from "@/components/admin/attendees-client";

export default function AdminAttendeesPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  const profiles = Array.from(mockDb.profiles.values());

  const initialAttendees = profiles.map((p) => {
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
