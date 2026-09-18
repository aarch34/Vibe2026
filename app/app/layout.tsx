import React from "react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { getWalletSummary } from "@/lib/wallet/wallet-service";
import { getUserProgression } from "@/lib/gameplay/progression-service";
import { TopHeader } from "@/components/attendee/top-header";
import { AttendeeBottomNav } from "@/components/attendee/bottom-nav";

export const dynamic = "force-dynamic";

export default async function AttendeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUserSession();
  const walletSummary = await getWalletSummary(session.eventId, session.profile.id);
  const progression = await getUserProgression(session.eventId, session.profile.id);

  // Resolve assigned zone
  let assignedZoneName = "Arnava";
  if (session.profile.assigned_zone_id) {
    const { mockDb } = await import("@/lib/db/supabase");
    const z = mockDb.zones.get(session.profile.assigned_zone_id);
    if (z) assignedZoneName = z.name;
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-blue-600">
      <TopHeader
        vibeId={session.profile.vibe_id}
        coins={walletSummary.wallet.balance}
        levelName={progression.currentLevel.name}
        assignedZoneName={assignedZoneName}
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-12 overflow-y-auto">
        {children}
      </main>
      <AttendeeBottomNav />
    </div>
  );
}
