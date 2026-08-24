/**
 * ============================================================================
 * EXPERIMENTAL FEASIBILITY HARNESS — NOT PRODUCT CODE
 * Task: M03-T01-E003-FEAS-01
 * ============================================================================
 *
 * Representative HTML table generator for the Shortcuts "Make Rich Text"
 * route. This is NOT the production payload: production Copy to Notes is
 * unchanged and keeps building its payload from src/domain/notesExport.ts.
 * This module restates the same proven-editable FIX-03 markup style (semantic
 * table, inline styles only, `bgcolor` + `<font color>` + cell/span CSS
 * carrying the exact locked foreground and the derived opaque highlight) over
 * the small fixture session so the harness can test whether a Shortcuts HTML →
 * rich-text conversion preserves an editable table and colors — something the
 * Safari clipboard path already failed to do on device.
 *
 * Deterministic, escaped, self-contained; no external references of any kind.
 */

import {
  CATEGORY_FG,
  CATEGORY_LABELS,
  OPAQUE_HIGHLIGHT,
} from "./fixture.mjs";
import { EXPORT_COLUMNS, displaySummary, formatDateDisplay, orderedRows } from "./format.mjs";

/** Download filename used by the harness page. */
export const HTML_FILE_NAME = "gym-session-feasibility.html";

/** MIME type used for File/Blob construction. */
export const HTML_MIME_TYPE = "text/html";

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeMultilineHtml(value) {
  return value.split("\n").map(escapeHtml).join("<br />");
}

const WRAPPER_STYLE =
  "background-color:#000000;color:#f2f2f7;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.4;padding:8px";

const TH_STYLE =
  "text-align:left;padding:4px 8px;border-bottom:1px solid rgba(84,84,88,0.65)";

const TD_STYLE = "padding:4px 8px;vertical-align:top";

function buildTableCellHtml(row, field) {
  const content = escapeMultilineHtml(row[field]);
  if (row.highlight === "none") {
    return `<td style="${TD_STYLE}">${content}</td>`;
  }
  const fg = CATEGORY_FG[row.highlight];
  const bgOpaque = OPAQUE_HIGHLIGHT[row.highlight];
  if (fg === undefined || bgOpaque === undefined) {
    throw new Error(`Unknown highlight "${row.highlight}" in feasibility fixture`);
  }
  const cellStyle = `${TD_STYLE};background-color:${bgOpaque};color:${fg}`;
  const textStyle = `color:${fg};background-color:${bgOpaque}`;
  return (
    `<td bgcolor="${bgOpaque}" style="${cellStyle}">` +
    `<font color="${fg}">` +
    `<span style="${textStyle}">${content}</span>` +
    `</font></td>`
  );
}

function buildTableRowHtml(row) {
  const label =
    row.highlight === "none" ? "" : CATEGORY_LABELS[row.highlight] ?? "";
  const categoryAttr = label !== "" ? ` data-gym-category="${escapeHtml(label)}"` : "";
  const cells = EXPORT_COLUMNS.map(({ field }) =>
    buildTableCellHtml(row, field),
  ).join("");
  return `<tr${categoryAttr}>${cells}</tr>`;
}

/**
 * Builds the representative whole-session HTML document fragment:
 * date → legend → summary → colored table → bottom notes (spec §§14.2, 15.1).
 */
export function buildRepresentativeNotesHtml(session) {
  const summary = displaySummary(session);
  const headCells = EXPORT_COLUMNS.map(
    ({ label }) => `<th style="${TH_STYLE}">${label}</th>`,
  ).join("");
  return [
    `<div style="${WRAPPER_STYLE}">`,
    `<p style="margin:0 0 8px"><strong>${escapeHtml(
      formatDateDisplay(session.dateLocal),
    )}</strong></p>`,
    `<p style="margin:0 0 8px">${escapeHtml(
      Object.values(CATEGORY_LABELS).join(" "),
    )}</p>`,
    `<p style="margin:0 0 12px">${escapeHtml(
      `${summary.sets} sets · ${summary.exercises} exercises`,
    )}</p>`,
    '<table style="border-collapse:collapse"><thead>',
    `<tr>${headCells}</tr>`,
    "</thead><tbody>",
    orderedRows(session.rows).map(buildTableRowHtml).join(""),
    "</tbody></table>",
    `<p style="margin:12px 0 4px"><strong>Notes</strong></p>`,
    `<p style="margin:0">${escapeMultilineHtml(session.notes)}</p>`,
    "</div>",
  ].join("");
}
