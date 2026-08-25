import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ACTUAL_SESSION_MIGRATION_KEY,
  ACTUAL_SESSION_REFERENCE,
  migrateActualSession,
} from "../data/actualSessionMigration";
import { startTodaySession } from "../data/clone";
import { createDb, type GymLogDB } from "../data/db";
import { ensureSeeded } from "../data/seed";
import type { WorkoutSession } from "../domain/types";

const NOW = new Date("2026-08-26T10:00:00.000Z");
let testDatabaseNumber = 0;

function session(id: string, dateLocal: string): WorkoutSession {
  return {
    id,
    dateLocal,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    rows: [],
    notes: "unrelated",
  };
}

describe("actual Tuesday session migration", () => {
  let db: GymLogDB;

  beforeEach(async () => {
    db = createDb(`actual-session-migration-test-${++testDatabaseNumber}`);
    await db.open();
    await db.transaction("rw", db.sessions, db.meta, async () => {
      await db.sessions.clear();
      await db.meta.clear();
    });
  });

  afterEach(() => {
    db.close();
  });

  it("imports the exact 40-row workout once and preserves unrelated records", async () => {
    await ensureSeeded(db, () => NOW);
    await db.sessions.put(session("unrelated-session", "2026-08-20"));
    await db.meta.put({
      key: "settings.theme",
      value: "light",
      at: NOW.toISOString(),
    });

    const first = await migrateActualSession(db, () => NOW);
    const second = await migrateActualSession(
      db,
      () => new Date("2026-08-27T10:00:00.000Z"),
    );

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    expect(await db.meta.get(ACTUAL_SESSION_MIGRATION_KEY)).toBeTruthy();
    expect(await db.sessions.count()).toBe(3);
    expect(await db.sessions.get("fixture-sunday-23-aug")).toBeTruthy();
    expect(await db.sessions.get("unrelated-session")).toEqual(
      session("unrelated-session", "2026-08-20"),
    );
    expect(await db.meta.get("settings.theme")).toEqual({
      key: "settings.theme",
      value: "light",
      at: NOW.toISOString(),
    });

    const imported = await db.sessions.get(ACTUAL_SESSION_REFERENCE.session.id);
    expect(imported).toBeTruthy();
    expect(imported!.dateLocal).toBe("2026-08-25");
    expect(imported!.rows).toHaveLength(40);
    expect(imported!.rows).toEqual(ACTUAL_SESSION_REFERENCE.session.rows);
    expect(imported!.summaryOverride).toEqual({
      sets: "40",
      exercises: "40",
    });
    expect(imported!.rows.reduce((sum, row) => sum + Number(row.sets), 0)).toBe(40);
  });

  it("does not delete an unidentified Wednesday session", async () => {
    await ensureSeeded(db, () => NOW);
    const wednesday = session("possible-device-test-session", "2026-08-26");
    await db.sessions.put(wednesday);

    await migrateActualSession(db, () => NOW);

    expect(await db.sessions.get(wednesday.id)).toEqual(wednesday);
    expect(await db.sessions.get(ACTUAL_SESSION_REFERENCE.session.id)).toBeTruthy();
  });

  it("lets the next session clone the imported Tuesday values and highlights", async () => {
    await ensureSeeded(db, () => NOW);
    await migrateActualSession(db, () => NOW);

    const result = await startTodaySession(db, {
      dateLocal: "2026-08-27",
      now: () => new Date("2026-08-27T10:00:00.000Z"),
      newId: (() => {
        let n = 0;
        return () => `clone-id-${++n}`;
      })(),
    });

    expect(result.session.sourceSessionId).toBe(ACTUAL_SESSION_REFERENCE.session.id);
    expect(
      result.session.rows.map(({ id: _id, position: _position, skip: _skip, ...row }) => row),
    ).toEqual(
      ACTUAL_SESSION_REFERENCE.session.rows.map(
        ({ id: _id, position: _position, skip: _skip, ...row }) => row,
      ),
    );
    expect(result.session.rows.every((row) => row.skip === "")).toBe(true);
    expect(result.session.notes).toBe("");
    expect(result.session.summaryOverride).toEqual({
      sets: "40",
      exercises: "40",
    });
  });
});
