import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Dexie from "dexie";
import {
  createDb,
  setNotes,
  setRowHighlight,
  setSummaryOverride,
  updateRowField,
  type GymLogDB,
} from "../data/db";
import { startTodaySession } from "../data/clone";
import { ensureSeeded } from "../data/seed";
import { calculateSummary, displaySummary } from "../domain/summary";

const DB_NAME = "gym-logger";
const SEED_ID = "fixture-sunday-23-aug";

let db: GymLogDB;

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
  db = createDb();
  await ensureSeeded(db);
});

afterEach(() => {
  db.close();
});

async function startTestSession(): Promise<string> {
  const result = await startTodaySession(db);
  return result.session.id;
}

describe("free-form persistence", () => {
  it.each([
    ["8,6"],
    ["body weight"],
    ["8.75 + 1 weight kg"],
    ["35?kg added weight thing"],
    ["  spaced  value  "],
    ["Ünicode ✓ mixed CASE"],
  ])("persists the arbitrary cell value %j exactly", async (value) => {
    const sessionId = await startTestSession();
    const session = (await db.sessions.get(sessionId))!;
    const rowId = session.rows[0].id;

    await updateRowField(db, sessionId, rowId, "reps", value);
    await updateRowField(db, sessionId, rowId, "weight", value);

    const reloaded = (await db.sessions.get(sessionId))!;
    expect(reloaded.rows.find((row) => row.id === rowId)!.reps).toBe(value);
    expect(reloaded.rows.find((row) => row.id === rowId)!.weight).toBe(value);
  });

  it("never normalizes or autocorrects exercise names", async () => {
    const sessionId = await startTestSession();
    const session = (await db.sessions.get(sessionId))!;
    const rowId = session.rows[0].id;

    await updateRowField(
      db,
      sessionId,
      rowId,
      "exercise",
      "Dumbell bilateral front raise",
    );

    const reloaded = (await db.sessions.get(sessionId))!;
    // Historical spelling ("Dumbell") is a personal label — preserved as-is.
    expect(reloaded.rows.find((row) => row.id === rowId)!.exercise).toBe(
      "Dumbell bilateral front raise",
    );
  });

  it("persists multi-line free-form notes", async () => {
    const sessionId = await startTestSession();
    const notes = "Cardio:\n- 15 min bike\nStarted using straps today ✓";

    await setNotes(db, sessionId, notes);

    const reloaded = (await db.sessions.get(sessionId))!;
    expect(reloaded.notes).toBe(notes);
  });

  it("persists a row highlight change", async () => {
    const sessionId = await startTestSession();
    const session = (await db.sessions.get(sessionId))!;
    const rowId = session.rows[17].id; // highlight: none

    await setRowHighlight(db, sessionId, rowId, "purple");

    const reloaded = (await db.sessions.get(sessionId))!;
    expect(reloaded.rows.find((row) => row.id === rowId)!.highlight).toBe(
      "purple",
    );
  });

  it("persists manual summary overrides and reset-to-calculated", async () => {
    const sessionId = await startTestSession();

    await setSummaryOverride(db, sessionId, { sets: "~41", exercises: "39ish" });
    let reloaded = (await db.sessions.get(sessionId))!;
    expect(displaySummary(reloaded)).toEqual({ sets: "~41", exercises: "39ish" });

    await setSummaryOverride(db, sessionId, undefined);
    reloaded = (await db.sessions.get(sessionId))!;
    expect(displaySummary(reloaded)).toEqual({ sets: "40", exercises: "40" });
  });
});

describe("summary calculation", () => {
  it("calculates suggested totals from the fixture rows", async () => {
    const session = (await db.sessions.get(SEED_ID))!;
    expect(calculateSummary(session.rows)).toEqual({
      sets: 40,
      exercises: 40,
    });
    // The stored override intentionally differs from calculation (spec §9.2).
    expect(displaySummary(session)).toEqual({ sets: "40", exercises: "39" });
  });

  it("ignores non-integer Sets when summing but keeps counting rows", async () => {
    const sessionId = await startTestSession();
    const before = (await db.sessions.get(sessionId))!;
    const firstRow = before.rows[0].id;
    const secondRow = before.rows[1].id;

    await updateRowField(db, sessionId, firstRow, "sets", "3");
    await updateRowField(db, sessionId, secondRow, "sets", "8,6");

    const after = (await db.sessions.get(sessionId))!;
    const calculated = calculateSummary(after.rows);
    // 38 rows still say "1" and one says "3" (sum 41); "8,6" is not silently
    // summed — only simple integer Sets values count (spec §9.1).
    expect(calculated.sets).toBe(41);
    expect(calculated.exercises).toBe(40);
  });

  it("counts skipped rows toward totals", async () => {
    const sessionId = await startTestSession();
    const before = (await db.sessions.get(sessionId))!;
    const rowId = before.rows[2].id;

    await updateRowField(db, sessionId, rowId, "skip", "skip");

    const after = (await db.sessions.get(sessionId))!;
    const calculated = calculateSummary(after.rows);
    expect(calculated.sets).toBe(40);
    expect(calculated.exercises).toBe(40);
  });

  it("excludes completely empty rows from the exercise count but preserves them", async () => {
    const sessionId = await startTestSession();
    const before = (await db.sessions.get(sessionId))!;

    const emptied = [
      ...before.rows,
      {
        id: "new-empty-row",
        position: 40,
        exercise: "",
        sets: "",
        reps: "",
        weight: "",
        skip: "",
        highlight: "none" as const,
      },
    ];
    await db.sessions.put({ ...before, rows: emptied });

    const after = (await db.sessions.get(sessionId))!;
    expect(after.rows).toHaveLength(41);
    expect(calculateSummary(after.rows).exercises).toBe(40);
  });
});
