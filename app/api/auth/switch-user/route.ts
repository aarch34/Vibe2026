import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, isUsingLiveSupabase } from "@/lib/db/supabase";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const redirectPath = url.searchParams.get("redirect") || "/app";

  if (userId) {
    cookies().set("vibe_user_id", userId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
  }

  return NextResponse.redirect(new URL(redirectPath, req.url));
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name, college } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (name && isUsingLiveSupabase() && supabaseAdmin) {
      const eventId = "a0000000-0000-0000-0000-000000000001";
      const vibeId = `VIBE-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .upsert({
          clerk_user_id: userId,
          vibe_id: vibeId,
          display_name: name,
          college: college || "Rotaract District 3192",
        }, { onConflict: "clerk_user_id" })
        .select()
        .single();

      if (profile) {
        await supabaseAdmin.from("event_members").upsert({
          event_id: eventId,
          profile_id: profile.id,
          role: "attendee",
          status: "active",
        }, { onConflict: "event_id,profile_id" });

        await supabaseAdmin.rpc("fn_credit_initial_wallet", {
          p_event_id: eventId,
          p_profile_id: profile.id,
          p_initial_amount: 500,
        });
      }
    }

    cookies().set("vibe_user_id", userId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
