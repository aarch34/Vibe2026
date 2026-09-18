"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserSession } from "@/lib/auth/session";
import { isUsingLiveSupabase, supabaseAdmin, mockDb } from "@/lib/db/supabase";
import { getZonalStaffSession } from "./auth";

export async function searchAttendeeForCheckinAction(query: string, zoneId: string) {
  const q = query.trim().toLowerCase();
  if (!q) return { success: true, results: [] };

  const eventId = "a0000000-0000-0000-0000-000000000001";

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, vibe_id, college")
      .or(`display_name.ilike.%${q}%,vibe_id.ilike.%${q}%`)
      .limit(10);

    const profileList = profiles || [];
    if (profileList.length === 0) return { success: true, results: [] };

    const pIds = profileList.map((p) => p.id);

    // Fetch completions in this zone for these profiles
    const { data: comps } = await supabaseAdmin
      .from("experience_completions")
      .select("profile_id, xp_earned, experiences(zone_id)")
      .eq("event_id", eventId)
      .in("profile_id", pIds);

    const checkedInSet = new Set<string>();
    (comps || []).forEach((c: any) => {
      if (c.experiences?.zone_id === zoneId) {
        checkedInSet.add(c.profile_id);
      }
    });

    const results = profileList.map((p) => ({
      id: p.id,
      displayName: p.display_name || "Attendee",
      vibeId: p.vibe_id || "VIBE-0000",
      college: p.college || "Rotaract District 3192",
      isCheckedInToZone: checkedInSet.has(p.id),
    }));

    return { success: true, results };
  }

  // Mock store
  const results = Array.from(mockDb.profiles.values())
    .filter(
      (p) =>
        p.display_name.toLowerCase().includes(q) ||
        p.vibe_id.toLowerCase().includes(q) ||
        (p.college && p.college.toLowerCase().includes(q))
    )
    .slice(0, 10)
    .map((p) => {
      const isCheckedIn = mockDb.completions.some((c) => {
        const exp = mockDb.experiences.get(c.experience_id);
        return c.profile_id === p.id && exp && exp.zone_id === zoneId;
      });
      return {
        id: p.id,
        displayName: p.display_name,
        vibeId: p.vibe_id,
        college: p.college || "Rotaract District 3192",
        isCheckedInToZone: isCheckedIn,
      };
    });

  return { success: true, results };
}

export async function checkinAttendeeAtZoneAction(params: {
  targetProfileId: string;
  zoneId: string;
  xpAmount?: number;
}) {
  const staff = await getZonalStaffSession();
  const eventId = "a0000000-0000-0000-0000-000000000001";
  const xpAward = params.xpAmount && params.xpAmount > 0 ? params.xpAmount : 75;

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      // Find an active experience in this zone
      const { data: exps } = await supabaseAdmin
        .from("experiences")
        .select("id, title")
        .eq("zone_id", params.zoneId)
        .eq("is_active", true)
        .limit(1);

      const exp = exps?.[0];
      const expId = exp?.id || "e0000000-0000-0000-0000-000000000001";

      // 1. Record experience completion with XP
      const { error: compErr } = await supabaseAdmin.from("experience_completions").insert({
        event_id: eventId,
        profile_id: params.targetProfileId,
        experience_id: expId,
        attempt_number: 1,
        coin_spent: 0,
        xp_earned: xpAward,
        coin_earned: 0,
        metadata: {
          type: "zonal_head_checkin",
          zone_id: params.zoneId,
          checked_in_by: staff?.username || "Zonal Head",
        },
      });

      if (compErr) {
        return { success: false, message: compErr.message };
      }

      // 2. Fetch attendee name
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("display_name, vibe_id")
        .eq("id", params.targetProfileId)
        .maybeSingle();

      revalidatePath("/staff");

      return {
        success: true,
        xpAwarded: xpAward,
        attendeeName: profile?.display_name || "Attendee",
        vibeId: profile?.vibe_id || "VIBE-0000",
        message: `Checked in ${profile?.display_name}! ⭐ +${xpAward} XP awarded to their profile!`,
      };
    }

    // Mock store
    const compId = `comp-staff-${Date.now()}`;
    const exp = Array.from(mockDb.experiences.values()).find(
      (e) => e.zone_id === params.zoneId
    );
    const expId = exp?.id || "exp-1";

    mockDb.completions.push({
      id: compId,
      event_id: eventId,
      profile_id: params.targetProfileId,
      experience_id: expId,
      qr_code_id: null,
      attempt_number: 1,
      coin_spent: 0,
      xp_earned: xpAward,
      coin_earned: 0,
      completed_at: new Date().toISOString(),
      metadata: {
        type: "zonal_head_checkin",
        zone_id: params.zoneId,
        checked_in_by: staff?.username || "Zonal Head",
      },
    });

    const profile = mockDb.profiles.get(params.targetProfileId);

    revalidatePath("/staff");

    return {
      success: true,
      xpAwarded: xpAward,
      attendeeName: profile?.display_name || "Attendee",
      vibeId: profile?.vibe_id || "VIBE-0000",
      message: `Checked in ${profile?.display_name}! ⭐ +${xpAward} XP awarded to their profile!`,
    };
  } catch (err: any) {
    console.error("checkinAttendeeAtZoneAction error:", err);
    return { success: false, message: err.message || "Failed to check in attendee" };
  }
}
