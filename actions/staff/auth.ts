"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { ZonalStaffUser, ZONAL_CREDENTIALS } from "@/lib/staff/zonal-config";
export type { ZonalStaffUser };

export async function loginZonalStaffAction(formData: FormData) {
  const username = (formData.get("username") as string || "").trim().toLowerCase();
  const password = (formData.get("password") as string || "").trim();

  const cred = ZONAL_CREDENTIALS[username];

  if (!cred || password !== cred.pass) {
    return {
      success: false,
      message: "Invalid credentials or passcode for this station kiosk.",
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
  // 1. Check Clerk session first (Seamless Zonal Staff SSO)
  try {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const authData = auth();

    if (authData.userId) {
      const user = await currentUser();
      const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
      const clerkUserId = authData.userId;

      // Official Super Admin override (thejaswinps@gmail.com)
      if (userEmail === "thejaswinps@gmail.com") {
        return {
          username: "thejaswinps",
          zoneSlug: "arnava",
          zoneId: "d0000000-0000-0000-0000-000000000001",
          zoneName: "Arnava",
          headName: "Thejaswin P (Super Admin)",
          staffType: "zonal_head",
          email: userEmail,
          loggedInAt: Date.now(),
        };
      }

      // Live Supabase lookup
      if (isUsingLiveSupabase() && supabaseAdmin) {
        let profile: any = null;

        const { data: pByClerk } = await supabaseAdmin
          .from("profiles")
          .select("id, display_name, clerk_user_id, email, assigned_zone_id")
          .eq("clerk_user_id", clerkUserId)
          .maybeSingle();

        if (pByClerk) {
          profile = pByClerk;
        } else if (userEmail) {
          const { data: pByEmail } = await supabaseAdmin
            .from("profiles")
            .select("id, display_name, clerk_user_id, email, assigned_zone_id")
            .ilike("email", userEmail)
            .maybeSingle();

          if (pByEmail) {
            profile = pByEmail;
            // Link clerk_user_id to profile for subsequent queries
            await supabaseAdmin
              .from("profiles")
              .update({ clerk_user_id: clerkUserId })
              .eq("id", profile.id);
          }
        }

        if (profile) {
          const { data: staffMember } = await supabaseAdmin
            .from("staff_members")
            .select(`
              id,
              role,
              staff_zone_assignments (
                id,
                zone_id,
                staff_type,
                is_active,
                zones (
                  id,
                  name,
                  slug
                )
              )
            `)
            .eq("profile_id", profile.id)
            .maybeSingle();

          if (staffMember) {
            const assignments = (staffMember as any).staff_zone_assignments || [];
            const activeAsg =
              assignments.find((a: any) => a.is_active !== false) || assignments[0];

            if (activeAsg && activeAsg.zones) {
              return {
                username: userEmail,
                zoneSlug: activeAsg.zones.slug,
                zoneId: activeAsg.zones.id,
                zoneName: activeAsg.zones.name,
                headName: `${profile.display_name} (${
                  activeAsg.staff_type === "zonal_head" ? "Head" : "Staff"
                })`,
                staffType: activeAsg.staff_type || "zonal_head",
                email: userEmail,
                loggedInAt: Date.now(),
              };
            }
          }
        }
      }

      // Memory Store Fallback
      const memProfile = Array.from(mockDb.profiles.values()).find(
        (p) =>
          p.clerk_user_id === clerkUserId ||
          (p.email && p.email.toLowerCase() === userEmail)
      );

      if (memProfile && memProfile.assigned_zone_id) {
        const zone =
          mockDb.zones.get(memProfile.assigned_zone_id) ||
          Array.from(mockDb.zones.values()).find(
            (z) =>
              z.id === memProfile.assigned_zone_id ||
              z.slug === memProfile.assigned_zone_id
          ) ||
          Array.from(mockDb.zones.values())[0];

        return {
          username: userEmail,
          zoneSlug: zone.slug,
          zoneId: zone.id,
          zoneName: zone.name,
          headName: `${memProfile.display_name} (Zonal Staff)`,
          staffType: "zonal_head",
          email: userEmail,
          loggedInAt: Date.now(),
        };
      }
    }
  } catch (clerkErr) {
    // Fall back to cookie
  }

  // 2. Fallback to cookie authentication (for offline kiosk tablets)
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("vibe_zonal_auth");
    if (!cookie?.value) return null;

    const session = JSON.parse(cookie.value);
    if (session.username && (ZONAL_CREDENTIALS[session.username] || session.zoneSlug)) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}
