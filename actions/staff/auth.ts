"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ZonalStaffUser, ZONAL_CREDENTIALS } from "@/lib/staff/zonal-config";
export type { ZonalStaffUser };

export async function loginZonalStaffAction(formData: FormData) {
  const username = (formData.get("username") as string || "").trim().toLowerCase();
  const password = (formData.get("password") as string || "").trim();

  const cred = ZONAL_CREDENTIALS[username];

  if (!cred || password !== cred.pass) {
    return {
      success: false,
      message: "Invalid zonal head username or password. 12 logins available (e.g. arnava1, taranaga1).",
    };
  }

  const zonalSession: ZonalStaffUser = {
    username,
    zoneSlug: cred.zoneSlug,
    zoneId: cred.zoneId,
    zoneName: cred.zoneName,
    headName: cred.headName,
    loggedInAt: Date.now(),
  };

  const cookieStore = await cookies();
  cookieStore.set("vibe_zonal_auth", JSON.stringify(zonalSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true, redirectUrl: "/staff" };
}

export async function logoutZonalStaffAction() {
  const cookieStore = await cookies();
  cookieStore.delete("vibe_zonal_auth");
  redirect("/staff/login");
}

export async function getZonalStaffSession(): Promise<ZonalStaffUser | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("vibe_zonal_auth");
    if (!cookie?.value) return null;

    const session = JSON.parse(cookie.value);
    if (session.username && ZONAL_CREDENTIALS[session.username]) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}
