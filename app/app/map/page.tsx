import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import {
  getCachedEventZones,
  getCachedActiveExperiences,
} from "@/lib/gameplay/progression-service";
import { VenueMap } from "@/components/map/venue-map";
import { Compass } from "lucide-react";
import { Zone, Experience, ExperienceCompletion } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function VenueMapPage() {
  const session = await getCurrentUserSession();

  let zones: Zone[] = [];
  let experiences: Experience[] = [];
  let userCompletions: ExperienceCompletion[] = [];

  const [cachedZones, cachedExps] = await Promise.all([
    getCachedEventZones(session.eventId),
    getCachedActiveExperiences(session.eventId),
  ]);

  zones = cachedZones;
  experiences = cachedExps;

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data: comps } = await supabaseAdmin
      .from("experience_completions")
      .select("*")
      .eq("event_id", session.eventId)
      .eq("profile_id", session.profile.id);

    userCompletions = comps || [];
  }

  if (
    !zones ||
    zones.length < 6 ||
    !zones.some((z) => z.slug === "arnava" || z.name === "Arnava")
  ) {
    zones = Array.from(mockDb.zones.values())
      .filter((z) =>
        ["arnava", "taranaga", "sagara", "pravaha", "samudhra", "varuna"].includes(
          z.slug
        )
      )
      .sort((a, b) => a.sort_order - b.sort_order);
    experiences = Array.from(mockDb.experiences.values()).filter((e) => e.is_active);
    userCompletions = mockDb.completions.filter(
      (c) => c.profile_id === session.profile.id && c.event_id === session.eventId
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2.5">
        <div className="w-10 h-10 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
          <Compass className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight font-mono">
            Venue Game Map
          </h1>
          <p className="text-xs text-muted-foreground font-bold">
            Tap a zone to discover missions, games, and rewards
          </p>
        </div>
      </div>

      <VenueMap
        zones={zones}
        experiences={experiences}
        userCompletions={userCompletions}
        assignedZoneId={session.profile.assigned_zone_id}
      />
    </div>
  );
}
