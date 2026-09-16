"use server";

import { z } from "zod";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

const submitPhotoSchema = z.object({
  stallId: z.string().min(1, "Stall ID is required"),
  photoUrl: z.string().min(1, "Photo is required"),
  instagramId: z.string().min(1, "Instagram ID is required"),
});

export async function submitStallPhotoAction(rawInput: z.infer<typeof submitPhotoSchema>) {
  const parsed = submitPhotoSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  try {
    const session = await getCurrentUserSession();

    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("stall_photos")
        .insert({
          event_id: session.eventId,
          profile_id: session.profile.id,
          stall_id: parsed.data.stallId,
          photo_url: parsed.data.photoUrl,
          instagram_id: parsed.data.instagramId,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, submission: data, message: "Photo submitted for volunteer verification!" };
    }

    return mockDb.submitStallPhoto(
      session.eventId,
      session.profile.id,
      parsed.data.stallId,
      parsed.data.photoUrl,
      parsed.data.instagramId
    );
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to submit stall photo" };
  }
}

export async function approveStallPhotoAction(submissionId: string) {
  try {
    const session = await getCurrentUserSession();

    if (isUsingLiveSupabase() && supabaseAdmin) {
      // 1. Get submission
      const { data: sub } = await supabaseAdmin
        .from("stall_photos")
        .select("*, stalls(*)")
        .eq("id", submissionId)
        .single();

      if (!sub) return { success: false, message: "Submission not found" };
      if (sub.status !== "pending") return { success: false, message: `Already ${sub.status}` };

      // 2. Mark approved
      await supabaseAdmin
        .from("stall_photos")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: session.profile.id,
        })
        .eq("id", submissionId);

      const xpReward = sub.stalls?.xp_reward || 100;
      const coinReward = sub.stalls?.coin_reward || 25;

      // 3. Award XP
      await supabaseAdmin.from("experience_completions").insert({
        event_id: sub.event_id,
        profile_id: sub.profile_id,
        experience_id: sub.stall_id,
        attempt_number: 1,
        coin_spent: 0,
        xp_earned: xpReward,
        coin_earned: coinReward,
        metadata: { type: "stall_photo", stall_id: sub.stall_id },
      });

      // 4. Award Coins
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("*")
        .eq("event_id", sub.event_id)
        .eq("profile_id", sub.profile_id)
        .single();

      if (wallet) {
        await supabaseAdmin
          .from("wallets")
          .update({ balance: wallet.balance + coinReward, version: wallet.version + 1 })
          .eq("id", wallet.id);

        await supabaseAdmin.from("wallet_transactions").insert({
          wallet_id: wallet.id,
          event_id: sub.event_id,
          profile_id: sub.profile_id,
          type: "earn",
          amount: coinReward,
          balance_before: wallet.balance,
          balance_after: wallet.balance + coinReward,
          source_type: "stall_photo_approved",
          source_id: sub.stall_id,
        });
      }

      return { success: true, message: `Approved! Awarded +${xpReward} XP and +${coinReward} VIBE.` };
    }

    return mockDb.approveStallPhoto(submissionId, session.profile.id);
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to approve photo" };
  }
}

export async function rejectStallPhotoAction(submissionId: string) {
  try {
    const session = await getCurrentUserSession();

    if (isUsingLiveSupabase() && supabaseAdmin) {
      await supabaseAdmin
        .from("stall_photos")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: session.profile.id,
        })
        .eq("id", submissionId);

      return { success: true, message: "Submission rejected." };
    }

    return mockDb.rejectStallPhoto(submissionId, session.profile.id);
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to reject photo" };
  }
}
