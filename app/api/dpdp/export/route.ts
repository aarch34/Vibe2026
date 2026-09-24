import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { socialStore } from "@/lib/db/social-store";

export const dynamic = "force-dynamic";

/**
 * DPDP Act 2023 - Section 11: Right to Access Information about Personal Data
 * Returns a complete, portable data dump of all personal data held about the Data Principal.
 */
export async function GET() {
  try {
    const session = await getCurrentUserSession();
    const profileId = session.profile.id;

    // 1. Fetch Profile
    let profile = mockDb.getProfile(profileId) || session.profile;
    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const { data: supaProfile } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .single();
        if (supaProfile) profile = supaProfile;
      } catch (err) {
        console.warn("Supabase profile fetch in DPDP export:", err);
      }
    }

    // 2. Fetch User Posts, Comments, Likes
    const posts = socialStore.getUserPosts(profileId);
    const comments = socialStore.getUserComments(profileId);
    const likes = socialStore.getUserLikes(profileId);

    // 3. Fetch Connections & Requests
    const connections = await socialStore.getConnectionsAsync(profileId);
    const connectionRequests = await socialStore.getConnectionRequestsAsync(profileId);

    // 4. Fetch Game Sessions
    let gameSessions: any[] = mockDb.gameSessions.filter((gs) => gs.profile_id === profileId);
    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const { data: dbSessions } = await supabaseAdmin
          .from("game_sessions")
          .select("*")
          .eq("profile_id", profileId)
          .order("played_at", { ascending: false });
        if (dbSessions) gameSessions = dbSessions;
      } catch (err) {
        console.warn("Supabase game sessions in DPDP export:", err);
      }
    }

    // 5. Build Comprehensive DPDP Data Principal Summary
    const exportData = {
      dpdp_compliance: {
        act: "Digital Personal Data Protection Act, 2023 (India)",
        section: "Section 11 - Right to Access Information",
        data_fiduciary: "Rotaract District 3192 (Bengaluru, India)",
        event: "VIBE 2026 Youth Festival",
        exported_at: new Date().toISOString(),
      },
      data_principal_identity: {
        profile_id: profile.id,
        vibe_id: profile.vibe_id,
        display_name: profile.display_name,
        username: profile.username,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
      },
      affiliation: {
        college: profile.college,
        rotaract_club: profile.rotaract_club,
        course_year: profile.course_year,
        city: profile.city || "Bengaluru",
      },
      profile_details: {
        bio: profile.bio,
        instagram_username: profile.instagram_username,
        interests: profile.interests,
        skills: profile.skills || [],
        hobbies: profile.hobbies || [],
        is_discoverable: profile.is_discoverable,
        profile_completed: profile.profile_completed,
        registered_at: profile.created_at,
        last_updated: profile.updated_at,
      },
      gamification_and_rewards: {
        total_xp: profile.xp,
        level_number: profile.level_number,
        level_name: profile.level_name,
        games_played_count: profile.games_played_count || gameSessions.length,
        connections_count: connections.length,
        posts_count: posts.length,
      },
      game_sessions_history: gameSessions.map((gs) => ({
        id: gs.id,
        game_type: gs.game_type,
        score: gs.score,
        max_score: gs.max_score,
        xp_earned: gs.xp_earned,
        played_at: gs.played_at,
      })),
      social_posts: posts.map((p) => ({
        id: p.id,
        caption: p.caption,
        image_url: p.image_url ? "[Image Stored]" : null,
        likes_count: p.likes_count,
        comments_count: p.comments_count,
        created_at: p.created_at,
      })),
      social_comments: comments.map((c) => ({
        id: c.id,
        post_id: c.post_id,
        comment: c.comment,
        created_at: c.created_at,
      })),
      social_likes_count: likes.length,
      connections_list: connections.map((c) => ({
        id: c.id,
        display_name: c.display_name,
        username: c.username,
        college: c.college,
        rotaract_club: c.rotaract_club,
      })),
      pending_incoming_requests: connectionRequests.incoming.length,
      pending_outgoing_requests: connectionRequests.outgoing.length,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="vibe2026-data-principal-${profile.username || "user"}.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
