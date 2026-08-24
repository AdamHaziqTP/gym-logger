import Dexie, { type Table } from "dexie";
import type {
  Highlight,
  SessionSummaryOverride,
  WorkoutSession,
} from "../domain/types";

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

export function createDb(): GymLogDB {
  return new GymLogDB();
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
