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

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-[#070B14] border-x border-slate-900/80 shadow-2xl relative">
        <TopHeader
          vibeId={session.profile.vibe_id}
          coins={walletSummary.wallet.balance}
          levelName={progression.currentLevel.name}
        />
        <main className="flex-1 pb-24 px-4 pt-3 overflow-y-auto">
          {children}
        </main>
        <AttendeeBottomNav />
      </div>
    </div>
  );
}
