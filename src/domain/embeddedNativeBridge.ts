import { serializeNativeHelperHandoff } from "./nativeHelperHandoff";
import type { NotesPayload } from "./notesExport";
import type { WorkoutSession } from "./types";

/**
 * In-process bridge used only by the bundled iOS Gym Logger shell. The PWA
 * keeps its normal browser/helper routes when this handler is unavailable.
 */
interface NativeMessageHandler {
  postMessage(message: unknown): void;
}

interface EmbeddedWebKitWindow extends Window {
  webkit?: {
    messageHandlers?: {
      gymLoggerNative?: NativeMessageHandler;
    };
  };
}

export type EmbeddedNativeStatus = "prepared" | "manual" | "failed" | "copied";
export const EMBEDDED_NATIVE_STATUS_EVENT = "gymlogger-native-status";

const EMBEDDED_NATIVE_STATUSES: ReadonlySet<string> = new Set([
  "prepared",
  "manual",
  "failed",
  "copied",
]);

function nativeHandler(): NativeMessageHandler | null {
  if (typeof window === "undefined") return null;
  return (window as EmbeddedWebKitWindow).webkit?.messageHandlers
    ?.gymLoggerNative ?? null;
}

export function hasEmbeddedNativeBridge(): boolean {
  return nativeHandler() !== null;
}

/**
 * Subscribes to the native shell's completion result. The bridge post itself
 * is synchronous, but Swift work (payload generation and Notes opening) is
 * not; callers must wait for this event before showing success.
 */
export function listenForEmbeddedNativeStatus(
  onStatus: (status: EmbeddedNativeStatus) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStatus = (event: Event) => {
    const status = (event as CustomEvent<{ status?: unknown }>).detail?.status;
    if (typeof status === "string" && EMBEDDED_NATIVE_STATUSES.has(status)) {
      onStatus(status as EmbeddedNativeStatus);
    }
  };

  window.addEventListener(EMBEDDED_NATIVE_STATUS_EVENT, handleStatus);
  return () => window.removeEventListener(EMBEDDED_NATIVE_STATUS_EVENT, handleStatus);
}

/** Sends the visible session directly to Swift without a clipboard hop. */
export function sendNativeHandoffToEmbeddedBridge(
  session: WorkoutSession,
): boolean {
  const handler = nativeHandler();
  if (!handler) return false;

  try {
    handler.postMessage({
      action: "prepareColouredNotes",
      payload: serializeNativeHelperHandoff(session),
    });
    return true;
  } catch {
    return false;
  }
}

/** Keeps ordinary Copy to Notes usable inside the bundled shell. */
export function writeNotesPayloadToEmbeddedNative(
  payload: NotesPayload,
): boolean {
  const handler = nativeHandler();
  if (!handler) return false;

  try {
    handler.postMessage({
      action: "copyNotesPayload",
      html: payload.html,
      plainText: payload.text,
    });
    return true;
  } catch {
    return false;
  }
}
