"use server";

import { z } from "zod";
import { getCurrentUserSession } from "@/lib/auth/session";
import { getZonalStaffSession } from "@/actions/staff/auth";
import { getAdminSession } from "@/actions/admin/auth";
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
      let resolvedQrUuid: string | null = null;
      if (qrCodeId) {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qrCodeId)) {
          resolvedQrUuid = qrCodeId;
        } else {
          const { data: qrRow } = await supabaseAdmin
            .from("qr_codes")
            .select("id")
            .eq("code", qrCodeId)
            .maybeSingle();
          resolvedQrUuid = qrRow?.id || null;
        }
      }

      const { data, error } = await supabaseAdmin.rpc("fn_complete_experience_atomic", {
        p_event_id: session.eventId,
        p_profile_id: session.profile.id,
        p_experience_id: experienceId,
        p_qr_code_id: resolvedQrUuid,
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

    if (isUsingLiveSupabase() && supabaseAdmin) {
      // Check if user already has an experience completion in this zone
      const { data: existingComps } = await supabaseAdmin
        .from("experience_completions")
        .select("id, experiences(zone_id)")
        .eq("event_id", session.eventId)
        .eq("profile_id", session.profile.id);

      const alreadyVisited = (existingComps || []).some(
        (c: any) => c.experiences?.zone_id === zoneId
      );

      if (alreadyVisited) {
        return {
          success: true,
          alreadyDiscovered: true,
          coinsEarned: 0,
          xpEarned: 0,
          message: "Zone already stamped in your Passport.",
        };
      }

      // Find an experience in this zone to anchor the discovery stamp
      const { data: exps } = await supabaseAdmin
        .from("experiences")
        .select("id")
        .eq("zone_id", zoneId)
        .limit(1);

      const expId = exps?.[0]?.id;
      if (!expId) {
        return { success: false, message: "Zone has no active experiences" };
      }

      // 1. Insert completion record
      await supabaseAdmin.from("experience_completions").insert({
        event_id: session.eventId,
        profile_id: session.profile.id,
        experience_id: expId,
        attempt_number: 1,
        coin_spent: 0,
        xp_earned: 100,
        coin_earned: 50,
        metadata: { type: "zone_discovery", zone_id: zoneId },
      });

      // 2. Credit 50 VIBE Coins to wallet
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("*")
        .eq("event_id", session.eventId)
        .eq("profile_id", session.profile.id)
        .single();

      if (wallet) {
        const balBefore = wallet.balance;
        const balAfter = balBefore + 50;

        await supabaseAdmin
          .from("wallets")
          .update({ balance: balAfter, version: wallet.version + 1, updated_at: new Date().toISOString() })
          .eq("id", wallet.id);

        await supabaseAdmin.from("wallet_transactions").insert({
          wallet_id: wallet.id,
          event_id: session.eventId,
          profile_id: session.profile.id,
          type: "earn",
          amount: 50,
          balance_before: balBefore,
          balance_after: balAfter,
          source_type: "zone_discovery",
          metadata: { zone_id: zoneId },
        });
      }

      return {
        success: true,
        alreadyDiscovered: false,
        coinsEarned: 50,
        xpEarned: 100,
        message: "🎉 Zone Discovered! +50 VIBE Coins, +100 XP, and Passport stamped!",
      };
    }

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
  const staff = await getZonalStaffSession();
  const admin = await getAdminSession();
  if (!staff && !admin) {
    return {
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized. Staff or Admin privileges required to verify challenges.",
    };
  }

  try {
    const session = await getCurrentUserSession();

    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { data: exp } = await supabaseAdmin
        .from("experiences")
        .select("*")
        .eq("id", experienceId)
        .single();

      if (!exp) return { success: false, message: "Experience not found" };

      // Record completion directly
      const { data: comp, error: compErr } = await supabaseAdmin
        .from("experience_completions")
        .insert({
          event_id: session.eventId,
          profile_id: attendeeProfileId,
          experience_id: experienceId,
          attempt_number: 1,
          coin_spent: 0,
          xp_earned: exp.xp_reward,
          coin_earned: exp.coin_reward,
          metadata: { verifiedByStaffProfileId: session.profile.id },
        })
        .select()
        .single();

      if (compErr) throw compErr;

      // Audit log
      await supabaseAdmin.from("audit_logs").insert({
        event_id: session.eventId,
        actor_profile_id: session.profile.id,
        action: "STAFF_CHALLENGE_APPROVED",
        entity_type: "experience_completions",
        entity_id: comp.id,
        after_data: { attendeeProfileId, experienceId, xpAwarded: exp.xp_reward },
      });

      return {
        success: true,
        xpAwarded: exp.xp_reward,
        message: `Approved! Awarded +${exp.xp_reward} XP to attendee.`,
      };
    }

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
