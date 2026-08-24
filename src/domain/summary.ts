import type { WorkoutRow, WorkoutSession } from "./types";

export interface CalculatedSummary {
  sets: number;
  exercises: number;
}

/**
 * Suggested totals (spec §9.1):
 * - Sets: sum of `Sets` cells that are simple integers; anything else
 *   (`8,6`, `3x8`, blanks…) is not silently summed.
 * - Exercises: count of rows with non-empty exercise names; completely empty
 *   rows are preserved but excluded from the count (spec §27.5).
 * - Skipped rows are ordinary rows and always count toward totals (spec §8.1).
 */
export function calculateSummary(rows: WorkoutRow[]): CalculatedSummary {
  let sets = 0;
  let exercises = 0;
  for (const row of rows) {
    const trimmedSets = row.sets.trim();
    if (/^\d+$/.test(trimmedSets)) {
      sets += Number.parseInt(trimmedSets, 10);
    }
    if (row.exercise.trim().length > 0) {
      exercises += 1;
    }
  }
  return { sets, exercises };
}

/**
 * Display totals: manual override wins when present (spec §9.2), otherwise the
 * calculated values are shown. Never overwrites the user's chosen summary.
 */
export function displaySummary(session: WorkoutSession): {
  sets: string;
  exercises: string;
} {
  const calculated = calculateSummary(session.rows);
  return {
    sets: session.summaryOverride?.sets ?? String(calculated.sets),
    exercises: session.summaryOverride?.exercises ?? String(calculated.exercises),
  };
}
