import rawFixture from "../../seed/latest-session.example.json";
import type { Highlight, WorkoutRow, WorkoutSession } from "../domain/types";

/**
 * The supplied seed fixture is the single source of truth for first-run data.
 * It is imported directly from `seed/latest-session.example.json` so the app
 * can never drift from the regression fixture (spec §24).
 */

interface FixtureRow {
  id: string;
  position: number;
  exercise: string;
  sets: string;
  reps: string;
  weight: string;
  skip: string;
  highlight: string;
}

interface FixtureSession {
  id: string;
  dateLocal: string;
  displayDate: string;
  summary: {
    setsDisplayOverride?: string;
    exercisesDisplayOverride?: string;
    note?: string;
  };
  rows: FixtureRow[];
  notes: string;
}

interface FixtureFile {
  schemaVersion: number;
  fixturePurpose: string;
  session: FixtureSession;
  highlightLegend: Record<string, string>;
  knownFormattingException: string;
}

export const SEED_FIXTURE = rawFixture as unknown as FixtureFile;

export const SEED_META_KEY = "seededFrom";

/** Converts the fixture into a persisted session without touching any string. */
export function seedSessionFromFixture(nowIso: string): WorkoutSession {
  const source = SEED_FIXTURE.session;

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
