/**
 * M03-T05 isolated diagnostic helper.
 *
 * This module is deliberately read-only: it inspects the browser-visible
 * clipboard and never writes, transforms, or replaces clipboard contents.
 */

export const FINGERPRINT_SCHEMA = "gym-logger/notes-clipboard-fingerprint/v1";

export function isTextualClipboardType(type) {
  return /^(?:text\/|application\/(?:json|xml|xhtml\+xml|rtf))/i.test(type);
}

function errorDetails(error) {
  return {
    name: error?.name || "Error",
    message: error?.message || String(error),
  };
}

async function readBlobBytes(blob) {
  if (typeof blob?.arrayBuffer === "function") {
    return new Uint8Array(await blob.arrayBuffer());
  }
  if (typeof blob?.text === "function") {
    return new TextEncoder().encode(await blob.text());
  }
  throw new Error("Clipboard representation did not expose arrayBuffer() or text()");
}

async function readBlobText(blob, bytes) {
  if (typeof blob?.text === "function") return blob.text();
  return new TextDecoder().decode(bytes);
}

export async function sha256Hex(bytes, cryptoLike = globalThis.crypto) {
  if (typeof cryptoLike?.subtle?.digest !== "function") return null;
  const digest = await cryptoLike.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Read every browser-visible clipboard item/type in the order supplied by
 * the browser. This function intentionally has no clipboard write path.
 */
export async function readClipboardFingerprint({
  clipboard = globalThis.navigator?.clipboard,
  cryptoLike = globalThis.crypto,
  capturedAt = new Date().toISOString(),
} = {}) {
  const base = {
    schema: FINGERPRINT_SCHEMA,
    capturedAt,
    source: "navigator.clipboard.read()",
    status: "ok",
    items: [],
  };

  if (typeof clipboard?.read !== "function") {
    return {
      ...base,
      status: "unsupported",
      error: {
        name: "NotSupportedError",
        message: "This browser does not expose navigator.clipboard.read().",
      },
    };
  }

  let clipboardItems;
  try {
    clipboardItems = await clipboard.read();
  } catch (error) {
    return { ...base, status: "error", error: errorDetails(error) };
  }

  let hasReadFailure = false;
  for (const [itemIndex, item] of Array.from(clipboardItems).entries()) {
    const types = Array.from(item?.types || []);
    const fingerprintItem = { itemIndex, types, representations: [] };

    for (const [typeIndex, type] of types.entries()) {
      const representation = { itemIndex, typeIndex, type };
      try {
        if (typeof item?.getType !== "function") {
          throw new Error("Clipboard item did not expose getType().");
        }
        const blob = await item.getType(type);
        const bytes = await readBlobBytes(blob);
        representation.readStatus = "ok";
        representation.byteLength = bytes.byteLength;
        representation.sha256 = await sha256Hex(bytes, cryptoLike);
        representation.hashStatus = representation.sha256
          ? "sha-256"
          : "unavailable — Web Crypto subtle.digest() is not exposed";

        if (isTextualClipboardType(type)) {
          representation.text = await readBlobText(blob, bytes);
          representation.textStatus = "captured-complete-text";
        } else {
          representation.payloadStatus =
            "non-text browser Blob inspected by size/hash only; native payload not exposed";
        }
      } catch (error) {
        hasReadFailure = true;
        representation.readStatus = "error";
        representation.error = errorDetails(error);
      }
      fingerprintItem.representations.push(representation);
    }

    base.items.push(fingerprintItem);
  }

  return {
    ...base,
    status: hasReadFailure ? "partial" : "ok",
    itemCount: base.items.length,
  };
}

export function serializeFingerprint(fingerprint) {
  return JSON.stringify(fingerprint, null, 2);
}

export function createFingerprintDownload(
  fingerprint,
  {
    documentLike = globalThis.document,
    urlLike = globalThis.URL,
    BlobCtor = globalThis.Blob,
  } = {},
) {
  if (typeof BlobCtor !== "function") {
    throw new Error("This browser cannot construct a JSON download Blob.");
  }
  if (typeof documentLike?.createElement !== "function") {
    throw new Error("A document is required to create the download link.");
  }
  if (typeof urlLike?.createObjectURL !== "function") {
    throw new Error("This browser cannot create a download URL.");
  }

  const json = serializeFingerprint(fingerprint);
  const blob = new BlobCtor([json], { type: "application/json" });
  const url = urlLike.createObjectURL(blob);
  const link = documentLike.createElement("a");
  link.href = url;
  link.download = "gym-logger-notes-clipboard-fingerprint.json";
  link.textContent = "Download fingerprint JSON";
  return { blob, json, link, url };
}
