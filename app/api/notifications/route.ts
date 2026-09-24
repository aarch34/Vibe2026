import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { socialStore } from "@/lib/db/social-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentUserSession();
    if (!session?.profile?.id) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0, incomingRequests: [] });
    }

    const notifications = await socialStore.getNotifications(session.profile.id);
    const { incoming } = socialStore.getConnectionRequests(session.profile.id);
    const unreadCount = notifications.filter((n) => !n.read).length + incoming.length;
    
    // Fetch fresh profile data to keep UI synced
    let currentXp = session.profile.xp || 0;
    try {
      const { mockDb, isUsingLiveSupabase, supabaseAdmin } = await import("@/lib/db/supabase");
      if (isUsingLiveSupabase() && supabaseAdmin) {
        const { data: prof } = await supabaseAdmin.from("profiles").select("xp").eq("id", session.profile.id).single();
        if (prof) currentXp = prof.xp;
      } else {
        const { mockDb: localMock } = await import("@/lib/db/mock-store");
        const prof = localMock.getProfile(session.profile.id);
        if (prof) currentXp = prof.xp;
      }
    } catch (e) {
      // fallback to session xp
    }

    return NextResponse.json({
      success: true,
      notifications,
      incomingRequests: incoming,
      unreadCount,
      currentXp,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getCurrentUserSession();
    if (!session?.profile?.id) {
      return NextResponse.json({ success: true });
    }

    await socialStore.markAllNotificationsRead(session.profile.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
