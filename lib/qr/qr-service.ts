import QRCode from "qrcode";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { QRCodeRecord, Experience, Zone } from "@/types/database";

export interface QRVerificationResult {
  valid: boolean;
  code: string;
  type?: "experience" | "checkpoint" | "zone_cheer";
  error?: string;
  errorCode?: string;
  experience?: Experience;
  zone?: Zone;
  attemptsUsed: number;
  maxAttempts: number;
  canAttempt: boolean;
  coinCost: number;
  xpReward: number;
  coinReward: number;
  zoneCheer?: {
    zoneId: string;
    zoneName: string;
    zoneSlug: string;
    totalCoins: number;
    tagline: string;
  };
}

const ZONE_TAGLINES: Record<string, string> = {
  arnava: "The Ocean of Momentum",
  taranaga: "The Rhythm of the Tide",
  sagara: "The Deep Collective",
  pravaha: "The Relentless Current",
  samudhra: "The Endless Horizon",
  varuna: "The Cosmic Sovereign",
};

export async function verifyQRScan(
  code: string,
  eventId: string,
  profileId: string
): Promise<QRVerificationResult> {
  let cleanCode = code.trim();
  try {
    if (
      cleanCode.includes("code=") ||
      cleanCode.startsWith("http://") ||
      cleanCode.startsWith("https://")
    ) {
      const parsed = new URL(cleanCode, "http://localhost");
      const param = parsed.searchParams.get("code");
      if (param) cleanCode = param.trim();
    }
  } catch {}

  // 1. Check if this is a Zone Cheering / Coin Contribution QR Code
  // Pattern: vibe-activity-{slug} or vibe-cheer-{slug}
  if (
    cleanCode.startsWith("vibe-activity-") ||
    cleanCode.startsWith("vibe-cheer-") ||
    cleanCode.endsWith("-cheer")
  ) {
    const zoneSlug = cleanCode
      .replace(/^vibe-(activity|cheer)-/, "")
      .replace(/-cheer$/, "")
      .trim()
      .toLowerCase();

    let targetZone: Zone | null = null;

    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { data: zData } = await supabaseAdmin
        .from("zones")
        .select("*")
        .eq("event_id", eventId)
        .eq("slug", zoneSlug)
        .maybeSingle();

      if (zData) targetZone = zData;
    }

    if (!targetZone) {
      const memZone =
        mockDb.zones.get(`z-${zoneSlug}`) ||
        Array.from(mockDb.zones.values()).find((z) => z.slug === zoneSlug);
      if (memZone) targetZone = memZone;
    }

    if (targetZone) {
      const totalCoins = Number(targetZone.coins_collected || 0);
      return {
        valid: true,
        type: "zone_cheer",
        code: cleanCode,
        zone: targetZone,
        zoneCheer: {
          zoneId: targetZone.id,
          zoneName: targetZone.name,
          zoneSlug: targetZone.slug,
          totalCoins,
          tagline:
            ZONE_TAGLINES[targetZone.slug.toLowerCase()] ||
            targetZone.description ||
            `Official station for Zone ${targetZone.name}`,
        },
        attemptsUsed: 0,
        maxAttempts: 9999,
        canAttempt: true,
        coinCost: 0,
        xpReward: 0,
        coinReward: 0,
      };
    }
  }

  // 2. Check standard QR codes & Checkpoints
  let qrRecord: QRCodeRecord | null = null;
  let experience: Experience | null = null;
  let zone: Zone | null = null;

  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data: qr } = await supabaseAdmin
      .from("qr_codes")
      .select("*, experiences(*, zones(*))")
      .eq("code", cleanCode)
      .eq("event_id", eventId)
      .eq("is_active", true)
      .maybeSingle();

    if (qr && qr.experiences) {
      qrRecord = qr;
      experience = qr.experiences;
      zone = qr.experiences.zones;

      const { count } = await supabaseAdmin
        .from("experience_completions")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profileId)
        .eq("experience_id", experience!.id);

      const attemptsUsed = count || 0;
      const canAttempt = attemptsUsed < experience!.max_attempts;

      const isCheckpoint = cleanCode.startsWith("vibe-zone-") && cleanCode.endsWith("-xp");

      return {
        valid: true,
        type: isCheckpoint ? "checkpoint" : "experience",
        code: cleanCode,
        experience: experience!,
        zone: zone!,
        attemptsUsed,
        maxAttempts: experience!.max_attempts,
        canAttempt,
        coinCost: experience!.coin_cost,
        xpReward: experience!.xp_reward,
        coinReward: experience!.coin_reward,
      };
    }

    // Fallback: If it's a zone checkpoint code like vibe-zone-taranaga-xp, resolve by zone directly
    if (cleanCode.startsWith("vibe-zone-") && cleanCode.endsWith("-xp")) {
      const zSlug = cleanCode.replace(/^vibe-zone-/, "").replace(/-xp$/, "");
      const { data: fallbackZone } = await supabaseAdmin
        .from("zones")
        .select("*")
        .eq("event_id", eventId)
        .eq("slug", zSlug)
        .maybeSingle();

      if (fallbackZone) {
        const { data: fbExp } = await supabaseAdmin
          .from("experiences")
          .select("*")
          .eq("zone_id", fallbackZone.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (fbExp) {
          const { count } = await supabaseAdmin
            .from("experience_completions")
            .select("*", { count: "exact", head: true })
            .eq("profile_id", profileId)
            .eq("experience_id", fbExp.id);

          return {
            valid: true,
            type: "checkpoint",
            code: cleanCode,
            experience: fbExp,
            zone: fallbackZone,
            attemptsUsed: count || 0,
            maxAttempts: fbExp.max_attempts,
            canAttempt: (count || 0) < fbExp.max_attempts,
            coinCost: fbExp.coin_cost,
            xpReward: fbExp.xp_reward,
            coinReward: fbExp.coin_reward,
          };
        }
      }
    }

    return {
      valid: false,
      code: cleanCode,
      error: "Invalid or inactive QR code.",
      errorCode: "INVALID_QR",
      attemptsUsed: 0,
      maxAttempts: 0,
      canAttempt: false,
      coinCost: 0,
      xpReward: 0,
      coinReward: 0,
    };
  }

  // 3. Memory store resolution
  const qr = mockDb.qrCodes.get(cleanCode);
  if (!qr || !qr.is_active || qr.event_id !== eventId) {
    // Check fallback for zone checkpoint
    if (cleanCode.startsWith("vibe-zone-") && cleanCode.endsWith("-xp")) {
      const zSlug = cleanCode.replace(/^vibe-zone-/, "").replace(/-xp$/, "");
      const memZone = Array.from(mockDb.zones.values()).find((z) => z.slug === zSlug);
      if (memZone) {
        const exp = Array.from(mockDb.experiences.values()).find((e) => e.zone_id === memZone.id);
        if (exp) {
          const attemptsUsed = mockDb.completions.filter(
            (c) => c.profile_id === profileId && c.experience_id === exp.id
          ).length;

          return {
            valid: true,
            type: "checkpoint",
            code: cleanCode,
            experience: exp,
            zone: memZone,
            attemptsUsed,
            maxAttempts: exp.max_attempts,
            canAttempt: attemptsUsed < exp.max_attempts,
            coinCost: exp.coin_cost,
            xpReward: exp.xp_reward,
            coinReward: exp.coin_reward,
          };
        }
      }
    }

    return {
      valid: false,
      code: cleanCode,
      error: "This QR code is invalid or does not belong to this event.",
      errorCode: "INVALID_QR",
      attemptsUsed: 0,
      maxAttempts: 0,
      canAttempt: false,
      coinCost: 0,
      xpReward: 0,
      coinReward: 0,
    };
  }

  experience = mockDb.experiences.get(qr.experience_id) || null;
  if (!experience || !experience.is_active) {
    return {
      valid: false,
      code: cleanCode,
      error: "The experience linked to this QR code is currently inactive.",
      errorCode: "EXPERIENCE_UNAVAILABLE",
      attemptsUsed: 0,
      maxAttempts: 0,
      canAttempt: false,
      coinCost: 0,
      xpReward: 0,
      coinReward: 0,
    };
  }

  zone = mockDb.zones.get(experience.zone_id) || null;

  const attemptsUsed = mockDb.completions.filter(
    (c) => c.profile_id === profileId && c.experience_id === experience!.id
  ).length;

  const canAttempt = attemptsUsed < experience.max_attempts;
  const isCheckpoint = cleanCode.startsWith("vibe-zone-") && cleanCode.endsWith("-xp");

  return {
    valid: true,
    type: isCheckpoint ? "checkpoint" : "experience",
    code: cleanCode,
    experience,
    zone: zone!,
    attemptsUsed,
    maxAttempts: experience.max_attempts,
    canAttempt,
    coinCost: experience.coin_cost,
    xpReward: experience.xp_reward,
    coinReward: experience.coin_reward,
  };
}

export async function renderQRCodeSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 2,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
  });
}

export async function renderQRCodeDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 2,
    width: 300,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
  });
}
