import { describe, expect, it } from "vitest";

// Production modules under test for parity (TypeScript sources).
import {
  buildNotesText,
} from "../domain/notesExport";
import {
  CATEGORY_LEGEND,
  HIGHLIGHT_TOKENS,
  OPAQUE_HIGHLIGHT_BG,
} from "../domain/highlights";
import { formatDateDisplay } from "../domain/dates";
import {
  calculateSummary as prodCalculateSummary,
  displaySummary as prodDisplaySummary,
} from "../domain/summary";

// Experimental feasibility harness modules (static assets, zero deps).
import {
  CATEGORY_BG_TRANSLUCENT,
  CATEGORY_FG,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  FIXTURE_SESSION,
  OPAQUE_HIGHLIGHT,
} from "../../public/feasibility/fixture.mjs";
import {
  calculateSummary,
  displaySummary,
  formatDateDisplay as mirrorFormatDateDisplay,
} from "../../public/feasibility/format.mjs";
import { buildPlainNotes } from "../../public/feasibility/plainNotes.mjs";
import {
  buildRtfColorTable,
  buildRtfNotes,
  escapeRtfText,
} from "../../public/feasibility/rtfNotes.mjs";
import { buildRepresentativeNotesHtml } from "../../public/feasibility/notesHtmlTable.mjs";
import {
  ROUTE_STATUS,
  classifyRoutes,
  detectCapabilities,
} from "../../public/feasibility/routes.mjs";

/* ======================================================================== */
/* EXPERIMENTAL FEASIBILITY HARNESS CONTRACTS (task M03-T01-E003-FEAS-01).  */
/* These tests keep the isolated public/feasibility/ asset pinned to the    */
/* production domain code so the spike can never drift from the accepted    */
/* payload contract, and they enforce honest capability reporting.          */
/* ======================================================================== */

/** Lifts the fixture into a full production WorkoutSession shape. */
function liftedSession() {
  return {
    id: FIXTURE_SESSION.id,
    dateLocal: FIXTURE_SESSION.dateLocal,
    createdAt: "2026-08-23T08:00:00.000Z",
    updatedAt: "2026-08-23T09:00:00.000Z",
    rows: FIXTURE_SESSION.rows.map((row) => ({ ...row })),
    notes: FIXTURE_SESSION.notes,
    summaryOverride: { ...FIXTURE_SESSION.summaryOverride },
  };
}

function sessionWithOneRow(row) {
  return {
    id: "t",
    dateLocal: "2026-08-23",
    createdAt: "2026-08-23T08:00:00.000Z",
    updatedAt: "2026-08-23T09:00:00.000Z",
    rows: [{ id: "r1", position: 0, ...row }],
    notes: "",
  };
}

/* ------------------------- fixture ↔ production parity ------------------- */

describe("fixture parity with production locked tokens", () => {
  it("legend labels and order match CATEGORY_LEGEND exactly", () => {
    expect(CATEGORY_ORDER).toEqual(CATEGORY_LEGEND.map(({ value }) => value));
    for (const { value, label } of CATEGORY_LEGEND) {
      expect(CATEGORY_LABELS[value]).toBe(label);
    }
  });

  it("foreground/background tokens match HIGHLIGHT_TOKENS for all five categories", () => {
    for (const category of CATEGORY_ORDER) {
      expect(CATEGORY_FG[category]).toBe(HIGHLIGHT_TOKENS[category].fg);
      expect(CATEGORY_BG_TRANSLUCENT[category]).toBe(
        HIGHLIGHT_TOKENS[category].bg,
      );
    }
  });

  it("derived opaque highlights match OPAQUE_HIGHLIGHT_BG (FIX-03 composite)", () => {
    const documented = {
      orange: "#261802",
      purple: "#1f0e27",
      mint: "#0f201f",
      blue: "#021529",
      pink: "#26080e",
    };
    for (const category of CATEGORY_ORDER) {
      expect(OPAQUE_HIGHLIGHT[category]).toBe(OPAQUE_HIGHLIGHT_BG[category]);
      expect(OPAQUE_HIGHLIGHT[category]).toBe(documented[category]);
    }
  });
});

describe("fixture representativeness", () => {
  it("covers all five categories plus at least one none row", () => {
    const highlights = new Set(FIXTURE_SESSION.rows.map((row) => row.highlight));
    for (const category of CATEGORY_ORDER) {
      expect(highlights.has(category)).toBe(true);
    }
    expect(
      FIXTURE_SESSION.rows.filter((row) => row.highlight === "none").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("keeps strictly increasing positions and weird free-form values verbatim", () => {
    const positions = FIXTURE_SESSION.rows.map((row) => row.position);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));

    const cells = FIXTURE_SESSION.rows.flatMap((row) => [
      row.exercise,
      row.sets,
      row.reps,
      row.weight,
      row.skip,
    ]);
    for (const weird of [
      "8,6",
      "body weight",
      "Recline curl bench 30° IR uni",
      "Kelso shrug — chest supported (wide grip)",
      "Curl & Press <strict>",
      'Ab Cable Crunch "inc."',
      'Reverse curl \\ "strict" {tempo 3-1-3}',
      "shoulder",
    ]) {
      expect(cells).toContain(weird);
    }
  });

  it("carries multi-line notes and a non-derivable summary override", () => {
    expect(FIXTURE_SESSION.notes.split("\n").length).toBeGreaterThan(2);
    // "~41"/"7+" can never be computed from integer set sums / row counts.
    expect(FIXTURE_SESSION.summaryOverride.sets).toBe("~41");
    expect(FIXTURE_SESSION.summaryOverride.exercises).toBe("7+");
  });
});

describe("mirror helper parity with production pure helpers", () => {
  const dates = [
    "2026-08-23", // Sunday 23 Aug
    "2024-02-29", // leap day
    "2026-01-01",
    "1999-12-31",
    "not-a-date",
    "2026-13-45",
    "2026-00-10",
  ];

  it("formatDateDisplay mirror equals production for every probe date", () => {
    for (const date of dates) {
      expect(mirrorFormatDateDisplay(date)).toBe(formatDateDisplay(date));
    }
    expect(mirrorFormatDateDisplay("2026-08-23")).toBe("Sunday 23 Aug");
  });

  it("summary mirror equals production including override precedence", () => {
    const cases = [
      liftedSession(),
      { ...liftedSession(), summaryOverride: undefined },
      sessionWithOneRow({
        exercise: "Lat Pulldown",
        sets: "8,6",
        reps: "10",
        weight: "body weight",
        skip: "",
        highlight: "purple",
      }),
      sessionWithOneRow({
        exercise: "",
        sets: "4x8",
        reps: "",
        weight: "",
        skip: "",
        highlight: "none",
      }),
    ];
    for (const session of cases) {
      expect(calculateSummary(session.rows)).toEqual(
        prodCalculateSummary(session.rows),
      );
      expect(displaySummary(session)).toEqual(prodDisplaySummary(session));
    }
    // Sanity on the interesting rules themselves.
    expect(displaySummary(liftedSession())).toEqual({
      sets: "~41",
      exercises: "7+",
    });
  });
});

/* ----------------------------- plain control ----------------------------- */

describe("plain text control restates production buildNotesText", () => {
  it("is byte-equal to the production plain payload for the fixture", () => {
    expect(buildPlainNotes(FIXTURE_SESSION)).toBe(
      buildNotesText(liftedSession()),
    );
  });

  it("uses the leading Category column header and TSV columns", () => {
    const lines = buildPlainNotes(FIXTURE_SESSION).split("\n");
    expect(lines).toContain("Category\tExercise\tSets\tReps\tWeight\tSkip");
    const armsRow = lines.find((line) => line.startsWith("Arms\t"));
    expect(armsRow).toBe("Arms\tRecline curl bench 30° IR uni\t4\t8,6\t16.25 kg\t");
    const noneRow = lines.find((line) =>
      line.endsWith('Ab Cable Crunch "inc."\t1\t9\t52.5kg\t'),
    );
    expect(noneRow?.startsWith("\t")).toBe(true); // empty Category for none rows
  });
});

/* ------------------------------ RTF generator ---------------------------- */

describe("RTF generator determinism and structure", () => {
  it("produces byte-identical output across calls and never mutates input", () => {
    const before = JSON.stringify(FIXTURE_SESSION);
    const first = buildRtfNotes(FIXTURE_SESSION);
    const second = buildRtfNotes(FIXTURE_SESSION);
    expect(first).toBe(second);
    expect(first.length).toBeGreaterThan(200);
    expect(JSON.stringify(FIXTURE_SESSION)).toBe(before);
  });

  it("emits an ASCII-only document starting and ending correctly", () => {
    const rtf = buildRtfNotes(FIXTURE_SESSION);
    expect(rtf.startsWith("{\\rtf1")).toBe(true);
    expect(rtf.endsWith("}")).toBe(true);
    expect(rtf).toMatch(/^[\n\x20-\x7e]+$/);
  });

  it("carries the exact color table: five foregrounds then five opaque highlights", () => {
    expect(buildRtfColorTable()).toBe(
      "{\\colortbl;" +
        "\\red255\\green159\\blue10;" + // Arms fg #ff9f0a
        "\\red191\\green90\\blue242;" + // Back fg #bf5af2
        "\\red102\\green212\\blue207;" + // Chest fg #66d4cf
        "\\red10\\green132\\blue255;" + // Delts fg #0a84ff
        "\\red255\\green55\\blue95;" + // Legs fg #ff375f
        "\\red38\\green24\\blue2;" + // Arms highlight #261802
        "\\red31\\green14\\blue39;" + // Back highlight #1f0e27
        "\\red15\\green32\\blue31;" + // Chest highlight #0f201f
        "\\red2\\green21\\blue41;" + // Delts highlight #021529
        "\\red38\\green8\\blue14;}", // Legs highlight #26080e
    );
  });

  it("renders one real RTF table row per fixture row plus a header row", () => {
    const rtf = buildRtfNotes(FIXTURE_SESSION);
    expect(rtf.split("\\trowd").length - 1).toBe(FIXTURE_SESSION.rows.length + 1);
    expect(rtf.split("\\cellx1100\\cellx2600\\cellx3900\\cellx5400\\cellx7000").length - 1).toBe(
      FIXTURE_SESSION.rows.length + 1,
    );
    // Each row carries exactly five real cells (excluding \cellx prefixes)
    // and terminates with \row.
    const rows = rtf.split("\\row");
    expect(rows.length - 1).toBe(FIXTURE_SESSION.rows.length + 1);
    for (const chunk of rows.slice(0, -1)) {
      expect((chunk.match(/\\cell(?!x)/g) ?? []).length).toBe(5);
    }
  });

  it("maps each category to its fixed color indices and leaves none uncolored", () => {
    const mapping = {
      orange: [1, 6],
      purple: [2, 7],
      mint: [3, 8],
      blue: [4, 9],
      pink: [5, 10],
    };
    for (const [category, [fgIndex, hlIndex]] of Object.entries(mapping)) {
      const rtf = buildRtfNotes(
        sessionWithOneRow({
          exercise: "Lat Pulldown",
          sets: "8,6",
          reps: "10",
          weight: "body weight",
          skip: "",
          highlight: category,
        }),
      );
      expect(rtf).toContain(`\\cf${fgIndex}\\highlight${hlIndex}\\chcbpat${hlIndex}`);
    }

    const noneRtf = buildRtfNotes(
      sessionWithOneRow({
        exercise: "Ab Cable Crunch",
        sets: "1",
        reps: "9",
        weight: "52.5kg",
        skip: "",
        highlight: "none",
      }),
    );
    expect(noneRtf).toContain("\\cf0\\highlight0\\chcbpat0");
    expect(noneRtf).not.toMatch(/\\cf[1-5]/);
    expect(noneRtf).not.toMatch(/\\highlight[1-9]/);
  });

  it("preserves export content order: date → legend → summary → table → notes", () => {
    const rtf = buildRtfNotes(FIXTURE_SESSION);
    // The middle dot in the summary line is emitted as an escaped \u183?.
    expect(rtf).toContain("\\u183?");
    const dateAt = rtf.indexOf("Sunday 23 Aug");
    const legendAt = rtf.indexOf("Arms Back Chest Delts Legs");
    const summaryAt = rtf.indexOf("~41 sets");
    const tableAt = rtf.indexOf("\\trowd");
    const notesAt = rtf.indexOf("Notes");
    expect(dateAt).toBeGreaterThan(-1);
    expect(legendAt).toBeGreaterThan(dateAt);
    expect(summaryAt).toBeGreaterThan(legendAt);
    expect(tableAt).toBeGreaterThan(summaryAt);
    expect(notesAt).toBeGreaterThan(tableAt);
    // Notes content comes after the Notes heading and keeps its line breaks.
    const notesSection = rtf.slice(notesAt);
    expect(notesSection).toContain("cardio 15min bike\\line right shoulder felt good");
    expect(notesSection).toContain("(8.75kg + 1kg)");
  });

  it("throws loudly on an unknown highlight instead of guessing colors", () => {
    expect(() =>
      buildRtfNotes(
        sessionWithOneRow({
          exercise: "X",
          sets: "1",
          reps: "1",
          weight: "1",
          skip: "",
          highlight: "chartreuse",
        }),
      ),
    ).toThrow(/unknown highlight/i);
  });
});

describe("RTF escaping", () => {
  it("escapes backslash, braces, tabs, newlines, and non-ASCII as \\uN?", () => {
    expect(escapeRtfText("a\\b")).toBe("a\\\\b");
    expect(escapeRtfText("{x}")).toBe("\\{x\\}");
    expect(escapeRtfText("30°")).toBe("30\\u176?");
    expect(escapeRtfText("’21")).toBe("\\u8217?21");
    expect(escapeRtfText("🏋")).toBe("\\u-10180?\\u-8245?");
    expect(escapeRtfText("8\tfall")).toBe("8\\tab fall");
    // Newlines are dropped here by design; callers place \line explicitly.
    expect(escapeRtfText("a\nb")).toBe("ab");
    expect(escapeRtfText("plain ASCII !?;")).toBe("plain ASCII !?;");
  });

  it("renders in-cell newlines as \\line inside colored cells", () => {
    const rtf = buildRtfNotes(
      sessionWithOneRow({
        exercise: "Superset\nfinisher",
        sets: "1",
        reps: "8",
        weight: "body weight",
        skip: "",
        highlight: "orange",
      }),
    );
    expect(rtf).toContain("Superset\\line finisher");
  });
});

/* -------------------------- representative HTML -------------------------- */

describe("representative HTML payload", () => {
  it("is deterministic", () => {
    expect(buildRepresentativeNotesHtml(FIXTURE_SESSION)).toBe(
      buildRepresentativeNotesHtml(FIXTURE_SESSION),
    );
  });

  it("escapes free-form text (& < > quotes) everywhere user data appears", () => {
    const html = buildRepresentativeNotesHtml(FIXTURE_SESSION);
    expect(html).toContain("Curl &amp; Press &lt;strict&gt;");
    expect(html).toContain("Ab Cable Crunch &quot;inc.&quot;");
    // Braces and backslashes are ordinary HTML text; only & < > " ' are escaped.
    expect(html).toContain('Reverse curl \\ &quot;strict&quot; {tempo 3-1-3}');
    expect(html).not.toContain("<strict>");
  });

  it("colors only category rows with exact tokens and tags them data-gym-category", () => {
    const html = buildRepresentativeNotesHtml(FIXTURE_SESSION);
    expect(html).toContain('<tr data-gym-category="Arms">');
    expect(html).toContain('<tr data-gym-category="Legs">');
    // Arms cell: exact fg + opaque highlight through bgcolor/font/span layers.
    expect(html).toContain(
      '<td bgcolor="#261802" style="padding:4px 8px;vertical-align:top;background-color:#261802;color:#ff9f0a"><font color="#ff9f0a"><span style="color:#ff9f0a;background-color:#261802">',
    );
    // None rows stay uncolored and untagged.
    const noneRowStart = html.indexOf('<tr><td style="padding:4px 8px;vertical-align:top">');
    expect(noneRowStart).toBeGreaterThan(-1);
    expect(html.match(/data-gym-category/g)?.length).toBe(5);
    expect(html).not.toContain('data-gym-category=""');
  });

  it("keeps export order and multiline notes as <br />", () => {
    const html = buildRepresentativeNotesHtml(FIXTURE_SESSION);
    const order = [
      "Sunday 23 Aug",
      "Arms Back Chest Delts Legs",
      "~41 sets · 7+ exercises",
      "<table",
      "<strong>Notes</strong>",
      "cardio 15min bike<br />right shoulder felt good",
    ];
    let cursor = -1;
    for (const marker of order) {
      const at = html.indexOf(marker, cursor + 1);
      expect(at).toBeGreaterThan(cursor);
      cursor = at;
    }
  });
});

/* ------------------------ honest route classification -------------------- */

const BASE_CAPS = {
  secureContext: true,
  protocol: "https",
  userAgent: "test-agent",
  hasShare: true,
  hasCanShare: true,
  canShareFiles: true,
  hasClipboardItem: true,
  clipboardSupportsHtml: true,
};

function verdictText(route) {
  return `${route.title} ${route.status} ${route.detail}`;
}

describe("route classification honesty", () => {
  it("only ever uses the defined honest statuses", () => {
    for (const route of classifyRoutes(BASE_CAPS)) {
      expect(Object.values(ROUTE_STATUS)).toContain(route.status);
    }
  });

  it("never asserts an Apple Notes outcome anywhere in any verdict", () => {
    for (const capsVariant of [
      BASE_CAPS,
      { ...BASE_CAPS, hasShare: false, canShareFiles: false, hasClipboardItem: false },
    ]) {
      for (const route of classifyRoutes(capsVariant)) {
        const text = verdictText(route).toLowerCase();
        expect(text).toMatch(/predict|unverified|evidence|mechanic|requires|not available|mirrors|established|baseline|unknown|honest|user-created|expected/i);
        expect(text).not.toMatch(/guaranteed|proven transfer|works with notes|will import successfully/);
      }
    }
  });

  it("marks Share Sheet routes unavailable when navigator.share is missing", () => {
    const routes = classifyRoutes({ ...BASE_CAPS, hasShare: false });
    const shareText = routes.find((route) => route.id === "share-text");
    expect(shareText.status).toBe(ROUTE_STATUS.UNAVAILABLE);
    expect(verdictText(shareText)).toMatch(/navigator\.share is not available/);
  });

  it("reports refused file sharing honestly while pointing at downloads", () => {
    const routes = classifyRoutes({ ...BASE_CAPS, canShareFiles: false });
    const shareFile = routes.find((route) => route.id === "share-file-html");
    expect(shareFile.status).toBe(ROUTE_STATUS.UNAVAILABLE);
    expect(verdictText(shareFile)).toMatch(/canShare\(\{files\}\) reports false/i);

    const accepting = classifyRoutes(BASE_CAPS).find(
      (route) => route.id === "share-file-html",
    );
    expect(accepting.status).toBe(ROUTE_STATUS.AVAILABLE);
    // Required stable semantic order (FEAS-02): "attachment … transport
    // evidence" — explicit prediction, never a Notes success claim.
    expect(verdictText(accepting)).toMatch(/attachment.*transport evidence/i);

    // Unknown support is its own honest verdict — never a guess.
    const unknown = classifyRoutes({ ...BASE_CAPS, canShareFiles: null }).find(
      (route) => route.id === "share-file-html",
    );
    expect(unknown.status).toBe(ROUTE_STATUS.UNKNOWN);
    expect(verdictText(unknown)).toMatch(/unknown.*evidence/i);
  });

  it("labels the RTF clipboard probe as evidence-seeking either way", () => {
    const available = classifyRoutes(BASE_CAPS).find(
      (route) => route.id === "rtf-clipboard-probe",
    );
    expect(available.status).toBe(ROUTE_STATUS.AVAILABLE);
    expect(verdictText(available)).toMatch(/rejection is the EXPECTED honest evidence/i);

    const missing = classifyRoutes({ ...BASE_CAPS, hasClipboardItem: false }).find(
      (route) => route.id === "rtf-clipboard-probe",
    );
    expect(missing.status).toBe(ROUTE_STATUS.UNAVAILABLE);
  });

  it("always marks Shortcut routes as requiring a USER-CREATED shortcut", () => {
    for (const id of ["shortcut-clipboard-html", "shortcut-share-file"]) {
      const route = classifyRoutes(BASE_CAPS).find((entry) => entry.id === id);
      expect(route.status).toBe(ROUTE_STATUS.MANUAL);
      expect(verdictText(route)).toMatch(/USER-CREATED/i);
      expect(verdictText(route)).toMatch(/no paid Developer dependency|same Shortcut family|Show in Share Sheet/i);
    }
  });

  it("downgrades the rich-paste control to unavailable off secure context", () => {
    const insecure = classifyRoutes({ ...BASE_CAPS, secureContext: false }).find(
      (route) => route.id === "control-html-source",
    );
    expect(insecure.status).toBe(ROUTE_STATUS.UNAVAILABLE);
  });
});

describe("capability detection defensiveness", () => {
  it("returns unknown/null answers rather than guesses on bare scopes", () => {
    const bare = {};
    const caps = detectCapabilities(bare);
    expect(caps.secureContext).toBe(null);
    expect(caps.protocol).toBe(null);
    expect(caps.hasShare).toBe(false);
    expect(caps.hasCanShare).toBe(false);
    expect(caps.canShareFiles).toBe(null);
    expect(caps.hasClipboardItem).toBe(false);
    expect(caps.clipboardSupportsHtml).toBe(null);
  });

  it("classifies an insecure http scope without share/clipboard support", () => {
    const caps = detectCapabilities({
      isSecureContext: false,
      location: { protocol: "http:" },
      navigator: {},
    });
    expect(caps.secureContext).toBe(false);
    expect(caps.protocol).toBe("http");
    expect(caps.hasShare).toBe(false);
    expect(caps.hasClipboardItem).toBe(false);
  });

  it("records canShare({files}) refusals and throws as false", () => {
    class FakeFile {
      constructor() {}
    }
    const refusing = detectCapabilities({
      isSecureContext: true,
      location: { protocol: "https:" },
      File: FakeFile,
      navigator: {
        share() {},
        canShare() {
          return false;
        },
      },
      ClipboardItem: function ClipboardItemShim() {},
    });
    expect(refusing.hasShare).toBe(true);
    expect(refusing.canShareFiles).toBe(false);

    const throwing = detectCapabilities({
      isSecureContext: true,
      location: { protocol: "https:" },
      File: FakeFile,
      navigator: {
        canShare() {
          throw new TypeError("bad input");
        },
      },
    });
    expect(throwing.canShareFiles).toBe(false);
  });
});
