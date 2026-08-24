/**
 * ============================================================================
 * EXPERIMENTAL FEASIBILITY HARNESS — NOT PRODUCT CODE
 * Task: M03-T01-E003-FEAS-01
 * ============================================================================
 *
 * Honest route-capability classification for the harness page.
 *
 * Rules enforced here and pinned by tests:
 * - a route is NEVER reported as a proven Notes transfer; statuses describe
 *   only local mechanics ("available on this origin", "needs a user-created
 *   Shortcut", "not available here");
 * - unsupported browser/native capabilities produce explicit evidence entries,
 *   never silent degradation or optimistic fallback claims;
 * - file handoffs are labeled with their PREDICTED Notes outcome (attachment),
 *   clearly marked as unverified transport evidence.
 */

/** Statuses a route verdict may take. */
export const ROUTE_STATUS = Object.freeze({
  AVAILABLE: "available-on-this-origin",
  MANUAL: "needs-user-created-shortcut",
  UNAVAILABLE: "not-available-here",
  UNKNOWN: "unknown-on-this-origin",
});

function hasFunction(object, name) {
  return Boolean(object) && typeof object[name] === "function";
}

/**
 * Detects the browser/native capabilities the routes depend on. Defensive by
 * design: every probe that can throw is wrapped, and unknown answers are
 * recorded as `null` (unknown) instead of guessed.
 *
 * `scope` defaults to globalThis; tests pass synthetic scopes.
 */
export function detectCapabilities(scope = globalThis) {
  let secureContext = null;
  try {
    secureContext =
      typeof scope.isSecureContext === "boolean" ? scope.isSecureContext : null;
  } catch {
    secureContext = null;
  }

  const navigatorRef = scope.navigator ?? null;
  const hasShare = hasFunction(navigatorRef, "share");
  const hasCanShare = hasFunction(navigatorRef, "canShare");

  // `canShare({ files })` is synchronous and legal without a user gesture.
  let canShareFiles = null;
  if (hasCanShare) {
    try {
      const probe =
        typeof scope.File === "function"
          ? new scope.File(["probe"], "probe.txt", { type: "text/plain" })
          : null;
      if (probe) {
        canShareFiles = navigatorRef.canShare({ files: [probe] }) === true;
      }
    } catch {
      canShareFiles = false;
    }
  }

  const clipboardItemCtor =
    typeof scope.ClipboardItem === "function" ? scope.ClipboardItem : null;
  const hasClipboardItem = clipboardItemCtor !== null;
  let clipboardSupportsHtml = null;
  if (
    clipboardItemCtor &&
    typeof clipboardItemCtor.supports === "function"
  ) {
    try {
      clipboardSupportsHtml =
        clipboardItemCtor.supports("text/html") === true;
    } catch {
      clipboardSupportsHtml = null;
    }
  }

  return {
    secureContext,
    protocol:
      scope.location && typeof scope.location.protocol === "string"
        ? scope.location.protocol.replace(":", "")
        : null,
    userAgent:
      navigatorRef && typeof navigatorRef.userAgent === "string"
        ? navigatorRef.userAgent
        : null,
    hasShare,
    hasCanShare,
    canShareFiles,
    hasClipboardItem,
    clipboardSupportsHtml,
  };
}

/**
 * Classifies every authorized route from detected capabilities.
 * Returns an array of `{ id, title, status, detail }` in route order.
 * No entry ever asserts an Apple Notes result.
 */
export function classifyRoutes(caps) {
  const routes = [];

  /* Controls — the accepted production behaviors, kept as comparison baselines. */
  routes.push({
    id: "control-plain",
    title: "Control A — plain TSV text copy",
    status: ROUTE_STATUS.AVAILABLE,
    detail:
      "Mirrors the accepted production plain fallback (clipboard writeText with legacy selection fallback). Expected on-device result: correct text values, no table/colors.",
  });
  routes.push({
    id: "control-html-source",
    title: "Control B — Copy to Notes rich paste (production screen)",
    status: caps.secureContext
      ? ROUTE_STATUS.AVAILABLE
      : ROUTE_STATUS.UNAVAILABLE,
    detail: caps.secureContext
      ? "Use the app's own Copy to Notes button on this trusted HTTPS origin. Established device evidence: editable table + all data survive; colors stripped. Baseline for comparison."
      : "Production rich copy requires the trusted HTTPS origin. Open this harness over HTTPS.",
  });

  /* Route 1 — PWA → Share Sheet / Shortcuts / Notes handoff. */
  routes.push({
    id: "share-text",
    title: "Route 1a — Share Sheet: plain text → Notes",
    status: caps.hasShare ? ROUTE_STATUS.AVAILABLE : ROUTE_STATUS.UNAVAILABLE,
    detail: caps.hasShare
      ? "navigator.share({text}) opens the iOS Share Sheet; choosing Notes creates a NEW note. Predicted: plain text only (no table/colors). Unverified until run."
      : "navigator.share is not available on this origin/browser. Evidence recorded; use Control A instead.",
  });
  routes.push({
    id: "share-file-html",
    title: "Route 1b — Share Sheet: .html FILE → Notes / Shortcut",
    status:
      caps.canShareFiles === true
        ? ROUTE_STATUS.AVAILABLE
        : caps.canShareFiles === false
          ? ROUTE_STATUS.UNAVAILABLE
          : ROUTE_STATUS.UNKNOWN,
    detail:
      caps.canShareFiles === true
        ? "File sharing supported. Predicted Apple Notes outcome when Notes is the chosen target: an attachment (not editable inline) — transport evidence only. Sharing into a Shortcut (Make Rich Text) is Route 3b."
        : caps.canShareFiles === false
          ? "Honest evidence: navigator.canShare({files}) reports false on this origin/browser. Use the Download buttons instead; the Files-app handoff remains testable manually."
          : "File-sharing support unknown here. Probe on-device with the Share File buttons; whatever they report is evidence, not a failure.",
  });
  routes.push({
    id: "download-files",
    title: "Route 1c/2 — Download .html/.rtf/.txt for Files-app handoff",
    status: ROUTE_STATUS.AVAILABLE,
    detail:
      "Downloads always work mechanically. PREDICTED Notes outcome for both formats: attachment/view-only document, NOT an editable colored table — unless proven otherwise on device.",
  });

  /* Route 2 — RTF/attributed clipboard or file handoff. */
  routes.push({
    id: "rtf-clipboard-probe",
    title: "Route 2a — RTF clipboard write probe (application/rtf)",
    status:
      caps.hasClipboardItem ? ROUTE_STATUS.AVAILABLE : ROUTE_STATUS.UNAVAILABLE,
    detail: caps.hasClipboardItem
      ? "Attempts a ClipboardItem with application/rtf. WebKit documents only text/plain, text/html, text/uri-list, image/png as writable; rejection is the EXPECTED honest evidence, reported verbatim."
      : "No ClipboardItem support on this origin/context — recorded as honest evidence. The clipboard RTF route is closed here; file handoff remains.",
  });
  routes.push({
    id: "rtf-file-handoff",
    title: "Route 2b — RTF file handoff (.rtf download / share)",
    status: ROUTE_STATUS.AVAILABLE,
    detail:
      "Deterministic RTF generated locally (no dependencies). Whether iOS Notes converts it to an editable colored table is unknown and must be measured on device; macOS Notes RTF behavior must not be generalized to iOS.",
  });

  /* Route 3 — Shortcuts conversion (always requires user setup). */
  routes.push({
    id: "shortcut-clipboard-html",
    title: "Route 3a — Shortcut: clipboard HTML source → Make Rich Text → Create Note",
    status: ROUTE_STATUS.MANUAL,
    detail:
      "Requires a USER-CREATED Shortcut (setup steps on the page). No Shortcut is bundled or assumed to exist. This is the lowest-friction candidate: no paid Developer dependency, one-time free setup.",
  });
  routes.push({
    id: "shortcut-share-file",
    title: "Route 3b — Shortcut via Share Sheet input → Make Rich Text → Create Note",
    status: ROUTE_STATUS.MANUAL,
    detail:
      "Same Shortcut family receiving Share Sheet input (text or file). Requires the same user-created Shortcut configured with 'Show in Share Sheet'.",
  });

  return routes;
}
