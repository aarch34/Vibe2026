"use server";

import { z } from "zod";
import { getZonalStaffSession } from "@/actions/staff/auth";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

const EVENT_ID = "a0000000-0000-0000-0000-000000000001";

const dutyAwardSchema = z.object({
  targetProfileId: z.string().min(1, "Target attendee profile is required"),
  zoneId: z.string().min(1, "Zone ID is required"),
  dutyCategory: z.string().min(2, "Duty category is required"),
  xpAmount: z.number().int().min(0, "XP must be at least 0"),
  coinAmount: z.number().int().min(0, "Coins must be at least 0"),
  description: z.string().min(5, "A descriptive justification (min 5 chars) is mandatory for audit trails"),
});

export interface DutyAwardResult {
  success: boolean;
  message?: string;
  dutyRecordId?: string;
  recipientName?: string;
  xpAwarded?: number;
  coinsAwarded?: number;
  newBalance?: number;
}

export async function awardDutyXpAction(rawInput: z.infer<typeof dutyAwardSchema>): Promise<DutyAwardResult> {
  const staff = await getZonalStaffSession();
  if (!staff) {
    return { success: false, message: "Unauthorized. Active Zonal Staff login required." };
  }

  const parsed = dutyAwardSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  const { targetProfileId, zoneId, dutyCategory, xpAmount, coinAmount, description } = parsed.data;

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      // 1. Fetch Recipient Profile & Zone
      const [pRes, zRes] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, display_name, vibe_id")
          .eq("id", targetProfileId)
          .single(),
        supabaseAdmin
          .from("zones")
          .select("id, name, slug, coins_collected")
          .eq("id", zoneId)
          .single(),
      ]);

      if (pRes.error || !pRes.data) {
        return { success: false, message: "Recipient attendee profile not found" };
      }
      if (zRes.error || !zRes.data) {
        return { success: false, message: "Zone not found" };
      }

      const recipient = pRes.data;
      const zone = zRes.data;

      // 2. Fetch or initialize recipient wallet
      let { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("*")
        .eq("event_id", EVENT_ID)
        .eq("profile_id", targetProfileId)
        .maybeSingle();

      if (!wallet) {
        const { data: newW, error: wInitErr } = await supabaseAdmin
          .from("wallets")
          .insert({
            event_id: EVENT_ID,
            profile_id: targetProfileId,
            balance: 500,
            version: 1,
          })
          .select()
          .single();

        if (wInitErr) throw new Error("Failed to initialize recipient wallet");
        wallet = newW;
      }

      const balanceBefore = wallet.balance;
      const newBalance = balanceBefore + coinAmount;

      // 3. Update wallet balance
      const { error: upWalletErr } = await supabaseAdmin
        .from("wallets")
        .update({
          balance: newBalance,
          version: wallet.version + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (upWalletErr) throw upWalletErr;

      // 4. Record wallet transaction if coins were awarded
      const dutyRecordId = `duty-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      if (coinAmount > 0) {
        await supabaseAdmin.from("wallet_transactions").insert({
          wallet_id: wallet.id,
          event_id: EVENT_ID,
          profile_id: targetProfileId,
          type: "earn",
          amount: coinAmount,
          balance_before: balanceBefore,
          balance_after: newBalance,
          source_type: "duty_reward",
          source_id: dutyRecordId,
          metadata: {
            dutyCategory,
            description,
            zoneId: zone.id,
            zoneName: zone.name,
            awardedBy: staff.headName,
            staffUsername: staff.username,
          },
        });
      }

      // 5. Record experience completion for instant XP credit and leaderboard sync
      await supabaseAdmin.from("experience_completions").insert({
        event_id: EVENT_ID,
        profile_id: targetProfileId,
        experience_id: null,
        attempt_number: 1,
        coin_spent: 0,
        xp_earned: xpAmount,
        coin_earned: coinAmount,
        metadata: {
          dutyRecordId,
          dutyCategory,
          zoneId: zone.id,
          zoneName: zone.name,
          awardedBy: staff.headName,
          staffUsername: staff.username,
          description,
        },
      });

      // 6. Update Zone Coins Score
      if (coinAmount > 0) {
        await supabaseAdmin
          .from("zones")
          .update({
            coins_collected: (zone.coins_collected || 0) + coinAmount,
          })
          .eq("id", zone.id);
      }

      // 7. Audit Log
      await supabaseAdmin.from("audit_logs").insert({
        event_id: EVENT_ID,
        actor_profile_id: null,
        action: "STAFF_DUTY_XP_AWARDED",
        entity_type: "duty_reward",
        entity_id: dutyRecordId,
        after_data: {
          staffUsername: staff.username,
          staffHeadName: staff.headName,
          zoneId: zone.id,
          zoneName: zone.name,
          recipientId: recipient.id,
          recipientName: recipient.display_name,
          recipientVibeId: recipient.vibe_id,
          xpAwarded: xpAmount,
          coinsAwarded: coinAmount,
          balanceBefore,
          newBalance,
          dutyCategory,
          description,
          awardedAt: new Date().toISOString(),
        },
      });

      // 8. Notification
      try {
        await supabaseAdmin.from("notifications").insert({
          event_id: EVENT_ID,
          profile_id: targetProfileId,
          type: "duty_reward",
          created_at: new Date().toISOString(),
        });
      } catch (notifErr) {
        console.warn("Notification insert skipped:", notifErr);
      }

      return {
        success: true,
        message: `Awarded +${xpAmount} XP & +${coinAmount} Coins to ${recipient.display_name} for "${dutyCategory}"!`,
        dutyRecordId,
        recipientName: recipient.display_name,
        xpAwarded: xpAmount,
        coinsAwarded: coinAmount,
        newBalance,
      };
    }

    // Memory Fallback
    const dutyRecordId = `duty-mem-${Date.now()}`;
    const targetProf = Array.from(mockDb.profiles.values()).find((p) => p.id === targetProfileId);
    const targetName = targetProf ? targetProf.display_name : "Volunteer Attendee";

    // Update memory wallet
    const key = `${EVENT_ID}:${targetProfileId}`;
    let memWallet = mockDb.wallets.get(key);
    if (!memWallet) {
      mockDb.creditInitialWallet(EVENT_ID, targetProfileId, 500);
      memWallet = mockDb.wallets.get(key)!;
    }

    const prevBal = memWallet.balance;
    memWallet.balance += coinAmount;

    // Record completion
    mockDb.completions.push({
      id: `comp-${Date.now()}`,
      event_id: EVENT_ID,
      profile_id: targetProfileId,
      experience_id: "exp-arnava-1",
      qr_code_id: null,
      attempt_number: 1,
      coin_spent: 0,
      xp_earned: xpAmount,
      coin_earned: coinAmount,
      metadata: { dutyCategory, description, awardedBy: staff.headName },
      completed_at: new Date().toISOString(),
    });

    // Record audit
    mockDb.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      event_id: EVENT_ID,
      actor_profile_id: null,
      action: "STAFF_DUTY_XP_AWARDED",
      entity_type: "duty_reward",
      entity_id: dutyRecordId,
      before_data: null,
      after_data: {
        staff: staff.headName,
        recipientName: targetName,
        xpAwarded: xpAmount,
        coinsAwarded: coinAmount,
        dutyCategory,
        description,
      },
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Awarded +${xpAmount} XP & +${coinAmount} Coins to ${targetName} for "${dutyCategory}"!`,
      dutyRecordId,
      recipientName: targetName,
      xpAwarded: xpAmount,
      coinsAwarded: coinAmount,
      newBalance: memWallet.balance,
    };
  } catch (err: any) {
    console.error("awardDutyXpAction error:", err);
    return { success: false, message: err.message || "Failed to award duty XP" };
  }
}

export async function getRecentDutyAwardsAction(zoneId: string) {
  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("audit_logs")
        .select("*")
        .eq("event_id", EVENT_ID)
        .eq("action", "STAFF_DUTY_XP_AWARDED")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      return {
        success: true,
        awards: (data || [])
          .filter((log: any) => log.after_data?.zoneId === zoneId || !zoneId)
          .map((log: any) => ({
            id: log.id,
            recipientName: log.after_data?.recipientName || "Volunteer",
            recipientVibeId: log.after_data?.recipientVibeId || "VIBE-0000",
            dutyCategory: log.after_data?.dutyCategory || "General Duty",
            xpAwarded: log.after_data?.xpAwarded || 0,
            coinsAwarded: log.after_data?.coinsAwarded || 0,
            awardedBy: log.after_data?.staffHeadName || "Zonal Head",
            awardedAt: log.created_at,
            description: log.after_data?.description || "",
          })),
      };
    }

    // Memory fallback
    const logs = mockDb.auditLogs.filter((l) => l.action === "STAFF_DUTY_XP_AWARDED");
    return {
      success: true,
      awards: logs.slice(0, 10).map((l) => ({
        id: l.id,
        recipientName: l.after_data?.recipientName || "Volunteer",
        recipientVibeId: "VIBE-0000",
        dutyCategory: l.after_data?.dutyCategory || "General Duty",
        xpAwarded: l.after_data?.xpAwarded || 0,
        coinsAwarded: l.after_data?.coinsAwarded || 0,
        awardedBy: l.after_data?.staff || "Zonal Head",
        awardedAt: l.created_at,
        description: l.after_data?.description || "",
      })),
    };
  } catch (err: any) {
    return { success: false, awards: [], message: err.message };
  }
}
