import { NextResponse } from "next/server";
import { getAdminSession } from "@/actions/admin/auth";
import { mockDb } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { invalidateSessionCache } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetUserId, amount, reason, adminName } = body;

    if (!targetUserId || amount === undefined || !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: "Target user, valid XP amount, and a mandatory reason are required." },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return NextResponse.json(
        { success: false, error: "XP amount must be a non-zero number." },
        { status: 400 }
      );
    }

    let adminDisplayName = adminName?.trim() || "District Admin";
    let adminProfileId: string | null = null;

    try {
      const admin = await getAdminSession();
      if (admin) {
        adminDisplayName = adminName?.trim() || admin.name || admin.username || "District Admin";
      }
    } catch {
      // non-fatal
    }

    // ── Live Supabase path ─────────────────────────────────────────────────────
    if (isUsingLiveSupabase() && supabaseAdmin) {
      // 1. Fetch current profile & XP
      const { data: targetProfile, error: fetchErr } = await supabaseAdmin
        .from("profiles")
        .select("id, xp, display_name, username")
        .eq("id", targetUserId)
        .single();

      if (fetchErr || !targetProfile) {
        return NextResponse.json(
          { success: false, error: "Target user not found: " + (fetchErr?.message || "") },
          { status: 404 }
        );
      }

      const xpBefore = targetProfile.xp ?? 0;
      const xpAfter = Math.max(0, xpBefore + numAmount); // XP can't go below 0

      // 2. Update XP on the profile
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({
          xp: xpAfter,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (updateErr) {
        return NextResponse.json(
          { success: false, error: "Failed to update profile XP: " + updateErr.message },
          { status: 500 }
        );
      }

      // 3. Write immutable audit log row
      try {
        await supabaseAdmin.from("admin_xp_adjustments").insert({
          target_profile_id: targetUserId,
          admin_profile_id: adminProfileId,
          admin_name: adminDisplayName,
          amount: numAmount,
          reason: reason.trim(),
          xp_before: xpBefore,
          xp_after: xpAfter,
          timestamp: new Date().toISOString(),
        });
      } catch (auditErr: any) {
        console.warn("[XP Adjust] Audit log insert failed:", auditErr?.message || auditErr);
      }

      // 4. Invalidate the session cache for the affected user so they see their new XP
      try {
        invalidateSessionCache(targetUserId);
      } catch {}

      return NextResponse.json({
        success: true,
        xpBefore,
        xpAfter,
        adjustment: numAmount,
        message: `Successfully adjusted XP for ${targetProfile.display_name}: ${xpBefore} → ${xpAfter} (${numAmount >= 0 ? "+" : ""}${numAmount} XP)`,
      });
    }

    // ── Mock/local path ────────────────────────────────────────────────────────
    const result = mockDb.adminAdjustXp(
      targetUserId,
      adminProfileId,
      adminDisplayName,
      numAmount,
      reason.trim()
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[XP Adjust Route Error]:", error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
