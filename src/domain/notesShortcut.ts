import type { NotesPayload } from "./notesExport";

/**
 * Optional PWA -> iOS Shortcuts handoff. This is deliberately separate from
 * the normal clipboard writer: the existing Copy to Notes path remains the
 * dependable uncoloured fallback until a real device proves this route.
 */
export type NotesShortcutOutcome = "shared" | "cancelled" | "failed";

export const NOTES_SHORTCUT_FILENAME = "Gym-Logger-Notes.html";

export function buildNotesShortcutFile(
  payload: NotesPayload,
  filename = NOTES_SHORTCUT_FILENAME,
): File {
  return new File([payload.html], filename, { type: "text/html" });
}

/** Returns true only when this browser exposes the OS file share APIs. */
export function supportsNotesShortcutShare(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    typeof File === "function"
  );
}

/**
 * Hands the self-contained HTML file to the system share sheet. "shared" is
 * returned only after navigator.share resolves; a user dismissal is reported
 * separately and no result claims that Apple Notes or a Shortcut completed.
 */
export async function shareNotesShortcutFile(
  file: File,
): Promise<NotesShortcutOutcome> {
  if (!supportsNotesShortcutShare()) return "failed";

  try {
    if (!navigator.canShare({ files: [file] })) return "failed";
  } catch {
    return "failed";
  }

  try {
    await navigator.share({ files: [file] });
    return "shared";
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError"
      ? "cancelled"
      : "failed";
  }
}
