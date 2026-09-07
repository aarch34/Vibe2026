import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { AdminQRClient } from "@/components/admin/qr-manager";
import { QrCode } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminQRPage() {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  let initialQRs: { code: string; experienceTitle: string; zoneName: string }[] = [];
  let experiences: { id: string; title: string }[] = [];

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const [qrsRes, expsRes] = await Promise.all([
      supabaseAdmin
        .from("qr_codes")
        .select("code, experiences(title, zones(name))")
        .eq("event_id", eventId),
      supabaseAdmin
        .from("experiences")
        .select("id, title")
        .eq("event_id", eventId)
        .eq("is_active", true),
    ]);

    initialQRs = (qrsRes.data || []).map((qr: any) => ({
      code: qr.code,
      experienceTitle: qr.experiences?.title || "Event Experience",
      zoneName: qr.experiences?.zones?.name || "Event Zone",
    }));

    experiences = (expsRes.data || []).map((e: any) => ({
      id: e.id,
      title: e.title,
    }));
  } else {
    const qrRecords = Array.from(mockDb.qrCodes.values());

    initialQRs = qrRecords.map((qr) => {
      const exp = mockDb.experiences.get(qr.experience_id);
      const zone = exp ? mockDb.zones.get(exp.zone_id) : null;
      return {
        code: qr.code,
        experienceTitle: exp?.title || "Event Experience",
        zoneName: zone?.name || "Event Zone",
      };
    });

    experiences = Array.from(mockDb.experiences.values()).map((e) => ({
      id: e.id,
      title: e.title,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          QR Checkpoint Management
        </h1>
        <p className="text-sm text-slate-400">
          Generate, preview, and print physical venue QR checkpoints
        </p>
      </div>

      <AdminQRClient initialQRs={initialQRs} experiences={experiences} />
    </div>
  );
}
