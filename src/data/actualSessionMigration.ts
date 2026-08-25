import rawReference from "../../references/ACTUAL_SESSION_2026-08-25.json";
import type { Highlight, WorkoutRow, WorkoutSession } from "../domain/types";
import type { GymLogDB } from "./db";

/**
 * M06-T06 — one bounded live-data migration (M06-T06 task): the product
 * owner's real Tuesday 2026-08-25 workout is imported into an existing
 * device database exactly once. The authoritative source is
 * `references/ACTUAL_SESSION_2026-08-25.json`, imported directly so the app
 * can never drift from it (same discipline as `fixture.ts`).
 *
 * Safety contract:
 * - Only the stable Tuesday record and one meta marker are ever written; no
 *   other session, setting, or meta row is read for modification, so the
 *   Sunday 2026-08-23 history record, settings/metadata, and any unrelated
 *   or unidentified session (e.g. a test/Wednesday entry) are untouched.
 * - The meta marker plus the session write share one transaction, so a
 *   remount can never observe a partial import, and re-running startup is a
 *   quiet no-op — the stable ID additionally makes any repeat idempotent
 *   (put-by-key), so the Tuesday record can never duplicate.
 * - A deliberate later deletion of the Tuesday session must stick: when the
 *   marker exists but the session is gone, migration does nothing (never
 *   resurrects user-deleted data, mirroring `ensureSeeded`).
 */

/** Stable marker for the one-time product-owner data import. */
export const ACTUAL_SESSION_MIGRATION_KEY =
  "migration.actual-session-2026-08-25.v1";

interface ActualSessionReferenceRow {
  id: string;
  position: number;
  exercise: string;
  sets: string;
  reps: string;
  weight: string;
  skip: string;
  highlight: string;
}

interface ActualSessionReference {
  schemaVersion: number;
  fixturePurpose?: string;
  session: {
    id: string;
    dateLocal: string;
    /** Display form is derivable from dateLocal; never persisted. */
    displayDate?: string;
    summary: {
      setsDisplayOverride?: string;
      exercisesDisplayOverride?: string;
    };
    rows: ActualSessionReferenceRow[];
    notes: string;
  };
}

export const ACTUAL_SESSION_REFERENCE =
  rawReference as unknown as ActualSessionReference;

/**
 * Converts the reference into a persisted session without touching any
 * string: every cell keeps its exact source bytes (including trailing /
 * leading spaces such as `"bilateral "`, `"7kg "`, `" 8"`), source row ids,
 * positions, and highlights, plus the explicit 40/40 summary override.
 */
function sessionFromReference(nowIso: string): WorkoutSession {
  const source = ACTUAL_SESSION_REFERENCE.session;

  const rows: WorkoutRow[] = source.rows.map((row) => ({
    id: row.id,
    position: row.position,
    exercise: row.exercise,
    sets: row.sets,
    reps: row.reps,
    weight: row.weight,
    skip: row.skip,
    highlight: row.highlight as Highlight,
  }));
  rows.sort((a, b) => a.position - b.position);

  const summaryOverride: WorkoutSession["summaryOverride"] = {};
  if (source.summary.setsDisplayOverride !== undefined) {
    summaryOverride.sets = source.summary.setsDisplayOverride;
  }
  if (source.summary.exercisesDisplayOverride !== undefined) {
    summaryOverride.exercises = source.summary.exercisesDisplayOverride;
  }

  return {
    id: source.id,
    dateLocal: source.dateLocal,
    createdAt: nowIso,
    updatedAt: nowIso,
    rows,
    notes: source.notes ?? "",
    summaryOverride,
  };
}

export interface ActualSessionMigrationResult {
  /**
   * True only when this call wrote the Tuesday record. Every later call is a
   * quiet no-op (`false`) — including after the user deliberately deletes
   * the imported session.
   */
  applied: boolean;
}

/**
 * Imports the supplied real workout exactly once. The marker is written in
 * the same transaction as the session, and while the marker is absent the
 * authoritative record is written insert-or-update by its stable ID, so a
 * stale partial record with that id converges to the supplied content
 * without touching anything else.
 */
export async function migrateActualSession(
  db: GymLogDB,
  now: () => Date = () => new Date(),
): Promise<ActualSessionMigrationResult> {
  const marker = await db.meta.get(ACTUAL_SESSION_MIGRATION_KEY);
  if (marker) return { applied: false };

  let applied = false;
  await db.transaction("rw", db.sessions, db.meta, async () => {
    // Re-check inside the transaction: two racing startups converge on one
    // write and one marker (the loser sees the marker's table state commit).
    if (await db.meta.get(ACTUAL_SESSION_MIGRATION_KEY)) return;
    await db.sessions.put(sessionFromReference(now().toISOString()));
    await db.meta.put({
      key: ACTUAL_SESSION_MIGRATION_KEY,
      value: `references/ACTUAL_SESSION_2026-08-25.json@${ACTUAL_SESSION_REFERENCE.schemaVersion}`,
      at: now().toISOString(),
    });
    applied = true;
  });

  return { applied };
}
