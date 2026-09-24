import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

/**
 * DPDP Act 2023 - Section 14: Right to Nominate
 * Registers an individual who shall, in the event of death or incapacity of the Data Principal,
 * exercise her rights under the provisions of this Act (Section 14(1)).
 *
 * "Incapacity" = inability to exercise rights due to unsoundness of mind or infirmity of body (Section 14(2)).
 */

// GET: Retrieve current nominee (Section 11 — Right to Access)
export async function GET() {
  try {
    const session = await getCurrentUserSession();

    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { data } = await (supabaseAdmin as any)
        .from("dpdp_nominees")
        .select("*")
        .eq("profile_id", session.profile.id)
        .maybeSingle();

      if (data) {
        return NextResponse.json({ success: true, nominee: data });
      }
    }

    // Fallback to in-memory
    const memProfile = mockDb.getProfile(session.profile.id) as any;
    return NextResponse.json({ success: true, nominee: memProfile?.nominee || null });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// POST: Register or update nominee (Section 14(1))
export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { nomineeName, nomineeEmail, nomineePhone, nomineeRelationship } = await req.json();

    if (!nomineeName?.trim() || !nomineeEmail?.trim()) {
      return NextResponse.json(
        { success: false, error: "Nominee full name and email address are required (Section 14, DPDP Act 2023)." },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nomineeEmail.trim())) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid nominee email address." },
        { status: 400 }
      );
    }

    const nominee = {
      profile_id: session.profile.id,
      nominee_name: nomineeName.trim(),
      nominee_email: nomineeEmail.trim().toLowerCase(),
      nominee_relationship: nomineeRelationship?.trim() || "Family / Legal Representative",
      designated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Persist to Supabase dpdp_nominees table (upsert — one nominee per user)
    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        await (supabaseAdmin as any)
          .from("dpdp_nominees")
          .upsert(nominee, { onConflict: "profile_id" });
      } catch (err) {
        console.warn("[DPDP §14] Supabase nominee upsert warning:", err);
      }
    }

    // Update in-memory profile
    const memProfile = mockDb.getProfile(session.profile.id);
    if (memProfile) {
      (memProfile as any).nominee = {
        name: nominee.nominee_name,
        email: nominee.nominee_email,
        relationship: nominee.nominee_relationship,
        registered_at: nominee.designated_at,
      };
    }

    return NextResponse.json({
      success: true,
      nominee: {
        name: nominee.nominee_name,
        email: nominee.nominee_email,
        relationship: nominee.nominee_relationship,
        designatedAt: nominee.designated_at,
      },
      message: `Nominee "${nominee.nominee_name}" successfully designated under Section 14 of the Digital Personal Data Protection Act, 2023.`,
      legalNote: "Your nominee may exercise your data rights in the event of your death or incapacity as defined in Section 14(2) of the DPDP Act, 2023.",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// DELETE: Remove nominee designation
export async function DELETE() {
  try {
    const session = await getCurrentUserSession();

    if (isUsingLiveSupabase() && supabaseAdmin) {
      await (supabaseAdmin as any)
        .from("dpdp_nominees")
        .delete()
        .eq("profile_id", session.profile.id);
    }

    const memProfile = mockDb.getProfile(session.profile.id) as any;
    if (memProfile?.nominee) {
      delete memProfile.nominee;
    }

    return NextResponse.json({
      success: true,
      message: "Nominee designation removed. You can designate a new nominee at any time.",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
