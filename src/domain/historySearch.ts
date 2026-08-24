import { formatDateDisplay } from "./dates";
import { orderedRows } from "./rows";
import type { WorkoutSession } from "./types";

/**
 * History search (spec §11.2): one local, case-insensitive substring query
 * over every session surface the user could look for — the local date in both
 * stored (`YYYY-MM-DD`) and display (`Sunday 23 Aug`) form, all five cell
 * columns of every row, and the free-form bottom notes. Pure functions only:
 * no normalization of user data beyond lowercasing for comparison.
 */

/** Every searchable text surface of one session (spec §11.2). */
export function sessionSearchSurfaces(session: WorkoutSession): string[] {
  const surfaces: string[] = [
    // Stored local date AND its display form so both "2026-08-23" and
    // "aug" / "sunday" queries match (spec §27.3 — local dates only).
    session.dateLocal,
    formatDateDisplay(session.dateLocal),
  ];
  for (const row of orderedRows(session.rows)) {
    surfaces.push(row.exercise, row.sets, row.reps, row.weight, row.skip);
  }
  surfaces.push(session.notes);
  return surfaces;
}

/** Case-insensitive substring test against all of a session's surfaces. */
export function sessionMatchesQuery(
  session: WorkoutSession,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  return sessionSearchSurfaces(session).some((surface) =>
    surface.toLowerCase().includes(needle),
  );
}

/**
 * Filters sessions for the History list. An empty (or whitespace-only) query
 * keeps every session in the given order; otherwise only matching sessions
 * remain, preserving the input order.
 */
export function filterSessionsBySearch(
  sessions: WorkoutSession[],
  query: string,
): WorkoutSession[] {
  if (query.trim() === "") return sessions;
  return sessions.filter((session) => sessionMatchesQuery(session, query));
}
