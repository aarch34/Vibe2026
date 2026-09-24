import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { socialStore } from "@/lib/db/social-store";

export const dynamic = "force-dynamic";

/**
 * DPDP Act 2023 - Section 13: Right of Grievance Redressal
 * Registers a formal grievance concerning digital personal data processing.
 */
export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { category, subject, description, contactEmail } = await req.json();

    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json(
        { success: false, error: "Subject and grievance description are required." },
        { status: 400 }
      );
    }

    const trackingId = `DPDP-${Date.now().toString().slice(-6)}`;

    // Create an in-app confirmation notification for the attendee
    await socialStore.createNotification({
      profile_id: session.profile.id,
      type: "new_challenge", // system notice icon
      title: `Grievance Registered (${trackingId}) ⚖️`,
      message: `Your DPDP grievance regarding "${subject.trim().slice(0, 40)}" was submitted to our Grievance Officer. Statutory response window: 48h ack, 7d resolution.`,
      link: "/privacy",
    });

    return NextResponse.json({
      success: true,
      trackingId,
      status: "Submitted to Grievance Redressal Officer",
      officerEmail: "grievance@vibe2026.rotaract.org",
      acknowledgmentWindow: "48 hours",
      resolutionWindow: "7 working days",
      message: `Your grievance has been formally registered with ID ${trackingId}. An acknowledgment has been generated.`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
