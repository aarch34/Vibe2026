import { NextResponse } from "next/server";
import { getCurrentUserSession, invalidateSessionCache } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const profileId = session.profile.id;
    const { is_discoverable } = await req.json();

    const boolDiscoverable = Boolean(is_discoverable);

    // 1. Update in-memory mockDb
    const memProfile = mockDb.getProfile(profileId);
    if (memProfile) {
      memProfile.is_discoverable = boolDiscoverable;
      memProfile.updated_at = new Date().toISOString();
    }

    // 2. Update Supabase if live
    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from("profiles")
          .update({
            is_discoverable: boolDiscoverable,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profileId);
      } catch (err) {
        console.warn("Supabase discoverable update error:", err);
      }
    }

    // 3. Invalidate session cache
    invalidateSessionCache(session.clerkUserId);
    invalidateSessionCache(profileId);

    return NextResponse.json({
      success: true,
      is_discoverable: boolDiscoverable,
      message: boolDiscoverable
        ? "Your profile is now public and discoverable to delegates."
        : "Your profile is now private and hidden from the Discover page.",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
