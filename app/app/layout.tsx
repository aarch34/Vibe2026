import React from "react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, calculateLevel } from "@/lib/db/mock-store";
import { TopHeader } from "@/components/attendee/top-header";
import { AttendeeBottomNav } from "@/components/attendee/bottom-nav";
import { InstallPWA } from "@/components/ui/install-pwa";

export const dynamic = "force-dynamic";

export default async function AttendeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUserSession();
  const profile = mockDb.getProfile(session.profile.id) || session.profile;
  const userXp = typeof profile?.xp === "number" ? profile.xp : 0;
  const levelInfo = calculateLevel(userXp);
  const notifications = profile?.id ? mockDb.getNotifications(profile.id) : [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-pink-500 selection:text-white">
      <TopHeader
        vibeId={profile?.vibe_id || "VB2026-000"}
        xp={userXp}
        levelName={levelInfo.level_name}
        badgeIcon={levelInfo.badge}
        displayName={profile?.display_name || "VIBE Member"}
        avatarUrl={profile?.avatar_url}
        notifications={notifications}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-12 overflow-y-auto">
        {children}
      </main>
      <AttendeeBottomNav />
      <InstallPWA />
    </div>
  );
}
