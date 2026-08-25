/**
 * ============================================================================
 * EXPERIMENTAL FEASIBILITY HARNESS — NOT PRODUCT CODE
 * Task: M03-T04 (WebKit native selection-copy colour proof)
 * ============================================================================
 *
 * Isolated static test asset for the reopened Apple Notes colour recovery
 * branch. It does NOT participate in the Gym Logger app bundle and it does
 * NOT alter the accepted production Copy to Notes behavior in any way.
 *
 * Hypothesis under test (device gate pending): WebKit's own rendered-selection
 * copy path may produce richer native pasteboard representations than the
 * production combined HTML/plain write. This module therefore does exactly
 * one thing inside a single user gesture:
 *
 *   1. render the canonical fixture session as REAL document content —
 *      date → five-entry legend → summary → an actual <table> with all rows
 *      in position order and every free-form value verbatim → bottom notes;
 *   2. move that content off screen with positioning ONLY. Nothing is
 *      concealed with CSS: no collapsed layout tricks of any kind, so the
 *      browser treats it as fully rendered content;
 *   3. select it with a DOM Range and invoke the browser's NATIVE copy
 *      command (`document.execCommand("copy")`) synchronously;
 *   4. restore the user's previous selection and focus, then remove the
 *      temporary host.
 *
 * Hard scope rules enforced by src/tests/m03t04NativeCopy.test.mjs:
 * - NO async clipboard writers of any kind are used or referenced here;
 * - NO copy-event interception and NO manual pasteboard payload assembly:
 *   the experiment tests only what the browser itself produces from the
 *   selected rendered content;
 * - the reported status describes ONLY whether the browser command was
 *   available / succeeded / failed. No Apple Notes structure or colour
 *   outcome is claimed by any code path on this page.
 */

import {
  CATEGORY_FG,
  CATEGORY_LABELS,
  FIXTURE_SESSION,
  OPAQUE_HIGHLIGHT,
} from "./fixture.mjs";
import {
  EXPORT_COLUMNS,
  displaySummary,
  formatDateDisplay,
  orderedRows,
} from "./format.mjs";

/* Presentation tokens mirror the production payload wrapper (dark backdrop,
   light foreground) so the copied markup matches the accepted export look as
   closely as the live DOM allows. */
const WRAPPER_STYLE =
  "background-color:#000000;color:#f2f2f7;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.4;padding:8px";

const TH_STYLE =
  "text-align:left;padding:4px 8px;border-bottom:1px solid rgba(84,84,88,0.65)";

const TD_STYLE = "padding:4px 8px;vertical-align:top";

/** Attribute marking the rendered proof subtree inside the document. */
export const PROOF_CONTENT_MARKER = "data-m03t04-proof-content";

/** Attribute marking the temporary off-screen host element. */
export const PROOF_HOST_MARKER = "data-m03t04-proof-host";

/** Resolves the canonical session for the proof when none is supplied. */
function resolveSession(session) {
  return session ?? FIXTURE_SESSION;
}

/**
 * Applies the exact locked category colours to one body cell and its inner
 * span, mirroring the layered production encoding (solid background attribute
 * + inline styles) so whichever layer a converter honors yields the identical
 * two colors per category.
 */
function applyCategoryColours(cell, span, highlight) {
  const fg = CATEGORY_FG[highlight];
  const bgOpaque = OPAQUE_HIGHLIGHT[highlight];
  if (!fg || !bgOpaque) {
    throw new Error(`Unknown highlight "${highlight}" in feasibility fixture`);
  }
  cell.setAttribute("bgcolor", bgOpaque);
  cell.style.cssText = `${TD_STYLE};background-color:${bgOpaque};color:${fg}`;
  span.style.cssText = `color:${fg};background-color:${bgOpaque}`;
}

/**
 * Appends free-form text while preserving explicit newlines as real <br>
 * elements — the live-DOM equivalent of the production multiline escaping.
 */
function appendMultilineText(target, value, doc) {
  const lines = String(value).split("\n");
  lines.forEach((line, index) => {
    if (index > 0) target.appendChild(doc.createElement("br"));
    target.appendChild(doc.createTextNode(line));
  });
}

/**
 * Builds (but does not attach) the complete proof subtree: date → legend →
 * summary → real table (thead + all fixture rows in position order, exact
 * values, locked category colours) → notes. Returns the root element plus a
 * stats summary used by tests to pin the full content contract.
 *
 * Pure with respect to the document: nothing is appended here.
 */
export function renderProofContent(sessionInput, doc = globalThis.document) {
  const session = resolveSession(sessionInput);
  const root = doc.createElement("div");
  root.setAttribute(PROOF_CONTENT_MARKER, "");
  root.style.cssText = WRAPPER_STYLE;

  const dateP = doc.createElement("p");
  dateP.style.cssText = "margin:0 0 8px";
  const dateStrong = doc.createElement("strong");
  dateStrong.textContent = formatDateDisplay(session.dateLocal);
  dateP.appendChild(dateStrong);

  const legendP = doc.createElement("p");
  legendP.style.cssText = "margin:0 0 8px";
  const legend = Object.values(CATEGORY_LABELS).join(" ");
  legendP.textContent = legend;

  const summary = displaySummary(session);
  const summaryLine = `${summary.sets} sets · ${summary.exercises} exercises`;
  const summaryP = doc.createElement("p");
  summaryP.style.cssText = "margin:0 0 12px";
  summaryP.textContent = summaryLine;

  const table = doc.createElement("table");
  table.style.cssText = "border-collapse:collapse";

  const thead = doc.createElement("thead");
  const headRow = doc.createElement("tr");
  for (const { label } of EXPORT_COLUMNS) {
    const th = doc.createElement("th");
    th.style.cssText = TH_STYLE;
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = doc.createElement("tbody");
  let cellCount = 0;
  let coloredRowCount = 0;
  let uncoloredRowCount = 0;
  for (const row of orderedRows(session.rows)) {
    const tr = doc.createElement("tr");
    const colored = row.highlight !== "none";
    if (colored) {
      coloredRowCount += 1;
      const label = CATEGORY_LABELS[row.highlight] ?? "";
      if (label !== "") tr.setAttribute("data-gym-category", label);
    } else {
      uncoloredRowCount += 1;
    }
    for (const { field } of EXPORT_COLUMNS) {
      const td = doc.createElement("td");
      if (colored) {
        const span = doc.createElement("span");
        applyCategoryColours(td, span, row.highlight);
        appendMultilineText(span, row[field], doc);
        td.appendChild(span);
      } else {
        td.style.cssText = TD_STYLE;
        appendMultilineText(td, row[field], doc);
      }
      tr.appendChild(td);
      cellCount += 1;
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  const notesTitle = doc.createElement("p");
  notesTitle.style.cssText = "margin:12px 0 4px";
  const notesStrong = doc.createElement("strong");
  notesStrong.textContent = "Notes";
  notesTitle.appendChild(notesStrong);

  const notesP = doc.createElement("p");
  notesP.style.cssText = "margin:0";
  appendMultilineText(notesP, session.notes, doc);

  root.append(dateP, legendP, summaryP, table, notesTitle, notesP);

  return {
    root,
    stats: {
      dateDisplay: formatDateDisplay(session.dateLocal),
      legend,
      summaryLine,
      rowCount: orderedRows(session.rows).length,
      coloredRowCount,
      uncoloredRowCount,
      cellCount,
      notesLines: session.notes.split("\n").length,
    },
  };
}

/**
 * Runs the whole native-selection-copy proof synchronously and reports ONLY
 * local mechanics:
 *
 * - `{ requested: false, succeeded: false }` — this environment did not
 *   expose the pieces the native path needs; nothing was attempted.
 * - `{ requested: true, succeeded: true }` — the browser copy command was
 *   invoked and returned success.
 * - `{ requested: true, succeeded: false }` — the command was invoked but
 *   refused or threw.
 *
 * Steps, all inside the caller's gesture:
 * 1. capture the current selection ranges (cloned) and focused element;
 * 2. render the proof content into a positioned off-screen host that stays
 *    fully displayed (no concealing styles whatsoever) and attach it;
 * 3. select the proof subtree with a fresh DOM Range;
 * 4. call the native copy command once;
 * 5. always restore the previous selection and focus and remove the host.
 *
 * `doc` is injectable for tests; it defaults to the global document.
 */
export function runNativeSelectionCopyProof({ session, doc } = {}) {
  const owner = doc ?? globalThis.document;
  if (
    !owner ||
    typeof owner.createElement !== "function" ||
    !owner.body ||
    typeof owner.createRange !== "function" ||
    typeof owner.getSelection !== "function"
  ) {
    return { requested: false, succeeded: false };
  }

  const selection = owner.getSelection();
  if (
    !selection ||
    typeof selection.addRange !== "function" ||
    typeof selection.removeAllRanges !== "function" ||
    typeof selection.getRangeAt !== "function"
  ) {
    return { requested: false, succeeded: false };
  }

  /* ---- capture previous selection/focus before touching anything -------- */
  const previousRanges = [];
  let previousRangeCount = 0;
  try {
    previousRangeCount = selection.rangeCount;
  } catch {
    previousRangeCount = 0;
  }
  for (let index = 0; index < previousRangeCount; index += 1) {
    try {
      const existing = selection.getRangeAt(index);
      if (existing) {
        previousRanges.push(
          typeof existing.cloneRange === "function"
            ? existing.cloneRange()
            : existing,
        );
      }
    } catch {
      // A range that cannot be read cannot be restored either; continue.
    }
  }
  const previousFocus =
    owner.activeElement && typeof owner.activeElement.focus === "function"
      ? owner.activeElement
      : null;

  /* ---- render + attach --------------------------------------------------- */
  const host = owner.createElement("div");
  host.setAttribute(PROOF_HOST_MARKER, "");
  // Positioned off screen yet FULLY DISPLAYED: the browser must treat this
  // as rendered content for its native copy serialization. No hiding of any
  // kind is applied to the host or its descendants.
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "-9999px";
  host.style.width = "720px";
  host.style.margin = "0";

  const { root } = renderProofContent(resolveSession(session), owner);
  host.appendChild(root);
  owner.body.appendChild(host);

  /* ---- select + invoke the native command ------------------------------- */
  let requested = false;
  let succeeded = false;
  try {
    const range = owner.createRange();
    range.selectNodeContents(root);
    selection.removeAllRanges();
    selection.addRange(range);
    if (typeof owner.execCommand === "function") {
      requested = true;
      succeeded = owner.execCommand.call(owner, "copy") === true;
    }
  } catch {
    // A refusal/throw after invocation keeps requested=true, succeeded=false.
  } finally {
    /* ---- restore previous state + cleanup (always) -------------------- */
    try {
      selection.removeAllRanges();
      for (const restored of previousRanges) {
        try {
          selection.addRange(restored);
        } catch {
          // Best effort per range.
        }
      }
    } catch {
      // Best effort overall.
    }
    if (previousFocus) {
      try {
        previousFocus.focus();
      } catch {
        // Best effort.
      }
    }
    try {
      if (typeof host.remove === "function") host.remove();
      else if (host.parentNode) host.parentNode.removeChild(host);
    } catch {
      // Best effort cleanup.
    }
  }

  return { requested, succeeded };
}

/**
 * The exact honest status line for the page, derived only from local
 * mechanics. It never asserts what a paste target will do with the result.
 */
export function describeNativeCopyOutcome(result) {
  if (!result || result.requested !== true) {
    return (
      "NOT AVAILABLE HERE: this browser did not expose the native " +
      "selection-copy mechanism, so the copy command was never requested."
    );
  }
  if (result.succeeded === true) {
    return (
      "Browser copy command SUCCEEDED (local mechanics only). Whatever the " +
      "browser produced from the selected proof content is now on the local " +
      "pasteboard. No Apple Notes structure or colour outcome is claimed " +
      "here — judge only by pasting into the target note on the iPhone."
    );
  }
  return (
    "Browser copy command FAILED (refused or threw). The local pasteboard " +
    "was not written by this proof."
  );
}

/**
 * Defensive environment facts for the page's evidence panel. Every probe is
 * wrapped; unknown answers stay "unknown" instead of being guessed.
 */
export function describeEnvironmentFacts(scope = globalThis) {
  const facts = [];
  const push = (label, value) => facts.push([label, value]);

  try {
    push(
      "Location",
      scope.location && typeof scope.location.href === "string"
        ? scope.location.href
        : "unknown",
    );
  } catch {
    push("Location", "unknown");
  }

  try {
    push(
      "Secure context",
      typeof scope.isSecureContext === "boolean"
        ? String(scope.isSecureContext)
        : "unknown",
    );
  } catch {
    push("Secure context", "unknown");
  }

  try {
    push(
      "User agent",
      scope.navigator && typeof scope.navigator.userAgent === "string"
        ? scope.navigator.userAgent
        : "unknown",
    );
  } catch {
    push("User agent", "unknown");
  }

  let selectionApi = "NOT available";
  try {
    const owner = scope.document;
    selectionApi =
      owner && typeof owner.getSelection === "function" &&
      owner.getSelection()
        ? "available"
        : "NOT available";
  } catch {
    selectionApi = "unknown";
  }
  push("DOM selection API", selectionApi);

  let nativeCommand = "NOT available";
  try {
    nativeCommand =
      scope.document && typeof scope.document.execCommand === "function"
        ? "available"
        : "NOT available";
  } catch {
    nativeCommand = "unknown";
  }
  push("Native copy command", nativeCommand);

  return facts;
}
