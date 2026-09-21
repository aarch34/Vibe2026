"use server";

import { z } from "zod";
import { getCurrentUserSession } from "@/lib/auth/session";
import { getAdminSession } from "@/actions/admin/auth";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

// 1. Adjust Attendee Balance (with audit log)
const adjustBalanceSchema = z.object({
  targetProfileId: z.string().min(1),
  amount: z.number().int(),
  reason: z.string().min(3, "Reason must be provided for audit trails"),
});

export async function adminAdjustBalanceAction(rawInput: z.infer<typeof adjustBalanceSchema>) {
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, message: "Unauthorized. District Admin privileges required." };
  }

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
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, message: "Unauthorized. District Admin privileges required." };
  }

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
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, message: "Unauthorized. District Admin privileges required." };
  }

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
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, message: "Unauthorized. District Admin privileges required." };
  }

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

// 5. Create Attendee Action (Full admin creation with all details & starter wallet)
const createAttendeeSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  vibeId: z.string().optional(),
  phone: z.string().optional(),
  instagramId: z.string().optional(),
  college: z.string().min(1, "College is required"),
  club: z.string().optional(),
  assignedZoneId: z.string().min(1, "Zone must be selected"),
  initialCoins: z.number().int().min(0).default(500),
  clerkUserId: z.string().optional(),
});

export async function adminCreateAttendeeAction(rawInput: z.infer<typeof createAttendeeSchema>) {
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, message: "Unauthorized. District Admin privileges required." };
  }

  const parsed = createAttendeeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  const {
    displayName,
    vibeId,
    phone,
    instagramId,
    college,
    club,
    assignedZoneId,
    initialCoins,
    clerkUserId,
  } = parsed.data;

  const session = await getCurrentUserSession();
  const finalVibeId = vibeId?.trim() || `VIBE-${Math.floor(1000 + Math.random() * 9000)}`;
  const finalClerkId = clerkUserId?.trim() || `clerk_admin_created_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      // 1. Insert Profile
      const { data: newProfile, error: pErr } = await supabaseAdmin
        .from("profiles")
        .insert({
          display_name: displayName.trim(),
          vibe_id: finalVibeId,
          phone: phone?.trim() || null,
          instagram_id: instagramId?.trim() || null,
          college: college.trim(),
          club: club?.trim() || null,
          assigned_zone_id: assignedZoneId,
          clerk_user_id: finalClerkId,
        })
        .select()
        .single();

      if (pErr) return { success: false, message: pErr.message };

      // 2. Insert Event Member
      await supabaseAdmin.from("event_members").insert({
        event_id: session.eventId,
        profile_id: newProfile.id,
        role: "attendee",
        status: "active",
      });

      // 3. Create Wallet
      const { data: newWallet, error: wErr } = await supabaseAdmin
        .from("wallets")
        .insert({
          event_id: session.eventId,
          profile_id: newProfile.id,
          balance: initialCoins,
          version: 1,
        })
        .select()
        .single();

      if (!wErr && newWallet) {
        // Record Initial Credit Transaction
        await supabaseAdmin.from("wallet_transactions").insert({
          wallet_id: newWallet.id,
          event_id: session.eventId,
          profile_id: newProfile.id,
          type: "initial_credit",
          amount: initialCoins,
          balance_before: 0,
          balance_after: initialCoins,
          source_type: "event_signup",
          idempotency_key: `init_${newProfile.id}`,
          metadata: { createdBy: "admin", initialCoins },
        });
      }

      // 4. Audit Log
      await supabaseAdmin.from("audit_logs").insert({
        event_id: session.eventId,
        actor_profile_id: session.profile.id,
        action: "ADMIN_CREATE_ATTENDEE",
        entity_type: "profile",
        entity_id: newProfile.id,
        before_data: null,
        after_data: { displayName, vibeId: finalVibeId, assignedZoneId, initialCoins },
      });

      return { success: true, profile: newProfile };
    }

    // Mock Store
    const newProfile = mockDb.createAttendeeProfile(
      finalClerkId,
      displayName.trim(),
      finalVibeId,
      college.trim(),
      club?.trim() || "",
      0,
      0,
      0,
      instagramId?.trim() || undefined,
      phone?.trim() || "+91 98765 00000",
      assignedZoneId
    );

    mockDb.auditLogs.unshift({
      id: `audit-create-${Date.now()}`,
      event_id: session.eventId,
      actor_profile_id: session.profile.id,
      action: "ADMIN_CREATE_ATTENDEE",
      entity_type: "profile",
      entity_id: newProfile.id,
      before_data: null,
      after_data: { displayName, vibeId: finalVibeId, assignedZoneId, initialCoins },
      created_at: new Date().toISOString(),
    });

    return { success: true, profile: newProfile };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create attendee" };
  }
}

// 6. Update Attendee Action
const updateAttendeeSchema = z.object({
  targetProfileId: z.string().min(1),
  displayName: z.string().min(2),
  phone: z.string().optional(),
  instagramId: z.string().optional(),
  college: z.string().min(1),
  club: z.string().optional(),
  assignedZoneId: z.string().min(1),
});

export async function adminUpdateAttendeeAction(rawInput: z.infer<typeof updateAttendeeSchema>) {
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, message: "Unauthorized. District Admin privileges required." };
  }

  const parsed = updateAttendeeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  const { targetProfileId, displayName, phone, instagramId, college, club, assignedZoneId } = parsed.data;
  const session = await getCurrentUserSession();

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          phone: phone?.trim() || null,
          instagram_id: instagramId?.trim() || null,
          college: college.trim(),
          club: club?.trim() || null,
          assigned_zone_id: assignedZoneId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetProfileId);

      if (error) return { success: false, message: error.message };

      await supabaseAdmin.from("audit_logs").insert({
        event_id: session.eventId,
        actor_profile_id: session.profile.id,
        action: "ADMIN_UPDATE_ATTENDEE",
        entity_type: "profile",
        entity_id: targetProfileId,
        before_data: null,
        after_data: { displayName, college, assignedZoneId },
      });

      return { success: true };
    }

    const prof = mockDb.profiles.get(targetProfileId);
    if (!prof) return { success: false, message: "Profile not found" };

    prof.display_name = displayName.trim();
    prof.phone = phone?.trim() || prof.phone;
    prof.instagram_id = instagramId?.trim() || prof.instagram_id;
    prof.college = college.trim();
    prof.club = club?.trim() || prof.club;
    prof.assigned_zone_id = assignedZoneId;
    prof.updated_at = new Date().toISOString();

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update attendee" };
  }
}

// 7. Delete Attendee Action
const deleteAttendeeSchema = z.object({
  targetProfileId: z.string().min(1),
});

export async function adminDeleteAttendeeAction(rawInput: z.infer<typeof deleteAttendeeSchema>) {
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, message: "Unauthorized. District Admin privileges required." };
  }

  const parsed = deleteAttendeeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  const { targetProfileId } = parsed.data;
  const session = await getCurrentUserSession();

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      // Clean child records
      await supabaseAdmin.from("experience_completions").delete().eq("profile_id", targetProfileId);
      await supabaseAdmin.from("wallet_transactions").delete().eq("profile_id", targetProfileId);
      await supabaseAdmin.from("wallets").delete().eq("profile_id", targetProfileId);
      await supabaseAdmin.from("event_members").delete().eq("profile_id", targetProfileId);
      const { error } = await supabaseAdmin.from("profiles").delete().eq("id", targetProfileId);

      if (error) return { success: false, message: error.message };

      await supabaseAdmin.from("audit_logs").insert({
        event_id: session.eventId,
        actor_profile_id: session.profile.id,
        action: "ADMIN_DELETE_ATTENDEE",
        entity_type: "profile",
        entity_id: targetProfileId,
        before_data: null,
        after_data: { deletedProfileId: targetProfileId },
      });

      return { success: true };
    }

    // Mock store
    mockDb.completions = mockDb.completions.filter((c) => c.profile_id !== targetProfileId);
    mockDb.walletTransactions = mockDb.walletTransactions.filter((tx) => tx.profile_id !== targetProfileId);
    mockDb.wallets.delete(`${session.eventId}:${targetProfileId}`);
    mockDb.eventMembers.delete(`${session.eventId}:${targetProfileId}`);
    mockDb.profiles.delete(targetProfileId);

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete attendee" };
  }
}

// 8. Purge Test Data Server Action
export async function adminPurgeTestDataAction() {
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, message: "Unauthorized. District Admin privileges required." };
  }

  const session = await getCurrentUserSession();

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { data: allProfiles } = await supabaseAdmin.from("profiles").select("*");
      const testProfiles = (allProfiles || []).filter((p: any) => {
        const isTestClerk = p.clerk_user_id?.startsWith("test-user-") || p.clerk_user_id?.startsWith("usr-reg-");
        const isVikramTest = p.display_name === "Vikram Sen" && p.clerk_user_id?.startsWith("test-");
        const isDummyAttendee = p.display_name === "VIBE Attendee" && !p.phone;
        return isTestClerk || isVikramTest || isDummyAttendee;
      });

      const testIds = testProfiles.map((p: any) => p.id);
      if (testIds.length > 0) {
        await supabaseAdmin.from("experience_completions").delete().in("profile_id", testIds);
        await supabaseAdmin.from("wallet_transactions").delete().in("profile_id", testIds);
        await supabaseAdmin.from("wallets").delete().in("profile_id", testIds);
        await supabaseAdmin.from("event_members").delete().in("profile_id", testIds);
        await supabaseAdmin.from("profiles").delete().in("id", testIds);
      }

      await supabaseAdmin.from("audit_logs").insert({
        event_id: session.eventId,
        actor_profile_id: session.profile.id,
        action: "ADMIN_PURGE_TEST_DATA",
        entity_type: "database",
        entity_id: session.eventId,
        before_data: { testProfilesCount: testIds.length },
        after_data: { purgedCount: testIds.length },
      });

      return { success: true, purgedCount: testIds.length };
    }

    return { success: true, purgedCount: 0 };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to purge test data" };
  }
}

// 9. Zone Management Actions
const updateZoneSchema = z.object({
  zoneId: z.string().min(1),
  isActive: z.boolean(),
});

export async function adminToggleZoneAction(rawInput: z.infer<typeof updateZoneSchema>) {
  const admin = await getAdminSession();
  if (!admin) return { success: false, message: "Unauthorized. District Admin privileges required." };

  const parsed = updateZoneSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, message: parsed.error.errors[0].message };
  const { zoneId, isActive } = parsed.data;

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      await supabaseAdmin.from("zones").update({ is_active: isActive }).eq("id", zoneId);
      return { success: true, isActive };
    }
    const zone = mockDb.zones.get(zoneId);
    if (zone) zone.is_active = isActive;
    return { success: true, isActive };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

const awardZoneCoinsSchema = z.object({
  zoneId: z.string().min(1),
  coins: z.number().int(),
  reason: z.string().min(3),
});

export async function adminAwardZoneCoinsAction(rawInput: z.infer<typeof awardZoneCoinsSchema>) {
  const admin = await getAdminSession();
  if (!admin) return { success: false, message: "Unauthorized. District Admin privileges required." };

  const parsed = awardZoneCoinsSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, message: parsed.error.errors[0].message };
  const { zoneId, coins, reason } = parsed.data;
  const session = await getCurrentUserSession();

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { data: zone } = await supabaseAdmin.from("zones").select("*").eq("id", zoneId).single();
      if (!zone) return { success: false, message: "Zone not found" };

      const newCoins = Math.max(0, (zone.coins_collected || 0) + coins);
      await supabaseAdmin.from("zones").update({ coins_collected: newCoins }).eq("id", zoneId);

      await supabaseAdmin.from("audit_logs").insert({
        event_id: session.eventId,
        actor_profile_id: session.profile.id,
        action: "ADMIN_ZONE_BONUS_AWARD",
        entity_type: "zone",
        entity_id: zoneId,
        before_data: { coins: zone.coins_collected },
        after_data: { coins: newCoins, adjustment: coins, reason },
      });

      return { success: true, newCoins };
    }

    const zone = mockDb.zones.get(zoneId);
    if (zone) {
      zone.coins_collected = Math.max(0, (zone.coins_collected ?? 0) + coins);
    }
    return { success: true, newCoins: zone?.coins_collected ?? 0 };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// 10. Experience Management Actions
const toggleExperienceSchema = z.object({
  experienceId: z.string().min(1),
  isActive: z.boolean(),
});

export async function adminToggleExperienceAction(rawInput: z.infer<typeof toggleExperienceSchema>) {
  const admin = await getAdminSession();
  if (!admin) return { success: false, message: "Unauthorized. District Admin privileges required." };

  const parsed = toggleExperienceSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, message: parsed.error.errors[0].message };
  const { experienceId, isActive } = parsed.data;

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      await supabaseAdmin.from("experiences").update({ is_active: isActive }).eq("id", experienceId);
      return { success: true, isActive };
    }
    const exp = mockDb.experiences.get(experienceId);
    if (exp) exp.is_active = isActive;
    return { success: true, isActive };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

const updateExperienceSchema = z.object({
  experienceId: z.string().min(1),
  title: z.string().min(2).optional(),
  coinCost: z.number().int().min(0).optional(),
  xpReward: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function adminUpdateExperienceAction(rawInput: z.infer<typeof updateExperienceSchema>) {
  const admin = await getAdminSession();
  if (!admin) return { success: false, message: "Unauthorized. District Admin privileges required." };

  const parsed = updateExperienceSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, message: parsed.error.errors[0].message };
  const { experienceId, title, coinCost, xpReward, isActive } = parsed.data;
  const session = await getCurrentUserSession();

  try {
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (coinCost !== undefined) updates.coin_cost = coinCost;
    if (xpReward !== undefined) updates.xp_reward = xpReward;
    if (isActive !== undefined) updates.is_active = isActive;

    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { error } = await supabaseAdmin.from("experiences").update(updates).eq("id", experienceId);
      if (error) return { success: false, message: error.message };

      await supabaseAdmin.from("audit_logs").insert({
        event_id: session.eventId,
        actor_profile_id: session.profile.id,
        action: "ADMIN_EXPERIENCE_UPDATE",
        entity_type: "experience",
        entity_id: experienceId,
        before_data: null,
        after_data: updates,
      });

      return { success: true };
    }

    const exp = mockDb.experiences.get(experienceId);
    if (exp) {
      if (title !== undefined) exp.title = title;
      if (coinCost !== undefined) exp.coin_cost = coinCost;
      if (xpReward !== undefined) exp.xp_reward = xpReward;
      if (isActive !== undefined) exp.is_active = isActive;
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// 11. Reward Management Action
const updateRewardSchema = z.object({
  rewardId: z.string().min(1),
  stockChange: z.number().int().optional(),
  stockSet: z.number().int().min(0).optional(),
  coinCost: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function adminUpdateRewardAction(rawInput: z.infer<typeof updateRewardSchema>) {
  const admin = await getAdminSession();
  if (!admin) return { success: false, message: "Unauthorized. District Admin privileges required." };

  const parsed = updateRewardSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, message: parsed.error.errors[0].message };
  const { rewardId, stockChange, stockSet, coinCost, isActive } = parsed.data;
  const session = await getCurrentUserSession();

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { data: rwd } = await supabaseAdmin.from("rewards").select("*").eq("id", rewardId).single();
      if (!rwd) return { success: false, message: "Reward not found" };

      const updates: any = {};
      if (typeof isActive === "boolean") updates.is_active = isActive;
      if (typeof stockSet === "number") updates.stock = stockSet;
      else if (typeof stockChange === "number") updates.stock = Math.max(0, (rwd.stock || 0) + stockChange);
      if (typeof coinCost === "number") updates.coin_cost = coinCost;

      await supabaseAdmin.from("rewards").update(updates).eq("id", rewardId);

      await supabaseAdmin.from("audit_logs").insert({
        event_id: session.eventId,
        actor_profile_id: session.profile.id,
        action: "ADMIN_REWARD_UPDATE",
        entity_type: "reward",
        entity_id: rewardId,
        before_data: { stock: rwd.stock, coin_cost: rwd.coin_cost, is_active: rwd.is_active },
        after_data: updates,
      });

      return { success: true };
    }

    const rwd = mockDb.rewards.get(rewardId);
    if (rwd) {
      if (typeof isActive === "boolean") rwd.is_active = isActive;
      if (typeof stockSet === "number") rwd.stock = stockSet;
      else if (typeof stockChange === "number") rwd.stock = Math.max(0, rwd.stock + stockChange);
      if (typeof coinCost === "number") rwd.coin_cost = coinCost;
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

