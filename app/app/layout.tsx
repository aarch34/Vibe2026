import React from "react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, calculateLevel } from "@/lib/db/mock-store";
import { TopHeader } from "@/components/attendee/top-header";
import { AttendeeBottomNav } from "@/components/attendee/bottom-nav";
import { InstallPWA } from "@/components/ui/install-pwa";
import { LiveStatsProvider } from "@/components/providers/live-stats-provider";

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

  if (profile?.is_banned) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-card border-2 border-red-500/30 shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">⛔</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-red-500 uppercase tracking-wider mb-2">Account Suspended</h1>
            <p className="text-muted-foreground text-sm">
              Your account has been restricted by an administrator due to violations of our community guidelines. 
              You can no longer access VIBE 2026.
            </p>
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">If you believe this is a mistake, please contact the district administration.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-pink-500 selection:text-white">
      <LiveStatsProvider initialXp={userXp} initialNotifications={notifications}>
        <TopHeader
          vibeId={profile?.vibe_id || "VB2026-000"}
          levelName={levelInfo.level_name}
          badgeIcon={levelInfo.badge}
          displayName={profile?.display_name || "VIBE Member"}
          avatarUrl={profile?.avatar_url}
        />

        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-12 overflow-y-auto">
          {children}
        </main>
        <AttendeeBottomNav />
        <InstallPWA />
      </LiveStatsProvider>
    </div>
  );
}
