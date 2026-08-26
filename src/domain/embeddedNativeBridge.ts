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

export type EmbeddedNativeAction =
  | "prepareColouredNotes"
  | "copyNotesPayload"
  | "saveColourSnapshot";
export type EmbeddedNativeStatus =
  | "saving"
  | "saved"
  | "denied"
  | "prepared"
  | "manual"
  | "failed"
  | "copied";
export const EMBEDDED_NATIVE_STATUS_EVENT = "gymlogger-native-status";

const EMBEDDED_NATIVE_STATUSES: ReadonlySet<string> = new Set([
  "saving",
  "saved",
  "denied",
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
  onStatus: (
    status: EmbeddedNativeStatus,
    action?: EmbeddedNativeAction,
  ) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStatus = (event: Event) => {
    const detail = (event as CustomEvent<{
      action?: unknown;
      status?: unknown;
    }>).detail;
    const status = detail?.status;
    if (typeof status === "string" && EMBEDDED_NATIVE_STATUSES.has(status)) {
      const action =
        typeof detail?.action === "string" &&
        (detail.action === "prepareColouredNotes" ||
          detail.action === "copyNotesPayload" ||
          detail.action === "saveColourSnapshot")
          ? detail.action
          : undefined;
      onStatus(status as EmbeddedNativeStatus, action);
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

/** Keeps the legacy rich Notes payload bridge available for compatibility. */
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

/** Sends a rendered Compact PNG to native for a direct Photos save. */
export function sendColourSnapshotToEmbeddedBridge(
  pngBase64: string,
  filename: string,
): boolean {
  const handler = nativeHandler();
  if (!handler) return false;

  try {
    handler.postMessage({
      action: "saveColourSnapshot",
      filename,
      pngBase64,
    });
    return true;
  } catch {
    return false;
  }
}
