"use server";

import { z } from "zod";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

// 1. Adjust Attendee Balance (with audit log)
const adjustBalanceSchema = z.object({
  targetProfileId: z.string().min(1),
  amount: z.number().int(),
  reason: z.string().min(3, "Reason must be provided for audit trails"),
});

export async function adminAdjustBalanceAction(rawInput: z.infer<typeof adjustBalanceSchema>) {
  const parsed = adjustBalanceSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  const { targetProfileId, amount, reason } = parsed.data;
  const session = await getCurrentUserSession();

  if (isUsingLiveSupabase() && supabaseAdmin) {
    // 1. Get current wallet
    const { data: wallet, error: wErr } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("event_id", session.eventId)
      .eq("profile_id", targetProfileId)
      .single();

    if (wErr || !wallet) {
      return { success: false, message: "Target wallet not found" };
    }

    const balBefore = wallet.balance;
    const newBal = balBefore + amount;
    if (newBal < 0) {
      return { success: false, message: "Resulting balance cannot be negative" };
    }

    // 2. Update wallet
    const { error: upErr } = await supabaseAdmin
      .from("wallets")
      .update({
        balance: newBal,
        version: wallet.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wallet.id);

    if (upErr) return { success: false, message: upErr.message };

    // 3. Record transaction
    await supabaseAdmin.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      event_id: session.eventId,
      profile_id: targetProfileId,
      type: "admin_adjustment",
      amount: Math.abs(amount),
      balance_before: balBefore,
      balance_after: newBal,
      source_type: "admin_action",
      source_id: session.profile.id,
      idempotency_key: `adj_${Date.now()}_${targetProfileId}`,
      metadata: { reason, adjustedBy: session.profile.display_name },
    });

    // 4. Record audit log
    await supabaseAdmin.from("audit_logs").insert({
      event_id: session.eventId,
      actor_profile_id: session.profile.id,
      action: "ADMIN_WALLET_ADJUSTMENT",
      entity_type: "wallet",
      entity_id: targetProfileId,
      before_data: { balance: balBefore },
      after_data: { balance: newBal, adjustment: amount, reason },
    });

    return { success: true, newBalance: newBal };
  }

  // Memory fallback
  const auditId = `audit-${Date.now()}`;
  mockDb.auditLogs.unshift({
    id: auditId,
    event_id: session.eventId,
    actor_profile_id: session.profile.id,
    action: "ADMIN_WALLET_ADJUSTMENT",
    entity_type: "wallet",
    entity_id: targetProfileId,
    before_data: null,
    after_data: { amount, reason },
    created_at: new Date().toISOString(),
  });

  const wallet = mockDb.wallets.get(`${session.eventId}:${targetProfileId}`);
  if (!wallet) {
    return { success: false, message: "Target wallet not found" };
  }

  const balBefore = wallet.balance;
  const newBal = balBefore + amount;
  if (newBal < 0) {
    return { success: false, message: "Resulting balance cannot be negative" };
  }

  wallet.balance = newBal;
  wallet.version += 1;
  wallet.updated_at = new Date().toISOString();

  mockDb.walletTransactions.unshift({
    id: `tx-adj-${Date.now()}`,
    wallet_id: wallet.id,
    event_id: session.eventId,
    profile_id: targetProfileId,
    type: "admin_adjustment",
    amount: Math.abs(amount),
    balance_before: balBefore,
    balance_after: newBal,
    source_type: "admin_action",
    source_id: session.profile.id,
    idempotency_key: `adj_${Date.now()}_${targetProfileId}`,
    metadata: { reason, adjustedBy: session.profile.display_name },
    created_at: new Date().toISOString(),
  });

  return { success: true, newBalance: newBal };
}

// 2. Generate/Update QR Code
const generateQRSchema = z.object({
  experienceId: z.string().min(1),
  customCode: z.string().optional(),
});

export async function adminGenerateQRCodeAction(rawInput: z.infer<typeof generateQRSchema>) {
  const parsed = generateQRSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  const { experienceId, customCode } = parsed.data;
  const session = await getCurrentUserSession();

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data: exp } = await supabaseAdmin
      .from("experiences")
      .select("*")
      .eq("id", experienceId)
      .single();

    if (!exp) return { success: false, message: "Experience not found" };

    const code = customCode || `vibe-${exp.slug}-${Math.random().toString(36).substring(2, 6)}`;

    const { data: qr, error: qrErr } = await supabaseAdmin
      .from("qr_codes")
      .upsert({
        event_id: session.eventId,
        experience_id: experienceId,
        code,
        version: 1,
        is_active: true,
      }, { onConflict: "code" })
      .select()
      .single();

    if (qrErr) return { success: false, message: qrErr.message };

    return { success: true, qr };
  }

  // Memory fallback
  const exp = mockDb.experiences.get(experienceId);
  if (!exp) return { success: false, message: "Experience not found" };

  const code = customCode || `vibe-${exp.slug}-${Math.random().toString(36).substring(2, 6)}`;
  const qrId = `qr-${Date.now()}`;

  const qrRecord = {
    id: qrId,
    event_id: session.eventId,
    experience_id: experienceId,
    code,
    version: 1,
    expires_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  mockDb.qrCodes.set(code, qrRecord);

  return { success: true, qr: qrRecord };
}

// 3. Freeze Event / Finalize Leaderboard (Point 39)
export async function adminToggleEventFreezeAction(freeze: boolean) {
  const session = await getCurrentUserSession();

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const status = freeze ? "frozen" : "live";

    await supabaseAdmin
      .from("events")
      .update({ status })
      .eq("id", session.eventId);

    await supabaseAdmin.from("audit_logs").insert({
      event_id: session.eventId,
      actor_profile_id: session.profile.id,
      action: freeze ? "EVENT_CONCLUDED_FREEZE" : "EVENT_UNFROZEN",
      entity_type: "events",
      entity_id: session.eventId,
      before_data: { wasFrozen: !freeze },
      after_data: { isFrozen: freeze, status },
    });

    mockDb.isEventFrozen = freeze;
    return { success: true, isFrozen: freeze };
  }

  // Memory fallback
  mockDb.isEventFrozen = freeze;

  mockDb.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    event_id: session.eventId,
    actor_profile_id: session.profile.id,
    action: freeze ? "EVENT_CONCLUDED_FREEZE" : "EVENT_UNFROZEN",
    entity_type: "event",
    entity_id: session.eventId,
    before_data: { wasFrozen: !freeze },
    after_data: { isFrozen: freeze },
    created_at: new Date().toISOString(),
  });

  return { success: true, isFrozen: freeze };
}

// 4. Adjust Attendee XP (with audit log)
const adjustXpSchema = z.object({
  targetProfileId: z.string().min(1),
  amount: z.number().int(),
  reason: z.string().min(3, "Reason must be provided for audit trails"),
});

export async function adminAdjustXpAction(rawInput: z.infer<typeof adjustXpSchema>) {
  const parsed = adjustXpSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  const { targetProfileId, amount, reason } = parsed.data;
  const session = await getCurrentUserSession();

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      // 1. Record experience completion with the XP adjustment
      const { error: compErr } = await supabaseAdmin.from("experience_completions").insert({
        event_id: session.eventId,
        profile_id: targetProfileId,
        experience_id: "e0000000-0000-0000-0000-000000000001",
        attempt_number: 1,
        coin_spent: 0,
        xp_earned: amount,
        coin_earned: 0,
        metadata: {
          type: "admin_xp_adjustment",
          adjustment: amount,
          reason,
          adjusted_by: session.profile.display_name || "Admin",
        },
      });

      if (compErr) {
        return { success: false, message: compErr.message };
      }

      // 2. Record audit log
      await supabaseAdmin.from("audit_logs").insert({
        event_id: session.eventId,
        actor_profile_id: session.profile.id,
        action: "ADMIN_XP_ADJUSTMENT",
        entity_type: "profile_xp",
        entity_id: targetProfileId,
        before_data: null,
        after_data: { adjustment: amount, reason, adjustedBy: session.profile.display_name },
      });

      return { success: true, adjustment: amount };
    }

    // Mock store implementation
    const compId = `comp-adj-${Date.now()}`;
    mockDb.completions.push({
      id: compId,
      event_id: session.eventId,
      profile_id: targetProfileId,
      experience_id: "e0000000-0000-0000-0000-000000000001",
      qr_code_id: null,
      attempt_number: 1,
      coin_spent: 0,
      xp_earned: amount,
      coin_earned: 0,
      completed_at: new Date().toISOString(),
      metadata: {
        type: "admin_xp_adjustment",
        adjustment: amount,
        reason,
        adjusted_by: session.profile.display_name,
      },
    });

    mockDb.auditLogs.unshift({
      id: `audit-xp-${Date.now()}`,
      event_id: session.eventId,
      actor_profile_id: session.profile.id,
      action: "ADMIN_XP_ADJUSTMENT",
      entity_type: "profile_xp",
      entity_id: targetProfileId,
      before_data: null,
      after_data: { adjustment: amount, reason },
      created_at: new Date().toISOString(),
    });

    return { success: true, adjustment: amount };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to adjust XP" };
  }
}
