import type { NotesPayload } from "./notesExport";

/**
 * Local clipboard writer for the Copy-to-Notes spike (spec §15; task
 * M03-T01). Strictly local: it talks only to the browser's Async Clipboard
 * API — no backend, no share targets, no Apple Notes automation (§2.2).
 *
 * Attempt order:
 * 1. ONE `ClipboardItem` carrying both `text/html` and `text/plain`
 *    (spec §15.2), so a capable target (Apple Notes on iOS) can pick the rich
 *    representation while everything else still gets plain text.
 * 2. Plain-text-only write (`writeText`) when the combined item is
 *    unsupported or rejected — the reliable fallback §15.6 requires.
 * 3. `"failed"` when even the fallback is unavailable or denied. Callers must
 *    surface this state; failure never reports success (AC-03).
 */

export type ClipboardCopyOutcome =
  | "copied-rich"
  | "copied-plain"
  | "failed";

/** True when the environment exposes the pieces the rich attempt needs. */
export function supportsCombinedClipboardWrite(): boolean {
  return (
    typeof ClipboardItem === "function" &&
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.write === "function"
  );
}

/**
 * Writes both representations of `payload` to the OS clipboard and resolves
 * with what actually happened. Never throws: every rejection is mapped to an
 * outcome the UI can report honestly.
 */
export async function writeNotesPayloadToClipboard(
  payload: NotesPayload,
): Promise<ClipboardCopyOutcome> {
  if (supportsCombinedClipboardWrite()) {
    try {
      const item = new ClipboardItem({
        "text/html": new Blob([payload.html], { type: "text/html" }),
        "text/plain": new Blob([payload.text], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      return "copied-rich";
    } catch {
      // Rich write unsupported or denied — fall through to plain text rather
      // than leaving the user with nothing (spec §15.6).
    }
  }

  const clipboard = typeof navigator !== "undefined"
    ? navigator.clipboard
    : undefined;
  if (typeof clipboard?.writeText === "function") {
    try {
      await clipboard.writeText(payload.text);
      return "copied-plain";
    } catch {
      // Permission denial or gesture loss — reported as failure below.
    }
  }
  return "failed";
}
