import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { invalidateSessionCache } from "@/lib/auth/session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("vibe_user_id")?.value;
    invalidateSessionCache(currentUserId);

    cookieStore.set("vibe_user_id", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
    });

    cookieStore.set("vibe_zonal_auth", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, redirect: "/sign-in" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to log out" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
