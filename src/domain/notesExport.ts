import { formatDateDisplay } from "./dates";
import {
  CATEGORY_LEGEND,
  HIGHLIGHT_TOKENS,
  OPAQUE_HIGHLIGHT_BG,
} from "./highlights";
import { orderedRows } from "./rows";
import { displaySummary } from "./summary";
import type { WorkoutRow, WorkoutSession } from "./types";

/**
 * Deterministic whole-session export representations for the Copy-to-Notes
 * spike (spec §15; task M03-T01). Pure functions only: given the same session
 * record the output is byte-for-byte identical — no timestamps, no locale
 * formatting, no randomness.
 *
 * Content order follows the approved export order (spec §§14.2, 15.1):
 * date → category legend → sets/exercises summary → fixed-column table →
 * bottom notes. Free-form cell values, Skip text, manual summary overrides,
 * row highlight categories, and bottom notes are carried verbatim (spec §6.2,
 * §27.6): nothing is normalized, trimmed, or coerced.
 */

export interface NotesPayload {
  /** Self-contained standards-compliant HTML (spec §15.3). */
  html: string;
  /** Plain-text fallback with a TSV table (spec §§15.2, 15.6). */
  text: string;
}

/** The five visible workout columns, in screen order (spec §6.1). */
const EXPORT_COLUMNS: ReadonlyArray<{
  field: "exercise" | "sets" | "reps" | "weight" | "skip";
  label: string;
}> = [
  { field: "exercise", label: "Exercise" },
  { field: "sets", label: "Sets" },
  { field: "reps", label: "Reps" },
  { field: "weight", label: "Weight" },
  { field: "skip", label: "Skip" },
];

/** Label lookup shared by both representations ("none" has no category). */
function categoryLabel(row: WorkoutRow): string {
  if (row.highlight === "none") return "";
  return (
    CATEGORY_LEGEND.find(({ value }) => value === row.highlight)?.label ?? ""
  );
}

/**
 * Escapes user text for embedding in the HTML payload. Applied to every piece
 * of free-form data (cells, notes, summary overrides via the summary line);
 * constants in this module never need it but go through the same path where
 * convenient.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escapes user text and preserves explicit line breaks as <br />. */
function escapeMultilineHtml(value: string): string {
  return value.split("\n").map(escapeHtml).join("<br />");
}

/* ------------------------------ plain text ----------------------------- */

/**
 * Plain-text representation. The table is tab-separated; because plain text
 * has no color channel, each row carries its category as an explicit leading
 * `Category` column (empty for unhighlighted rows) so highlight information
 * survives even when Apple Notes receives only the plain representation.
 */
export function buildNotesText(session: WorkoutSession): string {
  const summary = displaySummary(session);
  const header = EXPORT_COLUMNS.map(({ label }) => label).join("\t");
  const lines = [
    formatDateDisplay(session.dateLocal),
    "",
    CATEGORY_LEGEND.map(({ label }) => label).join(" "),
    "",
    `${summary.sets} sets · ${summary.exercises} exercises`,
    "",
    ["Category", header].join("\t"),
    ...orderedRows(session.rows).map((row) =>
      [categoryLabel(row), ...EXPORT_COLUMNS.map(({ field }) => row[field])]
        .join("\t"),
    ),
    "",
    "Notes",
    session.notes,
  ];
  return lines.join("\n");
}

/* -------------------------------- HTML --------------------------------- */

/* Dark presentation matching the app (spec §22.1): the wrapper carries the
   dark background/light foreground so pasted content remains readable when
   background styles survive the transfer. Whether Apple Notes actually keeps
   any of this is exactly what the human device gate must measure — nothing
   here assumes it does. */
const WRAPPER_STYLE =
  "background-color:#000000;color:#f2f2f7;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.4;padding:8px";

const TH_STYLE =
  "text-align:left;padding:4px 8px;border-bottom:1px solid rgba(84,84,88,0.65)";

const TD_STYLE = "padding:4px 8px;vertical-align:top";

/** Field names of the five visible workout columns. */
type WorkoutColumnField = "exercise" | "sets" | "reps" | "weight" | "skip";

/**
 * One body cell of the export table.
 *
 * FIX-03 (M03-T01-FIX-03): the FIX-02 per-cell/inline-CSS encoding still had
 * Apple Notes stripping every category color on the trusted HTTPS retest, so
 * the colored-row encoding now adds the conservative legacy-compatible layers
 * native HTML paste importers actually honor, while keeping every value
 * derived from the locked tokens (single source of truth in
 * `src/domain/highlights.ts`):
 *
 * 1. `<td bgcolor="…">` — legacy solid background attribute, using the
 *    category's OPAQUE equivalent (locked translucent token composited over
 *    the payload's `#000000` presentation backdrop; translucent `rgba(...)`
 *    cannot be expressed by legacy importers and was stripped on device);
 * 2. inline CSS on the `<td>` with the same opaque background + exact
 *    `HIGHLIGHT_TOKENS` foreground;
 * 3. `<font color="…">` directly around the cell text — the most widely
 *    honored legacy text-run foreground representation;
 * 4. an inline-styled `<span>` directly around the cell text carrying the
 *    exact foreground and the OPAQUE highlight (text-run level styling is
 *    what WebKit's attributed-string conversion privileges).
 *
 * Every layer states the SAME two colors per category, so whichever layer a
 * paste importer honors yields the identical result. `none` rows stay exactly
 * as before: no colors, no attributes, no wrappers of any kind.
 */
function buildTableCellHtml(row: WorkoutRow, field: WorkoutColumnField): string {
  const content = escapeMultilineHtml(row[field]);
  if (row.highlight === "none") {
    return `<td style="${TD_STYLE}">${content}</td>`;
  }
  const { fg } = HIGHLIGHT_TOKENS[row.highlight];
  const bgOpaque = OPAQUE_HIGHLIGHT_BG[row.highlight];
  const cellStyle = `${TD_STYLE};background-color:${bgOpaque};color:${fg}`;
  const textStyle = `color:${fg};background-color:${bgOpaque}`;
  return (
    `<td bgcolor="${bgOpaque}" style="${cellStyle}">` +
    `<font color="${fg}">` +
    `<span style="${textStyle}">${content}</span>` +
    `</font></td>`
  );
}

function buildTableRowHtml(row: WorkoutRow): string {
  const label = categoryLabel(row);
  const categoryAttr =
    label !== "" ? ` data-gym-category="${escapeHtml(label)}"` : "";
  const cells = EXPORT_COLUMNS.map(({ field }) =>
    buildTableCellHtml(row, field),
  ).join("");
  return `<tr${categoryAttr}>${cells}</tr>`;
}

function buildTableHtml(rows: WorkoutRow[]): string {
  const headCells = EXPORT_COLUMNS.map(
    ({ label }) => `<th style="${TH_STYLE}">${label}</th>`,
  ).join("");
  const bodyRows = rows.map(buildTableRowHtml).join("");
  return [
    '<table style="border-collapse:collapse">',
    "<thead>",
    `<tr>${headCells}</tr>`,
    "</thead>",
    "<tbody>",
    bodyRows,
    "</tbody>",
    "</table>",
  ].join("");
}

function paragraph(style: string, content: string): string {
  return `<p style="${style}">${content}</p>`;
}

/**
 * Standards-compliant, self-contained HTML (spec §15.3): semantic elements,
 * explicit rows/cells, inline styles only, no external references. The five
 * visible columns match the app table; row categories ride along as opaque
 * legacy-compatible colors (`bgcolor` + `<font color>` + inline CSS) on each
 * cell and its text wrappers plus a machine-readable `data-gym-category`
 * attribute (FIX-03).
 */
export function buildNotesHtml(session: WorkoutSession): string {
  const summary = displaySummary(session);
  return [
    `<div style="${WRAPPER_STYLE}">`,
    paragraph("margin:0 0 8px", `<strong>${formatDateDisplay(session.dateLocal)}</strong>`),
    paragraph("margin:0 0 8px", escapeHtml(CATEGORY_LEGEND.map(({ label }) => label).join(" "))),
    paragraph("margin:0 0 12px", escapeHtml(`${summary.sets} sets · ${summary.exercises} exercises`)),
    buildTableHtml(orderedRows(session.rows)),
    paragraph("margin:12px 0 4px", "<strong>Notes</strong>"),
    paragraph("margin:0", escapeMultilineHtml(session.notes)),
    "</div>",
  ].join("");
}

/* ------------------------------- combined ------------------------------ */

/** Both clipboard representations for one session, in export content order. */
export function buildNotesPayload(session: WorkoutSession): NotesPayload {
  return {
    html: buildNotesHtml(session),
    text: buildNotesText(session),
  };
}
