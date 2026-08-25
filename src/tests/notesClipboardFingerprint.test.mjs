import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FINGERPRINT_SCHEMA,
  createFingerprintDownload,
  isTextualClipboardType,
  readClipboardFingerprint,
  serializeFingerprint,
  sha256Hex,
} from "../../public/feasibility/notesClipboardFingerprint.mjs";

const PROJECT_ROOT = process.cwd();
const PAGE_PATH = resolve(PROJECT_ROOT, "public/feasibility/notes-clipboard-fingerprint.html");
const APP_PATH = resolve(PROJECT_ROOT, "public/feasibility/notesClipboardFingerprintApp.js");

function blob(text, type) {
  const bytes = new TextEncoder().encode(text);
  return {
    type,
    async arrayBuffer() {
      return bytes.slice().buffer;
    },
    async text() {
      return text;
    },
  };
}

describe("M03-T05 Notes clipboard fingerprint", () => {
  it("preserves item order, type order, complete text, byte lengths, and hashes", async () => {
    const clipboard = {
      async read() {
        return [
          {
            types: ["text/html", "text/plain", "image/png"],
            async getType(type) {
              if (type === "text/html") return blob('<table style="color:#f00">é</table>', type);
              if (type === "text/plain") return blob("Arms · 30°", type);
              return blob("png-bytes", type);
            },
          },
          {
            types: ["text/plain"],
            async getType() { return blob("second item", "text/plain"); },
          },
        ];
      },
    };

    const result = await readClipboardFingerprint({
      clipboard,
      capturedAt: "2026-08-26T00:00:00.000Z",
      cryptoLike: crypto,
    });

    expect(result).toMatchObject({
      schema: FINGERPRINT_SCHEMA,
      capturedAt: "2026-08-26T00:00:00.000Z",
      status: "ok",
      itemCount: 2,
    });
    expect(result.items.map((item) => item.itemIndex)).toEqual([0, 1]);
    expect(result.items[0].types).toEqual(["text/html", "text/plain", "image/png"]);
    expect(result.items[0].representations.map((entry) => entry.type)).toEqual([
      "text/html",
      "text/plain",
      "image/png",
    ]);
    expect(result.items[0].representations[0].text).toContain("é");
    expect(result.items[0].representations[1].text).toBe("Arms · 30°");
    expect(result.items[0].representations[2]).toMatchObject({
      byteLength: 9,
      payloadStatus: expect.stringContaining("non-text"),
    });
    expect(result.items[0].representations.every((entry) => entry.sha256)).toBe(true);
  });

  it("returns honest unsupported and permission/error results without throwing", async () => {
    await expect(readClipboardFingerprint({ clipboard: {} })).resolves.toMatchObject({
      status: "unsupported",
      error: { name: "NotSupportedError" },
    });

    const denied = await readClipboardFingerprint({
      clipboard: { async read() { throw new DOMException("User denied", "NotAllowedError"); } },
    });
    expect(denied).toMatchObject({ status: "error", error: { name: "NotAllowedError", message: "User denied" } });

    const partial = await readClipboardFingerprint({
      clipboard: {
        async read() {
          return [{ types: ["text/plain", "image/png"], async getType(type) {
            if (type === "text/plain") throw new Error("representation unavailable");
            return blob("png", type);
          } }];
        },
      },
    });
    expect(partial.status).toBe("partial");
    expect(partial.items[0].representations[0]).toMatchObject({
      readStatus: "error",
      error: { message: "representation unavailable" },
    });
  });

  it("uses SHA-256 when available and reports unavailable hashing honestly", async () => {
    const bytes = new TextEncoder().encode("Gym Logger");
    expect(await sha256Hex(bytes, crypto)).toMatch(/^[0-9a-f]{64}$/);
    expect(await sha256Hex(bytes, {})).toBeNull();
  });

  it("classifies textual types and serializes stable readable JSON", () => {
    expect(isTextualClipboardType("text/html")).toBe(true);
    expect(isTextualClipboardType("application/json")).toBe(true);
    expect(isTextualClipboardType("image/png")).toBe(false);
    const json = serializeFingerprint({ schema: FINGERPRINT_SCHEMA, status: "ok" });
    expect(json).toBe(`{\n  "schema": "${FINGERPRINT_SCHEMA}",\n  "status": "ok"\n}`);
  });

  it("creates a downloadable JSON link without touching the clipboard", () => {
    const fakeUrl = { createObjectURL: (value) => { fakeUrl.value = value; return "blob:test"; } };
    const fakeDocument = { createElement: () => ({}) };
    const result = createFingerprintDownload(
      { schema: FINGERPRINT_SCHEMA, status: "ok" },
      { documentLike: fakeDocument, urlLike: fakeUrl, BlobCtor: Blob },
    );
    expect(result.link).toMatchObject({ href: "blob:test", download: "gym-logger-notes-clipboard-fingerprint.json" });
    expect(result.json).toContain(FINGERPRINT_SCHEMA);
    expect(fakeUrl.value.type).toBe("application/json");
  });

  it("keeps the diagnostic isolated and read-only", () => {
    const page = readFileSync(PAGE_PATH, "utf8");
    const app = readFileSync(APP_PATH, "utf8");
    expect(page).toContain("Inspect Notes Clipboard");
    expect(page).toContain("notesClipboardFingerprintApp.js");
    expect(app).toContain("navigator?.clipboard");
    expect(app).not.toMatch(/clipboard\.(?:write|writeText)\s*\(/);
    expect(app).not.toContain("ClipboardItem");
    expect(app).not.toContain("clipboardData");
    expect(app).not.toContain("execCommand");
  });
});
