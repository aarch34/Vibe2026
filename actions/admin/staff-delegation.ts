"use server";

import { z } from "zod";
import { getAdminSession } from "@/actions/admin/auth";
import { mockDb, isUsingLiveSupabase, supabaseAdmin } from "@/lib/db/supabase";
import { ZonalStaffType } from "@/types/database";
import { ZONAL_CREDENTIALS } from "@/lib/staff/zonal-config";

const EVENT_ID = "a0000000-0000-0000-0000-000000000001";

export interface AssignedStaffRecord {
  assignmentId: string;
  staffMemberId: string;
  profileId: string;
  displayName: string;
  vibeId: string;
  college: string | null;
  email?: string | null;
  phone?: string | null;
  zoneId: string;
  zoneName: string;
  zoneSlug: string;
  staffType: ZonalStaffType;
  customPasscode?: string | null;
  isActive: boolean;
  assignedAt: string;
}

export interface ZoneStaffMatrix {
  zoneId: string;
  zoneName: string;
  zoneSlug: string;
  heads: AssignedStaffRecord[];
  staff: AssignedStaffRecord[];
}

// 1. Get Zonal Staff Matrix
export async function adminGetZonalStaffAssignmentsAction(): Promise<{
  success: boolean;
  matrix?: ZoneStaffMatrix[];
  message?: string;
}> {
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, message: "Unauthorized. District Admin login required." };
  }

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      // Fetch zones
      const { data: zones } = await supabaseAdmin
        .from("zones")
        .select("id, name, slug, sort_order")
        .eq("event_id", EVENT_ID)
        .order("sort_order", { ascending: true });

      // Fetch staff assignments
      const { data: assignments, error: aErr } = await supabaseAdmin
        .from("staff_zone_assignments")
        .select(`
          id,
          zone_id,
          staff_member_id,
          staff_type,
          custom_passcode,
          is_active,
          updated_at,
          staff_members (
            id,
            profile_id,
            role,
            profiles (
              id,
              display_name,
              vibe_id,
              college,
              email,
              phone
            )
          )
        `);

      const zoneMap: Record<string, ZoneStaffMatrix> = {};
      (zones || []).forEach((z: any) => {
        zoneMap[z.id] = {
          zoneId: z.id,
          zoneName: z.name,
          zoneSlug: z.slug,
          heads: [],
          staff: [],
        };
      });

      (assignments || []).forEach((row: any) => {
        const sm = row.staff_members;
        const p = sm?.profiles;
        if (!p || !zoneMap[row.zone_id]) return;

        const resolvedStaffType: ZonalStaffType =
          row.staff_type === "zonal_staff" ? "zonal_staff" : "zonal_head";

        const record: AssignedStaffRecord = {
          assignmentId: row.id,
          staffMemberId: sm.id,
          profileId: p.id,
          displayName: p.display_name || "Staff Member",
          vibeId: p.vibe_id || "VIBE-0000",
          college: p.college,
          email: p.email,
          phone: p.phone,
          zoneId: row.zone_id,
          zoneName: zoneMap[row.zone_id].zoneName,
          zoneSlug: zoneMap[row.zone_id].zoneSlug,
          staffType: resolvedStaffType,
          customPasscode: row.custom_passcode,
          isActive: row.is_active !== false,
          assignedAt: row.updated_at || new Date().toISOString(),
        };

        if (resolvedStaffType === "zonal_head") {
          zoneMap[row.zone_id].heads.push(record);
        } else {
          zoneMap[row.zone_id].staff.push(record);
        }
      });

      return { success: true, matrix: Object.values(zoneMap) };
    }

    // Memory Store Fallback
    const zoneKeys = ["z-arnava", "z-taranaga", "z-sagara", "z-pravaha", "z-samudhra", "z-varuna"];
    const matrix: ZoneStaffMatrix[] = zoneKeys.map((zid) => {
      const z = mockDb.zones.get(zid) || { id: zid, name: zid.replace("z-", "").toUpperCase(), slug: zid.replace("z-", "") };
      return {
        zoneId: z.id,
        zoneName: z.name,
        zoneSlug: z.slug,
        heads: [],
        staff: [],
      };
    });

    return { success: true, matrix };
  } catch (err: any) {
    console.error("adminGetZonalStaffAssignmentsAction error:", err);
    return { success: false, message: err.message || "Failed to load staff assignments" };
  }
}

// 2. Search Attendees for Delegation
export async function adminSearchAttendeesAction(query: string) {
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, results: [], message: "Unauthorized." };
  }

  const clean = query.trim().toLowerCase();
  if (!clean) return { success: true, results: [] };

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, vibe_id, college, email, phone, assigned_zone_id")
        .or(`display_name.ilike.%${clean}%,vibe_id.ilike.%${clean}%,college.ilike.%${clean}%`)
        .limit(10);

      if (error) throw error;

      return {
        success: true,
        results: (data || []).map((p: any) => ({
          id: p.id,
          displayName: p.display_name,
          vibeId: p.vibe_id,
          college: p.college,
          email: p.email,
          phone: p.phone,
          assignedZoneId: p.assigned_zone_id,
        })),
      };
    }

    // Memory fallback
    const profiles = Array.from(mockDb.profiles.values()).filter(
      (p) =>
        p.display_name.toLowerCase().includes(clean) ||
        p.vibe_id.toLowerCase().includes(clean) ||
        (p.college && p.college.toLowerCase().includes(clean))
    );

    return {
      success: true,
      results: profiles.slice(0, 10).map((p) => ({
        id: p.id,
        displayName: p.display_name,
        vibeId: p.vibe_id,
        college: p.college,
        email: p.email,
        phone: p.phone,
        assignedZoneId: p.assigned_zone_id,
      })),
    };
  } catch (err: any) {
    return { success: false, results: [], message: err.message };
  }
}

// 3. Create and Assign Staff Directly by Email
const createAndAssignSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  email: z.string().email("Valid email address is required for Clerk authentication"),
  phone: z.string().optional(),
  college: z.string().optional(),
  club: z.string().optional(),
  zoneId: z.string().min(1, "Zone is required"),
  staffType: z.enum(["zonal_head", "zonal_staff"]),
  passcode: z.string().optional(),
});

export async function adminCreateAndAssignZonalStaffAction(
  rawInput: z.infer<typeof createAndAssignSchema>
) {
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, message: "Unauthorized. District Admin login required." };
  }

  const parsed = createAndAssignSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  const { fullName, email, phone, college, club, zoneId, staffType, passcode } = parsed.data;
  const cleanEmail = email.trim().toLowerCase();

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      // 1. Get Zone info
      const { data: zone, error: zErr } = await supabaseAdmin
        .from("zones")
        .select("id, name, slug")
        .eq("id", zoneId)
        .single();

      if (zErr || !zone) {
        return { success: false, message: "Specified Oceanic Zone not found." };
      }

      // 2. Look up or create profile
      let profile: any = null;
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, vibe_id, display_name, email")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        const { data: updated, error: uErr } = await supabaseAdmin
          .from("profiles")
          .update({
            display_name: fullName.trim(),
            phone: phone?.trim() || null,
            college: college?.trim() || club?.trim() || "Rotaract District 3192",
            club: club?.trim() || "Rotaract Member",
            assigned_zone_id: zone.id,
          })
          .eq("id", existingProfile.id)
          .select()
          .single();

        if (uErr) throw uErr;
        profile = updated;
      } else {
        const vibeId = `VIBE-${Math.floor(1000 + Math.random() * 9000)}`;
        const { data: created, error: cErr } = await supabaseAdmin
          .from("profiles")
          .insert({
            email: cleanEmail,
            display_name: fullName.trim(),
            phone: phone?.trim() || null,
            college: college?.trim() || club?.trim() || "Rotaract District 3192",
            club: club?.trim() || "Rotaract Member",
            vibe_id: vibeId,
            assigned_zone_id: zone.id,
          })
          .select()
          .single();

        if (cErr) throw cErr;
        profile = created;
      }

      // 3. Upsert event_members
      await supabaseAdmin.from("event_members").upsert(
        {
          event_id: EVENT_ID,
          profile_id: profile.id,
          role: "staff",
          status: "active",
        },
        { onConflict: "event_id,profile_id" }
      );

      // 4. Upsert staff_members
      const { data: sm, error: smErr } = await supabaseAdmin
        .from("staff_members")
        .upsert(
          {
            event_id: EVENT_ID,
            profile_id: profile.id,
            role: "staff",
          },
          { onConflict: "event_id,profile_id" }
        )
        .select()
        .single();

      if (smErr || !sm) throw new Error(smErr?.message || "Failed to create staff member record");

      // 5. Upsert staff_zone_assignments
      const cleanPass = passcode?.trim() || `${zone.slug}@vibe2026`;
      const { data: sza, error: szaErr } = await supabaseAdmin
        .from("staff_zone_assignments")
        .upsert(
          {
            staff_member_id: sm.id,
            zone_id: zone.id,
            staff_type: staffType,
            custom_passcode: cleanPass,
            is_active: true,
          },
          { onConflict: "staff_member_id,zone_id" }
        )
        .select()
        .single();

      if (szaErr) throw new Error(szaErr.message);

      // 6. Update ZONAL_CREDENTIALS cache for kiosk
      const username = cleanEmail;
      ZONAL_CREDENTIALS[username] = {
        pass: cleanPass,
        zoneSlug: zone.slug,
        zoneId: zone.id,
        zoneName: zone.name,
        headName: `${fullName} (${staffType === "zonal_head" ? "Head" : "Staff"})`,
      };

      // 7. Audit Log
      await supabaseAdmin.from("audit_logs").insert({
        event_id: EVENT_ID,
        actor_profile_id: null,
        action: "ADMIN_STAFF_CREATED_AND_ASSIGNED",
        entity_type: "staff_zone_assignment",
        entity_id: sm.id,
        after_data: {
          adminUsername: admin.username,
          fullName,
          email: cleanEmail,
          phone,
          college,
          zoneId: zone.id,
          zoneName: zone.name,
          staffType,
        },
      });

      const newRecord: AssignedStaffRecord = {
        assignmentId: sza?.id || `asg-${Date.now()}`,
        staffMemberId: sm.id,
        profileId: profile.id,
        displayName: profile.display_name,
        vibeId: profile.vibe_id,
        college: profile.college,
        email: cleanEmail,
        phone: profile.phone,
        zoneId: zone.id,
        zoneName: zone.name,
        zoneSlug: zone.slug,
        staffType,
        customPasscode: cleanPass,
        isActive: true,
        assignedAt: new Date().toISOString(),
      };

      return {
        success: true,
        message: `Successfully authorized ${fullName} (${cleanEmail}) as ${
          staffType === "zonal_head" ? "Zonal Head" : "Zonal Staff"
        } for ${zone.name}!`,
        record: newRecord,
      };
    }

    // Mock store fallback
    const zoneKeys = ["z-arnava", "z-taranaga", "z-sagara", "z-pravaha", "z-samudhra", "z-varuna"];
    const resolvedZoneId = zoneKeys.includes(zoneId) ? zoneId : "z-arnava";
    const zone = mockDb.zones.get(resolvedZoneId) || {
      id: resolvedZoneId,
      name: resolvedZoneId.replace("z-", "").toUpperCase(),
      slug: resolvedZoneId.replace("z-", ""),
    };

    const mockProfile = mockDb.createAttendeeProfile(
      `usr-staff-${Date.now()}`,
      fullName.trim(),
      `VIBE-${Math.floor(1000 + Math.random() * 9000)}`,
      college || "Rotaract District 3192",
      club || "Rotaract Member",
      0
    );
    mockProfile.email = cleanEmail;
    mockProfile.phone = phone || null;
    mockProfile.assigned_zone_id = zone.id;

    const newRecord: AssignedStaffRecord = {
      assignmentId: `asg-${Date.now()}`,
      staffMemberId: `sm-${mockProfile.id}`,
      profileId: mockProfile.id,
      displayName: mockProfile.display_name,
      vibeId: mockProfile.vibe_id,
      college: mockProfile.college,
      email: cleanEmail,
      phone: mockProfile.phone,
      zoneId: zone.id,
      zoneName: zone.name,
      zoneSlug: zone.slug,
      staffType,
      isActive: true,
      assignedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: `Staff member authorized for Zone ${zone.name}.`,
      record: newRecord,
    };
  } catch (err: any) {
    console.error("adminCreateAndAssignZonalStaffAction error:", err);
    return { success: false, message: err.message || "Failed to create and assign staff member" };
  }
}

// 4. Assign Existing Attendee to Zone
const assignSchema = z.object({
  targetProfileId: z.string().min(1, "Target profile is required"),
  zoneId: z.string().min(1, "Zone is required"),
  staffType: z.enum(["zonal_head", "zonal_staff"]),
  passcode: z.string().optional(),
});

export async function adminAssignZonalStaffAction(rawInput: z.infer<typeof assignSchema>) {
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, message: "Unauthorized. District Admin login required." };
  }

  const parsed = assignSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  const { targetProfileId, zoneId, staffType, passcode } = parsed.data;

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      // 1. Get Target Profile & Zone info
      const [pRes, zRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, display_name, vibe_id").eq("id", targetProfileId).single(),
        supabaseAdmin.from("zones").select("id, name, slug").eq("id", zoneId).single(),
      ]);

      if (pRes.error || !pRes.data) return { success: false, message: "Target profile not found" };
      if (zRes.error || !zRes.data) return { success: false, message: "Specified zone not found" };

      const profile = pRes.data;
      const zone = zRes.data;

      // 2. Upsert staff_members
      const { data: sm, error: smErr } = await supabaseAdmin
        .from("staff_members")
        .upsert(
          {
            event_id: EVENT_ID,
            profile_id: targetProfileId,
            role: "staff",
          },
          { onConflict: "event_id,profile_id" }
        )
        .select()
        .single();

      if (smErr || !sm) throw new Error(smErr?.message || "Failed to create staff member record");

      // 3. Upsert staff_zone_assignments
      const cleanPass = passcode?.trim() || `${zone.slug}@vibe2026`;
      const { error: szaErr } = await supabaseAdmin
        .from("staff_zone_assignments")
        .upsert(
          {
            staff_member_id: sm.id,
            zone_id: zoneId,
          },
          { onConflict: "staff_member_id,zone_id" }
        );

      if (szaErr) throw new Error(szaErr.message);

      // 4. Update ZONAL_CREDENTIALS in-memory cache for instant kiosk login
      const username = `${zone.slug}_${(profile.vibe_id || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      ZONAL_CREDENTIALS[username] = {
        pass: cleanPass,
        zoneSlug: zone.slug,
        zoneId: zone.id,
        zoneName: zone.name,
        headName: `${profile.display_name} (${staffType === "zonal_head" ? "Head" : "Staff"})`,
      };

      // 5. Audit Log
      await supabaseAdmin.from("audit_logs").insert({
        event_id: EVENT_ID,
        actor_profile_id: null,
        action: "ADMIN_STAFF_ASSIGNED",
        entity_type: "staff_zone_assignment",
        entity_id: sm.id,
        after_data: {
          adminUsername: admin.username,
          targetProfileId,
          targetName: profile.display_name,
          targetVibeId: profile.vibe_id,
          zoneId: zone.id,
          zoneName: zone.name,
          staffType,
          stationUsername: username,
        },
      });

      return {
        success: true,
        message: `Successfully authorized ${profile.display_name} as ${staffType === "zonal_head" ? "Zonal Head" : "Zonal Staff"} for ${zone.name}!`,
        stationUsername: username,
        passcode: cleanPass,
      };
    }

    // Memory fallback
    return {
      success: true,
      message: `Staff member authorized for Zone ${zoneId}.`,
    };
  } catch (err: any) {
    console.error("adminAssignZonalStaffAction error:", err);
    return { success: false, message: err.message || "Failed to assign staff" };
  }
}

// 4. Revoke Staff Assignment
export async function adminRevokeZonalStaffAction(assignmentId: string) {
  const admin = await getAdminSession();
  if (!admin) {
    return { success: false, message: "Unauthorized. District Admin login required." };
  }

  try {
    if (isUsingLiveSupabase() && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from("staff_zone_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      await supabaseAdmin.from("audit_logs").insert({
        event_id: EVENT_ID,
        actor_profile_id: null,
        action: "ADMIN_STAFF_REVOKED",
        entity_type: "staff_zone_assignment",
        entity_id: assignmentId,
        after_data: {
          adminUsername: admin.username,
          assignmentId,
          timestamp: new Date().toISOString(),
        },
      });

      return { success: true, message: "Staff assignment revoked successfully." };
    }

    return { success: true, message: "Staff assignment revoked." };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to revoke staff" };
  }
}
