import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Dexie from "dexie";
import { App } from "../App";
import { createDb, type GymLogDB } from "../data/db";

const DB_NAME = "gym-logger";
const TODAY = "2026-08-24";
let db: GymLogDB;

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
  db = createDb();
});

afterEach(() => {
  cleanup();
  db.close();
  Reflect.deleteProperty(window, "webkit");
  vi.restoreAllMocks();
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

async function openSession() {
  render(<App db={db} todayLocal={TODAY} />);
  await screen.findByText(/40 sets · 39 exercises/);
  fireEvent.click(
    screen.getByRole("button", { name: "Start Today's Session" }),
  );
  await screen.findByDisplayValue("Recline curl bench 30° IR uni");
}

describe("final one-app session export UX", () => {
  it("shows one Notes action and one Compact Photos action only", async () => {
    await openSession();

    expect(
      screen.getByRole("button", { name: "Copy Coloured Notes & Open Notes" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save Colour Snapshot" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Copy to Notes" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Export Image" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Share Colour Snapshot" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Export style" })).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("waits for native Notes completion instead of claiming prepared on post", async () => {
    const messages = installBridge();
    await openSession();

    fireEvent.click(
      screen.getByRole("button", { name: "Copy Coloured Notes & Open Notes" }),
    );
    expect(await screen.findByText("Preparing coloured Notes copy…")).toBeTruthy();
    expect(screen.queryByText(/Notes opened; paste once/)).toBeNull();
    expect(messages[0]).toMatchObject({ action: "prepareColouredNotes" });

    window.dispatchEvent(
      new CustomEvent("gymlogger-native-status", {
        detail: { action: "prepareColouredNotes", status: "prepared" },
      }),
    );
    expect(
      await screen.findByText("Clipboard prepared. Notes opened; paste once in the Gym note."),
    ).toBeTruthy();
  });

  it("sends the visible unsaved session to native for Compact Photos saving", async () => {
    const messages = installBridge();
    const pngExport = await import("../domain/pngExport");
    vi.spyOn(pngExport, "rasterizeSvgToPngBlob").mockResolvedValue(
      new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
    );
    await openSession();

    fireEvent.change(screen.getByLabelText("Exercise row 1"), {
      target: { value: "Visible mid-flight edit" },
    });
    fireEvent.change(screen.getByLabelText("Session notes"), {
      target: { value: "Visible note" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Colour Snapshot" }));

    expect(await screen.findByText("Saving…")).toBeTruthy();
    let message: { action: string; filename: string; pngBase64: string } | undefined;
    await waitFor(() => {
      message = messages.find(
        (entry) =>
          typeof entry === "object" &&
          entry !== null &&
          (entry as { action?: string }).action === "saveColourSnapshot",
      ) as { action: string; filename: string; pngBase64: string } | undefined;
      expect(message).toBeDefined();
    });
    expect(message).toBeDefined();
    expect(message!.action).toBe("saveColourSnapshot");
    expect(message!.filename).toBe("Gym-2026-08-24.png");
    expect(message!.pngBase64).toBe("iVBORw==");

    window.dispatchEvent(
      new CustomEvent("gymlogger-native-status", {
        detail: { action: "saveColourSnapshot", status: "saved" },
      }),
    );
    expect(await screen.findByText("Saved to Photos ✓")).toBeTruthy();
    // The Notes action and the snapshot action intentionally let autosave
    // converge in the background; allow that queued work to finish before
    // the test closes its database.
    await new Promise((resolve) => setTimeout(resolve, 450));
  });
});
