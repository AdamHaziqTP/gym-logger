import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * M06-T01 static PWA contract: the manifest, icons, HTML head wiring, and
 * service-worker source must exist in public/ and agree with each other.
 * These are file-level checks (no network, no build) so they stay fast and
 * deterministic; runtime SW behavior is covered by serviceWorkerRuntime.test.ts
 * and the stamped dist output by the HTTPS smoke.
 */

const PUBLIC = resolve(process.cwd(), "public");

function readPublic(...segments: string[]): string {
  return readFileSync(resolve(PUBLIC, ...segments), "utf8");
}

interface ManifestIcon {
  src?: unknown;
  sizes?: unknown;
  type?: unknown;
  purpose?: unknown;
}

function pngDimensions(buffer: Buffer): { width: number; height: number } {
  // PNG signature (8 bytes) + IHDR length/type (8 bytes) → dims at offset 16.
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

describe("Web App Manifest (M06-T01)", () => {
  const raw = readPublic("manifest.webmanifest");
  const manifest = JSON.parse(raw) as Record<string, unknown>;

  it("exists with stable identity, name, and standalone display", () => {
    expect(manifest.name).toBe("Gym Log");
    expect(manifest.short_name).toBe("Gym Log");
    expect(manifest.id).toBe("/");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
  });

  it("is dark-compatible: theme and background match the app shell black", () => {
    expect(manifest.background_color).toBe("#000000");
    expect(manifest.theme_color).toBe("#000000");
  });

  it("references local PNG icons that exist at the declared sizes", () => {
    const icons = manifest.icons as ManifestIcon[];
    expect(Array.isArray(icons)).toBe(true);
    expect(icons.length).toBeGreaterThanOrEqual(2);

    const declaredSizes = new Set<string>();
    for (const icon of icons) {
      expect(typeof icon.src).toBe("string");
      expect(icon.type).toBe("image/png");
      expect(String(icon.src).startsWith("/")).toBe(true);

      const path = resolve(PUBLIC, String(icon.src).replace(/^\//, ""));
      expect(existsSync(path)).toBe(true);

      const buffer = readFileSync(path);
      expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(buffer.subarray(12, 16).toString("ascii")).toBe("IHDR");
      const { width, height } = pngDimensions(buffer);
      expect(`${width}x${height}`).toBe(icon.sizes);

      const purpose = String(icon.purpose ?? "any");
      for (const token of purpose.split(" ")) {
        expect(["any", "maskable"]).toContain(token);
      }
      if (purpose.includes("any")) declaredSizes.add(icon.sizes as string);
    }

    // Usable Home Screen icon range per the task requirements.
    expect(declaredSizes.has("192x192")).toBe(true);
    expect(declaredSizes.has("512x512")).toBe(true);
  });
});

describe("index.html PWA wiring (M06-T01)", () => {
  const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

  it("links the manifest, icons, and keeps the dark theme-color", () => {
    expect(html).toMatch(/<link\s+rel="manifest"\s+href="\/manifest\.webmanifest"/);
    expect(html).toMatch(/rel="apple-touch-icon"\s+href="\/apple-touch-icon\.png"/);
    expect(html).toMatch(/rel="icon"[^>]*href="\/icons\/icon-192\.png"/);
    expect(html).toMatch(/name="theme-color"\s+content="#000000"/);
  });

  it("declares standalone web-app metadata for iOS", () => {
    expect(html).toMatch(/name="mobile-web-app-capable"\s+content="yes"/);
    expect(html).toMatch(/name="apple-mobile-web-app-capable"\s+content="yes"/);
    expect(html).toMatch(/name="apple-mobile-web-app-title"\s+content="Gym Log"/);
  });

  it("loads no remote assets", () => {
    expect(html).not.toMatch(/https?:\/\//);
  });
});

describe("Service worker source contract (M06-T01)", () => {
  const sw = readPublic("sw.js");

  it("wires install, activate, and fetch listeners", () => {
    expect(sw).toContain('addEventListener("install"');
    expect(sw).toContain('addEventListener("activate"');
    expect(sw).toContain('addEventListener("fetch"');
  });

  it("uses a versioned gym-logger cache with build-stamp markers", () => {
    expect(sw).toContain('var CACHE_PREFIX = "gym-logger-"');
    expect(sw).toContain("var GYM_LOGGER_CACHE_REVISION");
    expect(sw).toContain("var GYM_LOGGER_PRECACHE_ASSETS");
    expect(sw).toContain("/* === gym-logger-sw-stamp === */");
    expect(sw).toContain("/* === end gym-logger-sw-stamp === */");
  });

  it("provides an offline navigation fallback for the shell", () => {
    expect(sw).toContain('var GYM_LOGGER_SHELL_URL = "/"');
    expect(sw).toMatch(/caches\s*\n?\s*\.match\(GYM_LOGGER_SHELL_URL,\s*\{\s*ignoreSearch:\s*true\s*\}/);
    expect(sw).toContain('"Offline"');
  });

  it("stays non-blocking: skipWaiting on install, claim on activate", () => {
    expect(sw).toContain("skipWaiting()");
    expect(sw).toContain("clients.claim()");
    // Never force a reload on update — editing must never be interrupted.
    expect(sw).not.toMatch(/clients\.claim\(\)[\s\S]*location\.reload/);
    expect(sw).not.toContain("location.reload");
  });

  it("only ever handles same-origin GET requests — no API/cloud caching", () => {
    expect(sw).toContain('request.method !== "GET"');
    expect(sw).toContain("url.origin !== self.location.origin");
    // No remote endpoints are hardcoded anywhere in the worker.
    expect(sw).not.toMatch(/https?:\/\//);
    // The worker never caches itself.
    expect(sw).toContain('url.pathname === "/sw.js"');
  });
});

describe("icon generator (M06-T01)", () => {
  it("exists so the committed PNGs stay reproducible without dependencies", () => {
    expect(
      existsSync(resolve(process.cwd(), "scripts", "generate-icons.mjs")),
    ).toBe(true);
    const source = readFileSync(
      resolve(process.cwd(), "scripts", "generate-icons.mjs"),
      "utf8",
    );
    // Dependency-free: only Node built-ins may be imported.
    const imports = Array.from(source.matchAll(/from "([^"]+)"/g), (m) => m[1]);
    expect(imports.length).toBeGreaterThan(0);
    for (const specifier of imports) {
      expect(specifier.startsWith("node:")).toBe(true);
    }
  });
});
