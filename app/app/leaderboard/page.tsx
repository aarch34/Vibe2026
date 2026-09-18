import { getCurrentUserSession } from "@/lib/auth/session";
import {
  getLeaderboard,
  getUserLeaderboardRank,
  getZoneLeaderboard,
} from "@/lib/leaderboard/leaderboard-service";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { DualLeaderboardClient } from "@/components/leaderboard/dual-leaderboard-client";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getCurrentUserSession();
  const [leaderboardRes, currentUserRank, zoneEntries] = await Promise.all([
    getLeaderboard(session.eventId, 50, 0),
    getUserLeaderboardRank(session.eventId, session.profile.id),
    getZoneLeaderboard(session.eventId),
  ]);

  let isFrozen = mockDb.isEventFrozen;
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("status")
      .eq("id", session.eventId)
      .single();
    if (ev) {
      isFrozen = ev.status === "frozen" || ev.status === "concluded";
    }
  }

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground tracking-tight font-mono">
              {isFrozen ? "Final District Standings" : "Festival Leaderboards"}
            </h1>
            <p className="text-xs text-muted-foreground font-bold">
              Rotaract District 3192 Live Standings & Zone Battle
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-black text-foreground bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] px-3 py-1">
          {leaderboardRes.totalParticipants} Attendees
        </span>
      </div>

      <DualLeaderboardClient
        entries={leaderboardRes.entries}
        totalParticipants={leaderboardRes.totalParticipants}
        currentUserRank={currentUserRank}
        zoneEntries={zoneEntries}
        currentProfileId={session.profile.id}
        assignedZoneId={session.profile.assigned_zone_id}
        isFrozen={isFrozen}
      />
    </div>
  );
}
