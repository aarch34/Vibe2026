"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUserSession, invalidateSessionCache } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

const updateProfileSchema = z.object({
  email: z.string().email("Please enter a valid email address").or(z.literal("")).optional(),
  instagramId: z.string().max(60, "Instagram handle too long").optional().default(""),
  zoneId: z.string().min(1, "Please select an assigned zone"),
  displayName: z.string().min(1, "Display name is required").max(60).optional(),
  club: z.string().max(80).optional(),
  phone: z.string().max(20).optional(),
});

const ZONE_SLUG_TO_UUID: Record<string, string> = {
  "arnava": "d0000000-0000-0000-0000-000000000001",
  "z-arnava": "d0000000-0000-0000-0000-000000000001",
  "d0000000-0000-0000-0000-000000000001": "d0000000-0000-0000-0000-000000000001",

  "taranaga": "d0000000-0000-0000-0000-000000000002",
  "z-taranaga": "d0000000-0000-0000-0000-000000000002",
  "d0000000-0000-0000-0000-000000000002": "d0000000-0000-0000-0000-000000000002",

  "sagara": "d0000000-0000-0000-0000-000000000003",
  "z-sagara": "d0000000-0000-0000-0000-000000000003",
  "d0000000-0000-0000-0000-000000000003": "d0000000-0000-0000-0000-000000000003",

  "pravaha": "d0000000-0000-0000-0000-000000000004",
  "z-pravaha": "d0000000-0000-0000-0000-000000000004",
  "d0000000-0000-0000-0000-000000000004": "d0000000-0000-0000-0000-000000000004",

  "samudhra": "d0000000-0000-0000-0000-000000000005",
  "z-samudhra": "d0000000-0000-0000-0000-000000000005",
  "d0000000-0000-0000-0000-000000000005": "d0000000-0000-0000-0000-000000000005",

  "varuna": "d0000000-0000-0000-0000-000000000006",
  "z-varuna": "d0000000-0000-0000-0000-000000000006",
  "d0000000-0000-0000-0000-000000000006": "d0000000-0000-0000-0000-000000000006",
};

export async function updateAttendeeProfileAction(rawInput: z.infer<typeof updateProfileSchema>) {
  const parsed = updateProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Invalid input data." };
  }

  const { email, instagramId, zoneId, displayName, club, phone } = parsed.data;

  try {
    const session = await getCurrentUserSession();

    // Clean Instagram Handle (ensure leading @ if non-empty)
    let cleanInsta = instagramId?.trim() || "";
    if (cleanInsta && !cleanInsta.startsWith("@")) {
      cleanInsta = `@${cleanInsta}`;
    }

    const cleanEmail = email?.trim().toLowerCase() || null;
    const targetZoneUuid = ZONE_SLUG_TO_UUID[zoneId.toLowerCase()] || zoneId;

    if (isUsingLiveSupabase() && supabaseAdmin) {
      const updatePayload: Record<string, any> = {
        email: cleanEmail,
        instagram_id: cleanInsta || null,
        assigned_zone_id: targetZoneUuid,
        updated_at: new Date().toISOString(),
      };

      if (displayName?.trim()) {
        updatePayload.display_name = displayName.trim();
      }
      if (club !== undefined) {
        updatePayload.club = club?.trim() || null;
      }
      if (phone !== undefined) {
        updatePayload.phone = phone?.trim() || null;
      }

      const { data: updatedProfile, error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update(updatePayload)
        .eq("id", session.profile.id)
        .select("*")
        .single();

      if (updateErr) {
        console.error("Supabase profile update error:", updateErr);
        throw new Error(updateErr.message || "Failed to update profile in database.");
      }

      // Invalidate session cache
      invalidateSessionCache(session.clerkUserId);
      invalidateSessionCache(session.profile.id);

      revalidatePath("/app/profile");
      revalidatePath("/app");
      revalidatePath("/app/map");

      return {
        success: true,
        message: "Profile details updated successfully!",
        profile: updatedProfile,
      };
    }

    // Mock store update
    const memProfile = mockDb.profiles.get(session.profile.id);
    if (memProfile) {
      memProfile.email = cleanEmail;
      memProfile.instagram_id = cleanInsta || null;
      memProfile.assigned_zone_id = targetZoneUuid;
      if (displayName?.trim()) memProfile.display_name = displayName.trim();
      if (club !== undefined) memProfile.club = club?.trim() || null;
      if (phone !== undefined) memProfile.phone = phone?.trim() || null;
      memProfile.updated_at = new Date().toISOString();
      mockDb.profiles.set(memProfile.id, memProfile);
    }

    invalidateSessionCache(session.clerkUserId);
    invalidateSessionCache(session.profile.id);

    revalidatePath("/app/profile");
    revalidatePath("/app");
    revalidatePath("/app/map");

    return {
      success: true,
      message: "Profile details updated successfully!",
      profile: memProfile,
    };
  } catch (err: any) {
    console.error("updateAttendeeProfileAction error:", err);
    return { success: false, message: err.message || "Failed to update profile." };
  }
}

export async function selectMyZoneAction(zoneId: string) {
  try {
    const session = await getCurrentUserSession();
    return await updateAttendeeProfileAction({
      zoneId,
      email: session.profile.email || "",
      instagramId: session.profile.instagram_id || "",
      displayName: session.profile.display_name,
      club: session.profile.club || undefined,
      phone: session.profile.phone || undefined,
    });
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to select zone." };
  }
}

