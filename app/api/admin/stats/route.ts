import { NextResponse } from "next/server";
import { supabaseAdmin, isUsingLiveSupabase, mockDb } from "@/lib/db/supabase";

export async function GET() {
  if (!isUsingLiveSupabase()) {
    const stats = mockDb.getAdminStats();
    const adjustments = mockDb.getAdminXpAdjustments();
    const users = Array.from(mockDb.profiles.values());
    return NextResponse.json({ success: true, stats, adjustments, users });
  }

  try {
    const [
      { count: totalUsers },
      { count: totalPosts },
      { count: activeChallenges },
      { data: users },
      { data: adjustments }
    ] = await Promise.all([
      supabaseAdmin!.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin!.from("posts").select("*", { count: "exact", head: true }),
      supabaseAdmin!.from("social_challenges").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin!.from("profiles").select("*").order("xp", { ascending: false }),
      supabaseAdmin!.from("admin_xp_adjustments").select("*").order("timestamp", { ascending: false }).limit(20)
    ]);

    const stats = {
      users: {
        totalUsers: totalUsers || 0,
        activeUsers: totalUsers || 0,
        profilesCompleted: totalUsers || 0,
        totalConnections: 0,
      },
      social: {
        totalPosts: totalPosts || 0,
        photosUploaded: 0,
        commentsCount: 0,
        likesCount: 0,
      },
      networking: {
        connectionReqsSent: 0,
        connectionReqsAccepted: 0,
        avgConnections: 0,
      },
      games: {
        gamesPlayed: 0,
        xpFromGames: 0,
      }
    };

    return NextResponse.json({ success: true, stats, adjustments: adjustments || [], users: users || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
