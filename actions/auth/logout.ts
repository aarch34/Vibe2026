"use server";

import { cookies } from "next/headers";
import { invalidateSessionCache } from "@/lib/auth/session";

export async function logoutAttendeeAction() {
  try {
    const cookieStore = await cookies();

    // Invalidate session cache
    const currentUserId = cookieStore.get("vibe_user_id")?.value;
    invalidateSessionCache(currentUserId);

    // Delete attendee session cookie
    cookieStore.set("vibe_user_id", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
    });

    // Delete staff auth cookie if present
    cookieStore.set("vibe_zonal_auth", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
    });

    return { success: true, redirectUrl: "/sign-in" };
  } catch (err: any) {
    console.error("Logout action error:", err);
    return { success: false, error: err.message || "Failed to log out" };
  }
}
