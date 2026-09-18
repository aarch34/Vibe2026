"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserSession } from "@/lib/auth/session";
import { isUsingLiveSupabase, supabaseAdmin, mockDb } from "@/lib/db/supabase";
import { FriendItem, AttendeeSearchResult } from "@/types/social";

const FRIEND_EXPERIENCE_ID = "e0000000-0000-0000-0000-000000000020";

export async function getFriendsDataAction() {
  try {
    const session = await getCurrentUserSession();
    const userId = session.profile.id;

    let friends: FriendItem[] = [];
    let allAttendees: AttendeeSearchResult[] = [];

    if (isUsingLiveSupabase() && supabaseAdmin) {
      // 1. Get user's friend connections
      const { data: completions } = await supabaseAdmin
        .from("experience_completions")
        .select("id, metadata, completed_at")
        .eq("event_id", session.eventId)
        .eq("profile_id", userId)
        .eq("experience_id", FRIEND_EXPERIENCE_ID);

      const friendIds = new Set<string>();
      (completions || []).forEach((c: any) => {
        if (c.metadata?.friend_id) {
          friendIds.add(c.metadata.friend_id);
          friends.push({
            profileId: c.metadata.friend_id,
            displayName: c.metadata.friend_name || "VIBE Fresher",
            vibeId: c.metadata.friend_vibe_id || "VIBE-Attendee",
            college: c.metadata.friend_college || null,
            instagramHandle: c.metadata.friend_instagram || c.metadata.friend_name?.toLowerCase().replace(/\s+/g, "_"),
            connectedAt: c.completed_at,
          });
        }
      });

      // 2. Get other registered profiles in event to discover
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, vibe_id, college")
        .neq("id", userId)
        .limit(40);

      allAttendees = (profiles || []).map((p: any) => {
        const handle = p.display_name?.toLowerCase().replace(/\s+/g, "_") || "vibe_fresher";
        return {
          id: p.id,
          displayName: p.display_name || "VIBE Fresher",
          vibeId: p.vibe_id || "VIBE-****",
          college: p.college || null,
          instagramHandle: handle,
          isFriend: friendIds.has(p.id),
        };
      });
    } else {
      // Mock Store implementation
      const friendIds = new Set<string>();
      Array.from(mockDb.completions.values()).forEach((c) => {
        if (c.profile_id === userId && c.experience_id === FRIEND_EXPERIENCE_ID && (c.metadata as any)?.friend_id) {
          const fid = (c.metadata as any).friend_id;
          friendIds.add(fid);
          friends.push({
            profileId: fid,
            displayName: (c.metadata as any).friend_name || "VIBE Fresher",
            vibeId: (c.metadata as any).friend_vibe_id || "VIBE-Attendee",
            college: (c.metadata as any).friend_college || null,
            instagramHandle: (c.metadata as any).friend_instagram || "vibe_fresher",
            connectedAt: c.completed_at,
          });
        }
      });

      allAttendees = Array.from(mockDb.profiles.values())
        .filter((p) => p.id !== userId)
        .map((p) => ({
          id: p.id,
          displayName: p.display_name,
          vibeId: p.vibe_id,
          college: p.college || null,
          instagramHandle: p.display_name.toLowerCase().replace(/\s+/g, "_"),
          isFriend: friendIds.has(p.id),
        }));
    }

    return {
      success: true,
      friends,
      allAttendees,
      totalFriends: friends.length,
      totalXpEarned: friends.length * 25,
    };
  } catch (err: any) {
    console.error("getFriendsDataAction error:", err);
    return {
      success: false,
      friends: [],
      allAttendees: [],
      totalFriends: 0,
      totalXpEarned: 0,
      message: err.message || "Failed to load friends",
    };
  }
}

export async function followAndAddFriendAction(friendProfileId: string) {
  try {
    const session = await getCurrentUserSession();
    const userId = session.profile.id;

    if (userId === friendProfileId) {
      return { success: false, message: "You cannot add yourself as a friend." };
    }

    if (isUsingLiveSupabase() && supabaseAdmin) {
      // 1. Check if already connected
      const { data: existing } = await supabaseAdmin
        .from("experience_completions")
        .select("id")
        .eq("event_id", session.eventId)
        .eq("profile_id", userId)
        .eq("experience_id", FRIEND_EXPERIENCE_ID)
        .contains("metadata", { friend_id: friendProfileId })
        .maybeSingle();

      if (existing) {
        return {
          success: true,
          alreadyFriends: true,
          xpEarned: 0,
          message: "You are already friends with this attendee!",
        };
      }

      // 2. Fetch friend profile details for metadata snapshot
      const { data: friendProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, vibe_id, college")
        .eq("id", friendProfileId)
        .maybeSingle();

      const friendName = friendProfile?.display_name || "VIBE Fresher";
      const friendVibeId = friendProfile?.vibe_id || "VIBE-Attendee";
      const friendCollege = friendProfile?.college || null;
      const friendHandle = friendName.toLowerCase().replace(/\s+/g, "_");

      // 3. Award +25 XP via experience_completions
      await supabaseAdmin.from("experience_completions").insert({
        event_id: session.eventId,
        profile_id: userId,
        experience_id: FRIEND_EXPERIENCE_ID,
        attempt_number: 1,
        coin_spent: 0,
        xp_earned: 25,
        coin_earned: 0,
        metadata: {
          type: "friend_connection",
          friend_id: friendProfileId,
          friend_name: friendName,
          friend_vibe_id: friendVibeId,
          friend_college: friendCollege,
          friend_instagram: friendHandle,
        },
      });

      revalidatePath("/app/friends");
      revalidatePath("/app");

      return {
        success: true,
        xpEarned: 25,
        friendName,
        friendHandle,
        message: `Connected with ${friendName}! ⭐ +25 XP awarded to your journey!`,
      };
    }

    // Mock store implementation
    const alreadyConnected = Array.from(mockDb.completions.values()).some(
      (c) =>
        c.profile_id === userId &&
        c.experience_id === FRIEND_EXPERIENCE_ID &&
        (c.metadata as any)?.friend_id === friendProfileId
    );

    if (alreadyConnected) {
      return {
        success: true,
        alreadyFriends: true,
        xpEarned: 0,
        message: "You are already friends with this attendee!",
      };
    }

    const friendProfile = mockDb.profiles.get(friendProfileId);
    const friendName = friendProfile?.display_name || "VIBE Fresher";
    const friendHandle = friendName.toLowerCase().replace(/\s+/g, "_");

    const compId = `comp-friend-${Date.now()}`;
    mockDb.completions.push({
      id: compId,
      event_id: session.eventId,
      profile_id: userId,
      experience_id: FRIEND_EXPERIENCE_ID,
      qr_code_id: null,
      attempt_number: 1,
      coin_spent: 0,
      xp_earned: 25,
      coin_earned: 0,
      completed_at: new Date().toISOString(),
      metadata: {
        type: "friend_connection",
        friend_id: friendProfileId,
        friend_name: friendName,
        friend_vibe_id: friendProfile?.vibe_id,
        friend_college: friendProfile?.college,
        friend_instagram: friendHandle,
      },
    });

    revalidatePath("/app/friends");
    revalidatePath("/app");

    return {
      success: true,
      xpEarned: 25,
      friendName,
      friendHandle,
      message: `Connected with ${friendName}! ⭐ +25 XP awarded to your journey!`,
    };
  } catch (err: any) {
    console.error("followAndAddFriendAction error:", err);
    return { success: false, message: err.message || "Failed to add friend" };
  }
}
