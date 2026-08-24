import { beforeEach, afterEach, describe, expect, it } from "vitest";
import Dexie from "dexie";
import fixtureJson from "../../seed/latest-session.example.json";
import { createDb, type GymLogDB } from "../data/db";
import { ensureSeeded } from "../data/seed";

const DB_NAME = "gym-logger";
const fixture = fixtureJson as unknown as {
  session: {
    id: string;
    dateLocal: string;
    rows: Array<{
      id: string;
      position: number;
      exercise: string;
      sets: string;
      reps: string;
      weight: string;
      skip: string;
      highlight: string;
    }>;
  };
};

let db: GymLogDB;

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
  db = createDb();
});

afterEach(() => {
  db.close();
});

describe("first-run seed", () => {
  it("imports the supplied fixture on first launch", async () => {
    const created = await ensureSeeded(db);
    expect(created).toBe(true);

    const session = await db.sessions.get(fixture.session.id);
    expect(session).toBeDefined();
    expect(session!.dateLocal).toBe(fixture.session.dateLocal);
  });

  it("preserves all 40 rows in source order", async () => {
    await ensureSeeded(db);
    const session = (await db.sessions.get(fixture.session.id))!;

    expect(session.rows).toHaveLength(40);
    expect(session.rows.map((row) => row.id)).toEqual(
      fixture.session.rows.map((row) => row.id),
    );
    expect(session.rows.map((row) => row.position)).toEqual([
      ...Array(40).keys(),
    ]);
  });

  it("keeps every free-form cell byte-for-byte identical to the fixture", async () => {
    await ensureSeeded(db);
    const session = (await db.sessions.get(fixture.session.id))!;

    const expectedCells = fixture.session.rows.map((row) => ({
      exercise: row.exercise,
      sets: row.sets,
      reps: row.reps,
      weight: row.weight,
      skip: row.skip,
    }));
    const actualCells = [...session.rows]
      .sort((a, b) => a.position - b.position)
      .map((row) => ({
        exercise: row.exercise,
        sets: row.sets,
        reps: row.reps,
        weight: row.weight,
        skip: row.skip,
      }));

    expect(actualCells).toEqual(expectedCells);
    // Spot-check known irregular values survive untouched.
    expect(session.rows.find((row) => row.id === "r38")!.weight).toBe(
      "body weight",
    );
    expect(session.rows.find((row) => row.id === "r09")!.weight).toBe("82.5kg");
    expect(session.rows.find((row) => row.id === "r33")!.weight).toBe("70 kg");
  });

  it("preserves the row-level highlights exactly", async () => {
    await ensureSeeded(db);
    const session = (await db.sessions.get(fixture.session.id))!;

    const expectedCounts: Record<string, number> = {};
    for (const row of fixture.session.rows) {
      expectedCounts[row.highlight] = (expectedCounts[row.highlight] ?? 0) + 1;
    }

    const actualCounts: Record<string, number> = {};
    for (const row of session.rows) {
      actualCounts[row.highlight] = (actualCounts[row.highlight] ?? 0) + 1;
    }

    expect(actualCounts).toEqual(expectedCounts);
    // The fixture must actually exercise several colors for this to be meaningful.
    expect(Object.keys(actualCounts)).toEqual(
      expect.arrayContaining(["orange", "purple", "mint", "blue", "pink", "none"]),
    );
  });

  it("retains the source summary override 40 / 39 despite the calculable mismatch", async () => {
    await ensureSeeded(db);
    const session = (await db.sessions.get(fixture.session.id))!;

    expect(session.summaryOverride).toEqual({ sets: "40", exercises: "39" });
    expect(session.rows.every((row) => row.sets === "1")).toBe(true);
    expect(session.notes).toBe("");
  });

  it("does not seed twice and never resurrects deleted data", async () => {
    expect(await ensureSeeded(db)).toBe(true);
    expect(await ensureSeeded(db)).toBe(false);

    await db.sessions.clear();
    expect(await ensureSeeded(db)).toBe(false);
    expect(await db.sessions.count()).toBe(0);
  });

  it("does not mutate the imported fixture object", async () => {
    const snapshot = JSON.parse(JSON.stringify(fixtureJson));
    await ensureSeeded(db);
    expect(JSON.parse(JSON.stringify(fixtureJson))).toEqual(snapshot);
  });
});
