import { describe, it, expect } from "vitest";
import {
  createPresignedUploadUrl,
  getMediaPublicUrl,
  STORAGE_BUCKET,
} from "@/lib/storage/storage-client";

describe("VIBE Media Storage — Cloudflare R2 Integration", () => {
  it("should target vibe2026-media R2 bucket by default", () => {
    expect(STORAGE_BUCKET).toBe("vibe2026-media");
  });

  it("should generate proper object key hierarchy", async () => {
    const result = await createPresignedUploadUrl(
      "vibe-2026",
      "avatars",
      "profile.png",
      "image/png"
    );

    expect(result.objectKey).toMatch(/^events\/vibe-2026\/avatars\/\d+-[a-z0-9]+\.png$/);
    expect(result.uploadUrl).toBeDefined();
    expect(result.publicUrl).toBeDefined();
  });

  it("should generate public URL correctly using Cloudflare R2 public dev URL", () => {
    const testKey = "events/vibe-2026/sponsors/redbull.png";
    const publicUrl = getMediaPublicUrl(testKey);

    expect(publicUrl).toContain("redbull.png");
    expect(
      publicUrl.includes("r2.dev") || publicUrl.startsWith("/uploads/")
    ).toBe(true);
  });
});
