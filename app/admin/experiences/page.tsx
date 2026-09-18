import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminExperiencesPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  let experiences: any[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("experiences")
      .select("*, zones(name), sponsors(name)")
      .eq("event_id", eventId)
      .order("coin_cost", { ascending: true });

    experiences = (data || []).map((exp: any) => ({
      ...exp,
      zoneName: exp.zones?.name || "Zone",
      sponsorName: exp.sponsors?.name || "—",
    }));
  } else {
    experiences = Array.from(mockDb.experiences.values()).map((exp) => ({
      ...exp,
      zoneName: mockDb.zones.get(exp.zone_id)?.name || "Zone",
      sponsorName: exp.sponsor_id ? mockDb.sponsors.get(exp.sponsor_id)?.name : "—",
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight font-mono">
            Experiences & Missions
          </h1>
          <p className="text-xs text-muted-foreground font-bold">
            Configure missions, coin costs, XP rewards, and attempt limits
          </p>
        </div>
      </div>

      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b-2 border-border text-muted-foreground uppercase text-[11px]">
                <th className="pb-3 font-black">Title</th>
                <th className="pb-3 font-black">Zone</th>
                <th className="pb-3 font-black">Sponsor</th>
                <th className="pb-3 font-black">Cost</th>
                <th className="pb-3 font-black">XP Reward</th>
                <th className="pb-3 font-black">Max Attempts</th>
                <th className="pb-3 font-black">Cooldown</th>
                <th className="pb-3 font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border font-medium">
              {experiences.map((exp) => (
                <tr key={exp.id} className="hover:bg-muted transition-colors">
                  <td className="py-3 text-foreground font-black">{exp.title}</td>
                  <td className="py-3 font-black text-primary">
                    {exp.zoneName}
                  </td>
                  <td className="py-3 text-muted-foreground font-bold">
                    {exp.sponsorName}
                  </td>
                  <td className="py-3 font-mono font-black text-foreground">
                    {exp.coin_cost > 0 ? `${exp.coin_cost} Coins` : "Free"}
                  </td>
                  <td className="py-3 font-mono font-black text-primary">
                    +{exp.xp_reward} XP
                  </td>
                  <td className="py-3 font-mono text-muted-foreground font-bold">
                    {exp.max_attempts}
                  </td>
                  <td className="py-3 font-mono text-muted-foreground font-bold">
                    {exp.cooldown_seconds > 0
                      ? `${exp.cooldown_seconds}s`
                      : "None"}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 border-2 border-border text-[10px] font-black bg-secondary text-secondary-foreground shadow-[1px_1px_0px_var(--border)]">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
