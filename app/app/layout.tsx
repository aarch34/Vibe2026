import React from "react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { getWalletSummary } from "@/lib/wallet/wallet-service";
import {
  getUserProgression,
  getCachedEventZones,
} from "@/lib/gameplay/progression-service";
import { TopHeader } from "@/components/attendee/top-header";
import { AttendeeBottomNav } from "@/components/attendee/bottom-nav";

export const dynamic = "force-dynamic";

export default async function AttendeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUserSession();
  const [walletSummary, progression, zones] = await Promise.all([
    getWalletSummary(session.eventId, session.profile.id),
    getUserProgression(session.eventId, session.profile.id),
    getCachedEventZones(session.eventId),
  ]);

  // Resolve assigned zone from cached catalog
  let assignedZoneName = "Arnava";
  if (session.profile.assigned_zone_id) {
    const found = zones.find(
      (z) => z.id === session.profile.assigned_zone_id || z.slug === session.profile.assigned_zone_id
    );
    if (found) {
      assignedZoneName = found.name;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      <TopHeader
        vibeId={session.profile.vibe_id}
        coins={walletSummary.wallet.balance}
        levelName={progression.currentLevel.name}
        assignedZoneName={assignedZoneName}
        displayName={session.profile.display_name}
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-12 overflow-y-auto">
        {children}
      </main>
      <AttendeeBottomNav />
    </div>
  );
}
