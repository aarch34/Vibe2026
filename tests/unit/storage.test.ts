import { describe, it, expect } from "vitest";
import {
  createPresignedUploadUrl,
  getMediaPublicUrl,
  STORAGE_BUCKET,
} from "@/lib/storage/storage-client";
import { isVideoMedia } from "@/lib/utils";

describe("VIBE Media Storage — Supabase Storage & Video Support", () => {
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

  it("should generate public URL correctly using Supabase storage or fallback", () => {
    const testKey = "events/vibe-2026/sponsors/redbull.png";
    const publicUrl = getMediaPublicUrl(testKey);

    expect(publicUrl).toContain("redbull.png");
    expect(
      publicUrl.includes("supabase.co") ||
        publicUrl.includes("Vibe%20Bucket") ||
        publicUrl.startsWith("/uploads/")
    ).toBe(true);
  });

  it("should correctly detect video media formats via isVideoMedia", () => {
    expect(isVideoMedia("https://example.com/storage/v1/object/public/Vibe%20Bucket/video.mp4")).toBe(true);
    expect(isVideoMedia("https://example.com/storage/v1/object/public/Vibe%20Bucket/movie.webm")).toBe(true);
    expect(isVideoMedia("https://example.com/storage/v1/object/public/Vibe%20Bucket/clip.mov")).toBe(true);
    expect(isVideoMedia("data:video/mp4;base64,AAAA")).toBe(true);
    expect(isVideoMedia("https://example.com/storage/v1/object/public/Vibe%20Bucket/photo.jpg")).toBe(false);
    expect(isVideoMedia("https://example.com/storage/v1/object/public/Vibe%20Bucket/avatar.png")).toBe(false);
    expect(isVideoMedia(null)).toBe(false);
    expect(isVideoMedia(undefined)).toBe(false);
  });
});
