import { formatDateDisplay } from "./dates";
import {
  CATEGORY_LEGEND,
  HIGHLIGHT_TOKENS,
} from "./highlights";
import { orderedRows } from "./rows";
import { displaySummary } from "./summary";
import type { Highlight, WorkoutRow, WorkoutSession } from "./types";

/**
 * Deterministic whole-session image representation (spec §14; task
 * M03-T02-IMAGE-EXPORT-01). Pure functions only: the same session and style
 * always produce a byte-identical SVG document — no clock, locale, randomness,
 * or DOM measurement of any kind. The browser-only PNG rasterization and
 * share/download mechanics live in `pngExport.ts`; this module never touches
 * them, which is what makes the renderer unit-testable.
 *
 * Content order follows spec §14.2: date → category legend (exactly `Arms
 * Back Chest Delts Legs`) → sets/exercises summary → five-column table →
 * bottom notes. Free-form cell values, Skip text, manual summary overrides,
 * row highlight categories, and notes are carried verbatim (spec §6.2,
 * §27.6): nothing is trimmed, normalized, or dropped. Long or multiline
 * values wrap; nothing is ever truncated.
 *
 * Presentation is locked to the app's dark Notes appearance (spec §14.4)
 * regardless of any future light theme: black backdrop, light text, subtle
 * grid lines, and each row painted with its exact locked category foreground
 * plus translucent background token. `none` rows stay unhighlighted.
 */

export type ImageExportStyle = "faithful" | "compact";

/** Field names of the visible workout columns (spec §6.1). */
export type ColumnField = "exercise" | "sets" | "reps" | "weight" | "skip";

/* ------------------------------ dark tokens ----------------------------- */

/** Locked dark-presentation colors (spec §22.1 / §14.4), mirrored for SVG. */
const DARK = {
  backdrop: "#000000",
  headerSurface: "#111113",
  text: "#f2f2f7",
  textDim: "#98989f",
  grid: "rgba(235, 235, 245, 0.16)",
  gridStrong: "rgba(235, 235, 245, 0.24)",
} as const;

const FONT_FAMILY =
  "-apple-system, 'Helvetica Neue', Arial, sans-serif";

/* ------------------------------ style tokens ----------------------------- */

interface StyleTokens {
  /** Outer margin left/right. Compact is deliberately narrower (§14.1). */
  marginX: number;
  marginTop: number;
  marginBottom: number;
  titleSize: number;
  legendSize: number;
  legendDotRadius: number;
  legendGapY: number;
  summarySize: number;
  gapBelowSummary: number;
  headSize: number;
  headPadY: number;
  headLineHeight: number;
  cellSize: number;
  cellLineHeight: number;
  cellPadY: number;
  cellPadX: number;
  minRowHeight: number;
  notesLabelSize: number;
  gapAboveNotes: number;
  /**
   * Base column fractions over the table width. The Skip fraction only
   * applies when the column is present; otherwise it is redistributed across
   * the remaining columns proportionally.
   */
  columnFractions: Record<ColumnField, number>;
}

/** Faithful: the normal Apple Notes-like spacing (§14.1 "Faithful"). */
const FAITHFUL: StyleTokens = {
  marginX: 24,
  marginTop: 30,
  marginBottom: 34,
  titleSize: 26,
  legendSize: 13,
  legendDotRadius: 5,
  legendGapY: 12,
  summarySize: 15,
  gapBelowSummary: 16,
  headSize: 12,
  headPadY: 9,
  headLineHeight: 15,
  cellSize: 15,
  cellLineHeight: 21,
  cellPadY: 10,
  cellPadX: 8,
  minRowHeight: 44,
  notesLabelSize: 12,
  gapAboveNotes: 20,
  columnFractions: {
    exercise: 0.33,
    sets: 0.11,
    reps: 0.13,
    weight: 0.22,
    skip: 0.21,
  },
};

/** Compact: smaller header/margins/padding, wider Exercise column (§14.1). */
const COMPACT: StyleTokens = {
  marginX: 12,
  marginTop: 18,
  marginBottom: 22,
  titleSize: 19,
  legendSize: 11,
  legendDotRadius: 4,
  legendGapY: 8,
  summarySize: 13,
  gapBelowSummary: 10,
  headSize: 10,
  headPadY: 6,
  headLineHeight: 13,
  cellSize: 12,
  cellLineHeight: 16,
  cellPadY: 5,
  cellPadX: 6,
  minRowHeight: 26,
  notesLabelSize: 11,
  gapAboveNotes: 14,
  columnFractions: {
    exercise: 0.42,
    sets: 0.09,
    reps: 0.11,
    weight: 0.18,
    skip: 0.2,
  },
};

export const IMAGE_EXPORT_WIDTH = 760;

function tokensForStyle(style: ImageExportStyle): StyleTokens {
  return style === "compact" ? COMPACT : FAITHFUL;
}

/* --------------------------- skip-column rule ---------------------------- */

/**
 * Exact Compact Skip rule (spec §14.1): the Skip column is hidden ONLY when
 * every Skip cell is empty. Values are compared verbatim — any non-empty
 * string (including whitespace-only) counts as Skip text, because §6.2/§27.6
 * forbid normalizing user data just to drop a column. Faithful always keeps
 * all five columns.
 */
export function compactIncludesSkipColumn(rows: ReadonlyArray<WorkoutRow>): boolean {
  return rows.some((row) => row.skip.length > 0);
}

/* -------------------------------- wrapping -------------------------------- */

/**
 * Rough average advance width of the system sans font as a fraction of the
 * point size. Only used to choose wrap points; correctness never depends on
 * its accuracy because words longer than a line are hard-broken below.
 */
const AVG_CHAR_WIDTH_RATIO = 0.58;

/**
 * Greedy word wrap with hard-breaking for over-long words. Splits explicit
 * newlines first so multiline values keep their line structure exactly.
 * Every input character appears in exactly one output line, in order — this
 * is how the renderer guarantees no truncation without measuring real glyph
 * widths (which would break determinism).
 */
export function wrapCellText(text: string, maxCharsPerLine: number): string[] {
  const limit = Math.max(1, Math.floor(maxCharsPerLine));
  const lines: string[] = [];
  const segments = text.split("\n");
  // Preserve trailing empty segments (e.g. "a\n") as empty lines.
  for (let s = 0; s < segments.length; s += 1) {
    const segment = segments[s] ?? "";
    if (segment === "") {
      lines.push("");
      continue;
    }
    let line = "";
    const words = segment.split(" ");
    for (const rawWord of words) {
      let word = rawWord;
      while (word.length > limit) {
        if (line !== "") {
          lines.push(line);
          line = "";
        }
        lines.push(word.slice(0, limit));
        word = word.slice(limit);
      }
      if (word === "") continue;
      if (line === "") {
        line = word;
      } else if (line.length + 1 + word.length <= limit) {
        line += ` ${word}`;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines.length > 0 ? lines : [""];
}

function maxCharsForColumn(
  columnWidth: number,
  tokens: StyleTokens,
): number {
  const usable = columnWidth - 2 * tokens.cellPadX - 2; // 2px inner gutter
  return Math.max(1, Math.floor(usable / (tokens.cellSize * AVG_CHAR_WIDTH_RATIO)));
}

/* -------------------------------- document -------------------------------- */

export interface ImageColumn {
  field: ColumnField;
  label: string;
  x: number;
  width: number;
}

export interface ImageBodyRow {
  y: number;
  height: number;
}

export type ImageElement =
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      fill: string;
      radius?: number;
    }
  | { kind: "circle"; cx: number; cy: number; radius: number; fill: string }
  | {
      kind: "text";
      x: number;
      y: number;
      text: string;
      fill: string;
      size: number;
      weight?: "bold";
      spacing?: number;
    };

export interface SessionImageDoc {
  style: ImageExportStyle;
  width: number;
  height: number;
  includesSkipColumn: boolean;
  columns: ImageColumn[];
  bodyRows: ImageBodyRow[];
  elements: ImageElement[];
}

const COLUMN_LABELS: Record<ColumnField, string> = {
  exercise: "Exercise",
  sets: "Sets",
  reps: "Reps",
  weight: "Weight",
  skip: "Skip",
};

const COLUMN_ORDER: ColumnField[] = [
  "exercise",
  "sets",
  "reps",
  "weight",
  "skip",
];

function buildColumns(
  tableWidth: number,
  tokens: StyleTokens,
  includeSkip: boolean,
): ImageColumn[] {
  const fractions = COLUMN_ORDER.filter(
    (field) => includeSkip || field !== "skip",
  );
  const totalFraction = fractions.reduce(
    (sum, field) => sum + tokens.columnFractions[field],
    0,
  );
  // Integer pixel widths; rounding remainder goes to the Exercise column so
  // the columns always sum exactly to the table width.
  const widths = fractions.map((field) =>
    Math.floor((tokens.columnFractions[field] / totalFraction) * tableWidth),
  );
  widths[0] += tableWidth - widths.reduce((sum, w) => sum + w, 0);

  const columns: ImageColumn[] = [];
  let x = 0;
  fractions.forEach((field, index) => {
    const width = widths[index] ?? 0;
    columns.push({ field, label: COLUMN_LABELS[field], x, width });
    x += width;
  });
  return columns;
}

function baselineFor(lineBoxTop: number, size: number, lineHeight: number): number {
  const leading = Math.max(0, lineHeight - size);
  return lineBoxTop + Math.floor(leading / 2) + Math.round(size * 0.8);
}

/**
 * Builds the structured image document for one session in one style. Pure:
 * identical inputs produce structurally identical docs.
 */
export function buildImageLayout(
  session: WorkoutSession,
  style: ImageExportStyle,
): SessionImageDoc {
  const tokens = tokensForStyle(style);
  const rows = orderedRows(session.rows);
  const summary = displaySummary(session);

  const contentWidth = IMAGE_EXPORT_WIDTH - 2 * tokens.marginX;
  const elements: ImageElement[] = [];

  /* -- 1. Date (spec §14.2 order starts here) -- */
  const dateBaseline = tokens.marginTop + Math.round(tokens.titleSize * 0.8);
  elements.push({
    kind: "text",
    x: tokens.marginX,
    y: dateBaseline,
    text: formatDateDisplay(session.dateLocal),
    fill: DARK.text,
    size: tokens.titleSize,
    weight: "bold",
  });

  /* -- 2. Category legend: exactly Arms Back Chest Delts Legs (final legend
        decision); `none` has no entry and no dot. Dots use the locked fg
        token, matching the on-screen CategoryLegend. -- */
  let cursorY =
    tokens.marginTop + Math.round(tokens.titleSize * 1.25) + tokens.legendGapY;
  let cursorX = tokens.marginX;
  for (const { value, label } of CATEGORY_LEGEND) {
    const dotCy = cursorY + tokens.legendDotRadius + 1;
    elements.push({
      kind: "circle",
      cx: cursorX + tokens.legendDotRadius,
      cy: dotCy,
      radius: tokens.legendDotRadius,
      fill: HIGHLIGHT_TOKENS[value].fg,
    });
    const labelX = cursorX + tokens.legendDotRadius * 2 + 6;
    elements.push({
      kind: "text",
      x: labelX,
      y: dotCy + Math.round(tokens.legendSize * 0.36),
      text: label,
      fill: DARK.textDim,
      size: tokens.legendSize,
    });
    cursorX = labelX + label.length * tokens.legendSize * AVG_CHAR_WIDTH_RATIO + 14;
  }

  /* -- 3. Sets/exercises summary (manual override wins, verbatim). -- */
  cursorY += tokens.legendDotRadius * 2 + tokens.legendGapY + 6;
  const summaryBaseline = cursorY + Math.round(tokens.summarySize * 0.8);
  elements.push({
    kind: "text",
    x: tokens.marginX,
    y: summaryBaseline,
    text: `${summary.sets} sets · ${summary.exercises} exercises`,
    fill: DARK.textDim,
    size: tokens.summarySize,
  });

  /* -- 4. Table. -- */
  const includeSkip = style === "faithful" || compactIncludesSkipColumn(rows);
  const columns = buildColumns(contentWidth, tokens, includeSkip);

  const headHeight = tokens.headLineHeight + 2 * tokens.headPadY;
  const tableTop = summaryBaseline + tokens.gapBelowSummary;

  // Header band + labels.
  elements.push({
    kind: "rect",
    x: tokens.marginX,
    y: tableTop,
    width: contentWidth,
    height: headHeight,
    fill: DARK.headerSurface,
  });
  for (const column of columns) {
    elements.push({
      kind: "text",
      x: tokens.marginX + column.x + tokens.cellPadX,
      y: tableTop + tokens.headPadY + Math.round(tokens.headSize * 0.8),
      text: column.label,
      fill: DARK.textDim,
      size: tokens.headSize,
      spacing: 0.3,
    });
  }

  // Body rows: heights come from wrapped line counts (max across cells).
  const bodyTop = tableTop + headHeight;
  const bodyRows: ImageBodyRow[] = [];
  const maxCharsByField = new Map<ColumnField, number>(
    columns.map((column) => [
      column.field,
      maxCharsForColumn(column.width, tokens),
    ]),
  );
  let y = bodyTop;
  for (const row of rows) {
    const maxLines = Math.max(
      ...columns.map(({ field }) =>
        wrapCellText(row[field], maxCharsByField.get(field) ?? 1).length,
      ),
      1,
    );
    const height = Math.max(
      tokens.minRowHeight,
      maxLines * tokens.cellLineHeight + 2 * tokens.cellPadY,
    );
    bodyRows.push({ y, height });
    y += height;
  }
  const tableBottom = y;

  // Row bands, per-cell highlights, cell text, separators.
  rows.forEach((row, rowIndex) => {
    const band = bodyRows[rowIndex];
    if (!band) return;
    for (const column of columns) {
      const cellX = tokens.marginX + column.x;
      // Category treatment (spec §5.2): translucent locked bg behind the
      // cell's text block, locked bright fg on the text itself. `none` rows
      // get no highlight at all.
      let textFill: string = DARK.text;
      if (row.highlight !== "none") {
        const category: Highlight = row.highlight;
        textFill = HIGHLIGHT_TOKENS[category].fg;
        elements.push({
          kind: "rect",
          x: cellX + 3,
          y: band.y + 3,
          width: column.width - 6,
          height: band.height - 6,
          radius: 6,
          fill: HIGHLIGHT_TOKENS[category].bg,
        });
      }
      const lines = wrapCellText(
        row[column.field],
        maxCharsByField.get(column.field) ?? 1,
      );
      lines.forEach((line, lineIndex) => {
        if (line === "") return;
        elements.push({
          kind: "text",
          x: cellX + tokens.cellPadX,
          y: baselineFor(
            band.y + tokens.cellPadY + lineIndex * tokens.cellLineHeight,
            tokens.cellSize,
            tokens.cellLineHeight,
          ),
          text: line,
          fill: textFill,
          size: tokens.cellSize,
        });
      });
      // Vertical separator after every column except the last.
      if (column.x + column.width < contentWidth) {
        elements.push({
          kind: "rect",
          x: tokens.marginX + column.x + column.width - 1,
          y: band.y,
          width: 1,
          height: band.height,
          fill: DARK.grid,
        });
      }
    }
    // Horizontal separator between rows (not below the last row; the outer
    // border closes the table).
    if (rowIndex < rows.length - 1) {
      elements.push({
        kind: "rect",
        x: tokens.marginX,
        y: band.y + band.height - 1,
        width: contentWidth,
        height: 1,
        fill: DARK.grid,
      });
    }
  });

  // Header underline + outer border (grid-strong like .table-scroll).
  elements.push({
    kind: "rect",
    x: tokens.marginX,
    y: tableTop + headHeight - 1,
    width: contentWidth,
    height: 1,
    fill: DARK.gridStrong,
  });
  elements.push({ kind: "rect", x: tokens.marginX, y: bodyTop, width: 1, height: tableBottom - bodyTop, fill: DARK.gridStrong });
  elements.push({ kind: "rect", x: tokens.marginX + contentWidth - 1, y: bodyTop, width: 1, height: tableBottom - bodyTop, fill: DARK.gridStrong });
  elements.push({ kind: "rect", x: tokens.marginX, y: tableBottom - 1, width: contentWidth, height: 1, fill: DARK.gridStrong });

  /* -- 5. Bottom notes (always emitted; I4). -- */
  const notesTop = tableBottom + tokens.gapAboveNotes;
  const notesLabelBaseline = notesTop + Math.round(tokens.notesLabelSize * 0.8);
  elements.push({
    kind: "text",
    x: tokens.marginX,
    y: notesLabelBaseline,
    text: "NOTES",
    fill: DARK.textDim,
    size: tokens.notesLabelSize,
    spacing: 0.5,
  });
  const noteLines = wrapCellText(
    session.notes,
    Math.floor(contentWidth / (tokens.cellSize * AVG_CHAR_WIDTH_RATIO)),
  );
  noteLines.forEach((line, lineIndex) => {
    if (line === "") return;
    elements.push({
      kind: "text",
      x: tokens.marginX,
      y:
        notesLabelBaseline +
        tokens.cellLineHeight +
        lineIndex * tokens.cellLineHeight +
        Math.round(tokens.cellSize * 0.8),
      text: line,
      fill: DARK.text,
      size: tokens.cellSize,
    });
  });

  const height =
    notesTop +
    tokens.notesLabelSize +
    noteLines.length * tokens.cellLineHeight +
    8 +
    tokens.marginBottom;

  return {
    style,
    width: IMAGE_EXPORT_WIDTH,
    height,
    includesSkipColumn: includeSkip,
    columns,
    bodyRows,
    elements,
  };
}

/* ------------------------------ serialization ------------------------------ */

/** Fixed deterministic number formatting: integers stay integers, other
 *  values round half-up to two decimals. No exponent notation, no locale. */
function fmt(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

/** Escapes dynamic text for XML text content and double-quoted attributes. */
export function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Serializes a layout doc into the final standalone SVG document string.
 * Byte-for-byte deterministic for identical docs.
 */
export function renderSessionSvg(doc: SessionImageDoc): string {
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(doc.width)}" height="${fmt(
      doc.height,
    )}" viewBox="0 0 ${fmt(doc.width)} ${fmt(doc.height)}" font-family="${FONT_FAMILY}">`,
  );
  parts.push(
    `  <rect x="0" y="0" width="${fmt(doc.width)}" height="${fmt(
      doc.height,
    )}" fill="${DARK.backdrop}"/>`,
  );
  for (const element of doc.elements) {
    switch (element.kind) {
      case "rect": {
        const radius =
          element.radius !== undefined ? ` rx="${fmt(element.radius)}"` : "";
        parts.push(
          `  <rect x="${fmt(element.x)}" y="${fmt(element.y)}" width="${fmt(
            element.width,
          )}" height="${fmt(element.height)}" fill="${element.fill}"${radius}/>`,
        );
        break;
      }
      case "circle":
        parts.push(
          `  <circle cx="${fmt(element.cx)}" cy="${fmt(element.cy)}" r="${fmt(
            element.radius,
          )}" fill="${element.fill}"/>`,
        );
        break;
      case "text": {
        const weight = element.weight ? ` font-weight="${element.weight}"` : "";
        const spacing =
          element.spacing !== undefined
            ? ` letter-spacing="${fmt(element.spacing)}"`
            : "";
        parts.push(
          `  <text x="${fmt(element.x)}" y="${fmt(element.y)}" fill="${
            element.fill
          }" font-size="${fmt(element.size)}"${weight}${spacing}>${escapeXmlText(
            element.text,
          )}</text>`,
        );
        break;
      }
    }
  }
  parts.push("</svg>");
  return parts.join("\n");
}

/**
 * One-call export representation: full-session SVG document (spec §14).
 */
export function buildSessionSvg(
  session: WorkoutSession,
  style: ImageExportStyle,
): string {
  return renderSessionSvg(buildImageLayout(session, style));
}

/** Spec §14.3: exactly `Gym-YYYY-MM-DD.png` from the session's local date. */
export function exportImageFilename(dateLocal: string): string {
  return `Gym-${dateLocal}.png`;
}
