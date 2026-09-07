import QRCode from "qrcode";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { QRCodeRecord, Experience, Zone } from "@/types/database";

export interface QRVerificationResult {
  valid: boolean;
  code: string;
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
}

export async function verifyQRScan(
  code: string,
  eventId: string,
  profileId: string
): Promise<QRVerificationResult> {
  const cleanCode = code.trim();

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
      .single();

    if (!qr || !qr.experiences) {
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

    return {
      valid: true,
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

  // Memory store resolution
  const qr = mockDb.qrCodes.get(cleanCode);
  if (!qr || !qr.is_active || qr.event_id !== eventId) {
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

  return {
    valid: true,
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
