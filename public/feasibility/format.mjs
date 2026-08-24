/**
 * ============================================================================
 * EXPERIMENTAL FEASIBILITY HARNESS — NOT PRODUCT CODE
 * Task: M03-T01-E003-FEAS-01
 * ============================================================================
 *
 * Dependency-free mirrors of the three pure production helpers the feasibility
 * generators need (`formatDateDisplay`, summary calculation/override, and
 * position ordering from src/domain/{dates,summary,rows}.ts). They exist only
 * so `public/feasibility/*.mjs` modules stay self-contained on a static page;
 * every mirror is pinned byte-for-byte against the production implementation
 * by `src/tests/feasibilityHarness.test.mjs`, so drift fails CI.
 */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Mirror of formatDateDisplay (src/domain/dates.ts): e.g. "Sunday 23 Aug". */
export function formatDateDisplay(dateLocal) {
  const parts = dateLocal.split("-").map((part) => Number.parseInt(part, 10));
  const [year, month, day] = parts;
  if (
    parts.length !== 3 ||
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12
  ) {
    return dateLocal;
  }
  const date = new Date(year, month - 1, day);
  return `${WEEKDAYS[date.getDay()]} ${day} ${MONTHS_SHORT[month - 1]}`;
}

/**
 * Mirror of calculateSummary (src/domain/summary.ts): Sets sums ONLY simple
 * integer cells; Exercises counts rows with a non-empty exercise name.
 */
export function calculateSummary(rows) {
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

/** Mirror of displaySummary: manual override wins when present. */
export function displaySummary(session) {
  const calculated = calculateSummary(session.rows);
  return {
    sets: session.summaryOverride?.sets ?? String(calculated.sets),
    exercises:
      session.summaryOverride?.exercises ?? String(calculated.exercises),
  };
}

/** Mirror of orderedRows (src/domain/rows.ts): stable sort by position. */
export function orderedRows(rows) {
  return [...rows].sort((a, b) => a.position - b.position);
}

/** The five visible workout columns in screen order (spec §6.1). */
export const EXPORT_COLUMNS = Object.freeze([
  { field: "exercise", label: "Exercise" },
  { field: "sets", label: "Sets" },
  { field: "reps", label: "Reps" },
  { field: "weight", label: "Weight" },
  { field: "skip", label: "Skip" },
]);
