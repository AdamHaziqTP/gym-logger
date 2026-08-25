import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import actualReferenceJson from "../../references/ACTUAL_SESSION_2026-08-25.json";
import { App } from "../App";
import {
  ACTUAL_SESSION_MIGRATION_KEY,
  ACTUAL_SESSION_REFERENCE,
  migrateActualSession,
} from "../data/actualSessionMigration";
import { startTodaySession } from "../data/clone";
import { createDb, type GymLogDB } from "../data/db";
import { ensureSeeded } from "../data/seed";
import type { WorkoutSession } from "../domain/types";

/**
 * Focused coverage for M06-T06 — the one-time live-data import of the
 * product owner's actual Tuesday 2026-08-25 session (task file
 * orchestration/tasks/M06-T06-ACTUAL-SESSION-MIGRATION.md).
 */

const STABLE_ID = ACTUAL_SESSION_REFERENCE.session.id;
const SEED_ID = "fixture-sunday-23-aug";
/** Migration clock: the day after the recorded Tuesday workout. */
const NOW = new Date("2026-08-26T10:00:00.000Z");

interface ReferenceRow {
  id: string;
  position: number;
  exercise: string;
  sets: string;
  reps: string;
  weight: string;
  skip: string;
  highlight: string;
}

const referenceRows = (
  actualReferenceJson as unknown as { session: { rows: ReferenceRow[] } }
).session.rows;

let testDatabaseNumber = 0;

function createTestDb(): GymLogDB {
  return createDb(`actual-session-migration-test-${++testDatabaseNumber}`);
}

function unrelatedSession(id: string, dateLocal: string): WorkoutSession {
  return {
    id,
    dateLocal,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    rows: [],
    notes: "unrelated",
  };
}

async function seededDb(): Promise<GymLogDB> {
  const db = createTestDb();
  await db.open();
  await ensureSeeded(db, () => NOW);
  return db;
}

describe("migrateActualSession — M06-T06 live-data import", () => {
  let db: GymLogDB;

  beforeEach(async () => {
    db = await seededDb();
  });

  afterEach(() => {
    db.close();
    cleanup();
  });

  it("imports once, marks the meta table, and never duplicates on repeat", async () => {
    const first = await migrateActualSession(db, () => NOW);
    const second = await migrateActualSession(
      db,
      () => new Date("2026-08-27T10:00:00.000Z"),
    );

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    expect(await db.meta.get(ACTUAL_SESSION_MIGRATION_KEY)).toEqual({
      key: ACTUAL_SESSION_MIGRATION_KEY,
      value: "references/ACTUAL_SESSION_2026-08-25.json@1",
      at: NOW.toISOString(),
    });
    // Stable ID keyed: a second write would update, never duplicate — and
    // the marker stops even that.
    const stableRecords = await db.sessions
      .where("id")
      .equals(STABLE_ID)
      .toArray();
    expect(stableRecords).toHaveLength(1);
    expect(await db.sessions.count()).toBe(2); // Sunday + Tuesday only.
  });

  it("stays single-record when two startups race", async () => {
    const results = await Promise.all([
      migrateActualSession(db),
      migrateActualSession(db),
    ]);

    expect(results.map((result) => result.applied).sort()).toEqual([
      false,
      true,
    ]);
    const stableRecords = await db.sessions
      .where("id")
      .equals(STABLE_ID)
      .toArray();
    expect(stableRecords).toHaveLength(1);
    expect(await db.sessions.count()).toBe(2);
    expect(await db.meta.get(ACTUAL_SESSION_MIGRATION_KEY)).toBeTruthy();
  });

  it("writes the exact 40-row data byte-for-byte in source order", async () => {
    await migrateActualSession(db, () => NOW);
    const imported = (await db.sessions.get(STABLE_ID))!;

    expect(imported.dateLocal).toBe("2026-08-25");
    expect(imported.rows).toHaveLength(40);
    expect(imported.rows.map((row) => row.id)).toEqual(
      referenceRows.map((row) => row.id),
    );
    expect(imported.rows.map((row) => row.position)).toEqual([
      ...Array(40).keys(),
    ]);
    expect(
      imported.rows.map((row) => ({
        exercise: row.exercise,
        sets: row.sets,
        reps: row.reps,
        weight: row.weight,
        skip: row.skip,
      })),
    ).toEqual(
      referenceRows.map((row) => ({
        exercise: row.exercise,
        sets: row.sets,
        reps: row.reps,
        weight: row.weight,
        skip: row.skip,
      })),
    );
    expect(imported.rows.map((row) => row.highlight)).toEqual(
      referenceRows.map((row) => row.highlight),
    );

    // Spot-check the known irregular values survive untouched (source
    // spacing is intentional product-owner fidelity).
    const byId = new Map(imported.rows.map((row) => [row.id, row]));
    expect(byId.get("a25-r01")!.weight).toBe("12 kg");
    expect(byId.get("a25-r02")!.exercise).toBe(
      "Recline curl bench 30° ER bilateral",
    );
    expect(byId.get("a25-r05")!.weight).toBe("7kg ");
    expect(byId.get("a25-r30")!.reps).toBe(" 8");
    expect(byId.get("a25-r31")!.reps).toBe(" 8");
    expect(byId.get("a25-r33")!.weight).toBe("70 kg");
    expect(byId.get("a25-r38")!.weight).toBe("body weight ");
    expect(imported.notes).toBe("");
    expect(imported.createdAt).toBe(NOW.toISOString());
    expect(imported.updatedAt).toBe(NOW.toISOString());
  });

  it("keeps the explicit 40/40 summary override", async () => {
    await migrateActualSession(db, () => NOW);
    const imported = (await db.sessions.get(STABLE_ID))!;

    expect(imported.summaryOverride).toEqual({
      sets: "40",
      exercises: "40",
    });
    // The override is deliberate, not derived: every Sets cell says "1".
    expect(imported.rows.every((row) => row.sets === "1")).toBe(true);
    expect(
      imported.rows.reduce((sum, row) => sum + Number(row.sets), 0),
    ).toBe(40);
  });

  it("updates a stale stable-id record to the authoritative content", async () => {
    // Insert/update contract: while the marker is absent, whatever sits on
    // the stable id converges to the supplied reference content.
    await db.sessions.put({
      ...unrelatedSession(STABLE_ID, "2026-08-25"),
      notes: "stale partial import",
      rows: [
        {
          id: "junk-row",
          position: 0,
          exercise: "half-written",
          sets: "",
          reps: "",
          weight: "",
          skip: "",
          highlight: "none",
        },
      ],
    });

    const result = await migrateActualSession(db, () => NOW);

    expect(result.applied).toBe(true);
    const imported = (await db.sessions.get(STABLE_ID))!;
    expect(imported.notes).toBe("");
    expect(imported.rows).toHaveLength(40);
    expect(imported.rows[0].weight).toBe("12 kg");
    expect(imported.summaryOverride).toEqual({
      sets: "40",
      exercises: "40",
    });
  });

  it("preserves the Sunday 2026-08-23 history record untouched", async () => {
    const before = (await db.sessions.get(SEED_ID))!;
    const snapshot = JSON.parse(JSON.stringify(before));

    await migrateActualSession(db, () => NOW);

    const after = (await db.sessions.get(SEED_ID))!;
    expect(after).toEqual(snapshot);
    expect(after.updatedAt).toBe(before.updatedAt);
  });

  it("preserves unrelated sessions, settings, and metadata", async () => {
    const wednesday = unrelatedSession("device-test-wednesday", "2026-08-26");
    await db.sessions.put(wednesday);
    await db.meta.put({ key: "settings.theme", value: "light", at: "x" });
    await db.meta.put({ key: "some.other.meta", value: "keep me", at: "y" });

    await migrateActualSession(db, () => NOW);

    // The unidentified Wednesday/test session must NOT be deleted.
    expect(await db.sessions.get(wednesday.id)).toEqual(wednesday);
    expect(await db.meta.get("settings.theme")).toEqual({
      key: "settings.theme",
      value: "light",
      at: "x",
    });
    expect(await db.meta.get("some.other.meta")).toEqual({
      key: "some.other.meta",
      value: "keep me",
      at: "y",
    });
    // First-run seeding marker survives as well.
    expect(await db.meta.get("seededFrom")).toBeTruthy();
    expect(await db.sessions.count()).toBe(3); // Sunday + Wednesday + Tuesday.
  });

  it("never resurrects the Tuesday session after a deliberate delete", async () => {
    await migrateActualSession(db, () => NOW);
    await db.sessions.delete(STABLE_ID);

    const second = await migrateActualSession(
      db,
      () => new Date("2026-08-28T09:00:00.000Z"),
    );

    expect(second.applied).toBe(false);
    expect(await db.sessions.get(STABLE_ID)).toBeUndefined();
    expect(await db.sessions.count()).toBe(1);
  });

  it("does not mutate the imported reference object", async () => {
    const snapshot = JSON.parse(JSON.stringify(actualReferenceJson));

    await migrateActualSession(db, () => NOW);

    expect(JSON.parse(JSON.stringify(actualReferenceJson))).toEqual(snapshot);
  });
});

describe("cloning after the migration (spec §4.2 policy)", () => {
  let db: GymLogDB;

  beforeEach(async () => {
    db = await seededDb();
    await migrateActualSession(db, () => NOW);
  });

  afterEach(() => {
    db.close();
  });

  it("clones Thursday's session from the Tuesday record with Skip + notes cleared", async () => {
    // Give the source something that MUST be cleared by the clone policy.
    const tuesday = (await db.sessions.get(STABLE_ID))!;
    tuesday.rows[5].skip = "skip";
    tuesday.notes = "15 min bike cool down";
    await db.sessions.put({ ...tuesday });

    const result = await startTodaySession(db, {
      dateLocal: "2026-08-27", // Thursday
      now: () => new Date("2026-08-28T08:00:00.000Z"),
      newId: (() => {
        let n = 0;
        return () => `clone-id-${++n}`;
      })(),
    });

    expect(result.created).toBe(true);
    // The migrated Tuesday session is the newest source, so the normal
    // start-today flow clones IT — not the older Sunday fixture.
    expect(result.session.sourceSessionId).toBe(STABLE_ID);
    expect(result.session.dateLocal).toBe("2026-08-27");

    // Rows clone literally: order, all five cell texts, highlights.
    expect(result.session.rows.map((row) => row.exercise)).toEqual(
      referenceRows.map((row) => row.exercise),
    );
    expect(result.session.rows.map((row) => [row.reps, row.weight])).toEqual(
      referenceRows.map((row) => [row.reps, row.weight]),
    );
    expect(result.session.rows.map((row) => row.highlight)).toEqual(
      referenceRows.map((row) => row.highlight),
    );
    // Fresh identities and normalized positions.
    expect(
      result.session.rows.every((row) => /^clone-id-\d+$/.test(row.id)),
    ).toBe(true);
    expect(result.session.rows.map((row) => row.position)).toEqual([
      ...Array(40).keys(),
    ]);

    // Existing Skip/notes clearing policy (spec §4.2): cleared in the clone,
    // untouched in the source.
    expect(result.session.rows.every((row) => row.skip === "")).toBe(true);
    expect(result.session.notes).toBe("");
    const afterSource = (await db.sessions.get(STABLE_ID))!;
    expect(afterSource.rows[5].skip).toBe("skip");
    expect(afterSource.notes).toBe("15 min bike cool down");

    // The manual 40/40 header carries over (source-fidelity convention).
    expect(result.session.summaryOverride).toEqual({
      sets: "40",
      exercises: "40",
    });
  });

  it("prefers the Tuesday record over the older Sunday seed as clone source", async () => {
    const result = await startTodaySession(db, { dateLocal: "2026-08-29" });
    expect(result.session.sourceSessionId).toBe(STABLE_ID);
    expect(result.session.rows[0].weight).toBe("12 kg");
  });
});

describe("App startup integration (runLiveMigrations)", () => {
  let db: GymLogDB;

  beforeEach(async () => {
    db = createTestDb();
    await db.open();
    await ensureSeeded(db, () => NOW);
  });

  afterEach(() => {
    cleanup();
    db.close();
  });

  it("migrates during bootstrap, feeds Home, and clones Thursday from Tuesday", async () => {
    const first = render(
      <App db={db} todayLocal="2026-08-27" runLiveMigrations />,
    );

    // Last Workout card reflects the imported Tuesday record.
    expect(await screen.findByText("Tuesday 25 Aug")).toBeTruthy();
    expect(await screen.findByText(/40 sets · 40 exercises/)).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Start Today's Session" }),
    );

    // The opened clone carries a Tuesday-only value ("12 kg" appears in no
    // Sunday-seed row), proving the normal flow used the Tuesday source.
    const importedWeights = await screen.findAllByDisplayValue("12 kg");
    expect(importedWeights.length).toBeGreaterThanOrEqual(1);
    expect(document.querySelectorAll("table tbody tr")).toHaveLength(40);

    const todays = await db.sessions
      .where("dateLocal")
      .equals("2026-08-27")
      .toArray();
    expect(todays).toHaveLength(1);
    expect(todays[0].sourceSessionId).toBe(STABLE_ID);
    expect(todays[0].summaryOverride).toEqual({ sets: "40", exercises: "40" });
    expect(await db.sessions.count()).toBe(3);

    // Relaunch against the same database: resumable, still no duplication.
    first.unmount();
    render(<App db={db} todayLocal="2026-08-27" runLiveMigrations />);
    expect(
      (await screen.findAllByDisplayValue("12 kg")).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      await db.sessions.where("id").equals(STABLE_ID).toArray(),
    ).toHaveLength(1);
    expect(await db.sessions.count()).toBe(3);
  });
});
