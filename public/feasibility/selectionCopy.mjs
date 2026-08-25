/**
 * M03-T04 isolated WebKit native-selection-copy proof.
 *
 * This module deliberately does not use ClipboardItem, navigator.clipboard,
 * writeText, or a copy event handler. The only clipboard operation in this
 * proof is the browser's synchronous native selection-copy command.
 */

export const SELECTION_COPY_PROOF_ID = "M03-T04-WEBKIT-SELECTION-COPY";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cellText(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function summaryText(session) {
  const override = session.summaryOverride ?? {};
  const sets = override.sets ?? "";
  const exercises = override.exercises ?? "";
  return `${sets} sets · ${exercises} exercises`;
}

/** Builds a real rendered HTML table, retaining the canonical fixture values. */
export function buildSelectionCopyMarkup(session) {
  const legend = [
    ["Arms", "#ff9f0a"],
    ["Back", "#bf5af2"],
    ["Chest", "#66d4cf"],
    ["Delts", "#0a84ff"],
    ["Legs", "#ff375f"],
  ];
  const rows = [...session.rows].sort((left, right) => left.position - right.position);
  const legendMarkup = legend
    .map(([label, color]) => `<span style="color:${color};margin-right:12px">${label}</span>`)
    .join("");
  const body = rows.map((row) => {
    const colors = {
      orange: ["#ff9f0a", "#261802"],
      purple: ["#bf5af2", "#1f0e27"],
      mint: ["#66d4cf", "#0f201f"],
      blue: ["#0a84ff", "#021529"],
      pink: ["#ff375f", "#26080e"],
    }[row.highlight];
    const style = colors
      ? `color:${colors[0]};background-color:${colors[1]}`
      : "";
    const cells = [row.exercise, row.sets, row.reps, row.weight, row.skip]
      .map((value) => `<td style="padding:5px 8px;${style}">${cellText(value)}</td>`)
      .join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  const headings = ["Exercise", "Sets", "Reps", "Weight", "Skip"]
    .map((label) => `<th style="padding:5px 8px;text-align:left">${label}</th>`)
    .join("");
  return [
    `<div data-selection-copy-proof="${SELECTION_COPY_PROOF_ID}" style="background:#000;color:#f2f2f7;font:17px -apple-system,Helvetica Neue,Arial,sans-serif;padding:8px">`,
    `<p><strong>${escapeHtml(session.displayDate)}</strong></p>`,
    `<p>${legendMarkup}</p>`,
    `<p>${escapeHtml(summaryText(session))}</p>`,
    `<table style="border-collapse:collapse"><thead><tr>${headings}</tr></thead><tbody>${body}</tbody></table>`,
    `<p><strong>Notes</strong></p><p>${cellText(session.notes)}</p>`,
    "</div>",
  ].join("");
}

function rememberSelection(selection) {
  const ranges = [];
  if (selection) {
    for (let index = 0; index < selection.rangeCount; index += 1) {
      ranges.push(selection.getRangeAt(index).cloneRange());
    }
  }
  return ranges;
}

/**
 * Selects a rendered proof node, invokes WebKit's native copy path, and
 * restores the caller's selection/focus. No clipboard data is supplied by
 * this function; the browser owns the pasteboard representations.
 */
export function copyRenderedSelection(root) {
  const ownerDocument = root?.ownerDocument;
  if (!ownerDocument || !ownerDocument.body || !root) return false;
  const selection = ownerDocument.getSelection?.() ?? null;
  const previousRanges = rememberSelection(selection);
  const previousFocus = ownerDocument.activeElement;
  let copied = false;

  try {
    const range = ownerDocument.createRange();
    range.selectNodeContents(root);
    selection?.removeAllRanges();
    selection?.addRange(range);
    copied = ownerDocument.execCommand?.("copy") === true;
  } catch {
    copied = false;
  } finally {
    selection?.removeAllRanges();
    for (const range of previousRanges) selection?.addRange(range);
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }
  return copied;
}
