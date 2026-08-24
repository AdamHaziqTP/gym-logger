import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import Dexie from "dexie";
import { App } from "../App";
import { createDb, type GymLogDB } from "../data/db";
import type { WorkoutRow, WorkoutSession } from "../domain/types";

const DB_NAME = "gym-logger";
/** Fixed local date with NO session, so seeded history never auto-resumes. */
const TODAY = "2026-08-24";
const SEED_ID = "fixture-sunday-23-aug";

let db: GymLogDB;

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
  db = createDb();
});

afterEach(() => {
  cleanup();
  db.close();
});

/** Minimal valid historical session factory for navigation fixtures. */
function makeHistoricalSession(
  overrides: Partial<WorkoutSession> = {},
): WorkoutSession {
  const rows: WorkoutRow[] = overrides.rows ?? [
    {
      id: "row-lat-pulldown",
      position: 0,
      exercise: "Lat Pulldown Wide",
      sets: "1",
      reps: "10",
      weight: "50kg",
      skip: "",
      highlight: "none",
    },
  ];
  return {
    id: overrides.id ?? "history-friday-21-aug",
    dateLocal: "2026-08-21",
    createdAt: "2026-08-21T18:00:00.000Z",
    updatedAt: "2026-08-21T19:00:00.000Z",
    rows,
    notes: "",
    ...overrides,
  };
}

/** Launches on Home (seeding the fixture), then navigates to History. */
async function openHistoryFromHome() {
  render(<App db={db} todayLocal={TODAY} />);
  // Home reflects the seeded fixture before any navigation.
  expect(await screen.findByText(/40 sets · 39 exercises/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "History" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "History" }));
  expect(await screen.findByRole("heading", { name: "History" })).toBeTruthy();
}

describe("History flow — Home → History → session → back (M02-T01)", () => {
  it("lists every stored session newest-first with date and summary only, never inline tables", async () => {
    await openHistoryFromHome();

    // A second, older historical session joins the seeded one (live update).
    await act(async () => {
      await db.sessions.put(makeHistoricalSession());
    });

    const list = await screen.findByRole("list", { name: "Session history" });
    const sunday = within(list).getByRole("button", {
      name: "Open session Sunday 23 Aug",
    });
    const friday = within(list).getByRole("button", {
      name: "Open session Friday 21 Aug",
    });
    // Newest (Sunday 23 Aug) renders BEFORE Friday 21 Aug (spec §11.1, F2).
    expect(
      sunday.compareDocumentPosition(friday) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // Summary lines only — never inline workout tables (spec §11.1, F1).
    expect(within(list).getByText("40 sets · 39 exercises")).toBeTruthy();
    expect(within(list).getByText("1 sets · 1 exercises")).toBeTruthy();
    expect(document.querySelector("table")).toBeNull();
  });

  it("filters locally through the search field and restores everything when cleared", async () => {
    await openHistoryFromHome();
    await act(async () => {
      await db.sessions.put(makeHistoricalSession());
    });

    const search = screen.getByLabelText("Search sessions");
    // Case-insensitive exercise-text match narrows the list to one session.
    fireEvent.change(search, { target: { value: "LAT PULLDOWN" } });
    await waitFor(() => {
      expect(screen.queryByText("Sunday 23 Aug")).toBeNull();
    });
    expect(screen.getByText("Friday 21 Aug")).toBeTruthy();

    // Emptying the query restores the complete reverse-chronological list
    // (spec §11.2; AC-03).
    fireEvent.change(search, { target: { value: "" } });
    expect(await screen.findByText("Sunday 23 Aug")).toBeTruthy();
    expect(screen.getByText("Friday 21 Aug")).toBeTruthy();
  });

  it("opens a historical session editable, persists cell/notes edits to that session, and returns to History", async () => {
    await openHistoryFromHome();

    fireEvent.click(
      screen.getByRole("button", { name: "Open session Sunday 23 Aug" }),
    );

    // The existing editable SessionView opens for the HISTORICAL session
    // (spec §11.3, F5) — history is not read-only.
    expect(
      await screen.findByRole("heading", { name: "Sunday 23 Aug" }),
    ).toBeTruthy();

    const weightInputs = screen.getAllByLabelText(/^Weight row /);
    fireEvent.change(weightInputs[0], {
      target: { value: "9 kg slow tempo" },
    });
    fireEvent.blur(weightInputs[0]);

    const notes = screen.getByLabelText("Session notes");
    fireEvent.change(notes, { target: { value: "Edited from History ✓" } });
    fireEvent.blur(notes);

    // Both edits land in the SAME stored historical record — no copy made.
    await waitFor(async () => {
      const stored = await db.sessions.get(SEED_ID);
      const firstRow = stored?.rows.find((row) => row.position === 0);
      expect(firstRow?.weight).toBe("9 kg slow tempo");
      expect(stored?.notes).toBe("Edited from History ✓");
    });
    expect(await db.sessions.toArray()).toHaveLength(1);

    // Back returns to the History list this session was opened from (AC-01),
    // not Home.
    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    expect(
      await screen.findByRole("heading", { name: "History" }),
    ).toBeTruthy();

    // Reopening the same historical entry shows the persisted edits.
    fireEvent.click(
      screen.getByRole("button", { name: "Open session Sunday 23 Aug" }),
    );
    expect(await screen.findByDisplayValue("9 kg slow tempo")).toBeTruthy();
    expect(screen.getByDisplayValue("Edited from History ✓")).toBeTruthy();
  });

  it("keeps historical edits after a full remount (reload persistence, AC-04)", async () => {
    await openHistoryFromHome();
    fireEvent.click(
      screen.getByRole("button", { name: "Open session Sunday 23 Aug" }),
    );
    const exerciseInput = await screen.findByDisplayValue(
      "Recline curl bench 30° IR uni",
    );
    fireEvent.change(exerciseInput, {
      target: { value: "Recline curl bench edited from history" },
    });
    fireEvent.blur(exerciseInput);
    await waitFor(async () => {
      const stored = await db.sessions.get(SEED_ID);
      expect(
        stored?.rows.some(
          (row) => row.exercise === "Recline curl bench edited from history",
        ),
      ).toBe(true);
    });

    // "Reload": fresh App mount against the same IndexedDB. No session exists
    // for TODAY, so the app must land on Home (not resume anywhere).
    cleanup();
    render(<App db={db} todayLocal={TODAY} />);
    expect(await screen.findByText("Gym Log")).toBeTruthy();
    expect(
      await screen.findByRole("button", { name: "Start Today's Session" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "History" }));
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Open session Sunday 23 Aug",
      }),
    );
    expect(
      await screen.findByDisplayValue(
        "Recline curl bench edited from history",
      ),
    ).toBeTruthy();
  });
});
