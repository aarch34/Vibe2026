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

    return NextResponse.json({
      success: true,
      notifications,
      incomingRequests: incoming,
      unreadCount,
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
