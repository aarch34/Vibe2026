import React from "react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { getWalletSummary } from "@/lib/wallet/wallet-service";
import { getUserProgression } from "@/lib/gameplay/progression-service";
import { TopHeader } from "@/components/attendee/top-header";
import { AttendeeBottomNav } from "@/components/attendee/bottom-nav";
import { TestSwitcher } from "@/components/attendee/test-switcher";

export const dynamic = "force-dynamic";

export default async function AttendeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUserSession();
  const walletSummary = await getWalletSummary(session.eventId, session.profile.id);
  const progression = await getUserProgression(session.eventId, session.profile.id);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-blue-600">
      <TestSwitcher
        currentVibeId={session.profile.vibe_id}
        currentDisplayName={session.profile.display_name}
      />
      <TopHeader
        vibeId={session.profile.vibe_id}
        coins={walletSummary.wallet.balance}
        levelName={progression.currentLevel.name}
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-12 overflow-y-auto">
        {children}
      </main>
      <AttendeeBottomNav />
    </div>
  );
}
