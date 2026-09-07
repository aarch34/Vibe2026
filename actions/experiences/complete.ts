"use server";

import { z } from "zod";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

const completeExperienceSchema = z.object({
  experienceId: z.string().min(1, "Experience ID is required"),
  qrCodeId: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
});

export type CompleteExperienceInput = z.infer<typeof completeExperienceSchema>;

export async function completeExperienceAction(rawInput: CompleteExperienceInput) {
  const parsed = completeExperienceSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.errors[0].message,
    };
  }

  const { experienceId, qrCodeId, idempotencyKey } = parsed.data;

  try {
    const session = await getCurrentUserSession();

    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.rpc("fn_complete_experience_atomic", {
        p_event_id: session.eventId,
        p_profile_id: session.profile.id,
        p_experience_id: experienceId,
        p_qr_code_id: qrCodeId || null,
        p_idempotency_key: idempotencyKey || null,
      });

      if (error) {
        return {
          success: false,
          code: "SERVER_ERROR",
          message: error.message,
        };
      }

      return data;
    }

    // Atomic fallback store
    const result = mockDb.completeExperienceAtomic(
      session.eventId,
      session.profile.id,
      experienceId,
      qrCodeId || null,
      idempotencyKey || null
    );

    return result;
  } catch (err: any) {
    return {
      success: false,
      code: "EXECUTION_ERROR",
      message: err.message || "Failed to complete experience",
    };
  }
}

// Zone Discovery Action (+50 VIBE Coins, +100 XP, Passport Stamp)
export async function discoverZoneAction(zoneId: string) {
  try {
    const session = await getCurrentUserSession();
    return mockDb.discoverZone(session.eventId, session.profile.id, zoneId);
  } catch (err: any) {
    return {
      success: false,
      code: "EXECUTION_ERROR",
      message: err.message || "Failed to discover zone",
    };
  }
}

// Staff Manual Verification for Physical Challenges
export async function approveChallengeStaffAction(attendeeProfileId: string, experienceId: string) {
  try {
    const session = await getCurrentUserSession();
    return mockDb.approvePhysicalChallenge(
      session.eventId,
      session.profile.id,
      attendeeProfileId,
      experienceId
    );
  } catch (err: any) {
    return {
      success: false,
      code: "EXECUTION_ERROR",
      message: err.message || "Failed to verify challenge",
    };
  }
}
