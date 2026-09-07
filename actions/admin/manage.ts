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

  // Audit record
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
