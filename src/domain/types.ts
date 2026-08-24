/**
 * Domain model — mirrors spec §20 exactly. Every visible cell is free-form
 * text; nothing is normalized, validated, or coerced (spec §6.2, §27.6).
 */

export type Highlight = "none" | "orange" | "purple" | "mint" | "blue" | "pink";

export interface WorkoutRow {
  id: string;
  position: number;

  exercise: string;
  sets: string;
  reps: string;
  weight: string;
  skip: string;

  highlight: Highlight;
}

export interface SessionSummaryOverride {
  sets?: string;
  exercises?: string;
}

export interface WorkoutSession {
  id: string;

  /** Local calendar date captured at creation (YYYY-MM-DD). */
  dateLocal: string;

  /** ISO timestamp. */
  createdAt: string;
  /** ISO timestamp. */
  updatedAt: string;

  sourceSessionId?: string;

  rows: WorkoutRow[];
  notes: string;

  summaryOverride?: SessionSummaryOverride;

  copiedToNotesAt?: string;
}
