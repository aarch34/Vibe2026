"use server";

import { z } from "zod";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

const redeemRewardSchema = z.object({
  rewardId: z.string().min(1, "Reward ID is required"),
  idempotencyKey: z.string().optional().nullable(),
});

export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;

export async function redeemRewardAction(rawInput: RedeemRewardInput) {
  const parsed = redeemRewardSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.errors[0].message,
    };
  }

  const { rewardId, idempotencyKey } = parsed.data;

  try {
    const session = await getCurrentUserSession();

    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.rpc("fn_redeem_reward_atomic", {
        p_event_id: session.eventId,
        p_profile_id: session.profile.id,
        p_reward_id: rewardId,
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

    const result = mockDb.redeemRewardAtomic(
      session.eventId,
      session.profile.id,
      rewardId,
      idempotencyKey || null
    );

    return result;
  } catch (err: any) {
    return {
      success: false,
      code: "EXECUTION_ERROR",
      message: err.message || "Failed to redeem reward",
    };
  }
}
