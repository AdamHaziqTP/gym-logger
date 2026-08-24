import { todayLocalDate } from "../domain/dates";
import type { WorkoutSession } from "../domain/types";
import { uuid } from "../util/uuid";
import type { GymLogDB } from "./db";
import { sortSessionsNewestFirst } from "./db";

/**
 * Session cloning rules (spec §4.2, §12; DECISIONS.md "implementation choices
 * to validate"):
 * - rows, order, values, and highlights clone literally;
 * - Skip column clears for the new day (skip describes what happened that day);
 * - bottom notes clear (cardio/context are session-specific);
 * - the manual summary override carries over (source-fidelity, matching the
 *   user's copy-the-header Notes convention).
 */
export interface ClonePolicy {
  clearSkipColumn: boolean;
  clearNotes: boolean;
  preserveSummaryOverride: boolean;
}

export const DEFAULT_CLONE_POLICY: ClonePolicy = {
  clearSkipColumn: true,
  clearNotes: true,
  preserveSummaryOverride: true,
};

export function createClonedSession(
  source: WorkoutSession,
  dateLocal: string,
  policy: ClonePolicy = DEFAULT_CLONE_POLICY,
  newId: () => string = uuid,
  now: () => Date = () => new Date(),
): WorkoutSession {
  const orderedRows = [...source.rows].sort((a, b) => a.position - b.position);

  const rows = orderedRows.map((row, index) => ({
    id: newId(),
    position: index,
    exercise: row.exercise,
    sets: row.sets,
    reps: row.reps,
    weight: row.weight,
    skip: policy.clearSkipColumn ? "" : row.skip,
    highlight: row.highlight,
  }));

  const iso = now().toISOString();

  return {
    id: newId(),
    dateLocal,
    createdAt: iso,
    updatedAt: iso,
    sourceSessionId: source.id,
    rows,
    notes: policy.clearNotes ? "" : source.notes,
    summaryOverride:
      policy.preserveSummaryOverride && source.summaryOverride
        ? { ...source.summaryOverride }
        : undefined,
  };
}

export interface StartResult {
  session: WorkoutSession;
  created: boolean;
}

export interface StartTodayOptions {
  /** Overrides the local date (tests). Defaults to the device local date. */
  dateLocal?: string;
  policy?: ClonePolicy;
  newId?: () => string;
  now?: () => Date;
}

/**
 * Starts today's session from the newest existing session. Idempotent for the
 * same local date (spec §27.1, §27.2): the read-check and write run inside one
 * read-write transaction so double taps cannot create two sessions.
 */
export async function startTodaySession(
  db: GymLogDB,
  options: StartTodayOptions = {},
): Promise<StartResult> {
  const dateLocal = options.dateLocal ?? todayLocalDate(options.now?.());
  const policy = options.policy ?? DEFAULT_CLONE_POLICY;

  let result: StartResult | undefined;

  await db.transaction("rw", db.sessions, async () => {
    const existing = (
      await db.sessions.where("dateLocal").equals(dateLocal).toArray()
    ).sort(sortNewestFirst);
    if (existing.length > 0) {
      result = { session: existing[0], created: false };
      return;
    }

    const latest = sortSessionsNewestFirst(await db.sessions.toArray())[0];
    if (!latest) {
      throw new Error("Cannot start a session before any session exists.");
    }

    const clone = createClonedSession(latest, dateLocal, policy, options.newId ?? uuid, options.now);
    await db.sessions.put(clone);
    result = { session: clone, created: true };
  });

  if (!result) {
    throw new Error("startTodaySession did not produce a result.");
  }
  return result;
}

function sortNewestFirst(a: WorkoutSession, b: WorkoutSession): number {
  return a.dateLocal === b.dateLocal
    ? b.createdAt.localeCompare(a.createdAt)
    : b.dateLocal.localeCompare(a.dateLocal);
}
