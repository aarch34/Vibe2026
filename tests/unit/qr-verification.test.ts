import { describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "@/lib/db/mock-store";
import {
  verifyQRScan,
  renderQRCodeSvg,
  renderQRCodeDataUrl,
} from "@/lib/qr/qr-service";

describe("🎯 QR Checkpoint Generation & Scannability Verification", () => {
  const eventId = "a0000000-0000-0000-0000-000000000001";
  const profileId = "prof-usr-demo-1";

  beforeEach(() => {
    mockDb.completions = [];
  });

  describe("1. Real QR Matrix Rendering", () => {
    it("should generate crisp SVG vector representation with valid xml and path elements", async () => {
      const code = "vibe-zone-arnava-xp";
      const svg = await renderQRCodeSvg(code);

      expect(svg).toBeDefined();
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain("viewBox=");
      expect(svg.length).toBeGreaterThan(100);
    });

    it("should generate high-contrast PNG data URL for browser and print rendering", async () => {
      const scanUrl = "https://vibe2026.app/app/scan?code=vibe-vault-cipher-2026";
      const dataUrl = await renderQRCodeDataUrl(scanUrl);

      expect(dataUrl).toBeDefined();
      expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true);
      expect(dataUrl.length).toBeGreaterThan(500);
    });
  });

  describe("2. Deep Link URL vs Raw Token Verification", () => {
    it("should verify when attendee scans raw checkpoint code string", async () => {
      const rawCode = "vibe-zone-arnava-xp";
      const result = await verifyQRScan(rawCode, eventId, profileId);

      expect(result.valid).toBe(true);
      expect(result.code).toBe(rawCode);
      expect(result.experience).toBeDefined();
      expect(result.experience?.title).toBe("Arnava Icebreaker");
      expect(result.canAttempt).toBe(true);
    });

    it("should automatically extract code token when scanned from a full deep link URL", async () => {
      const deepLink =
        "https://vibe2026.app/app/scan?code=vibe-zone-arnava-xp";
      const result = await verifyQRScan(deepLink, eventId, profileId);

      expect(result.valid).toBe(true);
      expect(result.code).toBe("vibe-zone-arnava-xp");
      expect(result.experience).toBeDefined();
      expect(result.experience?.title).toBe("Arnava Icebreaker");
    });

    it("should handle localhost URLs scanned in development environment", async () => {
      const localUrl =
        "http://localhost:3000/app/scan?code=vibe-stage-challenge-2026";
      const result = await verifyQRScan(localUrl, eventId, profileId);

      expect(result.valid).toBe(true);
      expect(result.code).toBe("vibe-stage-challenge-2026");
      expect(result.experience).toBeDefined();
    });

    it("should reject non-existent or invalid QR tokens gracefully", async () => {
      const fakeCode = "invalid-nonexistent-token";
      const result = await verifyQRScan(fakeCode, eventId, profileId);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBe("INVALID_QR");
    });
  });

  describe("3. Active Checkpoints Coverage", () => {
    it("should ensure all registered QR codes map to active experiences and zones", () => {
      const qrs = Array.from(mockDb.qrCodes.values());
      expect(qrs.length).toBeGreaterThan(0);

      for (const qr of qrs) {
        expect(qr.code).toBeTruthy();
        const exp = mockDb.experiences.get(qr.experience_id);
        expect(exp).toBeDefined();
        if (exp) {
          const zone = mockDb.zones.get(exp.zone_id);
          expect(zone).toBeDefined();
        }
      }
    });
  });
});
