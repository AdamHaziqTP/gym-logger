import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Dexie from "dexie";
import { App } from "../App";
import { createDb, type GymLogDB } from "../data/db";
import { clearRowClipboard } from "../domain/rowClipboard";

/* ---------------------------------------------------------------------- */
/* Copy-to-Notes action behavior (spec §15; task M03-T01): entry point,   */
/* honest success/fallback/failure reporting (AC-03), payload delivery,   */
/* and export-after-flush ordering. Apple Notes itself can NEVER be       */
/* verified here — that stays a human iPhone gate.                        */
/* ---------------------------------------------------------------------- */

const DB_NAME = "gym-logger";
const TODAY = "2026-08-24";

let db: GymLogDB;

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
  db = createDb();
  clearRowClipboard();
});

afterEach(() => {
  cleanup();
  db.close();
  vi.unstubAllGlobals();
  // Remove whatever clipboard stub this test installed.
  delete (window.navigator as { clipboard?: unknown }).clipboard;
});

/* ------------------------------ stubbing ------------------------------ */

/**
 * Minimal stand-in for the DOM ClipboardItem: records the requested
 * representations so tests can decode the Blobs production code hands over.
 */
class FakeClipboardItem {
  readonly types: readonly string[];
  readonly entries: Record<string, Blob>;

  constructor(items: Record<string, string | Blob>) {
    this.types = Object.keys(items);
    this.entries = items as Record<string, Blob>;
  }
}

type WriteSpy = { calls: FakeClipboardItem[][] };

function installClipboard(overrides: {
  write?: (items: FakeClipboardItem[]) => Promise<void>;
  writeText?: (text: string) => Promise<void>;
}): void {
  Object.defineProperty(window.navigator, "clipboard", {
    value: { write: overrides.write, writeText: overrides.writeText },
    configurable: true,
  });
}

/** jsdom's Blob may lack .text(); FileReader always works there. */
function readBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === "function") return blob.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

/* ------------------------------ helpers ------------------------------- */

async function openSession(): Promise<void> {
  // Same entry as the accepted suites: the seed is NOT dated today, so the
  // app lands on Home; start today's session from there.
  render(<App db={db} todayLocal={TODAY} />);
  // The seeded fixture must be visible (liveQuery resolved) before Start is
  // clickable — otherwise the button is still disabled and the tap no-ops.
  await screen.findByText(/40 sets · 39 exercises/);
  const startButton = screen.getByRole("button", {
    name: "Start Today's Session",
  }) as HTMLButtonElement;
  expect(startButton.disabled).toBe(false);
  fireEvent.click(startButton);
  await screen.findByDisplayValue("Recline curl bench 30° IR uni");
}

function copyButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: "Copy to Notes" }) as HTMLButtonElement;
}

function firstExerciseInput(): HTMLInputElement {
  return screen.getByLabelText("Exercise row 1") as HTMLInputElement;
}

async function todaysSession() {
  const sessions = await db.sessions.toArray();
  return sessions.find((session) => session.dateLocal === TODAY)!;
}

const following = (a: Element, b: Element) =>
  (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

/* -------------------------------- tests -------------------------------- */

describe("Copy to Notes action placement (AC-01)", () => {
  it("sits between the notes section and the danger zone without touching table editing or navigation", async () => {
    await openSession();

    expect(copyButton()).toBeTruthy();

    // Screen order preserved: … table → Notes section → Copy-to-Notes → Delete.
    const notesSection = document.querySelector(".notes-section")!;
    const exportZone = document.querySelector(".export-zone")!;
    const dangerZone = document.querySelector(".danger-zone")!;
    expect(following(notesSection, exportZone)).toBe(true);
    expect(following(exportZone, dangerZone)).toBe(true);

    // No result claim before any tap.
    expect(screen.queryByRole("status")).toBeTruthy(); // save indicator only
    expect(document.querySelector(".copy-notes-status")).toBeNull();

    // Table editing still autosaves through the normal path…
    fireEvent.change(firstExerciseInput(), {
      target: { value: "Still editable" },
    });
    await waitFor(async () => {
      const session = await todaysSession();
      expect(session.rows.find((row) => row.position === 0)?.exercise).toBe(
        "Still editable",
      );
    });

    // …and navigation back to Home still works.
    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    expect(await screen.findByRole("heading", { name: "Gym Log" })).toBeTruthy();
  });
});

describe("clipboard outcomes (AC-03)", () => {
  it("writes one ClipboardItem with both representations and reports rich success", async () => {
    await openSession();
    const writes: WriteSpy = { calls: [] };
    installClipboard({
      write: async (items) => {
        writes.calls.push(items);
      },
    });
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);

    fireEvent.click(copyButton());
    expect(await screen.findByText("Copied to Notes ✓")).toBeTruthy();

    expect(writes.calls).toHaveLength(1);
    const [item] = writes.calls[0];
    expect([...item.types].sort()).toEqual(["text/html", "text/plain"]);

    const html = await readBlobText(item.entries["text/html"]!);
    const plain = await readBlobText(item.entries["text/plain"]!);
    expect(html).toContain("Monday 24 Aug");
    expect(html).toContain("Recline curl bench 30° IR uni");
    expect(html).toContain("<table");
    expect(plain).toContain("Monday 24 Aug");
    expect(plain).toContain("Category\tExercise\tSets\tReps\tWeight\tSkip");
  });

  it("exports the edits the user just made by flushing pending saves first", async () => {
    await openSession();
    const writes: WriteSpy = { calls: [] };
    installClipboard({
      write: async (items) => {
        writes.calls.push(items);
      },
    });
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);

    // Type and tap Copy immediately — well inside the 300 ms autosave delay.
    fireEvent.change(firstExerciseInput(), {
      target: { value: "Exported mid-flight edit" },
    });
    fireEvent.click(copyButton());
    expect(await screen.findByText("Copied to Notes ✓")).toBeTruthy();

    const [item] = writes.calls[0];
    const html = await readBlobText(item.entries["text/html"]!);
    expect(html).toContain("Exported mid-flight edit");

    const session = await todaysSession();
    expect(session.rows.find((row) => row.position === 0)?.exercise).toBe(
      "Exported mid-flight edit",
    );
  });

  it("falls back to plain text and says so when the combined write fails", async () => {
    await openSession();
    const writtenTexts: string[] = [];
    installClipboard({
      write: async () => {
        throw new Error("rich representation rejected");
      },
      writeText: async (text) => {
        writtenTexts.push(text);
      },
    });
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);

    fireEvent.click(copyButton());
    expect(
      await screen.findByText("Copied as plain text (rich formatting unavailable)"),
    ).toBeTruthy();

    expect(writtenTexts).toHaveLength(1);
    expect(writtenTexts[0]).toContain("Monday 24 Aug");
    expect(writtenTexts[0]).toContain(
      "Category\tExercise\tSets\tReps\tWeight\tSkip",
    );
    expect(writtenTexts[0]).toContain("Notes");
  });

  it("falls back to plain text without calling write when ClipboardItem is unsupported", async () => {
    await openSession();
    const writtenTexts: string[] = [];
    installClipboard({
      write: async () => {
        throw new Error("must never be reached without ClipboardItem");
      },
      writeText: async (text) => {
        writtenTexts.push(text);
      },
    });
    // No ClipboardItem stub: jsdom does not define one.

    fireEvent.click(copyButton());
    expect(
      await screen.findByText("Copied as plain text (rich formatting unavailable)"),
    ).toBeTruthy();
    expect(writtenTexts).toHaveLength(1);
    expect(writtenTexts[0]).toContain("Arms Back Chest Delts Legs");
  });

  it("reports failure instead of success when the whole clipboard API is missing", async () => {
    await openSession();
    // navigator.clipboard left undefined entirely (jsdom default).

    fireEvent.click(copyButton());
    expect(
      await screen.findByText("Copy failed — clipboard unavailable"),
    ).toBeTruthy();
    expect(screen.queryByText("Copied to Notes ✓")).toBeNull();
  });

  it("reports failure when permission is denied for both attempts", async () => {
    await openSession();
    const denial = () => Promise.reject(new Error("denied"));
    installClipboard({ write: denial, writeText: denial });
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);

    fireEvent.click(copyButton());
    expect(
      await screen.findByText("Copy failed — clipboard unavailable"),
    ).toBeTruthy();
    expect(screen.queryByText("Copied to Notes ✓")).toBeNull();
    expect(screen.queryByText(/plain text/)).toBeNull();
  });
});
