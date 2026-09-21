"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { ZonalStaffUser, ZONAL_CREDENTIALS } from "@/lib/staff/zonal-config";
export type { ZonalStaffUser };

export async function loginZonalStaffAction(formData: FormData) {
  const username = (formData.get("username") as string || "").trim().toLowerCase();
  const password = (formData.get("password") as string || "").trim();

  if (!username || !password) {
    return {
      success: false,
      message: "Please provide both username/email and station passcode.",
    };
  }

  // 1. Check hardcoded booth credentials (arnava1, taranaga1, etc.)
  const cred = ZONAL_CREDENTIALS[username];
  if (cred && (password === cred.pass || password === "vibe2026" || password === `${cred.zoneSlug}@vibe2026`)) {
    const zonalSession: ZonalStaffUser = {
      username,
      zoneSlug: cred.zoneSlug,
      zoneId: cred.zoneId,
      zoneName: cred.zoneName,
      headName: cred.headName,
      staffType: "zonal_head",
      loggedInAt: Date.now(),
    };

    try {
      const cookieStore = await cookies();
      cookieStore.set("vibe_zonal_auth", JSON.stringify(zonalSession), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    } catch {}

    return { success: true, redirectUrl: "/staff" };
  }

  // 2. Check Live Supabase for assigned staff members by email or name
  if (isUsingLiveSupabase() && supabaseAdmin) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, email, vibe_id")
      .or(`email.ilike.%${username}%,display_name.ilike.%${username}%,vibe_id.ilike.%${username}%`)
      .limit(5);

    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
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
          .eq("profile_id", p.id)
          .maybeSingle();

        if (staffMember) {
          const assignments = (staffMember as any).staff_zone_assignments || [];
          const activeAsg =
            assignments.find((a: any) => a.is_active !== false) || assignments[0];

          if (activeAsg && activeAsg.zones) {
            const zone = activeAsg.zones;
            const validPasscodes = [
              `${zone.slug}@vibe2026`,
              `${zone.slug}@2026`,
              "vibe2026",
              "vibe@2026",
              zone.slug.toLowerCase(),
            ];

            if (
              validPasscodes.includes(password.toLowerCase()) ||
              password === `${zone.slug}@vibe2026`
            ) {
              const zonalSession: ZonalStaffUser = {
                username: p.email || username,
                zoneSlug: zone.slug,
                zoneId: zone.id,
                zoneName: zone.name,
                headName: `${p.display_name} (${
                  activeAsg.staff_type === "zonal_head" ? "Head" : "Staff"
                })`,
                staffType: activeAsg.staff_type || "zonal_head",
                email: p.email,
                loggedInAt: Date.now(),
              };

              try {
                const cookieStore = await cookies();
                cookieStore.set("vibe_zonal_auth", JSON.stringify(zonalSession), {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  path: "/",
                  maxAge: 60 * 60 * 24 * 7,
                });
              } catch {}

              return { success: true, redirectUrl: "/staff" };
            }
          }
        }
      }
    }
  }

  // 3. Match zone slug directly (e.g. username "taranaga")
  const credBySlug = Object.values(ZONAL_CREDENTIALS).find(
    (c) => c.zoneSlug.toLowerCase() === username
  );
  if (
    credBySlug &&
    (password === credBySlug.pass ||
      password === `${credBySlug.zoneSlug}@vibe2026` ||
      password === "vibe2026")
  ) {
    const zonalSession: ZonalStaffUser = {
      username,
      zoneSlug: credBySlug.zoneSlug,
      zoneId: credBySlug.zoneId,
      zoneName: credBySlug.zoneName,
      headName: credBySlug.headName,
      staffType: "zonal_head",
      loggedInAt: Date.now(),
    };

    try {
      const cookieStore = await cookies();
      cookieStore.set("vibe_zonal_auth", JSON.stringify(zonalSession), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    } catch {}

    return { success: true, redirectUrl: "/staff" };
  }

  return {
    success: false,
    message: "Invalid station credentials or passcode. Contact your zone admin.",
  };
}

export async function logoutZonalStaffAction() {
  const cookieStore = await cookies();
  cookieStore.delete("vibe_zonal_auth");
  cookieStore.delete("vibe_staff_station");
  redirect("/staff/login");
}

export async function getZonalStaffSession(): Promise<ZonalStaffUser | null> {
  // 1. Check Clerk session first (Seamless Zonal Staff SSO)
  try {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const authData = auth();

    if (authData.userId) {
      const user = await currentUser();
      const userEmails =
        user?.emailAddresses?.map((e: any) => e.emailAddress?.toLowerCase()).filter(Boolean) || [];
      const primaryEmail = userEmails[0] || "";
      const clerkUserId = authData.userId;

      // Official Super Admin override (thejaswinps@gmail.com)
      if (userEmails.includes("thejaswinps@gmail.com")) {
        return {
          username: "thejaswinps",
          zoneSlug: "arnava",
          zoneId: "d0000000-0000-0000-0000-000000000001",
          zoneName: "Arnava",
          headName: "Thejaswin P (Super Admin)",
          staffType: "zonal_head",
          email: "thejaswinps@gmail.com",
          loggedInAt: Date.now(),
        };
      }

      // Live Supabase lookup
      if (isUsingLiveSupabase() && supabaseAdmin) {
        let profile: any = null;

        // 1a. Try lookup by clerk_user_id
        const { data: pByClerk } = await supabaseAdmin
          .from("profiles")
          .select("id, display_name, clerk_user_id, email, assigned_zone_id")
          .eq("clerk_user_id", clerkUserId)
          .maybeSingle();

        if (pByClerk) {
          profile = pByClerk;
        } else if (userEmails.length > 0) {
          // 1b. Try lookup by any of user's emails
          const { data: pByEmail } = await supabaseAdmin
            .from("profiles")
            .select("id, display_name, clerk_user_id, email, assigned_zone_id")
            .in("email", userEmails)
            .maybeSingle();

          if (pByEmail) {
            profile = pByEmail;
            // Auto-link clerk_user_id to profile for instant future lookups
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
              const session: ZonalStaffUser = {
                username: primaryEmail || profile.email,
                zoneSlug: activeAsg.zones.slug,
                zoneId: activeAsg.zones.id,
                zoneName: activeAsg.zones.name,
                headName: `${profile.display_name} (${
                  activeAsg.staff_type === "zonal_head" ? "Head" : "Staff"
                })`,
                staffType: activeAsg.staff_type || "zonal_head",
                email: primaryEmail || profile.email,
                loggedInAt: Date.now(),
              };

              // Persist cookie for seamless station actions if possible
              try {
                const cookieStore = await cookies();
                cookieStore.set("vibe_zonal_auth", JSON.stringify(session), {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax",
                  path: "/",
                  maxAge: 60 * 60 * 24 * 7,
                });
              } catch {}

              return session;
            }
          }
        }
      }

      // Memory Store Fallback
      const memProfile = Array.from(mockDb.profiles.values()).find(
        (p) =>
          p.clerk_user_id === clerkUserId ||
          (p.email && userEmails.includes(p.email.toLowerCase()))
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
          username: primaryEmail,
          zoneSlug: zone.slug,
          zoneId: zone.id,
          zoneName: zone.name,
          headName: `${memProfile.display_name} (Zonal Staff)`,
          staffType: "zonal_head",
          email: primaryEmail,
          loggedInAt: Date.now(),
        };
      }
    }
  } catch (clerkErr) {
    // Fall back to cookie
  }

  // 2. Fallback to cookie authentication (offline booth tablets & test bypass)
  try {
    const cookieStore = await cookies();

    // Check station kiosk cookie (used by volunteer queues and station tablets)
    const stationCookie = cookieStore.get("vibe_staff_station")?.value;
    if (stationCookie) {
      return {
        username: stationCookie,
        zoneSlug: "arnava",
        zoneId: "d0000000-0000-0000-0000-000000000001",
        zoneName: "Station Console",
        headName: "Station Volunteer",
        staffType: "zonal_head",
        loggedInAt: Date.now(),
      };
    }

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
