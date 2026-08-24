import type { NotesPayload } from "./notesExport";

/**
 * Local clipboard writer for the Copy-to-Notes spike (spec §15; task
 * M03-T01, corrected by M03-T01-FIX-01). Strictly local: it talks only to
 * browser clipboard mechanisms — no backend, no share targets, no Apple
 * Notes automation (§2.2).
 *
 * Attempt order (FIX-01):
 * 1. ONE `ClipboardItem` carrying both `text/html` and `text/plain`
 *    (spec §15.2), so a capable target (Apple Notes on iOS) can pick the rich
 *    representation while everything else still gets plain text.
 * 2. Plain-text-only write (`writeText`) when the combined item is
 *    unsupported or rejected — the reliable fallback §15.6 requires.
 * 3. NEW (FIX-01): legacy selection-based copy (`document.execCommand`
 *    over a temporary textarea) for environments where the Async Clipboard
 *    API does not exist at all — which includes every non-secure origin such
 *    as the `http://192.168.1.49:5173` LAN server the product owner tested —
 *    or refused both async attempts. This is a plain-text-only best effort;
 *    it is reported as plain, never as rich success (AC-02/AC-03).
 * 4. `"failed"` when even the legacy path is unavailable or refuses. Callers
 *    must surface this state; failure never reports success (AC-03).
 *
 * Caller contract (FIX-01): invoke `writeNotesPayloadToClipboard` directly
 * inside the button gesture with NO awaited work before it. iOS/Safari ties
 * clipboard permission to transient user activation and drops it across
 * awaited tasks, so any `await save()` between the tap and the first
 * clipboard attempt can turn a permitted write into a denial.
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
 * Legacy selection-based plain-text copy (spec §15.5 names this exact
 * fallback; FIX-01). Creates a temporary off-screen textarea that carries
 * ONLY `text`, selects it, and runs `document.execCommand("copy")` — all
 * synchronously, so it stays inside the user gesture that started it.
 *
 * Carefully scoped per the FIX-01 constraints:
 * - nothing but the temporary helper is ever selected, so no unrelated page
 *   content can end up on the clipboard;
 * - no global selection toggles: page/user-select CSS and editable table
 *   behavior are untouched;
 * - the previous selection AND focus are restored afterwards, so keyboard
 *   and caret state survive the copy.
 *
 * Returns whether the copy command reported success; every missing API,
 * throw, or refusal maps to `false`.
 */
export function copyTextViaSelection(text: string): boolean {
  if (
    typeof document === "undefined" ||
    !document.body ||
    typeof document.execCommand !== "function"
  ) {
    return false;
  }

  const selection = typeof document.getSelection === "function"
    ? document.getSelection()
    : null;
  const previousRanges: Range[] = [];
  if (selection && selection.rangeCount > 0) {
    for (let index = 0; index < selection.rangeCount; index += 1) {
      const range = selection.getRangeAt(index);
      if (range) previousRanges.push(range);
    }
  }
  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.setAttribute("aria-hidden", "true");
  helper.tabIndex = -1;
  // Inline styles keep this self-contained: rendered (so Safari will copy
  // from it) yet visually absent and layout-neutral.
  helper.style.position = "fixed";
  helper.style.top = "0";
  helper.style.left = "-9999px";
  helper.style.width = "1px";
  helper.style.height = "1px";
  helper.style.padding = "0";
  helper.style.border = "none";
  helper.style.opacity = "0";

  let copied = false;
  try {
    document.body.appendChild(helper);
    helper.focus();
    helper.select();
    helper.setSelectionRange(0, text.length);
    copied = document.execCommand.call(document, "copy");
  } catch {
    copied = false;
  } finally {
    helper.remove();
    if (selection) {
      selection.removeAllRanges();
      for (const range of previousRanges) selection.addRange(range);
    }
    previousFocus?.focus();
  }
  return copied;
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
      // Permission denial or gesture loss — try the legacy path below.
    }
  }

  if (copyTextViaSelection(payload.text)) {
    return "copied-plain";
  }
  return "failed";
}
