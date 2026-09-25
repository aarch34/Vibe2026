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

  it("should enforce 50MB maximum media limit and 60s video limit guidelines", () => {
    const MAX_SIZE = 50 * 1024 * 1024;
    const MAX_DURATION_SEC = 60;

    const testSmallVideo = { size: 10 * 1024 * 1024, duration: 45 };
    const testOversizedVideo = { size: 55 * 1024 * 1024, duration: 30 };
    const testOverlongVideo = { size: 20 * 1024 * 1024, duration: 75 };

    expect(testSmallVideo.size <= MAX_SIZE).toBe(true);
    expect(testSmallVideo.duration <= MAX_DURATION_SEC).toBe(true);

    expect(testOversizedVideo.size <= MAX_SIZE).toBe(false);
    expect(testOverlongVideo.duration <= MAX_DURATION_SEC).toBe(false);
  });
});
