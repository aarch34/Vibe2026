import { describe, it, expect } from "vitest";
import {
  createPresignedUploadUrl,
  getMediaPublicUrl,
  STORAGE_BUCKET,
} from "@/lib/storage/storage-client";

describe("VIBE Media Storage — Supabase Bucket Integration", () => {
  it("should target Vibe Bucket by default", () => {
    expect(STORAGE_BUCKET).toBe("Vibe Bucket");
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

  it("should generate public URL correctly according to environment", () => {
    const testKey = "events/vibe-2026/sponsors/redbull.png";
    const publicUrl = getMediaPublicUrl(testKey);

    // In local unit test without live env keys, returns mock /uploads/ URL
    // In live mode with NEXT_PUBLIC_SUPABASE_URL, returns Supabase storage URL
    expect(publicUrl).toContain("redbull.png");
    expect(
      publicUrl.includes("Vibe%20Bucket") || publicUrl.startsWith("/uploads/")
    ).toBe(true);
  });
});
