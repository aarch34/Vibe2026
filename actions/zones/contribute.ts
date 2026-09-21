"use server";

import { z } from "zod";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

const contributeSchema = z.object({
  zoneId: z.string().min(1, "Zone ID is required"),
  amount: z.number().int().min(10, "Minimum contribution is 10 VIBE coins").max(10000, "Maximum contribution is 10,000 VIBE coins"),
});

export async function sendCoinsToZoneAction(rawInput: z.infer<typeof contributeSchema>) {
  const parsed = contributeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  const { zoneId, amount } = parsed.data;

  try {
    const session = await getCurrentUserSession();

    if (isUsingLiveSupabase() && supabaseAdmin) {
      // 1. Fetch wallet
      const { data: wallet, error: wErr } = await supabaseAdmin
        .from("wallets")
        .select("*")
        .eq("event_id", session.eventId)
        .eq("profile_id", session.profile.id)
        .single();

      if (wErr || !wallet || wallet.balance < amount) {
        return {
          success: false,
          code: "INSUFFICIENT_COINS",
          message: `You need at least ${amount} VIBE Coins to cheer this zone.`,
        };
      }

      // 2. Fetch Zone
      let zoneQuery = supabaseAdmin
        .from("zones")
        .select("*")
        .eq("event_id", session.eventId);

      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(zoneId)) {
        zoneQuery = zoneQuery.eq("id", zoneId);
      } else {
        const cleanSlug = zoneId.replace(/^z-/, "");
        zoneQuery = zoneQuery.eq("slug", cleanSlug);
      }

      const { data: zoneRow, error: zErr } = await zoneQuery.maybeSingle();
      if (zErr || !zoneRow) {
        return { success: false, message: "Target zone not found." };
      }

      const balBefore = wallet.balance;
      const newBal = balBefore - amount;

      // 3. Deduct from wallet
      await supabaseAdmin
        .from("wallets")
        .update({
          balance: newBal,
          version: wallet.version + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      // 4. Record wallet transaction
      await supabaseAdmin.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        event_id: session.eventId,
        profile_id: session.profile.id,
        type: "spend",
        amount,
        balance_before: balBefore,
        balance_after: newBal,
        source_type: "zone_contribution",
        source_id: zoneRow.id,
        idempotency_key: `zc_${Date.now()}_${session.profile.id}_${zoneRow.id}`,
        metadata: { zone_name: zoneRow.name, zone_id: zoneRow.id, cheer_amount: amount },
      });

      // 5. Update Zone coins_collected (support both column and map_data fallback)
      const curMapData = (zoneRow.map_data || {}) as Record<string, any>;
      const curCoins = Number(zoneRow.coins_collected ?? curMapData.coins_collected ?? 0);
      const newZoneCoins = curCoins + amount;

      try {
        await supabaseAdmin
          .from("zones")
          .update({
            coins_collected: newZoneCoins,
            map_data: { ...curMapData, coins_collected: newZoneCoins },
          })
          .eq("id", zoneRow.id);
      } catch {
        await supabaseAdmin
          .from("zones")
          .update({
            map_data: { ...curMapData, coins_collected: newZoneCoins },
          })
          .eq("id", zoneRow.id);
      }

      // 6. Award attendee cheering XP (+50 XP)
      const cheerXP = Math.max(25, Math.round(amount * 0.5));
      await supabaseAdmin.from("experience_completions").insert({
        event_id: session.eventId,
        profile_id: session.profile.id,
        experience_id: "e0000000-0000-0000-0000-000000000001",
        attempt_number: 1,
        coin_spent: amount,
        xp_earned: cheerXP,
        coin_earned: 0,
        metadata: {
          type: "zone_cheer",
          zone_id: zoneRow.id,
          zone_name: zoneRow.name,
        },
      });

      return {
        success: true,
        zoneName: zoneRow.name,
        coinsSent: amount,
        xpEarned: cheerXP,
        newBalance: newBal,
        zoneTotalCoins: newZoneCoins,
      };
    }

    // Mock store fallback
    const targetZoneId = zoneId.startsWith("z-") ? zoneId : `z-${zoneId}`;
    const zone = mockDb.zones.get(targetZoneId) || Array.from(mockDb.zones.values()).find((z) => z.slug === zoneId.replace(/^z-/, ""));
    if (!zone) {
      return { success: false, message: "Zone not found." };
    }

    const wallet = mockDb.wallets.get(`${session.eventId}:${session.profile.id}`);
    if (!wallet || wallet.balance < amount) {
      return {
        success: false,
        message: `You need at least ${amount} VIBE Coins to cheer this zone.`,
      };
    }

    wallet.balance -= amount;
    wallet.version += 1;
    wallet.updated_at = new Date().toISOString();

    zone.coins_collected = (zone.coins_collected || 0) + amount;

    const cheerXP = Math.max(25, Math.round(amount * 0.5));
    mockDb.completions.push({
      id: `comp-zc-${Date.now()}`,
      event_id: session.eventId,
      profile_id: session.profile.id,
      experience_id: `zc-${zone.id}`,
      qr_code_id: null,
      attempt_number: 1,
      coin_spent: amount,
      xp_earned: cheerXP,
      coin_earned: 0,
      completed_at: new Date().toISOString(),
      metadata: { type: "zone_cheer", zone_id: zone.id, zone_name: zone.name },
    });

    return {
      success: true,
      zoneName: zone.name,
      coinsSent: amount,
      xpEarned: cheerXP,
      newBalance: wallet.balance,
      zoneTotalCoins: zone.coins_collected,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to send coins to zone.",
    };
  }
}
