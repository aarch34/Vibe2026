"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface AdminUser {
  username: string;
  name: string;
  role: "admin";
  loggedInAt: number;
}

const ADMIN_CREDENTIALS: Record<string, string> = {
  jk: "jk@vibe2026",
  gunjan: "gunjan@vibe2026",
};

export async function loginAdminAction(formData: FormData) {
  const username = (formData.get("username") as string || "").trim().toLowerCase();
  const password = (formData.get("password") as string || "").trim();

  const expectedPassword = ADMIN_CREDENTIALS[username];

  if (!expectedPassword || password !== expectedPassword) {
    return {
      success: false,
      message: "Invalid admin username or password. Authorized logins: jk, gunjan",
    };
  }

  const adminSession: AdminUser = {
    username,
    name: username.toUpperCase(),
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
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("vibe_admin_auth");
    if (!cookie?.value) return null;

    const session = JSON.parse(cookie.value);
    if (session.role === "admin" && (session.username === "jk" || session.username === "gunjan")) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}
