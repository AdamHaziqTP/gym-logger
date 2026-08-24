import { describe, expect, it } from "vitest";
import {
  buildNotesHtml,
  buildNotesPayload,
  buildNotesText,
} from "../domain/notesExport";
import { CATEGORY_LEGEND, HIGHLIGHT_TOKENS } from "../domain/highlights";
import type { WorkoutRow, WorkoutSession } from "../domain/types";

/* ---------------------------------------------------------------------- */
/* Deterministic Copy-to-Notes payloads (spec §15; task M03-T01).         */
/* These tests pin the exact export representation: content order,        */
/* verbatim free-form values (§6.2/§27.6), highlight/category output, and */
/* HTML escaping. No DOM, no clipboard — pure functions only.             */
/* ---------------------------------------------------------------------- */

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

const REPRESENTATIVE_ROWS: WorkoutRow[] = [
  makeRow({
    id: "r0",
    position: 0,
    exercise: "Recline curl bench 30° IR uni",
    sets: "4",
    reps: "8-10",
    weight: "15kg",
    skip: "",
    highlight: "orange", // Arms
  }),
  makeRow({ id: "r1", position: 1 }), // fully empty row stays in the export
  makeRow({
    id: "r2",
    position: 2,
    exercise: "Lat Pulldown",
    sets: "8,6",
    reps: "10",
    weight: "body weight",
    skip: "knee",
    highlight: "purple", // Back
  }),
];

describe("plain text payload", () => {
  it("matches the exact approved order and layout byte-for-byte", () => {
    const session = makeSession({
      rows: REPRESENTATIVE_ROWS,
      notes: "cardio 15min bike\nshoulders feel good",
      summaryOverride: { sets: "~41", exercises: "39ish" },
    });

    const expected = [
      "Monday 24 Aug",
      "",
      "Arms Back Chest Delts Legs",
      "",
      "~41 sets · 39ish exercises",
      "",
      "Category\tExercise\tSets\tReps\tWeight\tSkip",
      "Arms\tRecline curl bench 30° IR uni\t4\t8-10\t15kg\t",
      "\t\t\t\t\t",
      "Back\tLat Pulldown\t8,6\t10\tbody weight\tknee",
      "",
      "Notes",
      "cardio 15min bike\nshoulders feel good",
    ].join("\n");

    expect(buildNotesText(session)).toBe(expected);
  });

  it("uses the calculated summary when no override exists; empty rows are preserved but not counted", () => {
    const session = makeSession({
      rows: [
        makeRow({ id: "a", position: 0, exercise: "Bench", sets: "12" }),
        makeRow({ id: "b", position: 1, exercise: "", sets: "99" }),
        makeRow({ id: "c", position: 2, exercise: "Row", sets: "8" }),
      ],
    });
    const text = buildNotesText(session);
    // Sets sums only simple integers of ALL rows (99 counts per §8.1);
    // exercises counts only non-empty names (§27.5).
    expect(text).toContain("119 sets · 2 exercises");
  });

  it("keeps the legend exactly the five approved categories in order", () => {
    const lines = buildNotesText(makeSession()).split("\n");
    expect(lines[2]).toBe("Arms Back Chest Delts Legs");
    expect(CATEGORY_LEGEND.map(({ label }) => label)).toEqual([
      "Arms",
      "Back",
      "Chest",
      "Delts",
      "Legs",
    ]);
  });

  it("emits the Notes section even when the notes are empty", () => {
    const text = buildNotesText(makeSession());
    expect(text.endsWith("Notes\n")).toBe(true);
  });

  it("preserves weird free-form cell values verbatim (spec §27.6)", () => {
    const session = makeSession({
      rows: [
        makeRow({
          id: "w0",
          position: 0,
          exercise: "SLDL (semi sumo?)",
          sets: "8.75 + 1 weight kg",
          reps: "10??",
          weight: "8,6",
          skip: "maybe later",
        }),
      ],
    });
    const text = buildNotesText(session);
    expect(text).toContain(
      "\tSLDL (semi sumo?)\t8.75 + 1 weight kg\t10??\t8,6\tmaybe later",
    );
  });

  it("represents highlights as a leading Category column, empty for none", () => {
    const session = makeSession({
      rows: [
        makeRow({ id: "b", position: 0, exercise: "Delts row", highlight: "blue" }),
        makeRow({ id: "n", position: 1, exercise: "Plain row" }),
        makeRow({ id: "l", position: 2, exercise: "Legs row", highlight: "pink" }),
      ],
    });
    const tableLines = buildNotesText(session)
      .split("\n")
      .slice(7); // after header line
    expect(tableLines[0].startsWith("Delts\tDelts row")).toBe(true);
    expect(tableLines[1]).toBe("\tPlain row\t\t\t\t");
    expect(tableLines[2].startsWith("Legs\tLegs row")).toBe(true);
  });
});

describe("HTML payload", () => {
  it("orders date → legend → summary → table → notes", () => {
    const html = buildNotesHtml(
      makeSession({
        rows: REPRESENTATIVE_ROWS,
        notes: "bottom notes line",
        summaryOverride: { sets: "~41", exercises: "39ish" },
      }),
    );
    const indexOf = (needle: string) => html.indexOf(needle);
    expect(indexOf("Monday 24 Aug")).toBeGreaterThan(-1);
    expect(indexOf("Arms Back Chest Delts Legs")).toBeGreaterThan(
      indexOf("Monday 24 Aug"),
    );
    expect(indexOf("~41 sets · 39ish exercises")).toBeGreaterThan(
      indexOf("Arms Back Chest Delts Legs"),
    );
    expect(indexOf("<table")).toBeGreaterThan(
      indexOf("~41 sets · 39 exercises"),
    );
    expect(html.indexOf(">Notes<")).toBeGreaterThan(indexOf("</table>"));
    expect(html.indexOf("bottom notes line")).toBeGreaterThan(
      html.indexOf(">Notes<"),
    );
  });

  it("renders a semantic five-column table with explicit header cells", () => {
    const html = buildNotesHtml(makeSession({ rows: REPRESENTATIVE_ROWS }));
    expect(html).toContain("<table");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    const headers = [...html.matchAll(/<th[^>]*>([^<]+)<\/th>/g)].map(
      (match) => match[1],
    );
    expect(headers).toEqual(["Exercise", "Sets", "Reps", "Weight", "Skip"]);
    expect(html.match(/<tr/g)?.length).toBe(4); // header + 3 body rows
  });

  it("escapes every piece of user text and never leaks raw markup", () => {
    const session = makeSession({
      rows: [
        makeRow({
          id: "x",
          position: 0,
          exercise: '<script>alert("x")</script>',
          weight: "A&B 'quoted'",
        }),
      ],
      notes: "notes <img src=x onerror=alert(1)> & done",
    });
    const html = buildNotesHtml(session);
    expect(html).toContain(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    expect(html).toContain("A&amp;B &#39;quoted&#39;");
    expect(html).toContain("notes &lt;img src=x onerror=alert(1)&gt; &amp; done");
    expect(html.includes("<script>")).toBe(false);
    expect(html.includes("<img")).toBe(false);
  });

  it("carries each category's exact fg/bg tokens on EVERY cell and text wrapper of colored rows (FIX-02)", () => {
    const session = makeSession({
      rows: CATEGORY_LEGEND.map(({ value, label }, index) =>
        makeRow({
          id: value,
          position: index,
          exercise: `${label} row`,
          sets: "3",
          highlight: value,
        }),
      ),
    });
    const html = buildNotesHtml(session);

    expect(html.match(/data-gym-category=/g)?.length).toBe(5);
    for (const { value, label } of CATEGORY_LEGEND) {
      const { fg, bg } = HIGHLIGHT_TOKENS[value];
      const trStart = html.indexOf(`<tr data-gym-category="${label}"`);
      expect(trStart).toBeGreaterThan(-1);
      const rowChunk = html.slice(trStart, html.indexOf("</tr>", trStart));

      // Cell markup carries both category tokens…
      const tds = rowChunk.match(/<td[^>]*/g) ?? [];
      expect(tds).toHaveLength(5);
      for (const td of tds) {
        expect(td).toContain(`background-color:${bg}`);
        expect(td).toContain(`color:${fg}`);
      }
      // …and so does the inline text wrapper inside every cell.
      const spans = rowChunk.match(/<span[^>]*/g) ?? [];
      expect(spans).toHaveLength(5);
      for (const span of spans) {
        expect(span).toContain(`color:${fg}`);
        expect(span).toContain(`background-color:${bg}`);
      }
      expect(rowChunk).toContain(`${label} row`);
    }
  });

  it("keeps none rows uncolored while colored rows keep their markers (FIX-02)", () => {
    const orange = HIGHLIGHT_TOKENS.orange;
    const html = buildNotesHtml(
      makeSession({
        rows: [
          makeRow({ id: "n", position: 0, exercise: "Plain row" }),
          makeRow({
            id: "o",
            position: 1,
            exercise: "Arms row",
            highlight: "orange",
          }),
        ],
      }),
    );

    // The `none` row: no marker, no wrappers, exactly the plain cell style,
    // and no category color anywhere in its markup.
    const noneStart = html.indexOf("<tr><td");
    expect(noneStart).toBeGreaterThan(-1);
    const noneChunk = html.slice(noneStart, html.indexOf("</tr>", noneStart));
    expect(noneChunk.includes("data-gym-category")).toBe(false);
    expect(noneChunk.includes("<span")).toBe(false);
    expect(noneChunk.includes(orange.bg)).toBe(false);
    expect(noneChunk.includes(orange.fg)).toBe(false);
    expect(noneChunk.match(/<td[^>]*/g)).toEqual([
      '<td style="padding:4px 8px;vertical-align:top"',
      '<td style="padding:4px 8px;vertical-align:top"',
      '<td style="padding:4px 8px;vertical-align:top"',
      '<td style="padding:4px 8px;vertical-align:top"',
      '<td style="padding:4px 8px;vertical-align:top"',
    ]);

    // Colored rows keep their machine-readable marker; it never renders empty.
    expect(html.includes('data-gym-category="Arms"')).toBe(true);
    expect(html.includes('data-gym-category=""')).toBe(false);
  });

  it("converts newlines to <br /> while keeping text content intact", () => {
    const session = makeSession({
      rows: [makeRow({ id: "m", position: 0, exercise: "line1\nline2" })],
      notes: "first\n\nthird",
    });
    const html = buildNotesHtml(session);
    expect(html).toContain("line1<br />line2");
    expect(html).toContain("first<br /><br />third");
  });

  it("wraps the export in a dark self-contained block with inline styles only", () => {
    const html = buildNotesHtml(makeSession({ rows: REPRESENTATIVE_ROWS }));
    expect(html.startsWith('<div style="background-color:#000000')).toBe(true);
    expect(html.endsWith("</div>")).toBe(true);
    expect(html.includes('href=')).toBe(false);
    expect(html.includes("http://")).toBe(false);
    expect(html.includes("https://")).toBe(false);
    expect(html.includes("class=")).toBe(false);
  });
});

describe("combined payload", () => {
  it("is deterministic: identical sessions produce byte-identical output", () => {
    const session = makeSession({
      rows: REPRESENTATIVE_ROWS,
      notes: "stable notes",
    });
    const first = buildNotesPayload(session);
    const second = buildNotesPayload({ ...session, rows: session.rows.map((row) => ({ ...row })) });
    expect(second).toEqual(first);
    expect(first.html).not.toBe("");
    expect(first.text).not.toBe("");
  });
});
