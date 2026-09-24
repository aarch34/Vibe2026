import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { socialStore } from "@/lib/db/social-store";
import { mockDb } from "@/lib/db/mock-store";

// In-memory set to prevent spamming XP on repeated clicks to same user
const trackedIgClicks = new Set<string>();

export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { targetProfileId } = await req.json();

    if (!targetProfileId || targetProfileId === session.profile.id) {
      return NextResponse.json({ success: true, xpEarned: 0 });
    }

    const clickKey = `${session.profile.id}:${targetProfileId}`;
    if (trackedIgClicks.has(clickKey)) {
      return NextResponse.json({ success: true, alreadyClaimed: true });
    }

    trackedIgClicks.add(clickKey);

    const targetUser = (await mockDb.getProfile(targetProfileId)) || { display_name: "an attendee" };
    const xp = 15;
    await socialStore.addXp(
      session.profile.id,
      xp,
      `Viewed @${targetUser.display_name} on Instagram! 📸 +15 XP`
    );

    return NextResponse.json({ success: true, xpEarned: xp });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
