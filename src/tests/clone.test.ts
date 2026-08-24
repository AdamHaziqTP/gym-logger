import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Dexie from "dexie";
import fixtureJson from "../../seed/latest-session.example.json";
import {
  createClonedSession,
  startTodaySession,
  startTodayFromSession,
  DEFAULT_CLONE_POLICY,
} from "../data/clone";
import { createDb, type GymLogDB } from "../data/db";
import { ensureSeeded } from "../data/seed";
import { todayLocalDate } from "../domain/dates";
import type { WorkoutSession } from "../domain/types";

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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("startTodaySession", () => {
  it("creates exactly one session for the requested local date", async () => {
    const result = await startTodaySession(db, { dateLocal: "2026-08-24" });

    expect(result.created).toBe(true);
    expect(result.session.dateLocal).toBe("2026-08-24");
    expect(result.session.id).toMatch(UUID_PATTERN);
    expect(result.session.id).not.toBe(SEED_ID);
    expect(result.session.sourceSessionId).toBe(SEED_ID);

    const todays = await db.sessions
      .where("dateLocal")
      .equals("2026-08-24")
      .toArray();
    expect(todays).toHaveLength(1);
    expect(await db.sessions.count()).toBe(2);
  });

  it("is idempotent: a second start resolves to Continue, not a duplicate", async () => {
    const first = await startTodaySession(db, { dateLocal: "2026-08-24" });
    const second = await startTodaySession(db, { dateLocal: "2026-08-24" });

    expect(second.created).toBe(false);
    expect(second.session.id).toBe(first.session.id);

    const todays = await db.sessions
      .where("dateLocal")
      .equals("2026-08-24")
      .toArray();
    expect(todays).toHaveLength(1);
  });

  it("stays idempotent when started concurrently (double tap)", async () => {
    const [a, b] = await Promise.all([
      startTodaySession(db, { dateLocal: "2026-08-24" }),
      startTodaySession(db, { dateLocal: "2026-08-24" }),
    ]);

    const todays = await db.sessions
      .where("dateLocal")
      .equals("2026-08-24")
      .toArray();
    expect(todays).toHaveLength(1);
    expect(b.session.id).toBe(a.session.id);
  });

  it("uses the device local calendar date by default", async () => {
    const result = await startTodaySession(db);
    expect(result.session.dateLocal).toBe(todayLocalDate());
  });

  it("clones rows literally: order, values, and highlights", async () => {
    const sourceFixture = (
      fixtureJson as unknown as {
        session: {
          rows: Array<{
            exercise: string;
            sets: string;
            reps: string;
            weight: string;
            highlight: string;
          }>;
        };
      }
    ).session;

    const result = await startTodaySession(db, { dateLocal: "2026-08-24" });
    const clone = result.session;

    expect(clone.rows.map((row) => row.exercise)).toEqual(
      sourceFixture.rows.map((row) => row.exercise),
    );
    expect(
      clone.rows.map((row) => [row.sets, row.reps, row.weight]),
    ).toEqual(sourceFixture.rows.map((row) => [row.sets, row.reps, row.weight]));
    expect(clone.rows.map((row) => row.highlight)).toEqual(
      sourceFixture.rows.map((row) => row.highlight),
    );
    // Row ids must be fresh (no reuse of fixture row ids); positions normalized.
    const seedRowIds = new Set(
      ((await db.sessions.get(SEED_ID))!).rows.map((row) => row.id),
    );
    for (const row of clone.rows) {
      expect(seedRowIds.has(row.id)).toBe(false);
      expect(row.id).toMatch(UUID_PATTERN);
    }
    expect(clone.rows.map((row) => row.position)).toEqual([
      ...Array(40).keys(),
    ]);
  });

  it("applies the recorded clone policy: clears Skip + notes, preserves override", async () => {
    // Give the seed something to clear first.
    const seedSession = (await db.sessions.get(SEED_ID))!;
    seedSession.rows[5].skip = "skip";
    seedSession.notes = "15 min bike cool down";
    await db.sessions.put({ ...seedSession });

    const result = await startTodaySession(db, { dateLocal: "2026-08-25" });
    const clone = result.session;

    expect(clone.rows.every((row) => row.skip === "")).toBe(true);
    expect(clone.notes).toBe("");
    expect(clone.summaryOverride).toEqual({ sets: "40", exercises: "39" });
    // The source keeps its own values untouched.
    const afterSource = (await db.sessions.get(SEED_ID))!;
    expect(afterSource.rows[5].skip).toBe("skip");
    expect(afterSource.notes).toBe("15 min bike cool down");
  });

  it("honors literal cloning when the policy asks for it", () => {
    const source = {
      id: "src",
      dateLocal: "2026-01-01",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      notes: "keep me",
      summaryOverride: { sets: "12", exercises: "11" },
      rows: [
        {
          id: "a",
          position: 0,
          exercise: "Row A",
          sets: "3",
          reps: "8",
          weight: "60kg",
          skip: "skip",
          highlight: "pink" as const,
        },
        {
          id: "b",
          position: 1,
          exercise: "",
          sets: "",
          reps: "",
          weight: "",
          skip: "",
          highlight: "none" as const,
        },
      ],
    };

    const literalPolicy = {
      clearSkipColumn: false,
      clearNotes: false,
      preserveSummaryOverride: true,
    };
    const clone = createClonedSession(source, "2026-01-02", literalPolicy);

    expect(DEFAULT_CLONE_POLICY.clearSkipColumn).toBe(true);
    expect(clone.rows[0].skip).toBe("skip");
    expect(clone.notes).toBe("keep me");
    expect(clone.summaryOverride).toEqual({ sets: "12", exercises: "11" });
    // Empty row is preserved as a row even though nothing is filled in.
    expect(clone.rows).toHaveLength(2);
  });
});

describe("startTodayFromSession (Copy Another Session, spec §4.3/§12.2)", () => {
  /** A non-latest historical source: older than the seeded 2026-08-23. */
  async function insertTravelSource(): Promise<WorkoutSession> {
    const source: WorkoutSession = {
      id: "history-fri-21-aug",
      dateLocal: "2026-08-21",
      createdAt: "2026-08-21T18:00:00.000Z",
      updatedAt: "2026-08-21T19:00:00.000Z",
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
    };
    await db.sessions.put(source);
    return source;
  }

  it("clones a specifically chosen NON-latest source under the default policy", async () => {
    const source = await insertTravelSource();

    const result = await startTodayFromSession(db, source.id, {
      dateLocal: "2026-08-24",
    });

    const clone = result.session;
    expect(result.replaced).toBe(false);
    expect(clone.id).toMatch(UUID_PATTERN);
    expect(clone.id).not.toBe(source.id);
    expect(clone.dateLocal).toBe("2026-08-24");
    expect(clone.sourceSessionId).toBe(source.id);
    // Exact row order, text, and highlights from the CHOSEN session.
    expect(clone.rows.map((row) => row.exercise)).toEqual([
      "Lat Pulldown Wide",
      "Cable Row",
    ]);
    expect(
      clone.rows.map((row) => [row.sets, row.reps, row.weight]),
    ).toEqual([
      ["1", "10", "50kg"],
      ["1", "12", "body weight"],
    ]);
    expect(clone.rows.map((row) => row.highlight)).toEqual(["pink", "purple"]);
    expect(clone.rows.every((row) => row.id.match(UUID_PATTERN))).toBe(true);
    // DEFAULT_CLONE_POLICY applied: Skip + notes cleared, override preserved.
    expect(clone.rows.every((row) => row.skip === "")).toBe(true);
    expect(clone.notes).toBe("");
    expect(clone.summaryOverride).toEqual({ sets: "5", exercises: "4" });
    // The source record itself is untouched.
    const afterSource = (await db.sessions.get(source.id))!;
    expect(afterSource.rows[0].skip).toBe("skip");
    expect(afterSource.notes).toBe("travel workout, hotel gym");
    // Exactly one session now exists for the target date.
    expect(
      await db.sessions.where("dateLocal").equals("2026-08-24").toArray(),
    ).toHaveLength(1);
    // Seeded fixture + inserted source + this clone = 3 total sessions.
    expect(await db.sessions.count()).toBe(3);
  });

  it("replaces an existing same-date session instead of duplicating it", async () => {
    await insertTravelSource();
    // Today already exists — created through the normal latest-clone path.
    const existing = await startTodaySession(db, { dateLocal: "2026-08-24" });
    expect(existing.created).toBe(true);

    const result = await startTodayFromSession(db, "history-fri-21-aug", {
      dateLocal: "2026-08-24",
    });

    expect(result.replaced).toBe(true);
    expect(result.session.sourceSessionId).toBe("history-fri-21-aug");

    const todays = await db.sessions
      .where("dateLocal")
      .equals("2026-08-24")
      .toArray();
    // The previous today's session is GONE, not kept alongside the clone.
    expect(todays).toHaveLength(1);
    expect(todays[0].id).not.toBe(existing.session.id);
    // The replacement swaps the same-date row in place, so the grand total
    // stays at 3: seeded fixture + inserted source + the one replacement.
    expect(await db.sessions.count()).toBe(3);
  });

  it("rejects a missing source without writing anything", async () => {
    await expect(
      startTodayFromSession(db, "no-such-session", {
        dateLocal: "2026-08-24",
      }),
    ).rejects.toThrow(/not found/);
    expect(await db.sessions.count()).toBe(1);
    expect(
      await db.sessions.where("dateLocal").equals("2026-08-24").toArray(),
    ).toHaveLength(0);
  });

  it("never leaves two same-date sessions when invoked concurrently", async () => {
    await Promise.all([
      startTodayFromSession(db, SEED_ID, { dateLocal: "2026-08-24" }),
      startTodayFromSession(db, SEED_ID, { dateLocal: "2026-08-24" }),
    ]);
    expect(
      await db.sessions.where("dateLocal").equals("2026-08-24").toArray(),
    ).toHaveLength(1);
  });
});
