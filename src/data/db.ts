import Dexie, { type Table } from "dexie";
import type {
  Highlight,
  SessionSummaryOverride,
  WorkoutRow,
  WorkoutSession,
} from "../domain/types";
import {
  createBlankRow,
  deleteRow as deleteRowOp,
  duplicateRow as duplicateRowOp,
  insertRowAt,
  orderedRows,
} from "../domain/rows";
import { uuid } from "../util/uuid";

/**
 * Local-first storage (spec §17.2, §20). Rows are embedded in the session
 * record: a session is ~20 KB at 40 rows, so one debounced write per edit is
 * cheap and keeps every mutation atomic.
 */

export interface MetaRecord {
  key: string;
  value: string;
  at: string;
}

export class GymLogDB extends Dexie {
  sessions!: Table<WorkoutSession, string>;
  meta!: Table<MetaRecord, string>;

  constructor(name = "gym-logger") {
    super(name);
    this.version(1).stores({
      sessions: "id, dateLocal, createdAt",
      meta: "key",
    });
  }
}

export function createDb(name = "gym-logger"): GymLogDB {
  return new GymLogDB(name);
}

export type EditableRowField =
  | "exercise"
  | "sets"
  | "reps"
  | "weight"
  | "skip";

export function sortSessionsNewestFirst(
  sessions: WorkoutSession[],
): WorkoutSession[] {
  return [...sessions].sort((a, b) =>
    a.dateLocal === b.dateLocal
      ? b.createdAt.localeCompare(a.createdAt)
      : b.dateLocal.localeCompare(a.dateLocal),
  );
}

export async function getLatestSession(
  db: GymLogDB,
): Promise<WorkoutSession | undefined> {
  const sorted = sortSessionsNewestFirst(await db.sessions.toArray());
  return sorted[0];
}

async function mutateSession(
  db: GymLogDB,
  sessionId: string,
  mutate: (session: WorkoutSession) => WorkoutSession,
): Promise<void> {
  await db.transaction("rw", db.sessions, async () => {
    const current = await db.sessions.get(sessionId);
    if (!current) return;
    const next = mutate(current);
    await db.sessions.put({ ...next, updatedAt: new Date().toISOString() });
  });
}

export async function updateRowField(
  db: GymLogDB,
  sessionId: string,
  rowId: string,
  field: EditableRowField,
  value: string,
): Promise<void> {
  await mutateSession(db, sessionId, (session) => ({
    ...session,
    rows: session.rows.map((row) =>
      row.id === rowId ? { ...row, [field]: value } : row,
    ),
  }));
}

export async function setRowHighlight(
  db: GymLogDB,
  sessionId: string,
  rowId: string,
  highlight: Highlight,
): Promise<void> {
  await mutateSession(db, sessionId, (session) => ({
    ...session,
    rows: session.rows.map((row) =>
      row.id === rowId ? { ...row, highlight } : row,
    ),
  }));
}

export async function setNotes(
  db: GymLogDB,
  sessionId: string,
  notes: string,
): Promise<void> {
  await mutateSession(db, sessionId, (session) => ({ ...session, notes }));
}

export async function setSummaryOverride(
  db: GymLogDB,
  sessionId: string,
  override: SessionSummaryOverride | undefined,
): Promise<void> {
  await mutateSession(db, sessionId, (session) => ({
    ...session,
    summaryOverride: override,
  }));
}

/* ------------------------------------------------------------------ */
/* Row menu operations (spec §§7.3-7.6; M01 human-gate correction).    */
/* All of them run atomically and normalize positions to 0..n-1.       */
/* ------------------------------------------------------------------ */

/** Writes an explicit row array back; the given order becomes 0..n-1. */
export async function replaceRows(
  db: GymLogDB,
  sessionId: string,
  rows: WorkoutRow[],
): Promise<void> {
  await mutateSession(db, sessionId, (session) => ({
    ...session,
    // Deliberately NO positional re-sort here: callers (drag commit, Undo)
    // pass the exact intended order, while carried position values are stale
    // until this normalization rewrites them.
    rows: rows.map((row, index) => ({ ...row, position: index })),
  }));
}

/** Inserts a blank row at `index`; resolves to the new row's id. */
export async function insertBlankRowAtIndex(
  db: GymLogDB,
  sessionId: string,
  index: number,
  newId: () => string = uuid,
): Promise<string | null> {
  return insertRowWithSpec(db, sessionId, index, () =>
    createBlankRow(newId()),
  );
}

/**
 * Inserts a copy of `source` (all five cell texts + highlight) with a fresh
 * identity at `index`; used by Paste. Resolves to the new row's id.
 */
export async function insertRowCopyAtIndex(
  db: GymLogDB,
  sessionId: string,
  index: number,
  source: WorkoutRow,
  newId: () => string = uuid,
): Promise<string | null> {
  return insertRowWithSpec(db, sessionId, index, () => ({
    ...createBlankRow(newId()),
    exercise: source.exercise,
    sets: source.sets,
    reps: source.reps,
    weight: source.weight,
    skip: source.skip,
    highlight: source.highlight,
  }));
}

async function insertRowWithSpec(
  db: GymLogDB,
  sessionId: string,
  index: number,
  makeRow: () => WorkoutRow,
): Promise<string | null> {
  let newRowId: string | null = null;
  await mutateSession(db, sessionId, (session) => {
    const row = makeRow();
    const beforeIds = new Set(orderedRows(session.rows).map((r) => r.id));
    const nextRows = insertRowAt(session.rows, index, row);
    const added = orderedRows(nextRows).find((r) => !beforeIds.has(r.id));
    if (added) newRowId = added.id;
    return { ...session, rows: nextRows };
  });
  return newRowId;
}

/** Duplicates a row exactly with a new identity; resolves to the copy's id. */
export async function duplicateRowById(
  db: GymLogDB,
  sessionId: string,
  rowId: string,
  newId: () => string = uuid,
): Promise<string | null> {
  let copyId: string | null = null;
  await mutateSession(db, sessionId, (session) => {
    const id = newId();
    const nextRows = duplicateRowOp(session.rows, rowId, () => id);
    const sourceIds = new Set(session.rows.map((row) => row.id));
    if (!sourceIds.has(rowId)) return session; // absent: no-op
    copyId = id;
    return { ...session, rows: nextRows };
  });
  return copyId;
}

export interface RemoveRowResult {
  removed: WorkoutRow;
  /** The full ordered row list before deletion — the Undo snapshot. */
  previousRows: WorkoutRow[];
}

/**
 * Removes a row and normalizes positions. Resolves to the removed row plus
 * the pre-delete snapshot for the temporary Undo affordance (spec §7.4), or
 * null when the row does not exist.
 */
export async function removeRowById(
  db: GymLogDB,
  sessionId: string,
  rowId: string,
): Promise<RemoveRowResult | null> {
  let result: RemoveRowResult | null = null;
  await mutateSession(db, sessionId, (session) => {
    const ordered = orderedRows(session.rows);
    const outcome = deleteRowOp(session.rows, rowId);
    if (!outcome.removed) return session;
    result = {
      removed: outcome.removed,
      previousRows: ordered.map((row) => ({ ...row })),
    };
    return { ...session, rows: outcome.rows };
  });
  return result;
}

/**
 * Deletes exactly one whole session (spec §11.4, §27.8; M02-T03). Rows are
 * embedded in the record, so removing it removes everything that belongs to
 * the session and nothing else. The existence check and removal run inside
 * one read-write transaction, so a racing write cannot resurrect the record
 * and no other session can be mutated. Resolves to `true` only when the
 * session existed and was removed.
 */
export async function deleteSession(
  db: GymLogDB,
  sessionId: string,
): Promise<boolean> {
  let deleted = false;
  await db.transaction("rw", db.sessions, async () => {
    const current = await db.sessions.get(sessionId);
    if (!current) return;
    await db.sessions.delete(sessionId);
    deleted = true;
  });
  return deleted;
}

/** Drag-reorder and Undo share this explicit-order write path (replaceRows). */
