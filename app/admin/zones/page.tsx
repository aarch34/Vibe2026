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
          <h1 className="text-2xl font-black text-foreground tracking-tight font-mono">
            Zone Management
          </h1>
          <p className="text-xs text-muted-foreground font-bold">
            Configure event zones and physical coordinates
          </p>
        </div>
      </div>

      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b-2 border-border text-muted-foreground uppercase text-[11px]">
                <th className="pb-3 font-black">Order</th>
                <th className="pb-3 font-black">Zone Name</th>
                <th className="pb-3 font-black">Slug</th>
                <th className="pb-3 font-black">Coordinates (X, Y)</th>
                <th className="pb-3 font-black">Description</th>
                <th className="pb-3 font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border font-medium">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-muted transition-colors">
                  <td className="py-3 font-mono font-black text-foreground">
                    Z{zone.sort_order}
                  </td>
                  <td className="py-3 font-black text-foreground">{zone.name}</td>
                  <td className="py-3 font-mono text-primary font-bold">{zone.slug}</td>
                  <td className="py-3 font-mono text-muted-foreground font-bold">
                    ({zone.map_data?.x ?? 0}, {zone.map_data?.y ?? 0})
                  </td>
                  <td className="py-3 text-muted-foreground font-bold max-w-xs truncate">
                    {zone.description}
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
