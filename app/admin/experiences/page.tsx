import { mockDb } from "@/lib/db/supabase";
import { Sparkles } from "lucide-react";

export default function AdminExperiencesPage() {
  const experiences = Array.from(mockDb.experiences.values());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Experiences & Missions
          </h1>
          <p className="text-sm text-slate-400">
            Configure missions, coin costs, XP rewards, and attempt limits
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <th className="pb-3">Title</th>
                <th className="pb-3">Zone</th>
                <th className="pb-3">Sponsor</th>
                <th className="pb-3">Cost</th>
                <th className="pb-3">XP Reward</th>
                <th className="pb-3">Max Attempts</th>
                <th className="pb-3">Cooldown</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {experiences.map((exp) => {
                const zone = mockDb.zones.get(exp.zone_id);
                const sponsor = exp.sponsor_id
                  ? mockDb.sponsors.get(exp.sponsor_id)
                  : null;

                return (
                  <tr key={exp.id} className="hover:bg-slate-800/30">
                    <td className="py-3 text-white font-bold">{exp.title}</td>
                    <td className="py-3 font-semibold text-blue-400">
                      {zone?.name || "Zone"}
                    </td>
                    <td className="py-3 text-slate-300">
                      {sponsor?.name || "—"}
                    </td>
                    <td className="py-3 font-mono font-bold text-amber-400">
                      {exp.coin_cost > 0 ? `${exp.coin_cost} Coins` : "Free"}
                    </td>
                    <td className="py-3 font-mono font-bold text-purple-400">
                      +{exp.xp_reward} XP
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {exp.max_attempts}
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {exp.cooldown_seconds > 0
                        ? `${exp.cooldown_seconds}s`
                        : "None"}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
