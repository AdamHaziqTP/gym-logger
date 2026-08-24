import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import Dexie from "dexie";
import { App } from "../App";
import { createDb, type GymLogDB } from "../data/db";
import { clearRowClipboard } from "../domain/rowClipboard";

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
});

/* ------------------------------ helpers ------------------------------ */

async function openSession(): Promise<void> {
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

function handles(): HTMLButtonElement[] {
  return [
    ...document.querySelectorAll<HTMLButtonElement>("tbody .row-handle"),
  ];
}

function handle(index: number): HTMLButtonElement {
  const list = handles();
  expect(list.length).toBeGreaterThan(index);
  return list[index];
}

async function todaysSession() {
  const sessions = await db.sessions.toArray();
  return sessions.find((session) => session.dateLocal === TODAY)!;
}

/** Selects a row via its handle (first tap) and opens the menu (second). */
async function openMenuForRow(index: number): Promise<void> {
  fireEvent.click(handle(index)); // select
  fireEvent.click(handle(index)); // selected → menu
  await screen.findByRole("menu", { name: "Row actions" });
}

function menuItem(name: string): HTMLButtonElement {
  return screen.getByRole("menuitem", { name }) as HTMLButtonElement;
}

/**
 * jsdom has no PointerEvent implementation; React only needs a bubbling event
 * with the right type plus pointer coordinates.
 */
function firePointer(
  target: HTMLElement | Window | Document,
  type: string,
  clientY: number,
): void {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, "clientX", { value: 10 });
  Object.defineProperty(event, "clientY", { value: clientY });
  fireEvent(target, event);
}

function makeRect(top: number, height: number): DOMRect {
  return {
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 100,
    width: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

/**
 * Stubs each displayed row's rect from its CURRENT DOM index so drag hit-testing
 * works in jsdom and stays correct across live preview reorders.
 */
const ROW_HEIGHT = 44;
function stubRowRects(): void {
  document
    .querySelectorAll<HTMLElement>("#workout-tbody tr[data-row-id]")
    .forEach((el) => {
      el.getBoundingClientRect = () => {
        const siblings = [
          ...document.querySelectorAll<HTMLElement>(
            "#workout-tbody tr[data-row-id]",
          ),
        ];
        const index = siblings.indexOf(el);
        return makeRect((index === -1 ? 0 : index) * ROW_HEIGHT, ROW_HEIGHT);
      };
    });
}

function exerciseValues(): string[] {
  return screen
    .getAllByLabelText(/^Exercise row /)
    .map((input) => (input as HTMLInputElement).value);
}

function normalizedPositions(rows: { position: number }[]): number[] {
  return rows.map((row) => row.position);
}

/* ------------------------------- tests ------------------------------- */

describe("category legend", () => {
  it("renders the approved labels and mapping between date and summary", async () => {
    await openSession();

    const legend = screen.getByLabelText("Category legend");
    const items = within(legend).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Arms",
      "Back",
      "Chest",
      "Delts",
      "Legs",
      "Other",
    ]);

    // Content order: date → category legend → sets/exercises summary → table.
    const title = screen.getByRole("heading", { name: "Monday 24 Aug" });
    const summary = screen.getByLabelText("Edit session summary");
    const following = (a: Element, b: Element) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    expect(following(title, legend)).toBe(true);
    expect(following(legend, summary)).toBe(true);

    // The legend renders the Arms entry with its dot.
    expect(within(items[0]).getByText("Arms")).toBeTruthy();
  });
});

describe("row handle selection and menu", () => {
  it("first tap selects the whole row; second tap opens the full command menu", async () => {
    await openSession();

    // First tap: selects — clear non-colour treatment, no menu yet.
    fireEvent.click(handle(0));
    const selectedTr = document.querySelector("tr.selected");
    const firstTr = document.querySelector("#workout-tbody tr[data-row-id]");
    // The selected treatment landed on row 1 of the table.
    expect(selectedTr).not.toBeNull();
    expect(selectedTr!.getAttribute("data-row-id")).toBe(
      firstTr!.getAttribute("data-row-id"),
    );
    expect((handle(0).getAttribute("aria-pressed"))).toBe("true");
    expect(handle(0).className).toContain("active");
    expect(screen.queryByRole("menu")).toBeNull();
    // Selection alone must not open the colour control.
    expect(screen.queryByText("Row colour")).toBeNull();

    // Second tap on the selected handle opens the row menu.
    fireEvent.click(handle(0));
    const menu = await screen.findByRole("menu", { name: "Row actions" });
    for (const label of [
      "Add Row Above",
      "Add Row Below",
      "Duplicate Row",
      "Copy",
      "Cut",
      "Colour",
      "Delete Row",
    ]) {
      expect(within(menu).getByRole("menuitem", { name: label })).toBeTruthy();
    }
    // Paste exists but is disabled while nothing was copied.
    const paste = within(menu).getByRole("menuitem", { name: "Paste" });
    expect((paste as HTMLButtonElement).disabled).toBe(true);

    // Tapping outside the menu (the dimmed backdrop) dismisses it without
    // losing data or selection.
    fireEvent.click(document.querySelector(".menu-backdrop")!);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.querySelector("tr.selected")).not.toBeNull();
  });

  it("enables Paste once a row was copied and pastes its data below with a new identity", async () => {
    await openSession();

    await openMenuForRow(0);
    fireEvent.click(menuItem("Copy"));
    expect(screen.queryByRole("menu")).toBeNull(); // command closes the menu

    // Reopen anywhere: Paste is now meaningful.
    await openMenuForRow(3);
    const paste = menuItem("Paste");
    expect(paste.disabled).toBe(false);
    fireEvent.click(paste);

    // Pasted below row index 3 ("Dumbell Pullover").
    await waitFor(async () => {
      const session = await todaysSession();
      expect(session.rows).toHaveLength(41);
    });

    const session = await todaysSession();
    // Cloned rows carry fresh UUIDs, so original vs paste is told apart by
    // position: the copied row sat at position 0, the paste landed at slot 4
    // (below selected row index 3, "Dumbell Pullover").
    const source = session.rows.find(
      (row) =>
        row.exercise === "Recline curl bench 30° IR uni" && row.position === 0,
    )!;
    const pasted = session.rows.find(
      (row) =>
        row.exercise === "Recline curl bench 30° IR uni" && row.position === 4,
    )!;
    expect(pasted.id).not.toBe(source.id);
    expect(pasted.sets).toBe(source.sets);
    expect(pasted.reps).toBe(source.reps);
    expect(pasted.weight).toBe(source.weight);
    expect(pasted.skip).toBe(source.skip);
    expect(pasted.highlight).toBe(source.highlight); // orange
    expect(normalizedPositions(session.rows)).toEqual([...Array(41).keys()]);
  });

  it("Cut removes the source row without losing the copied data", async () => {
    await openSession();

    // Row index 2 = "Dumbell bilateral front raise" (blue).
    await openMenuForRow(2);
    fireEvent.click(menuItem("Cut"));

    // Source row removed immediately…
    await waitFor(async () => {
      expect(screen.queryByDisplayValue("Dumbell bilateral front raise")).toBeNull();
    });
    let session = await todaysSession();
    expect(session.rows).toHaveLength(39);
    expect(normalizedPositions(session.rows)).toEqual([...Array(39).keys()]);
    // …with the temporary Undo affordance (spec §7.4), no confirmation modal.
    expect(screen.getByText("Row deleted")).toBeTruthy();

    // Clipboard kept the cut data even though the source is gone.
    await openMenuForRow(0);
    expect(menuItem("Paste").disabled).toBe(false);
    fireEvent.click(menuItem("Paste"));

    await waitFor(async () => {
      session = await todaysSession();
      expect(session.rows).toHaveLength(40);
    });
    session = await todaysSession();
    const restored = session.rows.find(
      (row) => row.exercise === "Dumbell bilateral front raise",
    )!;
    expect(restored.id).not.toBe("r03"); // fresh identity
    expect(restored.highlight).toBe("blue");
    expect(restored.position).toBe(1);
    expect(normalizedPositions(session.rows)).toEqual([...Array(40).keys()]);
  });

  it("Delete removes the selected row and Undo restores it exactly", async () => {
    await openSession();

    // Row index 5 = "Chest Press Neutral 5" (mint).
    await openMenuForRow(5);
    fireEvent.click(menuItem("Delete Row"));

    await waitFor(async () => {
      expect(screen.queryByDisplayValue("Chest Press Neutral 5")).toBeNull();
    });
    expect(screen.getByText("Row deleted")).toBeTruthy();
    let session = await todaysSession();
    expect(session.rows).toHaveLength(39);
    expect(normalizedPositions(session.rows)).toEqual([...Array(39).keys()]);
    // Deselected after delete: no menu or colour bar lingers.
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.querySelector("tr.selected")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(async () => {
      session = await todaysSession();
      expect(session.rows).toHaveLength(40);
    });
    session = await todaysSession();
    const restored = session.rows.find(
      (row) => row.exercise === "Chest Press Neutral 5",
    )!;
    expect(restored.highlight).toBe("mint");
    expect(restored.position).toBe(5);
    expect(normalizedPositions(session.rows)).toEqual([...Array(40).keys()]);
    // Exact values around it are untouched by the delete/restore cycle.
    expect(exerciseValues()[4]).toBe("Abducted dumbell External Rotation");
    expect(exerciseValues()[5]).toBe("Chest Press Neutral 5");
    expect(exerciseValues()[6]).toBe("Chest Press decline 9");
  });

  it("Add Row Above/Below insert blank rows at the right positions", async () => {
    await openSession();

    await openMenuForRow(1);
    fireEvent.click(menuItem("Add Row Above"));

    await waitFor(async () => {
      const session = await todaysSession();
      expect(session.rows).toHaveLength(41);
    });
    expect(exerciseValues()[0]).toBe("Recline curl bench 30° IR uni"); // r01 untouched at top
    expect(exerciseValues()[1]).toBe(""); // blank landed above old row 2
    let session = await todaysSession();
    const blank = session.rows.find((row) => row.position === 1)!;
    expect(blank).toMatchObject({
      exercise: "",
      sets: "",
      reps: "",
      weight: "",
      skip: "",
      highlight: "none",
    });
    expect(normalizedPositions(session.rows)).toEqual([...Array(41).keys()]);

    // Add Below relative to the same original row (now shifted to index 2).
    await openMenuForRow(2);
    fireEvent.click(menuItem("Add Row Below"));

    await waitFor(async () => {
      session = await todaysSession();
      expect(session.rows).toHaveLength(42);
    });
    expect(exerciseValues()[3]).toBe(""); // blank directly under old row 2
    session = await todaysSession();
    expect(normalizedPositions(session.rows)).toEqual([...Array(42).keys()]);
  });

  it("Duplicate Row creates an exact copy with a fresh identity", async () => {
    await openSession();

    // Row index 9 = "Saggital Flap Uni internally rotated cables" (purple).
    await openMenuForRow(9);
    fireEvent.click(menuItem("Duplicate Row"));

    await waitFor(async () => {
      const session = await todaysSession();
      expect(session.rows).toHaveLength(41);
    });
    const session = await todaysSession();
    // Cloned rows have UUID identities: source at position 9, copy at 10.
    const source = session.rows.find(
      (row) =>
        row.exercise === "Saggital Flap Uni internally rotated cables" &&
        row.position === 9,
    )!;
    const copy = session.rows.find(
      (row) => row.exercise === source.exercise && row.position === 10,
    )!;
    expect(copy.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(copy.id).not.toBe(source.id);
    expect(copy.sets).toBe(source.sets);
    expect(copy.reps).toBe(source.reps);
    expect(copy.weight).toBe(source.weight);
    expect(copy.skip).toBe(source.skip);
    expect(copy.highlight).toBe("purple");
    expect(copy.position).toBe(source.position + 1);
    expect(normalizedPositions(session.rows)).toEqual([...Array(41).keys()]);
    // Both copies visible in the table.
    expect(
      screen.getAllByDisplayValue("Saggital Flap Uni internally rotated cables"),
    ).toHaveLength(2);
  });

  it("Colour opens the existing palette and keeps the locked mapping", async () => {
    await openSession();

    // Row index 17 = "Ab Cable Crunch inc", currently Other/none.
    await openMenuForRow(17);
    fireEvent.click(menuItem("Colour"));

    const toolbar = await screen.findByRole("toolbar", { name: "Row colour" });
    const labels = within(toolbar)
      .getAllByRole("button")
      .map((button) => button.textContent);
    expect(labels.join("|")).toContain("None");
    expect(labels.join("|")).toContain("Arms");
    expect(labels.join("|")).toContain("Back");
    expect(labels.join("|")).toContain("Chest");
    expect(labels.join("|")).toContain("Delts");
    expect(labels.join("|")).toContain("Legs");

    fireEvent.click(within(toolbar).getByRole("button", { name: "Legs" }));

    await waitFor(async () => {
      const session = await todaysSession();
      const row = session.rows.find(
        (item) => item.exercise === "Ab Cable Crunch inc",
      )!;
      expect(row.highlight).toBe("pink");
    });
    // No other row was touched by the colour command.
    const session = await todaysSession();
    expect(
      session.rows.find((row) => row.exercise === "Recline curl bench 30° IR uni")!
        .highlight,
    ).toBe("orange");
    expect(exerciseValues()[17]).toBe("Ab Cable Crunch inc");
  });
});

describe("drag reorder", () => {
  it("reorders via pointer drag on the selected handle, preserving data and normalizing positions", async () => {
    await openSession();
    stubRowRects();

    // Select row 1, then press its handle and drag it below three rows.
    fireEvent.click(handle(0));
    firePointer(handle(0), "pointerdown", ROW_HEIGHT / 2);
    stubRowRects();
    // Land between the midpoints of displayed rows 3 and 4 → target index 3.
    const dropY = ROW_HEIGHT * 2 + ROW_HEIGHT / 2 + 20;
    firePointer(window, "pointermove", dropY);

    // The live preview must render (and flush refs) before release.
    await waitFor(() => {
      expect(exerciseValues()[3]).toBe("Recline curl bench 30° IR uni");
    });
    firePointer(window, "pointerup", dropY);

    await waitFor(async () => {
      const session = await todaysSession();
      const ordered = [...session.rows].sort((a, b) => a.position - b.position);
      expect(ordered.slice(0, 4).map((row) => row.exercise)).toEqual([
        "Recline curl bench 30° ER bilateral",
        "Dumbell bilateral front raise",
        "Dumbell Pullover",
        "Recline curl bench 30° IR uni",
      ]);
    });

    const session = await todaysSession();
    expect(normalizedPositions(session.rows)).toEqual([...Array(40).keys()]);
    // Every cell and highlight survived the move (identity unchanged).
    expect(
      session.rows.find(
        (row) => row.exercise === "Recline curl bench 30° IR uni",
      )!,
    ).toMatchObject({ position: 3, highlight: "orange" });
    // The dragged row keeps its data in the DOM at its new slot.
    expect(exerciseValues().slice(0, 4)).toEqual([
      "Recline curl bench 30° ER bilateral",
      "Dumbell bilateral front raise",
      "Dumbell Pullover",
      "Recline curl bench 30° IR uni",
    ]);
  });
});

describe("current-session resume", () => {
  it("reopens an existing current session directly; Home remains reachable via Gym Log", async () => {
    await openSession();

    // Simulate leaving and coming back: remount against the same database.
    cleanup();
    render(<App db={db} todayLocal={TODAY} />);

    // Direct resume — no Home hop, no Continue click needed.
    expect(
      await screen.findByDisplayValue("Recline curl bench 30° IR uni"),
    ).toBeTruthy();
    expect(document.querySelectorAll("table tbody tr")).toHaveLength(40);

    // Deliberate navigation home still works and offers Continue (§27.1).
    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    expect(
      await screen.findByRole("button", { name: /Continue Today's Session/ }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: /Continue Today's Session/ }),
    );
    expect(await screen.findByDisplayValue("Recline curl bench 30° IR uni")).toBeTruthy();
  });
});
