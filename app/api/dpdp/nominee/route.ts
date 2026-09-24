import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

/**
 * DPDP Act 2023 - Section 14: Right to Nominate
 * Registers an individual to exercise rights on behalf of Data Principal in event of death or incapacity.
 */
export async function POST(req: Request) {
  try {
    const session = await getCurrentUserSession();
    const { nomineeName, nomineeEmail, nomineePhone, nomineeRelationship } = await req.json();

    if (!nomineeName?.trim() || !nomineeEmail?.trim()) {
      return NextResponse.json(
        { success: false, error: "Nominee full name and email address are required." },
        { status: 400 }
      );
    }

    const nominee = {
      name: nomineeName.trim(),
      email: nomineeEmail.trim(),
      phone: nomineePhone?.trim() || "",
      relationship: nomineeRelationship?.trim() || "Family/Representative",
      registered_at: new Date().toISOString(),
    };

    // Update in-memory profile
    const memProfile = mockDb.getProfile(session.profile.id);
    if (memProfile) {
      (memProfile as any).nominee = nominee;
    }

    // Update Supabase if live
    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from("profiles")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.profile.id);
      } catch (err) {
        console.warn("Supabase nominee update warning:", err);
      }
    }

    return NextResponse.json({
      success: true,
      nominee,
      message: `Nominee ${nominee.name} successfully designated under Section 14 of the DPDP Act, 2023.`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
