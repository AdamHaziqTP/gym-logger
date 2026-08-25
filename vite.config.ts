/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

const certDir = path.resolve(process.cwd(), "certs");
const pfxPath = path.join(certDir, "gym-logger-dev.pfx");
const passwordPath = path.join(certDir, "gym-logger-dev.password");
const hasLocalHttps = fs.existsSync(pfxPath) && fs.existsSync(passwordPath);
const httpsOptions = hasLocalHttps
  ? {
      pfx: fs.readFileSync(pfxPath),
      passphrase: fs.readFileSync(passwordPath, "utf8").trim(),
    }
  : undefined;

/** FNV-1a over a buffer/string → 8 hex chars. Deterministic content stamp. */
function fnv1aHex(input: string | Buffer): string {
  let hash = 0x811c9dc5;
  const bytes = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function collectDistAssetUrls(distDir: string): string[] {
  const urls: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      const url = `/${path.relative(distDir, fullPath).split(path.sep).join("/")}`;
      // The service worker itself and sourcemaps are never precached.
      if (url === "/sw.js" || url.endsWith(".map")) continue;
      urls.push(url);
    }
  };
  walk(distDir);
  urls.sort();
  return urls;
}

/**
 * M06-T01: after a production build, rewrite dist/sw.js so its cache revision
 * is derived from the built output and its install step precaches exactly the
 * assets that were emitted (shell, hashed JS/CSS, manifest, icons, other local
 * static files). Keeps public/sw.js dependency-free while guaranteeing the
 * versioned cache matches each build.
 */
function gymLoggerServiceWorkerStamp(): Plugin {
  return {
    name: "gym-logger-sw-stamp",
    apply: "build",
    closeBundle() {
      const distDir = path.resolve(process.cwd(), "dist");
      const swPath = path.join(distDir, "sw.js");
      const source = fs.readFileSync(swPath, "utf8");

      const beginMarker = "/* === gym-logger-sw-stamp === */";
      const endMarker = "/* === end gym-logger-sw-stamp === */";
      const beginIndex = source.indexOf(beginMarker);
      const endIndex = source.indexOf(endMarker);
      if (beginIndex < 0 || endIndex < 0 || endIndex < beginIndex) {
        throw new Error(
          "gym-logger-sw-stamp: markers missing from public/sw.js",
        );
      }

      const assetUrls = collectDistAssetUrls(distDir);
      // Ensure both shell spellings are precached ("/" is what navigations
      // fall back to; "/index.html" covers direct hits).
      for (const shell of ["/", "/index.html"]) {
        if (!assetUrls.includes(shell)) assetUrls.unshift(shell);
      }

      const revisionSource = assetUrls
        .map(
          (url) =>
            `${url}:${fs.statSync(path.join(distDir, url.slice(1))).size}`,
        )
        .join("|");
      const revision = `v-${fnv1aHex(revisionSource)}`;

      const stampedBlock = [
        beginMarker,
        `var GYM_LOGGER_CACHE_REVISION = ${JSON.stringify(revision)};`,
        `var GYM_LOGGER_SHELL_URL = ${JSON.stringify("/")};`,
        `var GYM_LOGGER_PRECACHE_ASSETS = ${JSON.stringify(assetUrls)};`,
        endMarker,
      ].join("\n");

      const stamped =
        source.slice(0, beginIndex) +
        stampedBlock +
        source.slice(endIndex + endMarker.length);
      fs.writeFileSync(swPath, stamped);
      console.log(
        `gym-logger-sw-stamp: cache ${revision} precaches ${assetUrls.length} assets`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), gymLoggerServiceWorkerStamp()],
  server: hasLocalHttps
    ? {
        host: "0.0.0.0",
        https: httpsOptions,
      }
    : undefined,
  preview: hasLocalHttps
    ? {
        host: "0.0.0.0",
        https: httpsOptions,
      }
    : undefined,
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
  },
});
