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
import { createDb, deleteSession, type GymLogDB } from "../data/db";
import { ensureSeeded } from "../data/seed";
import type { WorkoutRow, WorkoutSession } from "../domain/types";

const DB_NAME = "gym-logger";
/** Fixed local date with NO session, so seeded history never auto-resumes. */
const TODAY = "2026-08-24";
const SEED_ID = "fixture-sunday-23-aug";
const TRAVEL_ID = "history-friday-21-aug";
/** Spec §11.4 / M02-T03 required confirmation copy — asserted VERBATIM. */
const REQUIRED_COPY =
  "Delete this session from Gym Log? This does not affect your Apple Notes archive.";

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

/** Launches on Home (seeding the fixture), then navigates to History. */
async function openHistoryFromHome() {
  render(<App db={db} todayLocal={TODAY} />);
  expect(await screen.findByText(/40 sets · 39 exercises/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "History" }));
  expect(await screen.findByRole("heading", { name: "History" })).toBeTruthy();
}

/** Opens a stored session's record for snapshot/preservation comparisons. */
async function stored(id: string): Promise<WorkoutSession | undefined> {
  return db.sessions.get(id);
}

describe("Whole-session delete flow (M02-T03)", () => {
  it("offers a discoverable whole-session Delete action inside the existing session flow (AC-01)", async () => {
    await openHistoryFromHome();
    fireEvent.click(
      screen.getByRole("button", { name: "Open session Sunday 23 Aug" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Sunday 23 Aug" }),
    ).toBeTruthy();

    // The affordance lives at the end of the session screen; nothing else on
    // the editor changed (table, notes, row menu all remain reachable).
    const trigger = screen.getByRole("button", { name: "Delete Session" });
    expect(trigger).toBeTruthy();

    // Arming alone must not remove anything…
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toBeTruthy();
    // …and no whole-session delete happens without the dialog's confirm.
    expect(await stored(SEED_ID)).toBeTruthy();
  });

  it("always confirms first, using the exact specified Apple Notes-safe wording (AC-02)", async () => {
    await openHistoryFromHome();
    fireEvent.click(
      screen.getByRole("button", { name: "Open session Sunday 23 Aug" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Delete Session" }),
    );

    const dialog = await screen.findByRole("alertdialog");
    // The spec §11.4 copy, verbatim, as one continuous string.
    expect(within(dialog).getByText(REQUIRED_COPY)).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(
      within(dialog).getByRole("button", { name: "Delete Session" }),
    ).toBeTruthy();

    // Opening the dialog wrote nothing.
    expect(await stored(SEED_ID)).toBeTruthy();
    expect(await db.sessions.count()).toBe(1);
  });

  it("Cancel (and backdrop dismissal) performs no deletion; session and view stay intact (AC-03)", async () => {
    await openHistoryFromHome();
    // Insert AFTER Home has rendered from the seed alone (same ordering the
    // other flow suites use): otherwise this newer session becomes the Home
    // "Last Workout" card and the seeded 40/39 line never appears there.
    await act(async () => {
      await db.sessions.put(makeTravelSession());
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Open session Sunday 23 Aug" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Sunday 23 Aug" }),
    ).toBeTruthy();

    const seedBefore = await stored(SEED_ID);

    fireEvent.click(
      screen.getByRole("button", { name: "Delete Session" }),
    );
    let dialog = await screen.findByRole("alertdialog");

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    // Still viewing the SAME session — no navigation change occurred.
    expect(
      screen.getByRole("heading", { name: "Sunday 23 Aug" }),
    ).toBeTruthy();

    // Every record untouched; the target is byte-for-byte identical.
    let sessions = await db.sessions.toArray();
    expect(sessions).toHaveLength(2);
    expect(await stored(SEED_ID)).toEqual(seedBefore);

    // Re-arm and cancel through the backdrop this time — same outcome.
    fireEvent.click(
      screen.getByRole("button", { name: "Delete Session" }),
    );
    dialog = await screen.findByRole("alertdialog");
    fireEvent.click(document.querySelector(".confirm-backdrop")!);
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });
    expect(
      screen.getByRole("heading", { name: "Sunday 23 Aug" }),
    ).toBeTruthy();
    sessions = await db.sessions.toArray();
    expect(sessions).toHaveLength(2);
    expect(await stored(SEED_ID)).toEqual(seedBefore);
  });

  it("Confirm deletes ONLY the selected session and returns to History without a stale view (AC-04, AC-05)", async () => {
    await openHistoryFromHome();
    await act(async () => {
      await db.sessions.put(makeTravelSession());
    });
    await screen.findByText("Friday 21 Aug");

    // Snapshot the OTHER session before deletion for the preservation check.
    const seedBefore = await stored(SEED_ID);

    fireEvent.click(
      screen.getByRole("button", { name: "Open session Friday 21 Aug" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Friday 21 Aug" }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Delete Session" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(REQUIRED_COPY)).toBeTruthy();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete Session" }),
    );

    // Back to the stable existing screen the session was opened from…
    expect(
      await screen.findByRole("heading", { name: "History" }),
    ).toBeTruthy();
    // …with NO stale deleted-session view anywhere.
    expect(screen.queryByRole("heading", { name: "Friday 21 Aug" })).toBeNull();
    expect(document.querySelector("table")).toBeNull();

    // The deleted session is gone from the History list too.
    await waitFor(async () => {
      expect(await db.sessions.get(TRAVEL_ID)).toBeUndefined();
    });
    const list = screen.getByRole("list", { name: "Session history" });
    expect(
      within(list).queryByRole("button", {
        name: "Open session Friday 21 Aug",
      }),
    ).toBeNull();
    expect(
      within(list).getByRole("button", { name: "Open session Sunday 23 Aug" }),
    ).toBeTruthy();

    // Exactly one session remains, and it was NOT mutated by the deletion.
    expect(await db.sessions.count()).toBe(1);
    expect(await stored(SEED_ID)).toEqual(seedBefore);
  });

  it("deleting today's resumed session returns to Home, which offers Start again; a remount never shows the deleted session (AC-04)", async () => {
    render(<App db={db} todayLocal={TODAY} />);
    await screen.findByText(/40 sets · 39 exercises/);
    fireEvent.click(
      screen.getByRole("button", { name: "Start Today's Session" }),
    );
    await screen.findByDisplayValue("Recline curl bench 30° IR uni");

    const todays = await db.sessions
      .where("dateLocal")
      .equals(TODAY)
      .toArray();
    expect(todays).toHaveLength(1);
    const todayId = todays[0].id;

    fireEvent.click(
      screen.getByRole("button", { name: "Delete Session" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete Session" }),
    );

    // Opened from Home → back lands on Home, now offering a fresh Start.
    expect(
      await screen.findByRole("button", { name: "Start Today's Session" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Monday 24 Aug" })).toBeNull();

    // Only the seeded fixture remains.
    expect(await db.sessions.count()).toBe(1);
    expect(await db.sessions.get(todayId)).toBeUndefined();

    // "Reload": the bootstrap finds no current session anymore, so it must
    // land on Home — never resume the deleted record.
    cleanup();
    render(<App db={db} todayLocal={TODAY} />);
    expect(
      await screen.findByRole("button", { name: "Start Today's Session" }),
    ).toBeTruthy();
    expect(
      screen.queryByDisplayValue("Recline curl bench 30° IR uni"),
    ).toBeNull();
    expect(await db.sessions.count()).toBe(1);
  });
});

describe("deleteSession data operation (M02-T03)", () => {
  /** Seeds the fixture and inserts the travel session; returns pre-delete copies. */
  async function seedTwoSessions() {
    await ensureSeeded(db);
    await db.sessions.put(makeTravelSession());
    const before = {
      seed: await stored(SEED_ID),
      travel: await stored(TRAVEL_ID),
    };
    return before;
  }

  it("removes exactly the target record and leaves every other record untouched", async () => {
    const before = await seedTwoSessions();

    const removed = await deleteSession(db, TRAVEL_ID);
    expect(removed).toBe(true);

    expect(await db.sessions.get(TRAVEL_ID)).toBeUndefined();
    expect(await db.sessions.get(SEED_ID)).toEqual(before.seed);
    expect(await db.sessions.count()).toBe(1);
  });

  it("resolves false for an unknown id and writes nothing", async () => {
    const before = await seedTwoSessions();

    const removed = await deleteSession(db, "no-such-session-id");
    expect(removed).toBe(false);

    expect(await db.sessions.get(SEED_ID)).toEqual(before.seed);
    expect(await db.sessions.get(TRAVEL_ID)).toEqual(before.travel);
    expect(await db.sessions.count()).toBe(2);
  });
});
