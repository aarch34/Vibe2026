"use server";

import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb } from "@/lib/db/mock-store";

export async function updateAttendeeProfile(formData: FormData) {
  const session = await getCurrentUserSession();
  const displayName = formData.get("display_name") as string;
  const bio = formData.get("bio") as string;
  const instagramUsername = formData.get("instagram_username") as string;

  if (displayName) {
    mockDb.updateProfile(session.profile.id, {
      display_name: displayName,
      bio: bio || null,
      instagram_username: instagramUsername || null,
    });
  }

  return { success: true };
}
