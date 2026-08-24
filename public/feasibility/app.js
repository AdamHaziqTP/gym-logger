/**
 * ============================================================================
 * EXPERIMENTAL FEASIBILITY HARNESS — NOT PRODUCT CODE
 * Task: M03-T01-E003-FEAS-01 (bounded Apple Notes color interoperability spike)
 * ============================================================================
 *
 * DOM wiring for public/feasibility/index.html. Every handler reports LOCAL
 * MECHANICS ONLY (copied / shared / downloaded / rejected) and records
 * unsupported or refused capabilities verbatim as evidence. No element of this
 * page claims an Apple Notes result.
 *
 * Clipboard writes start synchronously inside their tap gesture (the same
 * iOS/Safari transient-activation rule production FIX-01 documented).
 */

import { FIXTURE_SESSION, CATEGORY_FG, CATEGORY_LABELS, OPAQUE_HIGHLIGHT } from "./fixture.mjs";
import { EXPORT_COLUMNS, displaySummary, formatDateDisplay, orderedRows } from "./format.mjs";
import { buildPlainNotes } from "./plainNotes.mjs";
import { buildRtfNotes, RTF_FILE_NAME, RTF_MIME_TYPE } from "./rtfNotes.mjs";
import {
  buildRepresentativeNotesHtml,
  HTML_FILE_NAME,
  HTML_MIME_TYPE,
} from "./notesHtmlTable.mjs";
import { classifyRoutes, detectCapabilities, ROUTE_STATUS } from "./routes.mjs";

/* ------------------------------ pure data ------------------------------- */

const PLAIN_TEXT_NAME = "gym-session-feasibility.txt";
const PLAIN_MIME_TYPE = "text/plain";

const caps = detectCapabilities();

/* ---------------------------- mechanics log ----------------------------- */

function log(message) {
  const list = document.getElementById("mechanics-log");
  if (!list) return;
  const entry = document.createElement("li");
  const stamp = new Date().toISOString();
  entry.textContent = `${stamp} — ${message}`;
  list.insertBefore(entry, list.firstChild);
}

function report(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.classList.toggle("error", isError);
  }
  log(`${elementId}: ${message}`);
}

/* --------------------------- capability panel ---------------------------- */

function renderCapabilities() {
  const list = document.getElementById("caps-list");
  if (!list) return;
  const rows = [
    ["Secure context (isSecureContext)", caps.secureContext === null ? "unknown" : String(caps.secureContext)],
    ["Protocol", caps.protocol ?? "unknown"],
    ["navigator.share", caps.hasShare ? "available" : "NOT available"],
    ["navigator.canShare", caps.hasCanShare ? "available" : "NOT available"],
    [
      "canShare({ files })",
      caps.canShareFiles === null ? "unknown" : String(caps.canShareFiles),
    ],
    ["ClipboardItem", caps.hasClipboardItem ? "available" : "NOT available"],
    [
      'ClipboardItem.supports("text/html")',
      caps.clipboardSupportsHtml === null ? "unknown" : String(caps.clipboardSupportsHtml),
    ],
    ["User agent", caps.userAgent ?? "unknown"],
  ];
  for (const [term, definition] of rows) {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = definition;
    list.append(dt, dd);
  }
  const originHint = document.getElementById("origin-hint");
  if (originHint && location.origin.startsWith("http")) {
    originHint.textContent = location.origin;
  }
}

function renderRoutes() {
  const container = document.getElementById("route-verdicts");
  if (!container) return;
  for (const route of classifyRoutes(caps)) {
    const line = document.createElement("p");
    line.className = "verdict";
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent =
      route.status === ROUTE_STATUS.AVAILABLE
        ? "READY (mechanics)"
        : route.status === ROUTE_STATUS.MANUAL
          ? "NEEDS USER-CREATED SHORTCUT"
          : route.status === ROUTE_STATUS.UNKNOWN
            ? "UNKNOWN — PROBE ON DEVICE"
            : "NOT AVAILABLE HERE";
    const strong = document.createElement("strong");
    strong.textContent = ` ${route.title}`;
    const detail = document.createElement("div");
    detail.className = "detail";
    detail.textContent = route.detail;
    line.append(tag, strong, detail);
    container.append(line);
  }
}

/* --------------------------- fixture preview ----------------------------- */

function renderPreview() {
  const host = document.getElementById("fixture-preview");
  if (!host) return;
  const summary = displaySummary(FIXTURE_SESSION);

  const dateP = document.createElement("p");
  dateP.innerHTML = `<strong></strong>`;
  dateP.firstChild.textContent = `${formatDateDisplay(FIXTURE_SESSION.dateLocal)} · ${summary.sets} sets · ${summary.exercises} exercises`;

  const legendP = document.createElement("p");
  legendP.style.color = "#98989f";
  legendP.textContent = Object.values(CATEGORY_LABELS).join(" ");

  const table = document.createElement("table");
  table.className = "preview";
  const thead = table.createTHead().insertRow();
  for (const { label } of EXPORT_COLUMNS) {
    const th = document.createElement("th");
    th.textContent = label;
    thead.append(th);
  }
  const tbody = table.createTBody();
  for (const row of orderedRows(FIXTURE_SESSION.rows)) {
    const tr = tbody.insertRow();
    tr.dataset.gymCategory =
      row.highlight === "none" ? "" : CATEGORY_LABELS[row.highlight] ?? "";
    let fg = null;
    let bg = null;
    if (row.highlight !== "none") {
      fg = CATEGORY_FG[row.highlight];
      bg = OPAQUE_HIGHLIGHT[row.highlight];
      tr.style.color = fg;
      tr.style.backgroundColor = bg;
    }
    for (const { field } of EXPORT_COLUMNS) {
      const td = tr.insertCell();
      td.textContent = row[field];
    }
  }

  const notesTitle = document.createElement("h3");
  notesTitle.textContent = "Notes";
  const notesP = document.createElement("p");
  notesP.style.whiteSpace = "pre-line";
  notesP.textContent = FIXTURE_SESSION.notes;

  host.append(dateP, legendP, table, notesTitle, notesP);
}

/* ------------------------- clipboard mechanics --------------------------- */

/** Legacy selection-based plain-text copy (mirrors production fallback scope). */
function copyTextViaSelection(text) {
  if (
    typeof document === "undefined" ||
    !document.body ||
    typeof document.execCommand !== "function"
  ) {
    return false;
  }
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.setAttribute("aria-hidden", "true");
  helper.tabIndex = -1;
  helper.style.position = "fixed";
  helper.style.top = "0";
  helper.style.left = "-9999px";
  helper.style.width = "1px";
  helper.style.height = "1px";
  helper.style.opacity = "0";
  let copied = false;
  try {
    document.body.appendChild(helper);
    helper.focus();
    helper.select();
    helper.setSelectionRange(0, text.length);
    copied = document.execCommand.call(document, "copy");
  } catch {
    copied = false;
  } finally {
    helper.remove();
  }
  return copied;
}

async function copyPlainTextToClipboard(text, statusId, label) {
  // Start inside the gesture: build nothing async before this point.
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      report(statusId, `Copied ${label} to clipboard (mechanics only — paste result unverified).`);
      return;
    } catch (error) {
      report(
        statusId,
        `clipboard.writeText refused (${error.name}: ${error.message}); trying legacy selection copy…`,
        true,
      );
    }
  }
  if (copyTextViaSelection(text)) {
    report(statusId, `Copied ${label} via legacy selection copy (plain text only).`);
  } else {
    report(statusId, `FAILED: no clipboard mechanism accepted ${label}.`, true);
  }
}

/* ------------------------------- sharing --------------------------------- */

function makeFile(name, mimeType, content) {
  return new File([content], name, { type: mimeType });
}

async function shareFiles(files, statusId, label) {
  if (!navigator.share) {
    report(statusId, "NOT AVAILABLE HERE: navigator.share missing on this origin/browser.", true);
    return;
  }
  if (typeof navigator.canShare === "function") {
    let accepts = false;
    try {
      accepts = navigator.canShare({ files });
    } catch {
      accepts = false;
    }
    if (!accepts) {
      report(
        statusId,
        `NOT AVAILABLE HERE: canShare({files}) refused ${label}. Use the Download buttons instead.`,
        true,
      );
      return;
    }
  }
  try {
    await navigator.share({ files, title: "Gym Logger feasibility handoff" });
    report(
      statusId,
      "Share Sheet completed. Target chosen by the user is NOT observable here — no transfer outcome claimed.",
    );
  } catch (error) {
    if (error && error.name === "AbortError") {
      report(statusId, "Share Sheet dismissed by user (AbortError). Nothing transferred.");
    } else {
      report(statusId, `Share failed: ${error.name}: ${error.message}`, true);
    }
  }
}

async function shareText(statusId) {
  if (!navigator.share) {
    report(statusId, "NOT AVAILABLE HERE: navigator.share missing on this origin/browser.", true);
    return;
  }
  try {
    await navigator.share({
      title: "Gym Logger session",
      text: buildPlainNotes(FIXTURE_SESSION),
    });
    report(
      statusId,
      "Share Sheet completed. If Notes was chosen it creates a NEW note (plain text only). Verify on device.",
    );
  } catch (error) {
    if (error && error.name === "AbortError") {
      report(statusId, "Share Sheet dismissed by user (AbortError). Nothing transferred.");
    } else {
      report(statusId, `Share failed: ${error.name}: ${error.message}`, true);
    }
  }
}

/* ------------------------------ downloads -------------------------------- */

function downloadFile(name, mimeType, content, statusId) {
  try {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    report(statusId, `Downloaded ${name} (mechanics only). Predicted Notes outcome: attachment.`);
  } catch (error) {
    report(statusId, `Download failed: ${error.name}: ${error.message}`, true);
  }
}

/* --------------------- RTF clipboard representation probe ----------------- */

async function probeRtfClipboardWrite(statusId) {
  if (!navigator.clipboard || typeof navigator.clipboard.write !== "function") {
    report(statusId, "NOT AVAILABLE HERE: navigator.clipboard.write missing.", true);
    return;
  }
  if (typeof ClipboardItem !== "function") {
    report(statusId, "NOT AVAILABLE HERE: ClipboardItem is not defined.", true);
    return;
  }
  try {
    const item = new ClipboardItem({
      [RTF_MIME_TYPE]: new Blob([buildRtfNotes(FIXTURE_SESSION)], { type: RTF_MIME_TYPE }),
    });
    await navigator.clipboard.write([item]);
    // Unexpected but honest: some environment may accept it.
    report(
      statusId,
      "UNEXPECTED: clipboard accepted application/rtf on this browser — record this as high-value evidence.",
    );
  } catch (error) {
    report(
      statusId,
      `REJECTED (expected evidence): ${error.name}: ${error.message}`,
    );
  }
}

/* ------------------------------ capability JSON --------------------------- */

async function copyCapabilityReport(statusId) {
  const payload = JSON.stringify(
    { task: "M03-T01-E003-FEAS-01", href: location.href, ...caps },
    null,
    2,
  );
  await copyPlainTextToClipboard(payload, statusId, "capability report JSON");
}

/* -------------------------------- wiring ---------------------------------- */

const $ = (id) => document.getElementById(id);

function wire() {
  renderCapabilities();
  renderRoutes();
  renderPreview();

  $("btn-copy-caps").addEventListener("click", () => {
    void copyCapabilityReport("status-caps");
  });

  $("btn-copy-plain").addEventListener("click", () => {
    void copyPlainTextToClipboard(buildPlainNotes(FIXTURE_SESSION), "status-plain", "plain TSV control text");
  });

  $("btn-copy-html-source").addEventListener("click", () => {
    void copyPlainTextToClipboard(
      buildRepresentativeNotesHtml(FIXTURE_SESSION),
      "status-html-source",
      "representative HTML source",
    );
  });

  $("btn-share-text").addEventListener("click", () => {
    void shareText("status-share-text");
  });

  $("btn-share-html-file").addEventListener("click", () => {
    void shareFiles(
      [makeFile(HTML_FILE_NAME, HTML_MIME_TYPE, buildRepresentativeNotesHtml(FIXTURE_SESSION))],
      "status-share-html",
      "text/html file",
    );
  });

  $("btn-share-rtf-file").addEventListener("click", () => {
    void shareFiles(
      [makeFile(RTF_FILE_NAME, RTF_MIME_TYPE, buildRtfNotes(FIXTURE_SESSION))],
      "status-share-rtf",
      "application/rtf file",
    );
  });

  $("btn-probe-rtf-clipboard").addEventListener("click", () => {
    void probeRtfClipboardWrite("status-rtf-probe");
  });

  $("btn-download-html").addEventListener("click", () => {
    downloadFile(
      HTML_FILE_NAME,
      HTML_MIME_TYPE,
      buildRepresentativeNotesHtml(FIXTURE_SESSION),
      "status-dl-html",
    );
  });

  $("btn-download-rtf").addEventListener("click", () => {
    downloadFile(RTF_FILE_NAME, RTF_MIME_TYPE, buildRtfNotes(FIXTURE_SESSION), "status-dl-rtf");
  });

  $("btn-download-txt").addEventListener("click", () => {
    downloadFile(
      PLAIN_TEXT_NAME,
      PLAIN_MIME_TYPE,
      buildPlainNotes(FIXTURE_SESSION),
      "status-dl-txt",
    );
  });

  log(`Harness loaded. Secure context: ${caps.secureContext}. Share: ${caps.hasShare}. Files: ${caps.canShareFiles}.`);
}

wire();
