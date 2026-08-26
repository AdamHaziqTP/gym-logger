import { formatDateDisplay } from "./dates";
import { copyTextViaSelection } from "./notesClipboard";
import type { WorkoutSession } from "./types";

/**
 * Versioned bridge between the production PWA and the optional native Notes
 * pasteboard helper. The helper consumes this JSON from the system clipboard
 * before replacing it with the generated com.apple.flat-rtfd item.
 */
export const NATIVE_HELPER_SCHEMA_VERSION = 1 as const;
export const NATIVE_HELPER_SOURCE = "gym-logger-pwa" as const;
export const NATIVE_HELPER_URL = "gymloggerpasteboardproof://handoff";

export interface NativeHelperHandoff {
  schemaVersion: typeof NATIVE_HELPER_SCHEMA_VERSION;
  source: typeof NATIVE_HELPER_SOURCE;
  displayDate: string;
  session: WorkoutSession;
}

export function buildNativeHelperHandoff(
  session: WorkoutSession,
): NativeHelperHandoff {
  return {
    schemaVersion: NATIVE_HELPER_SCHEMA_VERSION,
    source: NATIVE_HELPER_SOURCE,
    displayDate: formatDateDisplay(session.dateLocal),
    session,
  };
}

export function serializeNativeHelperHandoff(session: WorkoutSession): string {
  return JSON.stringify(buildNativeHelperHandoff(session));
}

/**
 * Starts the native handoff with the best available local clipboard writer.
 * This function never includes the rich Notes payload: the native helper is
 * responsible for producing that payload after it receives the session JSON.
 */
export async function writeNativeHelperHandoffToClipboard(
  session: WorkoutSession,
): Promise<boolean> {
  const text = serializeNativeHelperHandoff(session);
  const clipboard =
    typeof navigator !== "undefined" ? navigator.clipboard : undefined;

  if (typeof clipboard?.writeText === "function") {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the synchronous, gesture-safe legacy path.
    }
  }

  return copyTextViaSelection(text);
}

/** Opens the installed helper through its registered iOS URL scheme. */
export function launchNativeHelper(): void {
  if (typeof window !== "undefined") {
    window.location.href = NATIVE_HELPER_URL;
  }
}
