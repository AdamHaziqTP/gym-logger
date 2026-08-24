/**
 * ============================================================================
 * EXPERIMENTAL FEASIBILITY HARNESS — NOT PRODUCT CODE
 * Task: M03-T01-E003-FEAS-01
 * ============================================================================
 *
 * Pure, deterministic RTF generator for the RTF/attributed-text file handoff
 * route. Zero dependencies; identical input produces byte-identical output.
 *
 * IMPORTANT HONESTY BOUNDARY (task/E-003): generating this file proves nothing
 * about Apple Notes. Whether iOS Notes imports it as a real editable colored
 * table — versus flattening it or filing it as a view-only attachment — is
 * exactly what the target-iPhone test must measure. Nothing here may be
 * described as a working Notes transfer until that evidence exists.
 *
 * Encoding choices:
 * - full `\colortbl`: category foregrounds at indices 1..5, derived opaque
 *   highlights at 6..10 (same composite as FIX-03, pinned to production);
 * - a REAL RTF table (`\trowd`/`\cellx`/`\intbl`/`\cell`/`\row`) rather than
 *   tab-separated paragraphs, because the question under test is precisely
 *   whether Notes keeps editable structure AND per-cell colors from RTF;
 * - every colored cell states its foreground via `\cf`, its highlight via
 *   both standard `\highlight` and Word-compatible character shading
 *   `\chcbpat`; `none` cells state index 0 (auto) explicitly;
 * - all non-ASCII text is emitted as signed 16-bit `\uN?` escapes over the
 *   UTF-16 encoding, so output is pure ASCII regardless of input script;
 * - `\` `{` `}` are escaped; in-cell newlines become `\line`; tabs become
 *   `\tab `; other C0 control characters are dropped.
 */

import {
  CATEGORY_FG,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  OPAQUE_HIGHLIGHT,
} from "./fixture.mjs";
import { EXPORT_COLUMNS, displaySummary, formatDateDisplay, orderedRows } from "./format.mjs";

/** Download filename used by the harness page. */
export const RTF_FILE_NAME = "gym-session-feasibility.rtf";

/** MIME type used for File/Blob construction and clipboard probes. */
export const RTF_MIME_TYPE = "application/rtf";

/* ------------------------------ escaping ------------------------------- */

function rtfUnicodeEscape(utf16Unit) {
  const signed = utf16Unit > 0x7fff ? utf16Unit - 0x10000 : utf16Unit;
  return `\\u${signed}?`;
}

/**
 * Escapes arbitrary user text into ASCII-only RTF text runs. Newlines must be
 * handled by callers (`\\line` placement differs between cells and notes);
 * they are dropped here like any other C0 control character.
 */
export function escapeRtfText(value) {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0);
    if (code === 0x5c) {
      out += "\\\\";
    } else if (code === 0x7b) {
      out += "\\{";
    } else if (code === 0x7d) {
      out += "\\}";
    } else if (code === 0x09) {
      out += "\\tab ";
    } else if (code >= 0x20 && code < 0x7f) {
      out += ch;
    } else if (code >= 0x7f) {
      if (code <= 0xffff) {
        out += rtfUnicodeEscape(code);
      } else {
        const offset = code - 0x10000;
        const high = 0xd800 + (offset >> 10);
        const low = 0xdc00 + (offset & 0x3ff);
        out += rtfUnicodeEscape(high) + rtfUnicodeEscape(low);
      }
    }
    // Remaining C0 control characters (incl. \n \r) are intentionally dropped.
  }
  return out;
}

/** Cell/note text with explicit line breaks preserved as `\\line`. */
function linesToRtf(value) {
  return value.split("\n").map(escapeRtfText).join("\\line ");
}

/* ----------------------------- color table ------------------------------ */

function hexToRtfColor(hex) {
  const int = Number.parseInt(hex.slice(1), 16);
  return `\\red${(int >> 16) & 255}\\green${(int >> 8) & 255}\\blue${int & 255}`;
}

/**
 * Color-table entries in fixed order: five foregrounds (indices 1..5) then
 * five opaque highlights (indices 6..10). Index 0 is the implicit `auto`.
 */
export function buildRtfColorTable() {
  const entries = [
    ...CATEGORY_ORDER.map((category) => CATEGORY_FG[category]),
    ...CATEGORY_ORDER.map((category) => OPAQUE_HIGHLIGHT[category]),
  ];
  return `{\\colortbl;${entries.map(hexToRtfColor).join(";")};}`;
}

const FG_INDEX = Object.fromEntries(
  CATEGORY_ORDER.map((category, index) => [category, index + 1]),
);
const HL_INDEX = Object.fromEntries(
  CATEGORY_ORDER.map((category, index) => [
    category,
    index + CATEGORY_ORDER.length + 1,
  ]),
);

/* ------------------------------ the table ------------------------------- */

/** Fixed column boundaries (twips); deterministic across calls. */
const ROW_PROPS =
  "\\trowd\\trgaph80\\trleft0\\cellx1100\\cellx2600\\cellx3900\\cellx5400\\cellx7000";

function rtfHeaderRow() {
  const cells = EXPORT_COLUMNS.map(
    ({ label }) => `\\intbl{\\b ${escapeRtfText(label)}}\\cell`,
  );
  return [ROW_PROPS, ...cells, "\\row"].join("\n");
}

function rtfBodyCell(text, highlight) {
  if (highlight === "none") {
    return `\\intbl{\\cf0\\highlight0\\chcbpat0 ${linesToRtf(text)}}\\cell`;
  }
  const fgIndex = FG_INDEX[highlight];
  const hlIndex = HL_INDEX[highlight];
  if (fgIndex === undefined || hlIndex === undefined) {
    throw new Error(`Unknown highlight "${highlight}" in feasibility fixture`);
  }
  return `\\intbl{\\cf${fgIndex}\\highlight${hlIndex}\\chcbpat${hlIndex} ${linesToRtf(
    text,
  )}}\\cell`;
}

function rtfTableRow(row) {
  const cells = EXPORT_COLUMNS.map(({ field }) =>
    rtfBodyCell(row[field], row.highlight),
  );
  return [ROW_PROPS, ...cells, "\\row"].join("\n");
}

/* --------------------------- the full document -------------------------- */

/**
 * Builds the complete RTF document for one session-like record (the shape of
 * FIXTURE_SESSION): date → legend → summary → colored table → bottom notes,
 * matching the approved export content order (spec §§14.2, 15.1).
 */
export function buildRtfNotes(session) {
  const summary = displaySummary(session);
  const legend = Object.values(CATEGORY_LABELS).join(" ");
  const parts = [
    "{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1033",
    "{\\fonttbl{\\f0\\fswiss\\fcharset0 Helvetica;}}",
    buildRtfColorTable(),
    `\\pard\\sa120\\f0\\fs28\\b ${escapeRtfText(
      formatDateDisplay(session.dateLocal),
    )}\\b0\\fs22\\par`,
    `\\pard\\sa80\\fs20 ${escapeRtfText(legend)}\\par`,
    `\\pard\\sa120\\fs22 ${escapeRtfText(
      `${summary.sets} sets · ${summary.exercises} exercises`,
    )}\\par`,
    [
      rtfHeaderRow(),
      ...orderedRows(session.rows).map(rtfTableRow),
    ].join("\n"),
    "\\pard\\sa80\\fs22\\b Notes\\b0\\par",
    `\\pard\\sa160\\fs22 ${linesToRtf(session.notes)}\\par`,
    "}",
  ];
  return parts.join("\n");
}
