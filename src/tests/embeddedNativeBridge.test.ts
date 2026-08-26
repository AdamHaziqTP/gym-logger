import { afterEach, describe, expect, it } from "vitest";
import {
  EMBEDDED_NATIVE_STATUS_EVENT,
  hasEmbeddedNativeBridge,
  listenForEmbeddedNativeStatus,
  sendColourSnapshotToEmbeddedBridge,
  sendNativeHandoffToEmbeddedBridge,
  writeNotesPayloadToEmbeddedNative,
} from "../domain/embeddedNativeBridge";
import type { NotesPayload } from "../domain/notesExport";
import type { WorkoutSession } from "../domain/types";

const session: WorkoutSession = {
  id: "actual-2026-08-25",
  dateLocal: "2026-08-25",
  createdAt: "2026-08-25T08:00:00.000Z",
  updatedAt: "2026-08-25T08:00:00.000Z",
  rows: [
    {
      id: "row-1",
      position: 0,
      exercise: "Press 30°",
      sets: "1",
      reps: "8",
      weight: "10kg",
      skip: "",
      highlight: "orange",
    },
  ],
  notes: "Keep · Unicode",
  summaryOverride: { sets: "40", exercises: "40" },
};

const notesPayload: NotesPayload = {
  html: "<table><tr><td>Arms</td></tr></table>",
  text: "Arms\nPress 30°",
};

afterEach(() => {
  Reflect.deleteProperty(window, "webkit");
});

function installBridge(): unknown[] {
  const messages: unknown[] = [];
  Object.defineProperty(window, "webkit", {
    configurable: true,
    value: {
      messageHandlers: {
        gymLoggerNative: {
          postMessage: (message: unknown) => messages.push(message),
        },
      },
    },
  });
  return messages;
}

describe("embedded native iOS bridge", () => {
  it("is absent in the normal browser/PWA environment", () => {
    expect(hasEmbeddedNativeBridge()).toBe(false);
    expect(sendNativeHandoffToEmbeddedBridge(session)).toBe(false);
  });

  it("sends the versioned real session directly to the in-process native bridge", () => {
    const messages = installBridge();

    expect(sendNativeHandoffToEmbeddedBridge(session)).toBe(true);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ action: "prepareColouredNotes" });
    const message = messages[0] as { payload: string };
    const handoff = JSON.parse(message.payload) as {
      schemaVersion: number;
      source: string;
      session: WorkoutSession;
    };
    expect(handoff.schemaVersion).toBe(1);
    expect(handoff.source).toBe("gym-logger-pwa");
    expect(handoff.session.id).toBe("actual-2026-08-25");
    expect(handoff.session.rows[0]?.exercise).toBe("Press 30°");
  });

  it("sends ordinary Notes representations through Swift in the bundled app", () => {
    const messages = installBridge();

    expect(writeNotesPayloadToEmbeddedNative(notesPayload)).toBe(true);
    expect(messages).toEqual([
      {
        action: "copyNotesPayload",
        html: notesPayload.html,
        plainText: notesPayload.text,
      },
    ]);
  });

  it("sends Compact PNG bytes and filename to the native Photos action", () => {
    const messages = installBridge();

    expect(
      sendColourSnapshotToEmbeddedBridge("iVBORw0KGgo=", "Gym-2026-08-25.png"),
    ).toBe(true);
    expect(messages).toEqual([
      {
        action: "saveColourSnapshot",
        filename: "Gym-2026-08-25.png",
        pngBase64: "iVBORw0KGgo=",
      },
    ]);
  });

  it("accepts action-scoped native statuses and ignores unknown values", () => {
    const statuses: string[] = [];
    const actions: Array<string | undefined> = [];
    const unsubscribe = listenForEmbeddedNativeStatus((status, action) => {
      statuses.push(status);
      actions.push(action);
    });

    window.dispatchEvent(
      new CustomEvent(EMBEDDED_NATIVE_STATUS_EVENT, {
        detail: { status: "manual" },
      }),
    );
    window.dispatchEvent(
      new CustomEvent(EMBEDDED_NATIVE_STATUS_EVENT, {
        detail: { status: "unexpected" },
      }),
    );
    unsubscribe();
    window.dispatchEvent(
      new CustomEvent(EMBEDDED_NATIVE_STATUS_EVENT, {
        detail: { status: "failed" },
      }),
    );

    expect(statuses).toEqual(["manual"]);
    expect(actions).toEqual([undefined]);
  });

  it("accepts the Photos saving lifecycle", () => {
    const statuses: string[] = [];
    const unsubscribe = listenForEmbeddedNativeStatus((status, action) => {
      if (action === "saveColourSnapshot") statuses.push(status);
    });
    for (const status of ["saving", "saved", "denied", "failed"] as const) {
      window.dispatchEvent(
        new CustomEvent(EMBEDDED_NATIVE_STATUS_EVENT, {
          detail: { action: "saveColourSnapshot", status },
        }),
      );
    }
    unsubscribe();
    expect(statuses).toEqual(["saving", "saved", "denied", "failed"]);
  });
});
