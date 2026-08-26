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

function nativeHandler(): NativeMessageHandler | null {
  if (typeof window === "undefined") return null;
  return (window as EmbeddedWebKitWindow).webkit?.messageHandlers
    ?.gymLoggerNative ?? null;
}

export function hasEmbeddedNativeBridge(): boolean {
  return nativeHandler() !== null;
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
