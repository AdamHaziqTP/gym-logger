/**
 * M03-T06 isolated proof helper.
 *
 * The payload is intentionally treated as opaque captured evidence. No HTML
 * parsing, sanitizing, regeneration, or colour substitution belongs here.
 */

import { sha256Hex } from "./notesClipboardFingerprint.mjs";

export const CAPTURED_HTML_BYTES = 184878;
export const CAPTURED_HTML_SHA256 =
  "c59e663f8aef5d90dee03664b90c119b09f10395b8cf84c6b23ff0adfe8d1002";
export const CAPTURED_PLAIN_BYTES = 1658;
export const CAPTURED_PLAIN_SHA256 =
  "d8bf2b0dd2f0e867090924922a56e87ab2e8f980f4ea25b3fb7b035fc80c17fc";

function errorDetails(error) {
  return {
    name: error?.name || "Error",
    message: error?.message || String(error),
  };
}

export function extractCapturedPayload(fingerprint) {
  const representations = (fingerprint?.items || []).flatMap(
    (item) => item?.representations || [],
  );
  const html = representations.find((entry) => entry.type === "text/html");
  const plain = representations.find((entry) => entry.type === "text/plain");
  if (typeof html?.text !== "string" || typeof plain?.text !== "string") {
    throw new Error("Captured fingerprint does not contain complete text/html and text/plain payloads.");
  }
  return {
    html: html.text,
    plain: plain.text,
    capturedHtmlBytes: html.byteLength,
    capturedHtmlSha256: html.sha256,
    capturedPlainBytes: plain.byteLength,
    capturedPlainSha256: plain.sha256,
  };
}

export async function validateCapturedPayload(
  payload,
  cryptoLike = globalThis.crypto,
) {
  const htmlBytes = new TextEncoder().encode(payload.html);
  const plainBytes = new TextEncoder().encode(payload.plain);
  const htmlSha256 = await sha256Hex(htmlBytes, cryptoLike);
  const plainSha256 = await sha256Hex(plainBytes, cryptoLike);
  return {
    htmlBytes: htmlBytes.byteLength,
    htmlSha256,
    plainBytes: plainBytes.byteLength,
    plainSha256,
    matchesPinnedFixture:
      htmlBytes.byteLength === CAPTURED_HTML_BYTES &&
      htmlSha256 === CAPTURED_HTML_SHA256 &&
      plainBytes.byteLength === CAPTURED_PLAIN_BYTES &&
      plainSha256 === CAPTURED_PLAIN_SHA256,
  };
}

export function createReplayClipboardItem(
  payload,
  {
    ClipboardItemCtor = globalThis.ClipboardItem,
    BlobCtor = globalThis.Blob,
  } = {},
) {
  if (typeof ClipboardItemCtor !== "function") {
    throw new Error("This browser does not expose ClipboardItem.");
  }
  if (typeof BlobCtor !== "function") {
    throw new Error("This browser cannot construct clipboard Blobs.");
  }

  const htmlBlob = new BlobCtor([payload.html], { type: "text/html" });
  const plainBlob = new BlobCtor([payload.plain], { type: "text/plain" });
  const item = new ClipboardItemCtor({
    "text/html": htmlBlob,
    "text/plain": plainBlob,
  });
  return { item, htmlBlob, plainBlob, types: ["text/html", "text/plain"] };
}

/**
 * Call clipboard.write synchronously before the first await so the caller can
 * invoke this function directly from a user gesture.
 */
export async function replayCapturedNotesClipboard({
  clipboard = globalThis.navigator?.clipboard,
  payload,
  ClipboardItemCtor = globalThis.ClipboardItem,
  BlobCtor = globalThis.Blob,
} = {}) {
  const base = {
    source: "captured Apple Notes text/html + text/plain",
    types: ["text/html", "text/plain"],
  };
  if (typeof clipboard?.write !== "function") {
    return {
      ...base,
      status: "unsupported",
      error: {
        name: "NotSupportedError",
        message: "This browser does not expose navigator.clipboard.write().",
      },
    };
  }

  try {
    const { item } = createReplayClipboardItem(payload, {
      ClipboardItemCtor,
      BlobCtor,
    });
    await clipboard.write([item]);
    return { ...base, status: "ok" };
  } catch (error) {
    return { ...base, status: "error", error: errorDetails(error) };
  }
}
