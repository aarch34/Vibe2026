import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("VIBE 2026 Branding & Favicon Assets", () => {
  const publicDir = path.resolve(process.cwd(), "public");

  it("should have all required favicon and web app icon files generated", () => {
    const requiredFiles = [
      "favicon.ico",
      "favicon-96x96.png",
      "apple-touch-icon.png",
      "icon-192.png",
      "icon-512.png",
      "web-app-manifest-192x192.png",
      "web-app-manifest-512x512.png",
      "images/vibe-logo.png",
      "images/vibe-og.jpg",
      "site.webmanifest",
      "manifest.json",
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(publicDir, relPath);
      expect(fs.existsSync(fullPath), `Expected ${relPath} to exist`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size, `Expected ${relPath} to have non-zero size`).toBeGreaterThan(100);
    }
  });

  it("should have valid PWA manifests configured", () => {
    const manifestRaw = fs.readFileSync(path.join(publicDir, "site.webmanifest"), "utf-8");
    const manifest = JSON.parse(manifestRaw);

    expect(manifest.name).toContain("VIBE 2026");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    expect(manifest.icons.some((i: any) => i.src === "/web-app-manifest-192x192.png")).toBe(true);
    expect(manifest.icons.some((i: any) => i.src === "/web-app-manifest-512x512.png")).toBe(true);
  });
});
