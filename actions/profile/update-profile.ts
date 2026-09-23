"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserSession, invalidateSessionCache } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";
import { isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { uploadMediaFile } from "@/lib/storage/storage-client";
import { Profile } from "@/types/database";

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
  profile?: Profile;
  xpEarned?: number;
}

export interface ProfileUpdateInput {
  display_name?: string;
  username?: string;
  college?: string;
  course_year?: string;
  rotaract_club?: string;
  city?: string | null;
  bio?: string | null;
  instagram_username?: string | null;
  interests?: string[] | string;
  skills?: string[] | string;
  hobbies?: string[] | string;
  avatar_url?: string | null;
  avatar_file?: File | null;
}

import { cleanInstagramUsername, parseStringArray } from "@/lib/profile/utils";

export async function updateAttendeeProfile(
  input: FormData | ProfileUpdateInput
): Promise<UpdateProfileResult> {
  try {
    const session = await getCurrentUserSession();
    if (!session || !session.profile || !session.profile.id) {
      return {
        success: false,
        error: "Unauthorized: You must be logged in to update your profile.",
      };
    }

    const profileId = session.profile.id;
    const currentProfile = mockDb.getProfile(profileId) || session.profile;

    // Extract fields from FormData or Object
    let displayName = "";
    let username = "";
    let college = "";
    let courseYear = "";
    let rotaractClub = "";
    let city: string | null = null;
    let bio: string | null = null;
    let instagramRaw: string | null = null;
    let interestsRaw: string[] | string | null = null;
    let skillsRaw: string[] | string | null = null;
    let hobbiesRaw: string[] | string | null = null;
    let avatarFile: File | null = null;
    let avatarUrlParam: string | null = null;

    if (input instanceof FormData) {
      displayName = (input.get("display_name") as string) || "";
      username = (input.get("username") as string) || "";
      college = (input.get("college") as string) || "";
      courseYear = (input.get("course_year") as string) || "";
      rotaractClub = (input.get("rotaract_club") as string) || "";
      city = (input.get("city") as string) || null;
      bio = (input.get("bio") as string) || null;
      instagramRaw = (input.get("instagram_username") as string) || null;
      interestsRaw = (input.get("interests") as string) || null;
      skillsRaw = (input.get("skills") as string) || null;
      hobbiesRaw = (input.get("hobbies") as string) || null;
      avatarUrlParam = input.get("avatar_url") as string | null;

      const fileEntry = input.get("avatar_file") || input.get("avatar");
      if (fileEntry && typeof fileEntry === "object" && "size" in fileEntry && (fileEntry as File).size > 0) {
        avatarFile = fileEntry as File;
      }
    } else {
      displayName = input.display_name || "";
      username = input.username || "";
      college = input.college || "";
      courseYear = input.course_year || "";
      rotaractClub = input.rotaract_club || "";
      city = input.city !== undefined ? input.city : null;
      bio = input.bio !== undefined ? input.bio : null;
      instagramRaw = input.instagram_username !== undefined ? input.instagram_username : null;
      interestsRaw = input.interests || null;
      skillsRaw = input.skills || null;
      hobbiesRaw = input.hobbies || null;
      avatarUrlParam = input.avatar_url !== undefined ? input.avatar_url : null;
      avatarFile = input.avatar_file || null;
    }

    // 1. Validate Full Name
    const trimmedName = displayName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return {
        success: false,
        error: "Full Name is required and must be at least 2 characters.",
      };
    }

    // 2. Validate Username
    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      return {
        success: false,
        error: "Username is required.",
      };
    }

    if (!/^[a-z0-9_.]+$/.test(trimmedUsername) || trimmedUsername.length < 2 || trimmedUsername.length > 30) {
      return {
        success: false,
        error: "Username must be between 2 and 30 characters and can only contain letters, numbers, underscores, and periods.",
      };
    }

    // Check username uniqueness
    if (mockDb.isUsernameTaken(trimmedUsername, profileId)) {
      return {
        success: false,
        error: "This username is already taken.",
      };
    }

    // 3. Bio character limit
    const trimmedBio = bio ? bio.trim() : null;
    if (trimmedBio && trimmedBio.length > 500) {
      return {
        success: false,
        error: "Bio cannot exceed 500 characters.",
      };
    }

    // 4. Sanitize and format data
    const cleanedInstagram = cleanInstagramUsername(instagramRaw);
    const interests = parseStringArray(interestsRaw);
    const skills = parseStringArray(skillsRaw);
    const hobbies = parseStringArray(hobbiesRaw);

    // 5. Handle Profile Photo Upload if provided
    let finalAvatarUrl: string | null | undefined = undefined;

    if (avatarFile && avatarFile.size > 0) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
      if (!allowedTypes.includes(avatarFile.type)) {
        return {
          success: false,
          error: "Invalid file type. Only JPEG, PNG, WebP, AVIF, and GIF images are permitted.",
        };
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (avatarFile.size > maxSize) {
        return {
          success: false,
          error: "Profile photo exceeds 5MB size limit. Please choose a smaller photo.",
        };
      }

      try {
        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const extension = avatarFile.name ? avatarFile.name.split(".").pop()?.toLowerCase() || "jpg" : "jpg";
        const objectKey = `events/vibe-2026/avatars/${profileId}-${Date.now()}.${extension}`;

        if (isUsingLiveSupabase() && supabaseAdmin) {
          const uploadRes = await uploadMediaFile(objectKey, buffer, avatarFile.type);
          finalAvatarUrl = uploadRes.publicUrl;
        } else {
          // Local/mock environment: use data URL to guarantee persistent local display
          finalAvatarUrl = `data:${avatarFile.type};base64,${buffer.toString("base64")}`;
        }
      } catch (uploadError: any) {
        console.error("Profile photo upload failed:", uploadError);
        return {
          success: false,
          error: "Couldn't upload your profile photo. Please try again.",
        };
      }
    } else if (avatarUrlParam !== null) {
      finalAvatarUrl = avatarUrlParam.trim() || null;
    }

    // 6. One-Time Profile Completion XP Reward (+50 XP)
    const wasAlreadyCompleted = Boolean(
      currentProfile.profile_completed ||
      (currentProfile.bio && currentProfile.interests && currentProfile.interests.length > 0)
    );
    const isNowComplete = Boolean(trimmedBio && interests.length > 0);

    let xpEarned = 0;
    if (!wasAlreadyCompleted && isNowComplete) {
      mockDb.addXpToProfile(profileId, 50, "Profile completed! +50 XP");
      xpEarned = 50;
    }

    // 7. Update In-Memory Store
    const updates: Partial<Profile> = {
      display_name: trimmedName,
      username: trimmedUsername,
      college: college.trim(),
      course_year: courseYear.trim(),
      rotaract_club: rotaractClub.trim(),
      city: city ? city.trim() : null,
      bio: trimmedBio,
      instagram_username: cleanedInstagram,
      interests,
      skills,
      hobbies,
      profile_completed: wasAlreadyCompleted || isNowComplete,
    };

    if (finalAvatarUrl !== undefined) {
      updates.avatar_url = finalAvatarUrl;
    }

    const updatedProfile = mockDb.updateProfile(profileId, updates);
    if (!updatedProfile) {
      return {
        success: false,
        error: "Couldn't update your profile. Please try again.",
      };
    }

    // 8. Update Supabase if live
    if (isUsingLiveSupabase() && supabaseAdmin) {
      try {
        const extendedUpdates: Record<string, any> = {
          display_name: trimmedName,
          college: updates.college,
          club: updates.rotaract_club,
          instagram_id: updates.instagram_username,
          username: updates.username,
          avatar_url: updates.avatar_url,
          course_year: updates.course_year,
          city: updates.city,
          bio: updates.bio,
          interests: updates.interests,
          skills: updates.skills,
          hobbies: updates.hobbies,
          profile_completed: updates.profile_completed,
          updated_at: new Date().toISOString(),
        };

        const { error: dbError } = await supabaseAdmin
          .from("profiles")
          .update(extendedUpdates)
          .eq("id", profileId);

        if (dbError) {
          // If extended columns don't exist yet in Supabase schema, sync standard baseline columns
          await supabaseAdmin
            .from("profiles")
            .update({
              display_name: trimmedName,
              college: updates.college,
              club: updates.rotaract_club,
              instagram_id: updates.instagram_username,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profileId);
        }
      } catch (err: any) {
        console.warn("Live Supabase profile update exception:", err.message);
      }
    }

    // 9. Invalidate Session Cache and Next.js Paths
    invalidateSessionCache(session.clerkUserId);
    invalidateSessionCache();

    try {
      revalidatePath("/app/profile");
      revalidatePath("/app");
      revalidatePath("/app/discover");
      revalidatePath("/", "layout");
    } catch {
      // Ignore if revalidatePath called outside Next.js request context (e.g. in unit tests)
    }

    return {
      success: true,
      profile: updatedProfile,
      xpEarned,
    };
  } catch (error: any) {
    console.error("updateAttendeeProfile error:", error);
    return {
      success: false,
      error: error?.message || "Couldn't update your profile. Please try again.",
    };
  }
}
