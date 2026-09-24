import { NextResponse } from "next/server";
import { supabaseAdmin, isUsingLiveSupabase, mockDb } from "@/lib/db/supabase";

export async function GET() {
  if (!isUsingLiveSupabase()) {
    const users = Array.from(mockDb.profiles.values()).sort((a, b) => b.xp - a.xp);
    return NextResponse.json({ success: true, users });
  }

  try {
    const { data: users, error } = await supabaseAdmin!
      .from("profiles")
      .select("*")
      .order("xp", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isUsingLiveSupabase()) {
    return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { profileId, isBanned } = await request.json();
    if (!profileId) {
      return NextResponse.json({ success: false, error: "Missing profileId" }, { status: 400 });
    }

    const { error } = await supabaseAdmin!
      .from("profiles")
      .update({ is_banned: isBanned })
      .eq("id", profileId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
