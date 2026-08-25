import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// Canonical fixture + locked colour tokens (pinned to production elsewhere).
import {
  CATEGORY_FG,
  CATEGORY_LABELS,
  FIXTURE_SESSION,
  OPAQUE_HIGHLIGHT,
} from "../../public/feasibility/fixture.mjs";

// Experimental M03-T04 proof modules (static assets, zero deps).
import {
  PROOF_CONTENT_MARKER,
  PROOF_HOST_MARKER,
  describeEnvironmentFacts,
  describeNativeCopyOutcome,
  renderProofContent,
  runNativeSelectionCopyProof,
} from "../../public/feasibility/nativeSelectionCopy.mjs";

/* ======================================================================== */
/* M03-T04 — WEBKIT NATIVE SELECTION-COPY PROOF CONTRACTS.                  */
/* These tests pin the isolated public/feasibility/ proof page to the       */
/* canonical content contract and enforce its hard scope rules: real        */
/* rendered DOM content, the browser's own copy command only, honest        */
/* mechanics-only status, and untouched production Copy to Notes.           */
/* ======================================================================== */

const PROJECT_ROOT = process.cwd();

const PROOF_FILES = [
  "public/feasibility/nativeSelectionCopy.mjs",
  "public/feasibility/nativeCopyApp.js",
  "public/feasibility/native-copy.html",
];

/** Ordered fixture rows (position order), mirroring production ordering. */
const ORDERED_ROWS = [...FIXTURE_SESSION.rows].sort(
  (a, b) => a.position - b.position,
);

/**
 * Compares a live style value against either the hex token or its rgb()
 * serialization (cssstyle may emit either form).
 */
function styleColourMatches(actual, hexToken) {
  const normalized = String(actual).toLowerCase().replace(/\s+/g, "");
  if (normalized === hexToken.toLowerCase()) return true;
  const int = Number.parseInt(hexToken.slice(1), 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return normalized === `rgb(${r},${g},${b})`;
}

function listSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listSourceFiles(fullPath));
    else out.push(fullPath);
  }
  return out;
}

afterEach(() => {
  document.body.innerHTML = "";
});

/* ------------------------- complete content contract --------------------- */

describe("proof content: real DOM table with the full Notes payload contract", () => {
  function mount() {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const { root, stats } = renderProofContent(FIXTURE_SESSION, document);
    host.appendChild(root);
    return { host, root, stats };
  }

  it("renders date, five-entry legend, and summary override line in export order", () => {
    const { root, stats } = mount();
    const paragraphs = root.querySelectorAll(":scope > p");
    expect(paragraphs.length).toBe(5); // date, legend, summary, Notes title, notes
    expect(paragraphs[0].querySelector("strong").textContent).toBe(
      "Sunday 23 Aug",
    );
    expect(stats.dateDisplay).toBe("Sunday 23 Aug");
    expect(paragraphs[1].textContent).toBe("Arms Back Chest Delts Legs");
    expect(stats.legend).toBe("Arms Back Chest Delts Legs");
    // Exact Unicode middle dot plus the non-derivable manual override.
    expect(paragraphs[2].textContent).toBe("~41 sets · 7+ exercises");
    expect(stats.summaryLine).toBe("~41 sets · 7+ exercises");
    // Date → legend → summary → table → Notes ordering inside the subtree.
    const dateAt = root.textContent.indexOf("Sunday 23 Aug");
    const legendAt = root.textContent.indexOf("Arms Back Chest Delts Legs");
    const summaryAt = root.textContent.indexOf("~41 sets");
    expect(dateAt).toBeGreaterThanOrEqual(0);
    expect(legendAt).toBeGreaterThan(dateAt);
    expect(summaryAt).toBeGreaterThan(legendAt);
  });

  it("renders an actual table element: thead columns plus every fixture row in position order", () => {
    const { root, stats } = mount();
    const tables = root.querySelectorAll("table");
    expect(tables.length).toBe(1);
    const table = tables[0];
    expect(table.querySelector("thead")).not.toBeNull();
    expect(table.querySelector("tbody")).not.toBeNull();

    const headerLabels = Array.from(table.querySelectorAll("thead th")).map(
      (th) => th.textContent,
    );
    expect(headerLabels).toEqual([
      "Exercise",
      "Sets",
      "Reps",
      "Weight",
      "Skip",
    ]);

    const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
    expect(bodyRows.length).toBe(ORDERED_ROWS.length);
    bodyRows.forEach((tr, rowIndex) => {
      const source = ORDERED_ROWS[rowIndex];
      const cells = Array.from(tr.querySelectorAll("td"));
      expect(cells.length).toBe(5);
      expect(cells.map((td) => td.textContent)).toEqual([
        source.exercise,
        source.sets,
        source.reps,
        source.weight,
        source.skip,
      ]);
    });

    expect(stats.rowCount).toBe(ORDERED_ROWS.length);
    expect(stats.cellCount).toBe(ORDERED_ROWS.length * 5);
    expect(stats.coloredRowCount).toBe(5);
    expect(stats.uncoloredRowCount).toBe(2);
    expect(stats.notesLines).toBe(3);
  });

  it("carries the exact locked category colours on every coloured cell and span", () => {
    const { root } = mount();
    const bodyRows = Array.from(root.querySelectorAll("tbody tr"));
    bodyRows.forEach((tr, rowIndex) => {
      const source = ORDERED_ROWS[rowIndex];
      if (source.highlight === "none") return;
      const fg = CATEGORY_FG[source.highlight];
      const bgOpaque = OPAQUE_HIGHLIGHT[source.highlight];
      expect(tr.getAttribute("data-gym-category")).toBe(
        CATEGORY_LABELS[source.highlight],
      );
      for (const td of tr.querySelectorAll("td")) {
        expect(td.getAttribute("bgcolor")).toBe(bgOpaque);
        expect(styleColourMatches(td.style.backgroundColor, bgOpaque)).toBe(
          true,
        );
        expect(styleColourMatches(td.style.color, fg)).toBe(true);
        const span = td.querySelector("span");
        expect(span).not.toBeNull();
        expect(span.textContent).toBe(td.textContent);
        expect(styleColourMatches(span.style.color, fg)).toBe(true);
        expect(styleColourMatches(span.style.backgroundColor, bgOpaque)).toBe(
          true,
        );
      }
    });
  });

  it("keeps unhighlighted rows plain: no category marker, no colours, no spans", () => {
    const { root } = mount();
    const bodyRows = Array.from(root.querySelectorAll("tbody tr"));
    bodyRows.forEach((tr, rowIndex) => {
      const source = ORDERED_ROWS[rowIndex];
      if (source.highlight !== "none") return;
      expect(tr.hasAttribute("data-gym-category")).toBe(false);
      for (const td of tr.querySelectorAll("td")) {
        expect(td.hasAttribute("bgcolor")).toBe(false);
        expect(td.style.backgroundColor).toBe("");
        expect(td.style.color).toBe("");
        expect(td.querySelector("span")).toBeNull();
      }
    });
  });

  it("preserves free-form torture values and multi-line notes verbatim", () => {
    const { root } = mount();
    const text = root.textContent;
    for (const weird of [
      "Recline curl bench 30° IR uni",
      "Kelso shrug — chest supported (wide grip)",
      "Curl & Press <strict>",
      'Ab Cable Crunch "inc."',
      "body weight",
      "8,6",
    ]) {
      expect(text).toContain(weird);
    }
    const paragraphs = root.querySelectorAll(":scope > p");
    const notesP = paragraphs[paragraphs.length - 1];
    expect(notesP.querySelectorAll("br").length).toBe(2);
    const lines = [
      "cardio 15min bike",
      "right shoulder felt good — reduce DB press",
      "next: add chain weight (8.75kg + 1kg)",
    ];
    let cursor = -1;
    for (const line of lines) {
      const at = notesP.textContent.indexOf(line, cursor + 1);
      expect(at).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it("keeps the rendered subtree fully displayed: positioning only, nothing concealed", () => {
    const { host, root } = mount();
    const all = [host, root, ...root.querySelectorAll("*")];
    for (const el of all) {
      expect(el.style.display).not.toBe("none");
      expect(el.style.visibility).not.toBe("hidden");
    }
    expect(root.style.display).toBe("");
    expect(root.style.visibility).toBe("");
  });
});

/* --------------------------- native copy mechanics ----------------------- */

/** Minimal fake element supporting exactly what the proof module touches. */
function fakeElement(tag) {
  const element = {
    tagName: String(tag).toUpperCase(),
    style: {},
    attributes: {},
    childNodes: [],
    parentNode: null,
    setAttribute(name, value) {
      element.attributes[name] = String(value);
    },
    getAttribute(name) {
      return name in element.attributes ? element.attributes[name] : null;
    },
    hasAttribute(name) {
      return name in element.attributes;
    },
    appendChild(child) {
      child.parentNode = element;
      element.childNodes.push(child);
      return child;
    },
    append(...kids) {
      for (const kid of kids) element.appendChild(kid);
    },
    remove() {
      if (element.parentNode) {
        const at = element.parentNode.childNodes.indexOf(element);
        if (at >= 0) element.parentNode.childNodes.splice(at, 1);
        element.parentNode = null;
      }
    },
  };
  // Live-DOM-like textContent: assigned text is owned text; appended
  // descendants concatenate their own text (text nodes contribute .text).
  Object.defineProperty(element, "textContent", {
    configurable: true,
    get() {
      if (element.childNodes.length === 0) return element.__ownText ?? "";
      return element.childNodes
        .map((child) =>
          child.nodeType === 3 ? child.text : (child.textContent ?? ""),
        )
        .join("");
    },
    set(value) {
      element.childNodes.length = 0;
      element.__ownText = String(value);
    },
  });
  return element;
}

/**
 * Fake document recording the exact event order of the proof run:
 * select / clear / add / copy:<command> / refocus.
 *
 * `clonablePrevious` controls whether the pre-existing user range exposes
 * cloneRange(): true exercises the primary clone-and-restore path used in
 * real browsers; false exercises the identity-restore fallback.
 */
function makeFakeDocument({
  hasCommand = true,
  copyResult = true,
  copyThrows = false,
  clonablePrevious = true,
} = {}) {
  const events = [];
  const addedRanges = [];
  const selectionState = { ranges: [] };
  const preexisting = { start: 0, end: 3 };
  if (clonablePrevious) {
    preexisting.cloneRange = function cloneRange() {
      return { start: 0, end: 3, clonedFrom: preexisting };
    };
  }
  selectionState.ranges.push(preexisting);

  const selectedNodes = [];

  const doc = {
    body: fakeElement("body"),
    activeElement: null,
    createElement(tag) {
      return fakeElement(tag);
    },
    createTextNode(text) {
      return { nodeType: 3, text };
    },
    createRange() {
      const range = {
        collapsed: false,
        cloneRange() {
          return { ...range };
        },
        selectNodeContents(node) {
          events.push("select");
          selectedNodes.push(node);
        },
      };
      return range;
    },
    getSelection() {
      return {
        get rangeCount() {
          return selectionState.ranges.length;
        },
        getRangeAt(index) {
          return selectionState.ranges[index];
        },
        removeAllRanges() {
          events.push("clear");
          selectionState.ranges.length = 0;
        },
        addRange(range) {
          events.push("add");
          selectionState.ranges.push(range);
          addedRanges.push(range);
        },
      };
    },
  };

  if (hasCommand) {
    doc.execCommand = function execCommand(command) {
      events.push(`copy:${command}`);
      if (copyThrows) throw new TypeError("command refused");
      return copyResult;
    };
  }

  doc.__events = events;
  doc.__selectionState = selectionState;
  doc.__selectedNodes = selectedNodes;
  doc.__addedRanges = addedRanges;
  doc.__preexistingRange = preexisting;
  return doc;
}

/** Asserts the user's previous single-range selection was fully restored. */
function expectPreviousSelectionRestored(doc, { byIdentity }) {
  const restored = doc.__selectionState.ranges;
  expect(restored.length).toBe(1);
  if (byIdentity) {
    expect(restored[0]).toBe(doc.__preexistingRange);
  } else {
    // A faithful clone of the previous boundaries — never the proof range.
    expect(restored[0]).not.toBe(doc.__addedRanges[0]);
    expect(restored[0].start).toBe(doc.__preexistingRange.start);
    expect(restored[0].end).toBe(doc.__preexistingRange.end);
  }
  // Exactly two selections happened overall: proof content, then restore.
  expect(doc.__addedRanges.length).toBe(2);
}

describe("native selection-copy mechanics (injected fake document)", () => {
  it("invokes the native command once over the rendered subtree and restores everything", () => {
    const doc = makeFakeDocument({ copyResult: true });
    doc.activeElement = {
      focus() {
        doc.__events.push("refocus");
      },
    };

    const result = runNativeSelectionCopyProof({
      session: FIXTURE_SESSION,
      doc,
    });

    expect(result).toEqual({ requested: true, succeeded: true });
    expect(doc.__events).toEqual([
      "select",
      "clear",
      "add",
      "copy:copy",
      "clear",
      "add",
      "refocus",
    ]);
    // Exactly one native command invocation, with the literal "copy" verb.
    expect(doc.__events.filter((event) => event.startsWith("copy:"))).toEqual([
      "copy:copy",
    ]);
    // The Range covered the marked proof content subtree.
    expect(doc.__selectedNodes.length).toBe(1);
    expect(
      doc.__selectedNodes[0].getAttribute(PROOF_CONTENT_MARKER),
    ).toBe("");
    // Previous user selection restored (as a faithful clone); host removed.
    expectPreviousSelectionRestored(doc, { byIdentity: false });
    expect(doc.body.childNodes.length).toBe(0);
  });

  it("restores a previous selection by identity when its ranges cannot be cloned", () => {
    const doc = makeFakeDocument({ copyResult: true, clonablePrevious: false });
    const result = runNativeSelectionCopyProof({
      session: FIXTURE_SESSION,
      doc,
    });
    expect(result.succeeded).toBe(true);
    expectPreviousSelectionRestored(doc, { byIdentity: true });
    expect(doc.body.childNodes.length).toBe(0);
  });

  it("reports refusal honestly while still restoring selection/focus and cleaning up", () => {
    const doc = makeFakeDocument({ copyResult: false });
    const result = runNativeSelectionCopyProof({
      session: FIXTURE_SESSION,
      doc,
    });
    expect(result).toEqual({ requested: true, succeeded: false });
    expect(doc.__events).toEqual(["select", "clear", "add", "copy:copy", "clear", "add"]);
    expect(doc.body.childNodes.length).toBe(0);
    expectPreviousSelectionRestored(doc, { byIdentity: false });
  });

  it("maps a throwing command to requested-but-failed with full cleanup", () => {
    const doc = makeFakeDocument({ copyThrows: true });
    const result = runNativeSelectionCopyProof({
      session: FIXTURE_SESSION,
      doc,
    });
    expect(result).toEqual({ requested: true, succeeded: false });
    expect(doc.__events).toContain("copy:copy");
    expect(doc.body.childNodes.length).toBe(0);
    expectPreviousSelectionRestored(doc, { byIdentity: false });
  });

  it("never requests anything when the command is unavailable, and still cleans up", () => {
    const doc = makeFakeDocument({ hasCommand: false });
    const result = runNativeSelectionCopyProof({
      session: FIXTURE_SESSION,
      doc,
    });
    expect(result).toEqual({ requested: false, succeeded: false });
    expect(doc.__events.filter((event) => event.startsWith("copy:"))).toEqual(
      [],
    );
    expect(doc.body.childNodes.length).toBe(0);
    expectPreviousSelectionRestored(doc, { byIdentity: false });
  });

  it("bails out safely when the document cannot host rendered content", () => {
    const doc = makeFakeDocument();
    doc.body = null;
    expect(runNativeSelectionCopyProof({ session: FIXTURE_SESSION, doc })).toEqual(
      { requested: false, succeeded: false },
    );
    expect(doc.__events.filter((event) => event.startsWith("copy:"))).toEqual(
      [],
    );

    const selectionLess = makeFakeDocument();
    selectionLess.getSelection = () => ({});
    expect(
      runNativeSelectionCopyProof({ session: FIXTURE_SESSION, doc: selectionLess }),
    ).toEqual({ requested: false, succeeded: false });

    const docless = makeFakeDocument();
    expect(runNativeSelectionCopyProof({ session: FIXTURE_SESSION, doc: null })).toEqual(
      { requested: false, succeeded: false },
    );
  });

  it("falls back to the canonical fixture when no session is supplied", () => {
    const doc = makeFakeDocument({ copyResult: true });
    const result = runNativeSelectionCopyProof({ doc });
    expect(result.succeeded).toBe(true);
    expect(doc.__selectedNodes[0].textContent).toContain("Sunday 23 Aug");
  });

  it("cleans up through the real jsdom path where the command is unavailable", () => {
    const hasCommand = typeof document.execCommand === "function";
    const result = runNativeSelectionCopyProof({});
    expect(result.requested).toBe(hasCommand);
    expect(document.querySelectorAll(`[${PROOF_HOST_MARKER}]`).length).toBe(0);
  });
});

/* ------------------------------ status honesty --------------------------- */

describe("status wording honesty", () => {
  it("describes only local mechanics for every outcome", () => {
    const unavailable = describeNativeCopyOutcome({
      requested: false,
      succeeded: false,
    });
    expect(unavailable).toMatch(/NOT AVAILABLE HERE/i);
    expect(unavailable).toMatch(/never requested/i);

    const failed = describeNativeCopyOutcome({
      requested: true,
      succeeded: false,
    });
    expect(failed).toMatch(/FAILED/i);

    const succeeded = describeNativeCopyOutcome({
      requested: true,
      succeeded: true,
    });
    expect(succeeded).toMatch(/SUCCEEDED \(local mechanics only\)/i);
  });

  it("never claims an Apple Notes structure or colour result in any status", () => {
    for (const result of [
      { requested: false, succeeded: false },
      { requested: true, succeeded: false },
      { requested: true, succeeded: true },
    ]) {
      const text = describeNativeCopyOutcome(result);
      expect(text).not.toMatch(/table (?:and |\) )?colou?rs (?:are |were )?(?:preserved|survived)/i);
      expect(text).not.toMatch(/notes (?:will |did )?(?:preserve|kept|received)/i);
    }
    const succeeded = describeNativeCopyOutcome({
      requested: true,
      succeeded: true,
    });
    expect(succeeded).toMatch(/no apple notes structure or colour outcome is claimed/i);
  });
});

/* ------------------------- forbidden-API static scans -------------------- */

describe("hard scope rules (static source scans)", () => {
  const FORBIDDEN_PATTERNS = [
    [/new\s+ClipboardItem/i, "async clipboard item writer"],
    [/navigator\s*\.\s*clipboard/i, "async clipboard namespace"],
    [/clipboardData/i, "copy-event payload access"],
    [/\bsetData\s*\(/i, "manual pasteboard assembly"],
    [/writeText/i, "async plain write"],
    [/addEventListener\(\s*(['"])copy\1/i, "copy-event interception"],
    [/\boncopy\s*=/i, "inline copy handler attribute"],
    [/\bdisplay\s*:\s*none\b/i, "concealed (non-rendered) content"],
    [/visibility\s*:\s*hidden\b/i, "concealed (non-rendered) content"],
  ];

  it("uses no clipboard writers and no copy interception anywhere in the proof", () => {
    for (const file of PROOF_FILES) {
      const text = readFileSync(resolve(PROJECT_ROOT, file), "utf8");
      for (const [pattern, label] of FORBIDDEN_PATTERNS) {
        expect(pattern.test(text), `${file} must not contain ${label}`).toBe(
          false,
        );
      }
    }
  });

  it("actually drives the native selection path it claims to test", () => {
    const moduleText = readFileSync(
      resolve(PROJECT_ROOT, "public/feasibility/nativeSelectionCopy.mjs"),
      "utf8",
    );
    for (const marker of [
      /execCommand/,
      /createRange/,
      /selectNodeContents/,
      /removeAllRanges/,
      /cloneRange/,
    ]) {
      expect(marker.test(moduleText)).toBe(true);
    }

    const pageText = readFileSync(
      resolve(PROJECT_ROOT, "public/feasibility/native-copy.html"),
      "utf8",
    );
    expect(pageText).toContain('id="btn-native-copy"');
    expect(pageText).toContain("./nativeCopyApp.js");

    const appText = readFileSync(
      resolve(PROJECT_ROOT, "public/feasibility/nativeCopyApp.js"),
      "utf8",
    );
    expect(appText).toContain("FIXTURE_SESSION");
    expect(appText).toContain("runNativeSelectionCopyProof");
  });

  it("renders off screen by positioning only (fixed host, visible content)", () => {
    const moduleText = readFileSync(
      resolve(PROJECT_ROOT, "public/feasibility/nativeSelectionCopy.mjs"),
      "utf8",
    );
    expect(moduleText).toContain('left = "-9999px"');
    expect(moduleText).toContain('position = "fixed"');
  });
});

/* ------------------ isolation / production Copy to Notes unchanged ------- */

describe("isolation and unchanged production baseline", () => {
  it("keeps the proof unreferenced from all production app sources", () => {
    const productionFiles = listSourceFiles(resolve(PROJECT_ROOT, "src"))
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => !/\.test\./.test(file));
    expect(productionFiles.length).toBeGreaterThan(10);
    for (const file of productionFiles) {
      const text = readFileSync(file, "utf8");
      expect(
        /feasibility|native-copy|m03t04/i.test(text),
        `${file} must not reference the experimental proof`,
      ).toBe(false);
    }
  });

  it("leaves the combined production clipboard writer intact", () => {
    const text = readFileSync(
      resolve(PROJECT_ROOT, "src/domain/notesClipboard.ts"),
      "utf8",
    );
    expect(text).toContain("new ClipboardItem({");
    expect(text).toContain('"text/html"');
    expect(text).toContain('"text/plain"');
    expect(text).toContain(".writeText(");
    expect(text).toContain('execCommand.call(document, "copy")');
  });
});

/* ---------------------------- environment facts -------------------------- */

describe("environment fact reporting defensiveness", () => {
  it("answers unknown rather than guessing on a bare scope", () => {
    const facts = Object.fromEntries(describeEnvironmentFacts({}));
    expect(facts.Location).toBe("unknown");
    expect(facts["Secure context"]).toBe("unknown");
    expect(facts["User agent"]).toBe("unknown");
    expect(facts["DOM selection API"]).toBe("NOT available");
    expect(facts["Native copy command"]).toBe("NOT available");
  });

  it("reports availability only from real probes", () => {
    const capable = describeEnvironmentFacts({
      location: { href: "https://lan/feasibility/native-copy.html" },
      isSecureContext: true,
      navigator: { userAgent: "test-agent" },
      document: {
        getSelection: () => ({}),
        execCommand: () => true,
      },
    });
    const entries = Object.fromEntries(capable);
    expect(entries.Location).toBe("https://lan/feasibility/native-copy.html");
    expect(entries["Secure context"]).toBe("true");
    expect(entries["DOM selection API"]).toBe("available");
    expect(entries["Native copy command"]).toBe("available");

    const insecure = Object.fromEntries(
      describeEnvironmentFacts({
        location: { href: "http://lan/" },
        isSecureContext: false,
        navigator: { userAgent: "test-agent" },
        document: { getSelection: () => ({}), execCommand: () => true },
      }),
    );
    expect(insecure["Secure context"]).toBe("false");
  });
});
