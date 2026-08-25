import type { WorkoutRow } from "./types";

/**
 * App-owned row clipboard for the Copy/Paste row commands (spec §7.3; M01
 * human-gate correction). Deliberately NOT the OS clipboard: the commands must
 * work offline in a Home Screen web app without any clipboard permission.
 *
 * The store lives at app scope so a copied row survives closing the menu,
 * deselecting, or navigating session → Home → session within one app run. A
 * page reload intentionally starts empty (Paste disabled), matching Notes.
 */

let storedRow: WorkoutRow | null = null;

export function copyRowToClipboard(row: WorkoutRow): void {
  storedRow = { ...row };
}

/** A defensive copy, or null when nothing was copied. */
export function peekRowClipboard(): WorkoutRow | null {
  return storedRow ? { ...storedRow } : null;
}

export function hasCopiedRow(): boolean {
  return storedRow !== null;
}

export function clearRowClipboard(): void {
  storedRow = null;
}
