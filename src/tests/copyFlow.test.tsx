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
const TRAVEL_ID = "history-friday-21-aug";

let db: GymLogDB;

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
  db = createDb();
});

afterEach(() => {
  cleanup();
  db.close();
});

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * A non-latest historical source (spec §4.3 motivation: e.g. a travel
 * workout). Defaults to clean Skip/notes so individual tests can opt into
 * values that exercise the clone policy.
 */
function makeTravelSession(
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
    {
      id: "row-cable-row",
      position: 1,
      exercise: "Cable Row",
      sets: "1",
      reps: "12",
      weight: "body weight",
      skip: "",
      highlight: "purple",
    },
  ];
  return {
    id: TRAVEL_ID,
    dateLocal: "2026-08-21",
    createdAt: "2026-08-21T18:00:00.000Z",
    updatedAt: "2026-08-21T19:00:00.000Z",
    rows,
    notes: "",
    ...overrides,
  };
}

/** Launches on Home (seeding the fixture), then opens the copy picker. */
async function openCopyPicker() {
  render(<App db={db} todayLocal={TODAY} />);
  // Home reflects the seeded fixture before any navigation.
  expect(await screen.findByText(/40 sets · 39 exercises/)).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Copy Another Session" }),
  );
  expect(
    await screen.findByRole("heading", { name: "Copy Another Session" }),
  ).toBeTruthy();
}

describe("Copy Another Session flow (M02-T02)", () => {
  it("exposes Copy Another Session on Home without removing existing controls", async () => {
    render(<App db={db} todayLocal={TODAY} />);
    await screen.findByText(/40 sets · 39 exercises/);

    // All four spec §4.1 controls coexist.
    expect(
      screen.getByRole("button", { name: "Start Today's Session" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "View" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "History" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Copy Another Session" }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Copy Another Session" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Copy Another Session" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    expect(
      await screen.findByRole("button", { name: "Start Today's Session" }),
    ).toBeTruthy();
  });

  it("lists sources newest-first and filters them through the local search field", async () => {
    await openCopyPicker();
    await act(async () => {
      // Notes text gives this session a search surface no other session has.
      await db.sessions.put(
        makeTravelSession({ notes: "hotel gym, band only" }),
      );
    });

    const list = await screen.findByRole("list", {
      name: "Copy source sessions",
    });
    const sunday = within(list).getByRole("button", {
      name: "Pick session Sunday 23 Aug",
    });
    const friday = within(list).getByRole("button", {
      name: "Pick session Friday 21 Aug",
    });
    // Newest first (spec §4.3 step 2 reuses History ordering).
    expect(
      sunday.compareDocumentPosition(friday) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // Same local search surfaces as History (AC-02): bottom-notes match.
    const search = screen.getByLabelText("Search sessions");
    fireEvent.change(search, { target: { value: "HOTEL GYM" } });
    await waitFor(() => {
      expect(screen.queryByText("Sunday 23 Aug")).toBeNull();
    });
    expect(screen.getByText("Friday 21 Aug")).toBeTruthy();

    fireEvent.change(search, { target: { value: "" } });
    expect(await screen.findByText("Sunday 23 Aug")).toBeTruthy();
    expect(screen.getByText("Friday 21 Aug")).toBeTruthy();
  });

  it("shows a compact READ preview with date and summary — no editable table", async () => {
    await openCopyPicker();
    fireEvent.click(
      screen.getByRole("button", { name: "Pick session Sunday 23 Aug" }),
    );

    // Date and summary from the SOURCE (spec §4.3 step 4; AC-03).
    expect(
      await screen.findByRole("heading", { name: "Sunday 23 Aug" }),
    ).toBeTruthy();
    expect(screen.getAllByText(/40 sets · 39 exercises/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Use This Session" }),
    ).toBeTruthy();

    // Read-oriented: no workout table anywhere, no editable inputs at all.
    expect(document.querySelector("table")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Choose Another Session" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Copy Another Session" }),
    ).toBeTruthy();
  });

  it("creates exactly one today session from the chosen source and opens it immediately", async () => {
    await openCopyPicker();
    // Source carries Skip entries, notes, and an override so the clone
    // policy is observable end-to-end.
    await act(async () => {
      await db.sessions.put(
        makeTravelSession({
          rows: [
            {
              id: "row-lat-pulldown",
              position: 0,
              exercise: "Lat Pulldown Wide",
              sets: "1",
              reps: "10",
              weight: "50kg",
              skip: "skip",
              highlight: "pink",
            },
            {
              id: "row-cable-row",
              position: 1,
              exercise: "Cable Row",
              sets: "1",
              reps: "12",
              weight: "body weight",
              skip: "",
              highlight: "purple",
            },
          ],
          notes: "travel workout, hotel gym",
          summaryOverride: { sets: "5", exercises: "4" },
        }),
      );
    });
    await screen.findByText("Friday 21 Aug");

    fireEvent.click(
      screen.getByRole("button", { name: "Pick session Friday 21 Aug" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Use This Session" }),
    );

    // Opens immediately as TODAY's session (spec §4.3 step 6).
    expect(
      await screen.findByRole("heading", { name: "Monday 24 Aug" }),
    ).toBeTruthy();
    expect(await screen.findByDisplayValue("Lat Pulldown Wide")).toBeTruthy();
    expect(screen.getByDisplayValue("body weight")).toBeTruthy();
    expect(document.querySelectorAll("table tbody tr")).toHaveLength(2);

    // Exactly one today session; fresh ids; provenance points at the CHOSEN
    // non-latest source (A5).
    const todays = await db.sessions
      .where("dateLocal")
      .equals(TODAY)
      .toArray();
    expect(todays).toHaveLength(1);
    const clone = todays[0];
    expect(clone.id).toMatch(UUID_PATTERN);
    expect(clone.id).not.toBe(TRAVEL_ID);
    expect(clone.sourceSessionId).toBe(TRAVEL_ID);

    // Row order/text/highlights cloned literally.
    expect(
      clone.rows.map((row) => [row.exercise, row.sets, row.reps, row.weight]),
    ).toEqual([
      ["Lat Pulldown Wide", "1", "10", "50kg"],
      ["Cable Row", "1", "12", "body weight"],
    ]);
    expect(clone.rows.map((row) => row.highlight)).toEqual(["pink", "purple"]);
    for (const row of clone.rows) {
      expect(row.id).toMatch(UUID_PATTERN);
      expect(row.id.startsWith("row-")).toBe(false);
    }

    // DEFAULT_CLONE_POLICY: Skip + notes cleared, override preserved.
    expect(clone.rows.every((row) => row.skip === "")).toBe(true);
    expect(clone.notes).toBe("");
    expect(clone.summaryOverride).toEqual({ sets: "5", exercises: "4" });

    // The source record itself is untouched.
    const source = await db.sessions.get(TRAVEL_ID);
    expect(source?.rows[0].skip).toBe("skip");
    expect(source?.notes).toBe("travel workout, hotel gym");
    // Seed + travel source + the one clone: nothing else was created.
    expect(await db.sessions.count()).toBe(3);
  });

  it("warns before replacing an existing today session; cancel changes nothing", async () => {
    await openCopyPicker();
    await act(async () => {
      await db.sessions.put(makeTravelSession());
    });

    // Create today's session through the normal Start path first.
    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Start Today's Session" }),
    );
    await screen.findByDisplayValue("Recline curl bench 30° IR uni");
    const original = await db.sessions
      .where("dateLocal")
      .equals(TODAY)
      .toArray();
    expect(original).toHaveLength(1);
    const originalTodayId = original[0].id;

    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Copy Another Session" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Pick session Friday 21 Aug" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Use This Session" }),
    );

    // Explicit warning appears; nothing has been written yet.
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Replace today's session?")).toBeTruthy();
    expect(
      within(dialog).getByText(
        "A session for Monday 24 Aug already exists. Use This Session replaces it with a fresh copy of Friday 21 Aug. Your Apple Notes archive is not affected.",
      ),
    ).toBeTruthy();

    // Cancel: no clone, no replacement, still on the preview.
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });
    let sessions = await db.sessions.toArray();
    expect(sessions).toHaveLength(3); // seed + travel + untouched today
    let todays = sessions.filter((session) => session.dateLocal === TODAY);
    expect(todays).toHaveLength(1);
    expect(todays[0].id).toBe(originalTodayId);

    // Second attempt confirmed: REPLACES today's session — never duplicates.
    fireEvent.click(
      await screen.findByRole("button", { name: "Use This Session" }),
    );
    const redialog = await screen.findByRole("alertdialog");
    fireEvent.click(
      within(redialog).getByRole("button", {
        name: "Replace Today's Session",
      }),
    );

    expect(
      await screen.findByRole("heading", { name: "Monday 24 Aug" }),
    ).toBeTruthy();
    expect(await screen.findByDisplayValue("Lat Pulldown Wide")).toBeTruthy();

    sessions = await db.sessions.toArray();
    expect(sessions).toHaveLength(3); // replaced, not added
    todays = sessions.filter((session) => session.dateLocal === TODAY);
    expect(todays).toHaveLength(1);
    expect(todays[0].id).not.toBe(originalTodayId);
    expect(todays[0].sourceSessionId).toBe(TRAVEL_ID);
    expect(todays[0].rows.map((row) => row.exercise)).toEqual([
      "Lat Pulldown Wide",
      "Cable Row",
    ]);
  });

  it("ignores a second Use This Session tap while the clone is resolving", async () => {
    await openCopyPicker();
    fireEvent.click(
      screen.getByRole("button", { name: "Pick session Sunday 23 Aug" }),
    );

    const useButton = () =>
      screen.getByRole("button", { name: "Use This Session" }) as HTMLButtonElement;
    await screen.findByRole("button", { name: "Use This Session" });

    useButton().click();
    if (!useButton().disabled) {
      useButton().click(); // second tap while resolving must be ignored
    }

    expect(
      await screen.findByRole("heading", { name: "Monday 24 Aug" }),
    ).toBeTruthy();

    const todays = await db.sessions
      .where("dateLocal")
      .equals(TODAY)
      .toArray();
    expect(todays).toHaveLength(1);
    expect(todays[0].sourceSessionId).toBe(SEED_ID);
    expect(await db.sessions.count()).toBe(2);
  });
});
