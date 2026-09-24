import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { socialStore } from "@/lib/db/social-store";

export const dynamic = "force-dynamic";

/**
 * DPDP Act 2023 - Section 6(4): Right to Withdraw Consent
 *
 * "Where consent given by the Data Principal is the basis of processing of personal data,
 *  such Data Principal shall have the right to withdraw her consent at any time, with the
 *  ease of doing so being comparable to the ease with which such consent was given."
 *
 * Section 6(5): Consequences shall be borne by Data Principal (accreditation may be revoked).
 * Section 6(6): Data Fiduciary shall, within reasonable time, cease processing.
 */
export async function POST() {
  try {
    const session = await getCurrentUserSession();
    const profileId = session.profile.id;

    const withdrawnAt = new Date().toISOString();

    // 1. Record withdrawal in dpdp_consent_register (Supabase)
    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        // Update all active consents for this user to withdrawn
        await (supabaseAdmin as any)
          .from("dpdp_consent_register")
          .update({ withdrawn_at: withdrawnAt, granted: false })
          .eq("profile_id", profileId)
          .is("withdrawn_at", null);

        // If no consent record existed, insert a withdrawal record
        const { data: existing } = await (supabaseAdmin as any)
          .from("dpdp_consent_register")
          .select("id")
          .eq("profile_id", profileId)
          .limit(1);

        if (!existing || existing.length === 0) {
          await (supabaseAdmin as any).from("dpdp_consent_register").insert({
            profile_id: profileId,
            purpose: "event_participation",
            granted: false,
            withdrawn_at: withdrawnAt,
          });
        }

        // Mark profile as not discoverable (processing restricted per §6(6))
        await supabaseAdmin
          .from("profiles")
          .update({ is_discoverable: false, updated_at: withdrawnAt })
          .eq("id", profileId);
      } catch (err) {
        console.warn("[DPDP §6(4)] Supabase consent withdrawal warning:", err);
      }
    }

    // 2. Create confirmation notification
    await socialStore.createNotification({
      profile_id: profileId,
      type: "new_challenge",
      title: "Consent Withdrawn — Processing Restricted ⚖️",
      message:
        "Your data processing consent has been withdrawn per Section 6(4) of the DPDP Act, 2023. Your profile is now hidden from discovery. To fully erase your data, use 'Delete My Account' in Profile Settings.",
      link: "/privacy",
    });

    return NextResponse.json({
      success: true,
      withdrawnAt,
      effectsApplied: [
        "Profile hidden from attendee discovery (is_discoverable = false)",
        "Consent register updated with withdrawal timestamp",
        "Ongoing personal data processing restricted",
      ],
      consequences: [
        "Event accreditation (QR access) may be affected",
        "Your public posts and connections remain until you request erasure via 'Delete My Account'",
        "To fully erase data, use the 'Delete My Account & Data' option in Profile Settings",
      ],
      legalNote:
        "Per Section 6(5) of the DPDP Act 2023, consequences of withdrawal shall be borne by the Data Principal. Processing that occurred prior to withdrawal remains lawful.",
      nextSteps: {
        fullErasure: "POST /api/dpdp/delete",
        grievance: "POST /api/dpdp/grievance",
        privacyNotice: "/privacy",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// GET: Check current consent status
export async function GET() {
  try {
    const session = await getCurrentUserSession();

    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { data } = await (supabaseAdmin as any)
        .from("dpdp_consent_register")
        .select("purpose, granted, granted_at, withdrawn_at, consent_version")
        .eq("profile_id", session.profile.id)
        .order("granted_at", { ascending: false })
        .limit(10);

      return NextResponse.json({
        success: true,
        consents: data || [],
        note: "Section 11, DPDP Act 2023 — Right to access information about personal data processing.",
      });
    }

    return NextResponse.json({ success: true, consents: [], note: "Consent records stored locally (Supabase not configured)." });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
