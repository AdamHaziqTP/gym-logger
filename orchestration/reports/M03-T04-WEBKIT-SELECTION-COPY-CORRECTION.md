# M03-T04 — WebKit native selection-copy proof: re-dispatched OX round

Date: 2026-08-26  
Base checkpoint: `9b1e33b` (working tree on top of `5511571`)  
Task: `orchestration/tasks/M03-T04-WEBKIT-SELECTION-COPY.md` (re-dispatched
READY_FOR_OX after the first OX invocation timed out and Codex fallback
produced `14db33d`, reviewed at `5511571`)  
Status: **AUTOMATED SCOPE COMPLETE — TARGET-iPhone PASTE GATE PENDING**

## Summary

Implemented the isolated WebKit native-selection-copy proof exactly as scoped
by the task file, consolidated the feasibility area onto one verified proof
artifact, and repointed the pending device gate at it. The production Copy to
Notes path is untouched. No Apple Notes structure or colour outcome is claimed
or implied anywhere in this work.

## Supersession of the earlier fallback round

The first OX dispatch timed out; the Codex fallback committed a minimal proof
(`public/feasibility/selection-copy.html` + `selectionCopy.mjs` + 3 focused
tests) that was accepted for automated scope. Audit against the task contract
during this round found a genuine defect plus thin coverage:

- **Content-contract violation:** the fallback renderer emitted
  `session.displayDate`, but `FIXTURE_SESSION` has no such field, so the
  copied markup carried the literal text `undefined` as the session date. The
  existing tests never asserted the date line, so the defect was invisible.
- The legend was rendered as five coloured spans instead of the payload's
  plain legend line; per-row colours/order/selection-restoration were not
  pinned by tests; the offscreen host used `opacity:.01` concealment styling;
  status wording did not isolate mechanics from outcome as tightly as the
  task requires.

Because two competing "proof" buttons on the trusted origin would make the
one-tap human gate ambiguous, this round consolidates on a single complete,
tested implementation:

| Retired (deleted) | Added |
|---|---|
| `public/feasibility/selection-copy.html` | `public/feasibility/native-copy.html` |
| `public/feasibility/selectionCopy.mjs` | `public/feasibility/nativeSelectionCopy.mjs` |
| `src/tests/selectionCopy.test.mjs` | `src/tests/m03t04NativeCopy.test.mjs` |
| — | `public/feasibility/nativeCopyApp.js` |

The historical fallback report (`M03-T04-WEBKIT-SELECTION-COPY.md`) and its
Codex review are preserved unchanged as records of that round. The live
device checklist `orchestration/evidence/HUMAN-VERIFICATION-M03-T04-WEBKIT-SELECTION-COPY.md`
now points at the new proof URL with a supersession note.

## Implementation vs task requirements

1. **Canonical session/colours, complete content contract** — renders
   `FIXTURE_SESSION` from `public/feasibility/fixture.mjs`: date
   (`Sunday 23 Aug`), five-entry legend, `~41 sets · 7+ exercises` override
   summary, all rows in position order with every free-form value verbatim
   (incl. `8,6`, `body weight`, `30°`, em dash, quotes/braces torture cells),
   locked foreground + derived-opaque highlight tokens per category, and
   multi-line notes. Tests pin every element of this contract.
2. **Real DOM table, rendered not concealed** — an actual `<table>` with
   `<thead>`/`<tbody>` attached inside the document during the gesture,
   hosted by a `position:fixed; left:-9999px` container that stays fully
   displayed. No `display:none`, no `visibility:hidden`, no detached
   fragment, no opacity games (statically enforced).
3. **One direct user gesture → Range + native copy command** — the button
   handler runs fully synchronously (nothing awaited before the call): capture
   previous selection ranges (cloned) and focused element, render+attach the
   host, select the proof subtree via `document.createRange()` /
   `selectNodeContents`, then invoke `document.execCommand("copy")` once.
4. **No interception, no manual payloads** — no async clipboard writers and no
   copy-event listeners/handlers anywhere in the proof; enforced by static
   scans over all three proof files (combined-item writer, async clipboard
   namespace reference, copy-event payload access, manual data assembly,
   async plain write, copy listener registration, inline handler attribute).
   The experiment reports only what WebKit itself produces from the selection.
5. **Restoration + cleanup + isolation** — previous selection restored
   (clone-based with identity fallback) and focus refocused after the
   synchronous call; the temporary host is always removed (success, refusal,
   throw, and missing-API paths each tested). No production source references
   the proof; the production combined writer remains intact (pinned statically
   and by the untouched behavioral suite).
6. **Honest status** — success/refusal/unavailable statuses describe only
   whether the browser command succeeded, failed, or was never requested, with
   an explicit "No Apple Notes structure or colour outcome is claimed" line.
   Tests assert no claim-like wording can appear.

## Automated verification

| Check | Result |
|---|---|
| Focused proof tests (`src/tests/m03t04NativeCopy.test.mjs`) | **PASS — 23/23** |
| Full suite | **PASS — 398/398 across 33 files** after the service-worker bypass assertion |
| Production build (`tsc && vite build`) | **PASS** — cache `v-800b87d5` precaches 20 assets incl. all three new proof files; retired assets absent from `dist` |
| `git diff --check` | Clean (exit 0; benign CRLF notice only) |
| HTTPS runtime smoke `https://192.168.1.49:4173/` | Shell `/`, manifest, service worker **200**; served SW matches built `v-800b87d5` and bypasses `/feasibility/*` |
| Proof page over trusted LAN origin | `/feasibility/native-copy.html` **200** with button/module markers; `nativeSelectionCopy.mjs`, `nativeCopyApp.js`, `fixture.mjs` all **200** |
| Retired proof URLs | Serve the harmless SPA shell fallback — no stale proof page reachable |

Focused coverage includes: real-DOM content/colour mapping (order, values,
tokens, plain none-rows, `<br>` notes), rendered-not-hidden invariant,
fake-document mechanics (exact select→copy→restore→cleanup ordering, refusal/
throw/missing-API honesty, clonable and non-clonable previous-range paths),
jsdom cleanup integration, status-wording honesty, forbidden-API static scans,
production-isolation scans, and defensive environment facts.

## Remaining boundary

Desktop automation cannot prove what Apple Notes pastes. The next gate is the
already-prepared human step: open
`https://192.168.1.49:4173/feasibility/native-copy.html` on the iPhone 14 Pro
Max, tap once, paste once into the existing `Gym` note, and record PASS/FAIL/
BLOCKED per `orchestration/evidence/HUMAN-VERIFICATION-M03-T04-WEBKIT-SELECTION-COPY.md`.
E-004 stays parked; normal Copy to Notes remains unchanged regardless of the
result.
