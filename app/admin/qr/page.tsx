import { mockDb } from "@/lib/db/supabase";
import { AdminQRClient } from "@/components/admin/qr-manager";
import { QrCode } from "lucide-react";

export default function AdminQRPage() {
  const qrRecords = Array.from(mockDb.qrCodes.values());

  const initialQRs = qrRecords.map((qr) => {
    const exp = mockDb.experiences.get(qr.experience_id);
    const zone = exp ? mockDb.zones.get(exp.zone_id) : null;
    return {
      code: qr.code,
      experienceTitle: exp?.title || "Event Experience",
      zoneName: zone?.name || "Event Zone",
    };
  });

  const experiences = Array.from(mockDb.experiences.values()).map((e) => ({
    id: e.id,
    title: e.title,
  }));

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
