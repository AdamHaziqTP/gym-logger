/**
 * ============================================================================
 * EXPERIMENTAL FEASIBILITY HARNESS — NOT PRODUCT CODE
 * Task: M03-T01-E003-FEAS-01
 * ============================================================================
 *
 * Plain-text control representation. This is a dependency-free restatement of
 * the accepted production `buildNotesText` (src/domain/notesExport.ts) —
 * same content order (date → legend → summary → Category+TSV table → notes),
 * same leading `Category` column, same "·" separator — so the harness page can
 * exercise the plain control without importing the app bundle.
 * `src/tests/feasibilityHarness.test.mjs` pins its output byte-equal to
 * production for the fixture session; any divergence fails CI.
 */

import { CATEGORY_LABELS } from "./fixture.mjs";
import { EXPORT_COLUMNS, displaySummary, formatDateDisplay, orderedRows } from "./format.mjs";

function categoryLabel(row) {
  if (row.highlight === "none") return "";
  return CATEGORY_LABELS[row.highlight] ?? "";
}

export function buildPlainNotes(session) {
  const summary = displaySummary(session);
  const header = EXPORT_COLUMNS.map(({ label }) => label).join("\t");
  const lines = [
    formatDateDisplay(session.dateLocal),
    "",
    Object.values(CATEGORY_LABELS).join(" "),
    "",
    `${summary.sets} sets · ${summary.exercises} exercises`,
    "",
    ["Category", header].join("\t"),
    ...orderedRows(session.rows).map((row) =>
      [categoryLabel(row), ...EXPORT_COLUMNS.map(({ field }) => row[field])].join(
        "\t",
      ),
    ),
    "",
    "Notes",
    session.notes,
  ];
  return lines.join("\n");
}
