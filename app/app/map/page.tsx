import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { VenueMap } from "@/components/map/venue-map";
import { Compass } from "lucide-react";
import { Zone, Experience, ExperienceCompletion } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function VenueMapPage() {
  const session = await getCurrentUserSession();

  let zones: Zone[] = [];
  let experiences: Experience[] = [];
  let userCompletions: ExperienceCompletion[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [zonesRes, expsRes, compsRes] = await Promise.all([
      supabaseAdmin
        .from("zones")
        .select("*")
        .eq("event_id", session.eventId)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("experiences")
        .select("*")
        .eq("event_id", session.eventId)
        .eq("is_active", true),
      supabaseAdmin
        .from("experience_completions")
        .select("*")
        .eq("event_id", session.eventId)
        .eq("profile_id", session.profile.id),
    ]);

    zones = zonesRes.data || [];
    experiences = expsRes.data || [];
    userCompletions = compsRes.data || [];
  } else {
    zones = Array.from(mockDb.zones.values()).sort((a, b) => a.sort_order - b.sort_order);
    experiences = Array.from(mockDb.experiences.values()).filter((e) => e.is_active);
    userCompletions = mockDb.completions.filter(
      (c) => c.profile_id === session.profile.id && c.event_id === session.eventId
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Compass className="w-5 h-5 text-blue-400" />
        <div>
          <h1 className="text-lg font-black text-white tracking-tight">
            Venue Game Map
          </h1>
          <p className="text-xs text-slate-400">
            Tap a zone to discover missions, games, and rewards
          </p>
        </div>
      </div>

      <VenueMap
        zones={zones}
        experiences={experiences}
        userCompletions={userCompletions}
      />
    </div>
  );
}
