import type { WorkoutRow } from "./types";

/**
 * Pure row operations for the Apple Notes-style row menu and drag reorder
 * (spec §§7.2-7.6, §20.2). Every operation returns a NEW array, preserves all
 * free-form cell text and highlight values exactly (spec §6.2, §27.6), and
 * normalizes positions to 0..n-1 (spec §20.2).
 */

/** Rows sorted by position — never mutates the input. */
export function orderedRows(rows: WorkoutRow[]): WorkoutRow[] {
  return [...rows].sort((a, b) => a.position - b.position);
}

/** Reassigns positions 0..n-1 in the given array order (spec §20.2). */
export function normalizePositions(rows: WorkoutRow[]): WorkoutRow[] {
  return rows.map((row, index) => ({ ...row, position: index }));
}

/** A fresh empty row ("Other"/no highlight) for Add Row Above/Below. */
export function createBlankRow(id: string): WorkoutRow {
  return {
    id,
    position: 0,
    exercise: "",
    sets: "",
    reps: "",
    weight: "",
    skip: "",
    highlight: "none",
  };
}

/**
 * Inserts a fully-formed row (identity included) at `index` (clamped to 0..n).
 * Existing rows shift down; positions are normalized.
 */
export function insertRowAt(
  rows: WorkoutRow[],
  index: number,
  row: WorkoutRow,
): WorkoutRow[] {
  const ordered = orderedRows(rows);
  const clamped = Math.max(0, Math.min(index, ordered.length));
  return normalizePositions([
    ...ordered.slice(0, clamped),
    row,
    ...ordered.slice(clamped),
  ]);
}

/**
 * Inserts a blank row at `index` (clamped to 0..n). Existing rows shift down;
 * positions are normalized.
 */
export function insertBlankRowAt(
  rows: WorkoutRow[],
  index: number,
  newId: () => string,
): WorkoutRow[] {
  return insertRowAt(rows, index, createBlankRow(newId()));
}

/**
 * Duplicates the row with `rowId` as an exact copy (all five cell texts and
 * the highlight) with a fresh identity, inserted directly below the source.
 */
export function duplicateRow(
  rows: WorkoutRow[],
  rowId: string,
  newId: () => string,
): WorkoutRow[] {
  const ordered = orderedRows(rows);
  const index = ordered.findIndex((row) => row.id === rowId);
  if (index === -1) return normalizePositions(ordered);

  const source = ordered[index];
  const copy: WorkoutRow = {
    id: newId(),
    position: source.position,
    exercise: source.exercise,
    sets: source.sets,
    reps: source.reps,
    weight: source.weight,
    skip: source.skip,
    highlight: source.highlight,
  };
  return normalizePositions([
    ...ordered.slice(0, index + 1),
    copy,
    ...ordered.slice(index + 1),
  ]);
}

/**
 * Removes the row with `rowId`. Returns the removed row (or null when absent)
 * plus the normalized remaining rows; positions stay contiguous.
 */
export function deleteRow(
  rows: WorkoutRow[],
  rowId: string,
): { removed: WorkoutRow | null; rows: WorkoutRow[] } {
  const ordered = orderedRows(rows);
  const index = ordered.findIndex((row) => row.id === rowId);
  if (index === -1) return { removed: null, rows: normalizePositions(ordered) };
  const removed = ordered[index];
  const remaining = [
    ...ordered.slice(0, index),
    ...ordered.slice(index + 1),
  ];
  return { removed, rows: normalizePositions(remaining) };
}

/**
 * Moves the row with `rowId` to `toIndex` (clamped), preserving every cell
 * value and highlight; positions are normalized afterwards.
 */
export function moveRow(
  rows: WorkoutRow[],
  rowId: string,
  toIndex: number,
): WorkoutRow[] {
  const ordered = orderedRows(rows);
  const fromIndex = ordered.findIndex((row) => row.id === rowId);
  if (fromIndex === -1) return normalizePositions(ordered);

  const clamped = Math.max(0, Math.min(toIndex, ordered.length - 1));
  if (clamped === fromIndex) return normalizePositions(ordered);

  const without = [...ordered];
  const [moved] = without.splice(fromIndex, 1);
  without.splice(clamped, 0, moved);
  return normalizePositions(without);
}
