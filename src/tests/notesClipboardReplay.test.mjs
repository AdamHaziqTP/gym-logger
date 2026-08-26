import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CAPTURED_HTML_BYTES,
  CAPTURED_HTML_SHA256,
  CAPTURED_PLAIN_BYTES,
  CAPTURED_PLAIN_SHA256,
  createReplayClipboardItem,
  extractCapturedPayload,
  replayCapturedNotesClipboard,
  validateCapturedPayload,
} from "../../public/feasibility/notesClipboardReplay.mjs";

const ROOT = process.cwd();
const fixturePath = resolve(ROOT, "public/feasibility/notes-clipboard-fingerprint.json");
const evidenceFixturePath = resolve(ROOT, "orchestration/evidence/fixtures/M03-T05-apple-notes-clipboard-fingerprint.json");
const pagePath = resolve(ROOT, "public/feasibility/notes-html-replay.html");
const appPath = resolve(ROOT, "public/feasibility/notesClipboardReplayApp.js");

const fingerprint = JSON.parse(readFileSync(fixturePath, "utf8"));

class FakeBlob {
  constructor(parts, options) {
    this.value = parts.join("");
    this.type = options.type;
  }

  async text() {
    return this.value;
  }
}

describe("M03-T06 exact Apple Notes HTML replay", () => {
  it("preserves the supplied fixture byte-for-byte in both evidence and served copies", () => {
    expect(readFileSync(fixturePath, "utf8")).toBe(readFileSync(evidenceFixturePath, "utf8"));
    const payload = extractCapturedPayload(fingerprint);
    expect(payload.capturedHtmlBytes).toBe(CAPTURED_HTML_BYTES);
    expect(payload.capturedHtmlSha256).toBe(CAPTURED_HTML_SHA256);
    expect(payload.capturedPlainBytes).toBe(CAPTURED_PLAIN_BYTES);
    expect(payload.capturedPlainSha256).toBe(CAPTURED_PLAIN_SHA256);
    expect(payload.html).toContain("rgb(255, 146, 48)");
    expect(payload.html).toContain("rgba(255, 55, 95, 0.15)");
  });

  it("revalidates the exact UTF-8 byte lengths and pinned SHA-256 values", async () => {
    const payload = extractCapturedPayload(fingerprint);
    await expect(validateCapturedPayload(payload, crypto)).resolves.toMatchObject({
      htmlBytes: CAPTURED_HTML_BYTES,
      htmlSha256: CAPTURED_HTML_SHA256,
      plainBytes: CAPTURED_PLAIN_BYTES,
      plainSha256: CAPTURED_PLAIN_SHA256,
      matchesPinnedFixture: true,
    });
  });

  it("creates exactly text/html then text/plain without changing either string", async () => {
    const payload = extractCapturedPayload(fingerprint);
    let itemTypes;
    let itemValues;
    class FakeClipboardItem {
      constructor(values) {
        itemValues = values;
        itemTypes = Object.keys(values);
      }
    }
    const { item, htmlBlob, plainBlob, types } = createReplayClipboardItem(payload, {
      ClipboardItemCtor: FakeClipboardItem,
      BlobCtor: FakeBlob,
    });
    expect(item).toBeInstanceOf(FakeClipboardItem);
    expect(types).toEqual(["text/html", "text/plain"]);
    expect(itemTypes).toEqual(["text/html", "text/plain"]);
    expect(await itemValues["text/html"].text()).toBe(payload.html);
    expect(await itemValues["text/plain"].text()).toBe(payload.plain);
    expect(htmlBlob.type).toBe("text/html");
    expect(plainBlob.type).toBe("text/plain");
  });

  it("writes one ClipboardItem through the injected clipboard and reports success", async () => {
    const payload = extractCapturedPayload(fingerprint);
    const calls = [];
    const result = await replayCapturedNotesClipboard({
      payload,
      BlobCtor: Blob,
      ClipboardItemCtor: class FakeClipboardItem {
        constructor(values) { this.values = values; }
      },
      clipboard: { async write(items) { calls.push(items); } },
    });
    expect(result).toMatchObject({ status: "ok", types: ["text/html", "text/plain"] });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toHaveLength(1);
  });

  it("reports unsupported and permission failures honestly", async () => {
    const payload = extractCapturedPayload(fingerprint);
    await expect(replayCapturedNotesClipboard({ payload, clipboard: {} })).resolves.toMatchObject({
      status: "unsupported",
      error: { name: "NotSupportedError" },
    });
    await expect(replayCapturedNotesClipboard({
      payload,
      clipboard: { async write() { throw new DOMException("User denied", "NotAllowedError"); } },
      ClipboardItemCtor: class FakeClipboardItem { constructor() {} },
      BlobCtor: Blob,
    })).resolves.toMatchObject({ status: "error", error: { name: "NotAllowedError" } });
  });

  it("keeps the proof isolated from production Copy to Notes", () => {
    const page = readFileSync(pagePath, "utf8");
    const app = readFileSync(appPath, "utf8");
    expect(page).toContain("Replay captured Notes HTML");
    expect(page).not.toContain('id="root"');
    expect(app).toContain("notesClipboardReplay.mjs");
    expect(app).toContain("notes-clipboard-fingerprint.json");
    expect(app).not.toContain("copyToNotes");
    expect(app).not.toContain("clipboardData");
    expect(app).not.toContain("execCommand");
  });
});
