import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { socialStore } from "@/lib/db/social-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/connections/states?ids=uuid1,uuid2,...
 * Returns connection status (none|pending|connected) for a list of profile IDs
 * relative to the currently authenticated user. Used by DiscoverClient after
 * delta sync to get accurate states for newly-arrived profiles.
 */
export async function GET(req: Request) {
  try {
    const session = await getCurrentUserSession().catch(() => null);
    if (!session?.profile?.id) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids") || "";
    const requestedIds = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 50); // cap at 50 IDs

    if (requestedIds.length === 0) {
      return NextResponse.json({ success: true, states: {} });
    }

    // Get the full connection map for current user (cached internally in social store)
    const fullMap = await socialStore.getUserConnectionMapAsync(session.profile.id);

    // Return only the states for the requested IDs
    const states: Record<string, "connected" | "pending" | "none"> = {};
    for (const id of requestedIds) {
      states[id] = fullMap[id] || "none";
    }

    return NextResponse.json(
      { success: true, states },
      { headers: { "Cache-Control": "private, no-cache" } }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
