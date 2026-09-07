import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { MapPin } from "lucide-react";
import { Zone } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminZonesPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  let zones: Zone[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("zones")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true });
    zones = data || [];
  } else {
    zones = Array.from(mockDb.zones.values()).sort(
      (a, b) => a.sort_order - b.sort_order
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Zone Management
          </h1>
          <p className="text-sm text-slate-400">
            Configure event zones and physical coordinates
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <th className="pb-3">Order</th>
                <th className="pb-3">Zone Name</th>
                <th className="pb-3">Slug</th>
                <th className="pb-3">Coordinates (X, Y)</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-slate-800/30">
                  <td className="py-3 font-mono font-bold text-white">
                    Z{zone.sort_order}
                  </td>
                  <td className="py-3 font-bold text-white">{zone.name}</td>
                  <td className="py-3 font-mono text-blue-400">{zone.slug}</td>
                  <td className="py-3 font-mono text-slate-300">
                    ({zone.map_data?.x ?? 0}, {zone.map_data?.y ?? 0})
                  </td>
                  <td className="py-3 text-slate-400 max-w-xs truncate">
                    {zone.description}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
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
