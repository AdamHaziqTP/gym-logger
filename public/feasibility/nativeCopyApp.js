/**
 * ============================================================================
 * EXPERIMENTAL FEASIBILITY HARNESS — NOT PRODUCT CODE
 * Task: M03-T04 (WebKit native selection-copy colour proof)
 * ============================================================================
 *
 * DOM wiring for public/feasibility/native-copy.html.
 *
 * The proof gesture is fully synchronous: nothing is awaited between the tap
 * and the native copy command call, so the whole experiment stays inside the
 * transient user activation (the same iOS/Safari rule the production fallback
 * documents). The reported status describes local mechanics ONLY — never an
 * Apple Notes structure or colour outcome.
 */

import { FIXTURE_SESSION } from "./fixture.mjs";
import {
  describeEnvironmentFacts,
  describeNativeCopyOutcome,
  runNativeSelectionCopyProof,
} from "./nativeSelectionCopy.mjs";

function log(message) {
  const list = document.getElementById("proof-log");
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

function renderEnvironmentFacts() {
  const list = document.getElementById("env-facts");
  if (!list) return;
  for (const [term, definition] of describeEnvironmentFacts()) {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = definition;
    list.append(dt, dd);
  }
}

function wire() {
  renderEnvironmentFacts();

  const button = document.getElementById("btn-native-copy");
  button.addEventListener("click", () => {
    // Fully synchronous inside the tap gesture — no awaited work first.
    const result = runNativeSelectionCopyProof({ session: FIXTURE_SESSION });
    report(
      "status-native-copy",
      describeNativeCopyOutcome(result),
      !result.succeeded,
    );
  });

  log(`Proof page loaded at ${location.href}`);
}

wire();
