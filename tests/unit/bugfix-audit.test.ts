import { describe, it, expect, beforeEach } from "vitest";
import { verifyQRScan } from "@/lib/qr/qr-service";
import { mockDb } from "@/lib/db/mock-store";

describe("🐛 Bug Fix Audit Suite", () => {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  const profileId = "p-test-01";

  beforeEach(() => {
    mockDb.completions = [];
  });

  describe("Bug 4: Zonal Cheering & Checkpoint QR Recognition", () => {
    it("should recognize vibe-activity-taranaga as a zone_cheer QR code", async () => {
      const res = await verifyQRScan("vibe-activity-taranaga", eventId, profileId);
      expect(res.valid).toBe(true);
      expect(res.type).toBe("zone_cheer");
      expect(res.zoneCheer).toBeDefined();
      expect(res.zoneCheer?.zoneName).toBe("Taranaga");
      expect(res.zoneCheer?.zoneSlug).toBe("taranaga");
    });

    it("should recognize vibe-activity-arnava as a zone_cheer QR code", async () => {
      const res = await verifyQRScan("vibe-activity-arnava", eventId, profileId);
      expect(res.valid).toBe(true);
      expect(res.type).toBe("zone_cheer");
      expect(res.zoneCheer?.zoneName).toBe("Arnava");
    });

    it("should recognize vibe-zone-taranaga-xp as a checkpoint QR code", async () => {
      const res = await verifyQRScan("vibe-zone-taranaga-xp", eventId, profileId);
      expect(res.valid).toBe(true);
      expect(res.type).toBe("checkpoint");
      expect(res.xpReward).toBeGreaterThanOrEqual(75);
    });

    it("should recognize vibe-zone-arnava-xp as a checkpoint QR code", async () => {
      const res = await verifyQRScan("vibe-zone-arnava-xp", eventId, profileId);
      expect(res.valid).toBe(true);
      expect(res.type).toBe("checkpoint");
      expect(res.xpReward).toBeGreaterThanOrEqual(75);
    });

    it("should handle URL encoded query string QR codes", async () => {
      const res = await verifyQRScan("https://vibe2026.app/app/scan?code=vibe-activity-sagara", eventId, profileId);
      expect(res.valid).toBe(true);
      expect(res.type).toBe("zone_cheer");
      expect(res.zoneCheer?.zoneName).toBe("Sagara");
    });
  });

  describe("Bug 6: Attendee Zone Self-Selection", () => {
    it("creates newly registered attendee profiles without forced assignment", () => {
      const freshProfile = mockDb.createAttendeeProfile(
        "usr-new-attendee-99",
        "Kiran Kumar",
        "VIBE-9999",
        "BMS College of Engineering",
        "Rotaract Club of BMS"
      );
      expect(freshProfile.assigned_zone_id).toBeNull();
    });

    it("allows attendee to self-select their zone freely", () => {
      const attendee = mockDb.createAttendeeProfile(
        "usr-self-select-1",
        "Maya Nair",
        "VIBE-4421",
        "RVCE",
        "Rotaract RVCE"
      );

      // Select Varuna
      attendee.assigned_zone_id = "d0000000-0000-0000-0000-000000000006";
      mockDb.profiles.set(attendee.id, attendee);
      expect(mockDb.profiles.get(attendee.id)?.assigned_zone_id).toBe("d0000000-0000-0000-0000-000000000006");

      // Switch to Taranaga
      attendee.assigned_zone_id = "d0000000-0000-0000-0000-000000000002";
      mockDb.profiles.set(attendee.id, attendee);
      expect(mockDb.profiles.get(attendee.id)?.assigned_zone_id).toBe("d0000000-0000-0000-0000-000000000002");
    });
  });
});

