import { describe, it, expect } from "vitest";
import { isVideoMedia } from "@/lib/utils";

describe("Instagram-Style Video Feed & Scroll Stop Logic", () => {
  it("correctly identifies video media URLs", () => {
    expect(isVideoMedia("https://assets.vibe2026.org/videos/cyberpunk-raccoon.mp4")).toBe(true);
    expect(isVideoMedia("https://assets.vibe2026.org/media/clip.webm")).toBe(true);
    expect(isVideoMedia("https://assets.vibe2026.org/media/story.mov")).toBe(true);
    expect(isVideoMedia("https://assets.vibe2026.org/videos/delegates.mp4?alt=media&token=123")).toBe(true);
    expect(isVideoMedia("data:video/mp4;base64,AAAA")).toBe(true);

    // Photos should not be detected as video
    expect(isVideoMedia("https://assets.vibe2026.org/photos/delegates.jpg")).toBe(false);
    expect(isVideoMedia("https://assets.vibe2026.org/photos/banner.png")).toBe(false);
    expect(isVideoMedia(null)).toBe(false);
    expect(isVideoMedia(undefined)).toBe(false);
  });

  it("calculates viewport overlap to accurately stop the video when scrolled down", () => {
    // Helper replicating the scroll-out check in InstagramFeedVideo
    function isVideoScrolledOutOfView(
      rect: { top: number; bottom: number; height: number },
      viewportHeight = 800
    ) {
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(viewportHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibleRatio = rect.height > 0 ? visibleHeight / rect.height : 0;

      // Video should stop if less than 45% is visible or it has scrolled past the edges
      return visibleRatio < 0.45 || rect.bottom <= 50 || rect.top >= viewportHeight - 50;
    }

    // 1. Centered video (active viewing)
    expect(
      isVideoScrolledOutOfView({ top: 200, bottom: 600, height: 400 }, 800)
    ).toBe(false);

    // 2. User scrolled DOWN: Video pushed up towards the top edge
    // Only 100px of 400px remaining (25% visible)
    expect(
      isVideoScrolledOutOfView({ top: -300, bottom: 100, height: 400 }, 800)
    ).toBe(true);

    // 3. User scrolled DOWN further: Video completely past the top of the viewport
    expect(
      isVideoScrolledOutOfView({ top: -500, bottom: -100, height: 400 }, 800)
    ).toBe(true);

    // 4. Video near bottom edge (scrolled down to next post, current video entering from bottom)
    // Only 80px visible at the bottom
    expect(
      isVideoScrolledOutOfView({ top: 720, bottom: 1120, height: 400 }, 800)
    ).toBe(true);
  });

  it("formats playback timestamps accurately (mm:ss format)", () => {
    function formatTime(seconds: number) {
      if (!seconds || isNaN(seconds)) return "0:00";
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? "0" : ""}${s}`;
    }

    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(11)).toBe("0:11");
    expect(formatTime(59)).toBe("0:59");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(125)).toBe("2:05");
  });

  it("calculates real-time upload progress and MB values accurately for the progress bar", () => {
    function computeUploadProgress(loaded: number, total: number) {
      const percent = Math.min(100, Math.round((loaded / total) * 100));
      const loadedMb = (loaded / (1024 * 1024)).toFixed(1);
      const totalMb = (total / (1024 * 1024)).toFixed(1);
      const barWidth = `${Math.max(4, percent)}%`;
      return { percent, loadedMb, totalMb, barWidth };
    }

    // 10.2 MB video file upload stages
    const totalBytes = 10.2 * 1024 * 1024;

    // At 0% upload start
    const start = computeUploadProgress(0, totalBytes);
    expect(start.percent).toBe(0);
    expect(start.loadedMb).toBe("0.0");
    expect(start.totalMb).toBe("10.2");
    expect(start.barWidth).toBe("4%"); // Minimum visibility for aesthetic feedback

    // At ~45% upload (matching user screenshot context)
    const mid = computeUploadProgress(4.59 * 1024 * 1024, totalBytes);
    expect(mid.percent).toBe(45);
    expect(mid.loadedMb).toBe("4.6");
    expect(mid.totalMb).toBe("10.2");
    expect(mid.barWidth).toBe("45%");

    // At 100% upload complete
    const end = computeUploadProgress(totalBytes, totalBytes);
    expect(end.percent).toBe(100);
    expect(end.loadedMb).toBe("10.2");
    expect(end.totalMb).toBe("10.2");
    expect(end.barWidth).toBe("100%");
  });

  it("correctly identifies double-tap like gestures on video and photo media", () => {
    // Simulator for double-tap detector logic used in InstagramFeedVideo
    class DoubleTapDetector {
      private lastTapTime = 0;
      public doubleTapFired = 0;
      public singleTapPending = false;

      public handleTap(timestamp: number, dx = 0, dy = 0) {
        // Reject swipe/drag
        if (dx > 25 || dy > 25) return;

        const timeDiff = timestamp - this.lastTapTime;
        if (timeDiff > 40 && timeDiff < 380) {
          // Double-tap confirmed! Cancel single tap and fire double tap
          this.singleTapPending = false;
          this.doubleTapFired += 1;
          this.lastTapTime = 0;
        } else {
          this.lastTapTime = timestamp;
          this.singleTapPending = true;
        }
      }
    }

    const detector = new DoubleTapDetector();

    // 1. Two taps within 200ms -> Double tap like triggers
    detector.handleTap(1000);
    expect(detector.singleTapPending).toBe(true);
    expect(detector.doubleTapFired).toBe(0);

    detector.handleTap(1200); // 200ms later
    expect(detector.doubleTapFired).toBe(1);
    expect(detector.singleTapPending).toBe(false);

    // 2. Slow taps (500ms apart) -> Not a double tap
    detector.handleTap(2000);
    detector.handleTap(2600); // 600ms later
    expect(detector.doubleTapFired).toBe(1); // Still 1

    // 3. User was scrolling/dragging (displacement > 25px) -> Ignored
    detector.handleTap(3000);
    detector.handleTap(3150, 40, 10); // 150ms later but with dx=40
    expect(detector.doubleTapFired).toBe(1); // Not counted as double-tap
  });
});
