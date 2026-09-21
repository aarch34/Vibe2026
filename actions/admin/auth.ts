"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface AdminUser {
  username: string;
  name: string;
  role: "admin";
  loggedInAt: number;
}

const SUPER_ADMIN_EMAILS = ["thejaswinps@gmail.com"];

const ADMIN_CREDENTIALS: Record<string, string> = {
  jk: "jk@vibe2026",
  gunjan: "gunjan@vibe2026",
  thejaswinps: "thejaswinps@vibe2026",
};

export async function loginAdminAction(formData: FormData) {
  const username = (formData.get("username") as string || "").trim().toLowerCase();
  const password = (formData.get("password") as string || "").trim();

  const expectedPassword = ADMIN_CREDENTIALS[username];

  if (!expectedPassword || password !== expectedPassword) {
    return {
      success: false,
      message: "Invalid admin credentials. Official Super Admin: thejaswinps@gmail.com (Sign in with Clerk).",
    };
  }

  const adminSession: AdminUser = {
    username,
    name: username === "thejaswinps" ? "Thejaswin P" : username.toUpperCase(),
    role: "admin",
    loggedInAt: Date.now(),
  };

  const cookieStore = await cookies();
  cookieStore.set("vibe_admin_auth", JSON.stringify(adminSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return { success: true, redirectUrl: "/admin" };
}

export async function logoutAdminAction() {
  const cookieStore = await cookies();
  cookieStore.delete("vibe_admin_auth");
  redirect("/admin/login");
}

export async function getAdminSession(): Promise<AdminUser | null> {
  // 1. Check Clerk session first (Super Admin thejaswinps@gmail.com)
  try {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const authData = auth();
    if (authData.userId) {
      const user = await currentUser();
      const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
      const role = (authData.sessionClaims?.metadata as any)?.role;

      if (email === "thejaswinps@gmail.com" || role === "admin") {
        return {
          username: "thejaswinps",
          name: user?.firstName
            ? `${user.firstName} ${user.lastName || ""}`.trim()
            : "Thejaswin P (Admin)",
          role: "admin",
          loggedInAt: Date.now(),
        };
      }
    }
  } catch {
    // Clerk not loaded or static render
  }

  // 2. Fallback to cookie (for kiosk/preset logins)
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("vibe_admin_auth");
    if (!cookie?.value) return null;

    const session = JSON.parse(cookie.value);
    if (
      session.role === "admin" &&
      (session.username === "jk" ||
        session.username === "gunjan" ||
        session.username === "thejaswinps")
    ) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}
