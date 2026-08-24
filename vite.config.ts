/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

const certDir = path.resolve(process.cwd(), "certs");
const pfxPath = path.join(certDir, "gym-logger-dev.pfx");
const passwordPath = path.join(certDir, "gym-logger-dev.password");
const hasLocalHttps = fs.existsSync(pfxPath) && fs.existsSync(passwordPath);

export default defineConfig({
  plugins: [react()],
  server: hasLocalHttps
    ? {
        host: "0.0.0.0",
        https: {
          pfx: fs.readFileSync(pfxPath),
          passphrase: fs.readFileSync(passwordPath, "utf8").trim(),
        },
      }
    : undefined,
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
  },
});
