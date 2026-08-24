import { describe, expect, it } from "vitest";
import { formatDateDisplay } from "../domain/dates";
import { seedSessionFromFixture } from "../data/fixture";
import {
  IMAGE_EXPORT_WIDTH,
  buildImageLayout,
  buildSessionSvg,
  compactIncludesSkipColumn,
  escapeXmlText,
  exportImageFilename,
  renderSessionSvg,
  wrapCellText,
  type ColumnField,
  type ImageElement,
  type ImageExportStyle,
  type SessionImageDoc,
} from "../domain/imageExport";
import { CATEGORY_LEGEND, HIGHLIGHT_TOKENS } from "../domain/highlights";
import type { WorkoutRow, WorkoutSession } from "../domain/types";

/* ---------------------------------------------------------------------- */
/* Deterministic full-session image export (spec §14; task               */
/* M03-T02-IMAGE-EXPORT-01, corrected by M03-T02-IMAGE-EXPORT-02).       */
/* Pure coverage: the 40-row fixture renders into ONE complete SVG       */
/* (I1/I2), colors carry the locked tokens (I3), bottom notes are        */
/* included (I4), both styles work and differ exactly as §14.1           */
/* specifies (I5), and hostile free-form values survive verbatim         */
/* without markup injection or truncation (§27.6). iOS save/share       */
/* behavior (I6) is NEVER claimed here.                                  */
/*                                                                       */
/* The renderer intentionally wraps long/multiline values into several   */
/* <text> fragments, so NO assertion may require a complete long value   */
/* to occur contiguously in the SVG. Order and losslessness are proven   */
/* instead by collecting each cell's emitted fragments (geometrically    */
/* scoped to the cell's rectangle) and comparing them against the source */
/* with only the wrapper's break-point whitespace ignored.               */
/* ---------------------------------------------------------------------- */

const FIXTURE_SESSION: WorkoutSession = seedSessionFromFixture(
  "2026-08-23T08:00:00.000Z",
);

function makeRow(
  overrides: Partial<WorkoutRow> & { id: string; position: number },
): WorkoutRow {
  return {
    exercise: "",
    sets: "",
    reps: "",
    weight: "",
    skip: "",
    highlight: "none",
    ...overrides,
  };
}

function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: "s1",
    dateLocal: "2026-08-24",
    createdAt: "2026-08-24T08:00:00.000Z",
    updatedAt: "2026-08-24T09:00:00.000Z",
    rows: [],
    notes: "",
    ...overrides,
  };
}

type TextElement = Extract<ImageElement, { kind: "text" }>;
type RectElement = Extract<ImageElement, { kind: "rect" }>;

function isText(element: ImageElement): element is TextElement {
  return element.kind === "text";
}

function docTexts(doc: SessionImageDoc): string[] {
  return doc.elements.filter(isText).map((element) => element.text);
}

/**
 * Removes ALL whitespace. The wrapper consumes characters only at its own
 * break points, which are always a space or an explicit newline, so two
 * whitespace-free strings being equal proves every visible character of the
 * source survived exactly once, in order.
 */
function withoutWhitespace(value: string): string {
  return value.replace(/\s+/g, "");
}

/** Surface color of the table header band (mirrors DARK.headerSurface in
 * imageExport.ts); it is the one rect spanning the full content width. */
const HEADER_SURFACE_FILL = "#111113";

/** Position/width of the rendered table: the header band spans exactly the
 * content width inside whichever margins the selected style uses (Faithful
 * 24px, Compact 12px — a test must never assume one margin for both). */
function tableFrame(doc: SessionImageDoc): { x: number; width: number } {
  const band = doc.elements.find(
    (element): element is RectElement =>
      element.kind === "rect" && element.fill === HEADER_SURFACE_FILL,
  );
  expect(band, "header band rect missing from doc").toBeTruthy();
  return { x: band!.x, width: band!.width };
}

/**
 * All text elements the renderer emitted INSIDE one body cell
 * (bodyRows[rowIndex] × the named column), in emission order. Element x/y
 * coordinates carry the shared outer margin, so the column range is taken
 * relative to the table frame. Nothing else is painted inside a cell's body
 * rectangle, so these fragments are exactly that cell's wrapped content.
 */
function cellElements(
  doc: SessionImageDoc,
  rowIndex: number,
  field: ColumnField,
): TextElement[] {
  const frame = tableFrame(doc);
  const column = doc.columns.find((candidate) => candidate.field === field);
  const band = doc.bodyRows[rowIndex];
  if (!column || !band) return [];
  const left = frame.x + column.x;
  const right = left + column.width;
  return doc.elements.filter(
    (element): element is TextElement =>
      isText(element) &&
      element.x >= left &&
      element.x < right &&
      element.y >= band.y &&
      element.y < band.y + band.height,
  );
}

function cellFragments(
  doc: SessionImageDoc,
  rowIndex: number,
  field: ColumnField,
): string[] {
  return cellElements(doc, rowIndex, field).map((element) => element.text);
}

/** Text payloads exactly as serialized in the SVG (still entity-escaped). */
function serializedTextContents(svg: string): string[] {
  return Array.from(svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)).map(
    (match) => match[1] ?? "",
  );
}

/** Sequential search so duplicate values cannot fake ordering. */
function assertOrdered(haystack: string[], needles: string[]): void {
  let from = 0;
  for (const needle of needles) {
    const found = haystack.indexOf(needle, from);
    expect(found, `expected "${needle}" after position ${from}`).toBeGreaterThan(-1);
    from = found + 1;
  }
}

const STYLES: ImageExportStyle[] = ["faithful", "compact"];

describe("40-row fixture export (I1/I2)", () => {
  it("renders ONE complete deterministic SVG per style with header block, every row in order, and closing root", () => {
    const notes = "cardio 15min bike\nshoulders feel good";
    const session = { ...FIXTURE_SESSION, notes };
    for (const style of STYLES) {
      const svg = buildSessionSvg(session, style);

      // One standalone document — no fragments, no truncation.
      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
      expect(svg.match(/<svg /g)).toHaveLength(1);

      const doc = buildImageLayout(session, style);
      expect(doc.bodyRows).toHaveLength(40);

      // §14.2 content order for the values that never wrap: date → five-entry
      // legend → manual summary override → …table… → NOTES → note lines.
      assertOrdered(docTexts(doc), [
        formatDateDisplay(session.dateLocal),
        "Arms", "Back", "Chest", "Delts", "Legs",
        "40 sets · 39 exercises",
        "NOTES",
        "cardio 15min bike",
        "shoulders feel good",
      ]);

      // Long exercise names wrap into multiple <text> fragments, so the
      // first and last table rows are located by their emitted fragments
      // rather than one contiguous string: both must sit between the summary
      // override and the bottom NOTES label, first row strictly before last.
      const elements = doc.elements;
      const summaryAt = elements.findIndex(
        (element) => isText(element) && element.text === "40 sets · 39 exercises",
      );
      const notesAt = elements.findIndex(
        (element) => isText(element) && element.text === "NOTES",
      );
      const firstRowFragments = cellElements(doc, 0, "exercise");
      const lastRowFragments = cellElements(doc, 39, "exercise");
      expect(firstRowFragments.length).toBeGreaterThan(0);
      expect(lastRowFragments.length).toBeGreaterThan(0);
      const firstRowAt = elements.indexOf(firstRowFragments[0]!);
      const lastRowAt = elements.indexOf(lastRowFragments[0]!);
      expect(summaryAt).toBeGreaterThan(-1);
      expect(notesAt).toBeGreaterThan(summaryAt);
      expect(firstRowAt).toBeGreaterThan(summaryAt);
      expect(lastRowAt).toBeGreaterThan(firstRowAt);
      expect(notesAt).toBeGreaterThan(lastRowAt);

      // I2: nothing dropped — every exercise cell's fragments rebuild its
      // source value character-for-character (only break-point whitespace
      // ignored), across all 40 rows, in both styles.
      session.rows.forEach((row, rowIndex) => {
        if (row.exercise === "") return;
        const rebuilt = cellFragments(doc, rowIndex, "exercise").join("");
        expect(withoutWhitespace(rebuilt)).toBe(withoutWhitespace(row.exercise));
      });
    }
  });

  it("is byte-for-byte deterministic for identical sessions, including cloned rows", () => {
    for (const style of STYLES) {
      const first = buildSessionSvg(FIXTURE_SESSION, style);
      const second = buildSessionSvg(
        {
          ...FIXTURE_SESSION,
          rows: FIXTURE_SESSION.rows.map((row) => ({ ...row })),
        },
        style,
      );
      expect(second).toBe(first);
      expect(first.length).toBeGreaterThan(1000);

      const docFirst = buildImageLayout(FIXTURE_SESSION, style);
      const docSecond = buildImageLayout(FIXTURE_SESSION, style);
      expect(renderSessionSvg(docSecond)).toBe(renderSessionSvg(docFirst));
    }
  });
});

describe("locked category colors inside the image (I3)", () => {
  it("paints every highlighted row's text with its exact locked fg token over the locked translucent bg", () => {
    const doc = buildImageLayout(FIXTURE_SESSION, "compact");
    const rectFills = doc.elements
      .filter(
        (element): element is RectElement => element.kind === "rect",
      )
      .map((element) => element.fill);

    // Fixture rows are unique and non-empty, so content identifies the row.
    for (const row of FIXTURE_SESSION.rows) {
      const exerciseElement = doc.elements.find(
        (element): element is TextElement =>
          element.kind === "text" && element.text === row.exercise,
      );
      expect(exerciseElement).toBeTruthy();
      if (row.highlight === "none") {
        // `none` rows stay unhighlighted: default light text, no bg fill.
        expect(exerciseElement!.fill).toBe("#f2f2f7");
        expect(rectFills).not.toContain(HIGHLIGHT_TOKENS.none.bg);
      } else {
        const tokens = HIGHLIGHT_TOKENS[row.highlight];
        expect(exerciseElement!.fill).toBe(tokens.fg);
      }
    }

    // Every highlighted cell of every highlighted row carries the exact
    // locked translucent background token (rows × columns rects).
    for (const { value } of CATEGORY_LEGEND) {
      const highlighted = FIXTURE_SESSION.rows.filter(
        (row) => row.highlight === value,
      );
      if (highlighted.length === 0) continue;
      expect(
        rectFills.filter((fill) => fill === HIGHLIGHT_TOKENS[value].bg),
      ).toHaveLength(highlighted.length * doc.columns.length);
    }
  });

  it("keeps the visible legend exactly Arms Back Chest Delts Legs in the image", () => {
    for (const style of STYLES) {
      const texts = docTexts(buildImageLayout(FIXTURE_SESSION, style));
      assertOrdered(texts, ["Arms", "Back", "Chest", "Delts", "Legs"]);
      expect(texts.filter((text) => text === "None")).toHaveLength(0);
    }
  });
});

describe("Faithful and Compact differ as specified (I5)", () => {
  it("both styles carry the complete session", () => {
    for (const style of STYLES) {
      const doc = buildImageLayout(FIXTURE_SESSION, style);
      const texts = docTexts(doc);
      expect(texts).toContain(formatDateDisplay(FIXTURE_SESSION.dateLocal));
      expect(texts).toContain("40 sets · 39 exercises");
      // Long exercise names wrap into several fragments; each cell's emitted
      // fragments must rebuild its source value (break-point whitespace
      // ignored) instead of appearing as one contiguous string.
      FIXTURE_SESSION.rows.forEach((row, rowIndex) => {
        if (row.exercise === "") return;
        const rebuilt = cellFragments(doc, rowIndex, "exercise").join("");
        expect(withoutWhitespace(rebuilt)).toBe(withoutWhitespace(row.exercise));
      });
    }
  });

  it("compact is shorter, tighter, and gives Exercise a wider column", () => {
    const faithful = buildImageLayout(FIXTURE_SESSION, "faithful");
    const compact = buildImageLayout(FIXTURE_SESSION, "compact");

    expect(compact.height).toBeLessThan(faithful.height);

    const faithfulExercise =
      faithful.columns.find(({ field }) => field === "exercise")!.width;
    const compactExercise =
      compact.columns.find(({ field }) => field === "exercise")!.width;
    expect(compactExercise).toBeGreaterThan(faithfulExercise);

    // Smaller outer margin (narrower left inset of the date line).
    const faithfulDate = faithful.elements.find(
      (element): element is TextElement =>
        element.kind === "text" &&
        element.text === formatDateDisplay(FIXTURE_SESSION.dateLocal),
    )!;
    const compactDate = compact.elements.find(
      (element): element is TextElement =>
        element.kind === "text" &&
        element.text === formatDateDisplay(FIXTURE_SESSION.dateLocal),
    )!;
    expect(compactDate.x).toBeLessThan(faithfulDate.x);

    // Smaller header/type scale overall.
    const maxSize = (doc: SessionImageDoc) =>
      Math.max(
        ...doc.elements.map((element) =>
          element.kind === "text" ? element.size : 0,
        ),
      );
    expect(maxSize(compact)).toBeLessThan(maxSize(faithful));
  });
});

describe("Compact Skip omission rule is exact (§14.1)", () => {
  const rowsWithSkip = (
    skips: string[],
  ): WorkoutRow[] =>
    skips.map((skip, index) =>
      makeRow({ id: `r${index}`, position: index, exercise: `Ex ${index}`, skip }),
    );

  it("hides Skip when EVERY Skip cell is empty; keeps it otherwise", () => {
    const allEmpty = makeSession({ rows: rowsWithSkip(["", "", ""]) });
    expect(compactIncludesSkipColumn(allEmpty.rows)).toBe(false);
    const compactColumns = buildImageLayout(allEmpty, "compact").columns.map(
      ({ field }) => field,
    );
    expect(compactColumns).toEqual(["exercise", "sets", "reps", "weight"]);
    // Faithful keeps all five columns even with every Skip cell empty.
    expect(
      buildImageLayout(allEmpty, "faithful").columns.map(({ field }) => field),
    ).toEqual(["exercise", "sets", "reps", "weight", "skip"]);

    const anyNonEmpty = makeSession({
      rows: rowsWithSkip(["", "", "knee"]),
    });
    expect(compactIncludesSkipColumn(anyNonEmpty.rows)).toBe(true);
    const kept = buildImageLayout(anyNonEmpty, "compact");
    expect(kept.columns.at(-1)?.label).toBe("Skip");
  });

  it("counts whitespace-only Skip text as Skip text (values are verbatim)", () => {
    const blankish = makeSession({ rows: rowsWithSkip(["", " "]) });
    expect(compactIncludesSkipColumn(blankish.rows)).toBe(true);
    expect(
      buildImageLayout(blankish, "compact").columns.at(-1)?.label,
    ).toBe("Skip");
  });

  it("handles the empty-session edge by omitting Skip in Compact", () => {
    expect(compactIncludesSkipColumn([])).toBe(false);
    expect(
      buildImageLayout(makeSession(), "compact").columns.map(
        ({ field }) => field,
      ),
    ).toEqual(["exercise", "sets", "reps", "weight"]);
  });

  it("always lays columns out to the selected document's exact table width", () => {
    const sessions = [
      makeSession(),
      makeSession({ rows: rowsWithSkip(["", "", ""]) }),
      makeSession({ rows: rowsWithSkip(["knee"]) }),
      makeSession({ rows: rowsWithSkip([" ", ""]) }),
      FIXTURE_SESSION,
    ];
    let faithfulTableWidth = 0;
    let compactTableWidth = 0;
    for (const session of sessions) {
      for (const style of STYLES) {
        const doc = buildImageLayout(session, style);
        expect(doc.width).toBe(IMAGE_EXPORT_WIDTH);
        // Assert against THIS document's actual table width — the header band
        // spans the full content width inside the style's own margins — never
        // against one hard-coded margin shared by both styles.
        const frame = tableFrame(doc);
        const total = doc.columns.reduce((sum, c) => sum + c.width, 0);
        expect(total).toBe(frame.width);
        expect(doc.columns[0]!.x).toBe(0);
        expect(doc.columns.at(-1)!.x + doc.columns.at(-1)!.width).toBe(
          frame.width,
        );
        if (style === "compact") compactTableWidth = frame.width;
        else faithfulTableWidth = frame.width;
      }
    }
    // Compact's smaller margins leave the wider table.
    expect(compactTableWidth).toBeGreaterThan(faithfulTableWidth);
  });
});

describe("hostile free-form values survive without injection or truncation", () => {
  const HOSTILE_ROWS: WorkoutRow[] = [
    makeRow({
      id: "h0",
      position: 0,
      exercise: 'SLDL (semi sumo?) {brace} \\ 30° IR',
      sets: "8,6",
      reps: '"10"',
      weight: "A&B 'quoted'",
      skip: '<img src=x onerror=alert(1)>',
      highlight: "mint",
    }),
    makeRow({
      id: "h1",
      position: 1,
      exercise: "line1\nline2\nline3",
      sets: "3",
    }),
    makeRow({
      id: "h2",
      position: 2,
      exercise: "W".repeat(300), // one unbroken word far beyond any line
      highlight: "purple",
    }),
  ];
  const HOSTILE_NOTES =
    'cardio <b>15</b>min & bike\nC:\\gym\\log "quoted" \\ {json:1}\nend';
  const HOSTILE_SESSION = makeSession({
    dateLocal: "2026-02-03",
    rows: HOSTILE_ROWS,
    notes: HOSTILE_NOTES,
  });

  /** Minimal entity decode used ONLY to verify values round-trip intact. */
  function unescapeXml(value: string): string {
    return value
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }

  it("escapes markup metacharacters so nothing can inject tags", () => {
    for (const style of STYLES) {
      const svg = buildSessionSvg(HOSTILE_SESSION, style);
      // No raw tag or event-handler attribute anywhere in the document.
      expect(svg).not.toContain("<img");
      expect(svg).not.toMatch(/<\/?[a-z]+[^>]*onerror/);
      // The document itself stays well-formed: exactly one svg root.
      expect(svg.match(/<svg /g)).toHaveLength(1);

      // Every serialized <text> payload is fully entity-escaped, and decoding
      // the serialized payloads reproduces exactly the layout's raw texts —
      // escaping is information-preserving for arbitrary hostile content.
      const doc = buildImageLayout(HOSTILE_SESSION, style);
      const serialized = serializedTextContents(svg);
      expect(serialized.length).toBe(docTexts(doc).length);
      for (const content of serialized) {
        expect(content, `raw markup leaked: ${content}`).not.toMatch(/[<>]/);
      }
      expect(serialized.map((content) => unescapeXml(content))).toEqual(
        docTexts(doc),
      );

      // The hostile Skip value reaches the document only through escaped
      // fragments, which decode back and reassemble to the exact source
      // (the wrapper's break-point space excepted).
      const rebuiltSkip = cellFragments(doc, 0, "skip").join("");
      expect(withoutWhitespace(rebuiltSkip)).toBe(
        withoutWhitespace("<img src=x onerror=alert(1)>"),
      );
    }
  });

  it("preserves commas, degree signs, quotes, braces, and backslashes verbatim", () => {
    const CELL_CASES: Array<[number, ColumnField, string]> = [
      [0, "exercise", "SLDL (semi sumo?) {brace} \\ 30° IR"],
      [0, "sets", "8,6"],
      [0, "reps", '"10"'],
      [0, "weight", "A&B 'quoted'"],
      [0, "skip", "<img src=x onerror=alert(1)>"],
      [1, "exercise", "line1\nline2\nline3"],
    ];
    for (const style of STYLES) {
      const doc = buildImageLayout(HOSTILE_SESSION, style);
      for (const [rowIndex, field, source] of CELL_CASES) {
        const rebuilt = cellFragments(doc, rowIndex, field).join("");
        expect(
          withoutWhitespace(rebuilt),
          `${field} of row ${rowIndex} lost content`,
        ).toBe(withoutWhitespace(source));
      }
      // Bottom notes: everything emitted after the NOTES label must rebuild
      // the full multiline, quote/backslash-laden notes value.
      const texts = docTexts(doc);
      const notesAt = texts.indexOf("NOTES");
      expect(notesAt).toBeGreaterThan(-1);
      const rebuiltNotes = texts.slice(notesAt + 1).join("");
      expect(withoutWhitespace(rebuiltNotes)).toBe(
        withoutWhitespace(HOSTILE_NOTES),
      );
    }
  });

  it("keeps multiline structure and hard-breaks over-long words without losing characters", () => {
    for (const style of STYLES) {
      const texts = docTexts(buildImageLayout(HOSTILE_SESSION, style));
      // Multiline cell becomes separate lines, in order, none dropped.
      assertOrdered(texts, ["line1", "line2", "line3"]);
      assertOrdered(texts, ["cardio <b>15</b>min & bike", "end"]);
      // The 300-char word reassembles character-perfect.
      const rebuilt = texts
        .filter((text) => /^W+$/.test(text))
        .join("");
      expect(rebuilt).toBe("W".repeat(300));
    }
  });
});

describe("wrapping primitive", () => {
  it("splits explicit newlines, preserving empty segments", () => {
    expect(wrapCellText("a\n\nb", 20)).toEqual(["a", "", "b"]);
    expect(wrapCellText("", 20)).toEqual([""]);
  });

  it("greedy-fills words and hard-breaks anything longer than a line", () => {
    expect(wrapCellText("aa bb cc", 5)).toEqual(["aa bb", "cc"]);
    expect(wrapCellText("abcdef", 2)).toEqual(["ab", "cd", "ef"]);
    // "defghijkl" cannot fit a 4-char line: it hard-breaks into 4-char chunks
    // and the following short word joins the final chunk's line.
    const lines = wrapCellText("abc defghijkl mn", 4);
    expect(lines).toEqual(["abc", "defg", "hijk", "l mn"]);
    // Lossless where spaces are accounted for: the only characters the
    // wrapper ever consumes are the spaces/newlines it breaks at, so joining
    // the emitted lines and dropping whitespace rebuilds the source exactly.
    expect(withoutWhitespace(lines.join(""))).toBe(
      withoutWhitespace("abc defghijkl mn"),
    );
  });
});

describe("XML escaping primitive", () => {
  it("entity-encodes all five markup metacharacters", () => {
    expect(escapeXmlText(`<a b="c">&'d'</a>`)).toBe(
      "&lt;a b=&quot;c&quot;&gt;&amp;&apos;d&apos;&lt;/a&gt;",
    );
  });
});

describe("output filename (§14.3)", () => {
  it("is Gym-YYYY-MM-DD.png from the session's local date", () => {
    expect(exportImageFilename("2026-08-23")).toBe("Gym-2026-08-23.png");
    expect(exportImageFilename(FIXTURE_SESSION.dateLocal)).toBe(
      "Gym-2026-08-23.png",
    );
  });
});
