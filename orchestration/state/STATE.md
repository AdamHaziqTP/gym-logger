# Gym Logger orchestration state

Updated: 2026-08-26

## Current status

- Project: Gym Logger
- Control mode: Codex orchestrator → DSH/OX Alpha builder → Codex verification
- Current milestone: M03 — Apple Notes colour-recovery feasibility
- Current task: M03-T09 real production-session native manual-paste handoff
- Status: READY_FOR_HOSTED_BUILD_AND_HUMAN_GATE
- Automatic correction attempts used: 2 / 2 for M01
- Infrastructure retry: completed; FIX-02 was dispatched after rate-limit recovery and did not consume an M01 implementation correction attempt
- Human review gate: install the newest hosted helper, open the real Tuesday `actual-2026-08-25` session from the PWA, use **Prepare Coloured Notes Copy**, then paste once into the existing `Gym` note and complete `HUMAN-VERIFICATION-M03-T09-NATIVE-MANUAL-PASTE-HANDOFF.md`.
- Latest bounded task: M03-T09 real-session native manual-paste handoff; production PWA ordinary Copy to Notes remains unchanged.
- Human-gate correction cycle: M01 FIX-05 independently green in automated verification; M03-T01 FIX-01 independently green for automated/plain-fallback scope
- Commissioning report: `orchestration/reports/M01-commissioning-report.md`

## Known-good checkpoints

- Handoff baseline: `db71546` — `chore: checkpoint gym logger handoff`
- Orchestration bootstrap: `dd72762`
- Last orchestration evidence checkpoint: `c10d429` — FIX-05 automated known-good checkpoint candidate
- M01 engineering checkpoint: independently green automated FIX-05 checkpoint; physical-device acceptance deferred, not passed
- M02-T02/T03/T04: accepted automatically through Codex verification
- M03-T01/FIX-03 engineering checkpoint: 153/153 tests, build, diff audit, and HTTPS runtime smoke accepted; Apple Notes color interoperability was escalated and is now resolved as a documented v1 limitation
- M03-T01/E-003 engineering checkpoint: `75c7ba4` — isolated feasibility harness accepted by Codex at 33/33 focused tests, 186/186 full suite, build, diff audit, and HTTPS runtime smoke; no auxiliary route is adopted into v1
- B2 helper checkpoint: `249e216` — Apple Notes-shaped generated flat-RTFD source and gate; hosted macOS/Xcode run `32959270742` passed packaging
- B2 device checkpoint: `d0544c5` — generated Gym Logger flat-RTFD pasted as an editable table with all five row colours; legend-label polish remained open

## Completed

- Read the full finalized `GYM_LOGGER_SPEC.md`.
- Inspected all supplied screenshots and the seed fixture.
- Read `references/text 2.txt` enough to confirm intentionally irregular free-form history.
- Read the available Build Gym Logger conversation export as supplementary history.
- Confirmed the Desktop DSH wrapper exists at the verified path.
- Completed independent automated verification of the M01/FIX-05 correction checkpoint.
- Recorded the product owner's iPhone 14 Pro Max result: temporary LAN/local-host runtime was unreachable, so HV-01 through HV-05 are BLOCKED/DEFERRED rather than passed.
- Recorded product authorization to continue in full-auto mode through bounded milestones and defer low-risk M01 physical-device checks to the final reachable/installable-build acceptance pass.
- Accepted M02-T02 Copy Another Session automatically.
- Accepted M02-T03 whole-session deletion automatically.
- Accepted M02-T04 summary overrides automatically.
- Accepted M03-T01 engineering clipboard spike automatically.
- Accepted M03-T01-FIX-01 engineering correction at 140/140 tests, passing build, and passing LAN runtime smoke.
- Recorded iPhone plain-fallback result: all text/data survived, while table structure, formatting, and colours were unavailable on the non-secure HTTP LAN origin.
- Resolved product escalation E-002 in favor of a trusted HTTPS retest rather than accepting HTTP plain-text-only as the final product limitation.
- Completed OX M03-T01-FIX-02: per-cell and per-text-wrapper category color payload correction.
- Completed Codex independent FIX-02 verification: 141/141 tests, build, diff audit, and HTTPS runtime smoke passed.
- Recorded the FIX-02 iPhone result: table/data remain correct, but Apple Notes still strips both category foreground and text-highlight colors; prepared FIX-03 for opaque/legacy-compatible text-run markup.
- Completed OX M03-T01-FIX-03 and Codex independent verification: 153/153 tests, build, diff audit, and HTTPS runtime smoke passed.
- Recorded the FIX-03 iPhone result: no category foreground or text-highlight colors survived; opened E-003 as platform interoperability evidence after three bounded HTML representations.
- Resolved E-003 by authorizing one bounded native/RTF/Shortcuts feasibility spike before accepting uncolored rich paste as the final v1 limitation.
- Completed and independently verified the bounded E-003 feasibility harness at 33/33 focused tests, 186/186 full suite, passing build and HTTPS runtime.
- Closed E-003 after product-owner evidence that another normal copy still had no colours and the auxiliary RTF/file/Shortcuts workflow was too unclear/high-friction for the intended simple v1 workflow. V1 now accepts editable rich-table paste without category colours as a documented iOS/Notes limitation.
- Recorded iPhone visual defect: Home screen Copy Another Session button clips/overlaps the History button below it on iPhone 14 Pro Max.
- Completed M03-T02 image export automated scope: Faithful/Compact deterministic PNG rendering, preview/download/share contract, and export controls; physical iPhone readability/save/share remain deferred.
- Completed M05-T01 backup/restore automated scope: deterministic JSON export, strict validation, explicit replacement summary/confirmation, transactional session restore, and best-effort safety export; physical Files/share/restore remain deferred.
- M06-T01 implementation was independently inspected and its focused tests/build passed, but the full suite exposed one genuine unhandled delayed SessionView timer after jsdom teardown; M06 remains unaccepted pending the bounded cleanup correction.
- M06-T01 and its timer correction are now independently accepted: 316/316 tests, clean build, diff audit, and trusted HTTPS manifest/service-worker/icon smoke; physical install/offline/visual checks remain deferred.
- M06-T02 is not accepted: independent build found two TypeScript errors and the worker has not yet supplied focused settings coverage or its required report. A bounded correction is prepared.
- M06-T02 is independently accepted for automated scope: 32 focused settings tests, 348 full tests, clean build/diff, and HTTPS shell/manifest/service-worker smoke; device theme/readability checks remain deferred.
- M06-T03 release-readiness is independently accepted for automated scope: deterministic 40-row fixture and synthetic 100-row render/export/order coverage, 350/350 full tests, clean build/diff, trusted HTTPS shell/manifest/service-worker/icon/asset smoke, static-hosting audit, and consolidated final-device documentation.
- Full v1 readiness sweep found one genuine bounded gap: backup restore included metadata/settings in the file but `replaceAllSessions` left the device's existing metadata/settings untouched. M06-T04 corrected this contract and added coverage before returning to the final human gate.
- M06-T04 is independently accepted: atomic sessions/settings restore, duplicate metadata rejection, live settings refresh, 45/45 focused backup tests, 352/352 full tests, clean build/diff, and trusted HTTPS runtime smoke.
- M06-T05 correction is independently accepted for automated scope: SVG-backed export previews, reachable mobile close control, deliberate generated Gym Logger icon, repaired local root/leaf HTTPS chain, 354/354 tests, build, runtime smoke, and diff audit. The physical retest remains open.
- M06-T05 saved-image delivery correction was rejected by device evidence: Faithful 1520×4842 and Compact 1520×2456 outputs were fully transparent after `0cb9b46`. A second bounded correction now fixes the real-canvas draw/encode lifecycle; preview/dismissal remain accepted.
- The `bfa2fba` device retest rejected the real-canvas correction too: one Compact 1520×2456 saved PNG remained fully transparent. A third bounded correction now traces image decode → canvas pixels → PNG/File handoff, refuses blank canvases, and retries one Blob-backed SVG decode path. Automated verification is 362/362 with build/runtime/diff pass.
- The `fa57dcb` device retest rejected the pixel guard: preview regressed to empty and saved output still failed. The next bounded correction replaces SVG-image `drawImage` rasterization with the offline pure-JS Canvg renderer, restores preview independence, and keeps the visible-pixel guard. Automated verification remains 362/362 with build/runtime/diff pass; physical saved-image proof is still open.
- M03-T03 Shortcuts colour-recovery branch is physically closed: both append and rich-clipboard/manual-paste variants failed to preserve an editable table and colours. The failed Share for Notes Colours action is hidden from the normal v1 UI; helper/evidence remain preserved and E-004 remains the only authorized native proof.
- Recorded the target-iPhone M03-T03 result as a genuine failure: Shortcuts flattened the content to plain text, lost all colours, and produced `Â·`/`Â°` mojibake. The Shortcuts branch is closed with no further variants authorized.
- E-004 is authorized for exactly one isolated native attributed-string/pasteboard feasibility proof; the PWA and normal Copy to Notes path remain unchanged.
- E-004 source proof is independently reviewed: 12/12 native harness checks, 359/359 PWA tests, build, and diff audit pass; Swift/Xcode compilation is unavailable on this Windows workstation.
- M06-T06 actual Tuesday session migration is independently accepted: exact 40-row source, transactional once-only marker, Sunday/unrelated-data preservation, Wednesday safety, next-session cloning, supplied icon assets, 365/365 full tests, build, HTTPS runtime, certificate endpoint, and diff audit pass. Physical IndexedDB/Home Screen verification remains deferred.
- Product-sync later recorded a genuine M06-T05 export geometry defect: Canvg now produces visible Faithful/Compact PNGs on the target iPhone, but both are framed too small in the top-left with large unused black space. Route a bounded framing/crop correction only; preserve the working Canvg rasterizer, visible pixels, colours, preview, and save/share path.
- M06-T05 framing correction is independently accepted for automated scope: the delivery canvas now applies the selected raster scale before Canvg renders; focused PNG/migration coverage is 27/27, full suite is 374/374, build/runtime/certificate/diff checks pass, and the target-iPhone saved-image framing result remains open.
- Phase B physical evidence at `934ddd7` passed the newly generated flat-RTFD table/content structure but failed all five category colours. Phase C remains blocked; B2 is the bounded Apple Notes-shaped RTF correction.
- B2 Apple Notes-shaped helper correction is independently green for automated scope: native contract checks pass, the full PWA suite is 410/410, build and diff hygiene pass, and production `src/`/`public/` remain unchanged. Target-iPhone colour fidelity is unproven.
- Hosted macOS/Xcode run `32959270742` passed from `249e216`; Codex verified the unsigned IPA contains the helper app and bundled fixture. This proves packaging only, not the Apple Notes result.
- B2 target-iPhone result is accepted for core feasibility at `d0544c5`: generated data pasted as an editable table with all five row/category colours, correct content/order/summary/notes/Unicode; only the separate legend labels were uncoloured.
- The bounded M03-T08 Phase C task was attempted through a fresh DSH Desktop headless `/agent-teams` dispatch with the configured OpenRouter/stealth/ox-alpha patch. It produced no stdout or delta for 150 seconds and was terminated as a task-level worker timeout; Codex fallback added the legend polish and Shortcut proof action.
- Codex independently verified the Phase C source contract, 410/410 PWA tests, production build, and diff hygiene. Hosted macOS/Xcode run `32961489740` independently compiled and packaged the updated helper from `6d28fec`; the Phase C device gate is now open.
- Phase C was physically closed at `cda3a58`: Shortcut append reached the correct `Gym` note and preserved a table, but stripped colours and concatenated the legend. No further Shortcut or HTML conversion variants are authorized.
- M03-T09 OX Alpha dispatch timed out without output or a usable delta in the bounded approximately 150-second DSH Desktop window. Codex fallback implemented the narrow manual-paste handoff and recorded the worker classification in `orchestration/reports/M03-T09-NATIVE-MANUAL-PASTE-HANDOFF-OX-ALPHA-REPORT.md`.
- M03-T09 is independently green for the PWA/native contract: 412/412 PWA tests, production build, native static contract, and handoff-specific review. The native Swift compile requires the hosted macOS/Xcode workflow and the target iPhone result remains open.

## Final disposition

- M01/FIX-05 automated verification remains the engineering baseline for continuation; its deferred physical-iPhone checks are not reclassified as PASS.
- Product owner has authorized full-auto continuation through bounded milestones except where a genuinely unavoidable product/human gate exists.
- The trusted-HTTPS iPhone result remains the v1 Notes-transfer baseline: real editable Notes table and all data/order PASS; the ordinary path strips category foreground/highlight colours. The M03-T03 Shortcuts route is closed after physical failure and must not regress this baseline.
- M03-T03 Shortcuts is closed after physical failure. E-004 may test one minimal native pasteboard helper only; it must not become a native rewrite, paid Developer dependency, or recurring fragile workflow.
- Preserve the HTTP synchronous plain-text fallback as a resilience path.
- Do not alter the reliable one-tap uncoloured Copy to Notes baseline. E-004 is the single authorized native-helper proof; if it fails editable-table plus colour preservation or is too burdensome to install, close colour recovery and retain the uncoloured v1 baseline.
- M06-T03 is accepted for automated scope. Historical import remains explicitly deferred, and Apple Notes colour transfer remains the accepted v1 platform limitation.
- The Home responsive-layout defect (Copy Another Session overlapping History on iPhone 14 Pro Max) must be routed as a bounded correction before final product acceptance. It does not block M03 continuation.
- Do not declare the project complete until all deferred real-iPhone acceptance items, including PNG export, offline/installability, the deferred M01 touch/legend checks, and the recorded Home overlap correction, have been physically verified.
- M05-T01 backup/restore, M06 release-readiness, and M06-T04 settings restore are accepted for automated scope. Stop only at the consolidated final iPhone 14 Pro Max gate in `orchestration/evidence/HUMAN-VERIFICATION-FINAL-IPHONE14-PROMAX.md`.
- The consolidated iPhone 14 Pro Max pass found real failures in both image-export previews, mobile export-sheet dismissal, local HTTPS trust, and the Home Screen icon. Route the bounded code/icon corrections through M06-T05 before requesting one consolidated retest; do not mark any physical behavior passed from desktop evidence.
- M06-T05 is accepted for automated scope. The same consolidated checklist now awaits one physical retest at `https://192.168.1.49:4173/`; do not mark device behavior passed from desktop evidence.
- M03-T03 target-iPhone proof is closed as failed; do not claim Apple Notes colours from the Shortcuts route or desktop evidence. E-004 Phase A/A2 is complete; B2 generated-payload proof is now the active bounded route.
- M06-T06 OX invocation produced no output or delta during the bounded ~95-second task window; classify this as a task-level worker hang/timeout, not OX unavailability. Codex fallback was used only after that concrete failure and independently verified the implementation.

## Deferred

- M01 FIX-05 physical-iPhone HV-01 through HV-05: BLOCKED/DEFERRED due unreachable temporary LAN/local-host runtime; final acceptance still required later.
- Apple Notes category colour transfer: accepted v1 limitation; standard rich paste preserves editable table/data/order but not category foreground/highlight colours.
- Faithful and Compact tall PNG export on the target iPhone.
- Home responsive-layout defect: Copy Another Session visually clips/overlaps History on iPhone 14 Pro Max; correction required before final acceptance.
- Final iPhone 14 Pro Max install/offline/touch/layout/settings/PNG/backup/Notes checks in the consolidated checklist.
- Backup/restore physical Files/share/restore behavior remains deferred to the consolidated final iPhone pass.
- M06-T05 physical saved-image delivery remains deferred to the consolidated final iPhone pass. Faithful/Compact preview and mobile dismissal were already PASS in the latest device evidence and do not need repeating for this correction unless a regression appears.
- M06-T05 framing is the current physical export gate: retest one Faithful and one Compact saved PNG for visible content and correct full-frame geometry. Preview and mobile dismissal remain accepted from the latest physical evidence unless they regress.
- The final retest's port-5174 certificate-serving interruption was infrastructure-only and is resolved: both the certificate endpoint and HTTPS app endpoint are now bound on `0.0.0.0` and verified over the workstation LAN address. The iPhone trust result remains pending.
- M03-T03 Shortcuts share, one-time setup, and colour-recovery proof are closed as a physical failure; the ordinary uncoloured Copy to Notes baseline remains accepted.
- E-004 B2 generated Gym Logger fixture payload passed at `d0544c5`; Phase C Shortcut append failed at `cda3a58` and is closed. The current gate is the real-session native manual-paste handoff; preserve the helper and do not infer production fidelity from fixture or captured-payload replay.
- The post-`0cb9b46` saved-image retest found fully transparent Faithful and Compact PNGs. The active correction is `orchestration/tasks/M06-T05-FIX-EXPORT-TRANSPARENT.md`; do not mark PNG delivery passed from desktop evidence.

## Escalations

- E-001 historical DSH rate-limit condition is no longer the current blocker.
- E-002 is RESOLVED: trusted HTTPS verification completed.
- E-003 is RESOLVED/CLOSED as the historical uncoloured-baseline decision; its Shortcuts branch is now physically failed and closed.
- E-004 Phase A/A2 and B2 generated-payload proof are complete. Phase C Shortcut append is the active bounded proof; no paid Developer dependency is authorized.

## Active task checkpoint

## M03-T05 current checkpoint — 2026-08-26

- M03-T04 is closed after the target-iPhone native selection-copy result:
  editable Notes table/data/order/Unicode PASS; category colours FAIL.
- M03-T05 is independently accepted for automated scope in
  `orchestration/reviews/M03-T05-NOTES-CLIPBOARD-FINGERPRINT-codex-review.md`.
- OX Alpha was dispatched through the verified Desktop wrapper but produced
  no output or delta in the bounded task window; this is recorded as a
  task-level timeout in `orchestration/reports/M03-T05-OX-ALPHA-REPORT.md`.
- The current human gate is
  `orchestration/evidence/HUMAN-VERIFICATION-M03-T05-NOTES-CLIPBOARD-FINGERPRINT.md`:
  copy a small coloured table in Apple Notes, inspect it at the exact HTTPS
  diagnostic URL, and return the downloaded JSON. Do not alter production
  `Copy to Notes` or advance E-004 until this web-visible result is reviewed.
- M06-T07 icon/share and the remaining consolidated iPhone checks remain
  deferred and batched; no device behavior is passed from desktop evidence.

## M03-T06 current checkpoint — 2026-08-26

- The product owner supplied the M03-T05 fingerprint JSON from the target
  iPhone. It is preserved byte-for-byte at
  `orchestration/evidence/fixtures/M03-T05-apple-notes-clipboard-fingerprint.json`
  and mirrored under `public/feasibility/` for the isolated proof page.
- The captured clipboard is `ok`, with `text/html` and `text/plain`. The HTML
  is 184,878 UTF-8 bytes and contains Apple Notes table markup, Apple-specific
  classes, and all five exact foreground/background colour tokens.
- M03-T05 therefore resolves the web-visible fingerprint gate in favour of a
  bounded exact replay experiment. Do not advance E-004 native inspection yet.
- The next gate is `orchestration/evidence/HUMAN-VERIFICATION-M03-T06-EXACT-NOTES-HTML-REPLAY.md`:
  tap the isolated replay button, paste into Apple Notes, and check editable
  table structure plus all five colours. No production clipboard behavior is
  changed or accepted from automation.

- Prepared `orchestration/tasks/M02-T01.md` from the approved M02 plan. It is limited to History listing/search and editable historical sessions; Copy Another Session, delete confirmation, and summary override UI remain later bounded tasks.
- Base checkpoint for the worker: `f173046`.
- M02-T01 correction attempts used: 1 / 2. The first worker wrote scoped implementation files but timed out before its report and component-level navigation/edit coverage were complete.
- M02-T01 automated checkpoint accepted by Codex: History/search/editable historical sessions; 81/81 tests, build, and LAN runtime smoke passed.
- Prepared `orchestration/tasks/M02-T02.md` from the existing M02 plan. Base checkpoint for the next worker: `41a42de`.
- M02-T02 initial OX run wrote the bounded Copy Another Session implementation but timed out without its required worker report; Codex independently found 89/91 tests because two new total-count assertions contradicted the fixture-plus-source-plus-clone test setup.
- M02-T02 initial run was rejected. Correction task `orchestration/tasks/M02-T02-FIX-01.md` is prepared; correction attempts used: 1 / 2. The one-session-per-local-date behavior remains required.
- M02-T02-FIX-01 automated checkpoint accepted by Codex: Copy Another Session/search/preview/clone/conflict flow; 91/91 tests, build, and LAN runtime smoke passed. Physical and visual acceptance remain unclaimed.
- Prepared `orchestration/tasks/M02-T03.md` from the M02 plan for whole-session deletion confirmation; summary override UI remains a later bounded M02 task.
- M02-T03 automated checkpoint accepted by Codex: whole-session delete confirmation and isolated transactional deletion; 98/98 tests, build, and LAN runtime smoke passed. Physical and visual acceptance remain unclaimed.
- Prepared `orchestration/tasks/M02-T04.md` from spec §9.2 for manual Sets/Exercises summary overrides and reset-to-calculated behavior.
- M02-T04 automated checkpoint accepted by Codex: summary overrides, arbitrary strings, persistence/remount, and reset-to-calculated; 105/105 tests, build, and LAN runtime smoke passed. Physical and visual acceptance remain unclaimed.
- Prepared `orchestration/tasks/M03-T01.md` for the minimal Apple Notes clipboard integration spike; target-iPhone paste remains a human gate.
- M03-T01 automated checkpoint accepted by Codex: deterministic clipboard payloads and rich/plain/failure handling; 125/125 tests, build, and LAN runtime smoke passed. Apple Notes interoperability is now the explicit human gate in `orchestration/evidence/HUMAN-VERIFICATION-M03-T01.md`.
- Product owner tested the reachable iPhone 14 Pro Max path and reported `Copy failed — clipboard unavailable` after pressing Copy to Notes. HV-M03-3 is recorded as FAIL; HV-M03-1 and HV-M03-2 are BLOCKED/NOT EXECUTED. The failure was routed to `orchestration/tasks/M03-T01-FIX-01.md`.
- M03-T01-FIX-01 automated correction accepted by Codex: scoped synchronous legacy plain-text fallback and activation-preserving payload construction; 140/140 tests, build, and LAN runtime smoke passed.
- FIX-01 iPhone retest completed: Copy to Notes reported the plain fallback, and the user reported correct text values, but the HTTP LAN paste was strict text with no Notes table structure, formatting, or colors. Plain content is PASS; rich formatting remained untested because HTTP could not exercise the secure clipboard path.
- Product decision E-002 recorded: do not accept plain-text-only yet. Prepare a trusted HTTPS origin for the same PWA, then repeat HV-M03-1 on the iPhone 14 Pro Max.
- Trusted HTTPS retest completed: editable Notes table and all values survived, but category text/highlight colors did not.
- M03-T01-FIX-02 and FIX-03 attempted three bounded HTML color representations. Codex independently accepted the automatable scope, but target-iPhone Apple Notes continued stripping both foreground and highlight colours.
- E-003 decision recorded: authorize one bounded non-HTML interoperability feasibility spike, then either adopt a proven low-friction route or accept uncolored editable-table paste as the documented v1 platform limitation.
- E-003 feasibility harness completed and independently verified. Product owner did not adopt the auxiliary routes; the branch is closed with uncolored editable-table paste accepted for v1.
- M03-T03 was prepared and dispatched through the configured OX Alpha wrapper. OX was silent for the bounded window with no report or delta; Codex fallback implemented the optional HTML-file share route and recorded `orchestration/reports/M03-T03-SHORTCUTS-COLOUR-FEASIBILITY.md`.
- Recorded `orchestration/evidence/M03-T03-HUMAN-SHORTCUTS-RESULT.md` and prepared `orchestration/tasks/E-004-NATIVE-NOTES-COLOUR-HELPER.md` from the authorized escalation.
- E-004 task was dispatched through the configured OX Alpha wrapper; OX was silent for the bounded window. Codex fallback completed the isolated source proof and recorded `orchestration/reports/E-004-NATIVE-NOTES-COLOUR-HELPER.md` and `orchestration/reviews/E-004-NATIVE-NOTES-COLOUR-HELPER-codex-review.md`.

## M06-T07 current checkpoint

- The three bounded M06-T07 tasks were dispatched separately through the
  verified Desktop DSH wrapper with the headless profile and
  `openrouter/stealth/ox-alpha` routing. Each timed out without usable output,
  report, or repository delta; this is recorded as a task-level worker timeout,
  not OX unavailability.
- Codex fallback implemented the Compact `Share Colour Snapshot` action,
  selected-row Paste replacement, Cut removal, and cache-busted icon URLs.
- Independent verification is green: 74/74 focused tests, 374/374 full tests,
  production build, PWA/static assertions, and diff hygiene.
- The remaining human gate is exactly the two checks in
  `orchestration/evidence/M06-T07-FINAL-HUMAN-CHECKLIST.md`: fresh Home Screen
  icon re-add and direct Compact colour-snapshot share. No desktop result is a
  physical pass. E-004 remains parked and does not block v1.

## M03-T04 reopened colour investigation checkpoint

- Product decision `Apple Notes colour recovery reopened — 2026-08-26` now
  supersedes the prior colour-limitation disposition for this bounded branch.
- First task: `orchestration/tasks/M03-T04-WEBKIT-SELECTION-COPY.md`.
- Do not change production Copy to Notes or claim colours from desktop tests.
- If the proof is ready, the next gate is one simple target-iPhone paste into
  the existing `Gym` note; only that result determines whether the fingerprint
  and native-helper branches proceed.
- The first fallback proof at `/feasibility/selection-copy.html` was retired
  after a content-contract audit found its date field could be `undefined`.
  The single live proof is `/feasibility/native-copy.html`.
- The service worker now bypasses `/feasibility` navigation and static requests
  so the experimental proof cannot be replaced by a cached app shell.

## Final automated checkpoint

- M05-T01 backup/restore automated scope accepted by Codex: 43/43 focused tests, 262/262 full suite, passing build, diff audit, and trusted HTTPS runtime smoke. Review: `orchestration/reviews/M05-T01-BACKUP-RESTORE-01-codex-review.md`.
- M06-T03 automated release-readiness scope accepted: 2/2 focused tests, 350/350 full suite, passing build, diff audit, trusted HTTPS runtime smoke, static deployment audit, documentation, and final-device checklist. Review: `orchestration/reviews/M06-T03-RELEASE-READINESS-codex-review.md`.
- OX was dispatched twice through the verified Desktop DSH headless wrapper for M06-T03, but both invocations ended without a worker report or repository delta. The bounded task was completed from the authoritative task file and independently verified; this worker execution issue does not alter product acceptance.
- Current gate: `orchestration/evidence/HUMAN-VERIFICATION-FINAL-IPHONE14-PROMAX.md` — one saved-image-only retest remains open after the PNG delivery correction.
- M06-T05 and M03-T03 automated scope are accepted, with M03-T03 physically failed/closed. E-004 is parked; next action is the consolidated human-only PWA/iPhone 14 Pro Max pass at `https://192.168.1.49:4173/`.
- M06-T05 saved-image delivery correction in `orchestration/reviews/M06-T05-FIX-EXPORT-DELIVERY-codex-review.md` was rejected by the target device. The next bounded correction is `orchestration/tasks/M06-T05-FIX-EXPORT-TRANSPARENT.md`; after independent verification, return one saved-image-only physical retest.
- The transparent-pixel correction is recorded in `orchestration/reviews/M06-T05-FIX-EXPORT-PIXEL-TRACE-codex-review.md`; after independent verification, return one saved-image-only physical retest. Do not repeat preview or dismissal.
- The alternate raster correction is recorded in `orchestration/reviews/M06-T05-FIX-EXPORT-ALTERNATE-RASTER-codex-review.md`; return one saved-image-only physical retest. Do not repeat preview or dismissal unless they regress again.
- DSH/OX recovery diagnostic on 2026-08-26 is recorded in `orchestration/reports/OX-DSH-RECOVERY-2026-08-26.md`: fresh unpatched smoke passed in 16.65s, fresh patched smoke passed in 25.33s, and a fresh larger multi-file worker review timed out at 90.08s with empty stdout/stderr. Classify this as a worker-task hang/timeout, not OX unavailability; preserve the verified Desktop wrapper route and keep fallback emergency-only.
- M06-T06 accepted automated checkpoint: `orchestration/reviews/M06-T06-ACTUAL-SESSION-MIGRATION-codex-review.md`; current human gate remains `orchestration/evidence/HUMAN-VERIFICATION-FINAL-IPHONE14-PROMAX.md`.
- New product evidence: `orchestration/evidence/HUMAN-VERIFICATION-M06-T05-EXPORT-DELIVERY-RETEST.md` now records PNG visibility PASS but framing/crop FAIL after `9cf5286`; do not treat the export branch as physically accepted.
- New automated evidence: `orchestration/evidence/M06-T05-FIX-EXPORT-FRAMING-AUTOMATED.md` records the independently verified geometry correction; physical acceptance remains intentionally unclaimed.

## M03-T06 disposition and E-004 native inspection checkpoint

- M03-T06 is closed as a genuine target-iPhone colour-fidelity failure. The
  exact Apple Notes-origin HTML replay preserved the editable table, order,
  values, summary, notes, and Unicode but stripped all five category colours.
  No further HTML/CSS/WebKit colour experiments are authorized.
- E-004 is now the active bounded colour-recovery proof. The existing isolated
  SwiftUI helper was extended with `Inspect Notes Clipboard`,
  `Replay Captured Clipboard`, report/raw-payload sharing, first-item
  pasteboard type order, item-provider identifiers, byte sizes, SHA-256 hashes,
  and a 10 MB raw-payload safety cap. Production PWA and normal `Copy to
  Notes` remain untouched.
- Codex independently ran the native harness: 18/18 checks pass after adding
  the explicit pasteboard type-order contract. The PWA regression suite remains
  410/410, `npm run build` passes, `git diff --check` passes, and no `src/` or
  `public/` files changed in this checkpoint.
- The fresh E-004 OX Alpha task was dispatched through the verified DSH Desktop
  wrapper with the configured `openrouter` / `stealth/ox-alpha` routing. It
  produced no stdout, stderr, report, or delta during the bounded window and
  was classified as a worker-task timeout. This does not classify OX or the
  wrapper as unavailable; the Codex fallback is recorded separately.
- `.github/workflows/e004-native-helper.yml` is prepared for a manual hosted
  macOS/Xcode build. No IPA, compile result, install result, or Apple Notes
  colour result is claimed until that workflow actually produces an artifact
  and the target iPhone is tested.
- Hosted workflow run `32924739747` reached Xcode but failed before compilation
  because the target build incorrectly supplied `-derivedDataPath` without a
  scheme. The workflow was corrected to use the target build's normal runner
  DerivedData location; rerun is required before the helper is ready for
  installation.
- Hosted workflow run `32924817788` reached the Xcode build graph but failed
  because the project referenced its nested Swift/resource files from the
  wrong directory. The project references now use the actual nested paths;
  rerun is required for a real compile result.
- Hosted workflow run `32924910818` compiled the helper sources far enough to
  expose a Swift actor-isolation error in the replay action. The helper view is
  now explicitly main-actor isolated; rerun is required to verify compile and
  packaging.
- Hosted workflow run `32924992866` successfully compiled the Swift helper but
  failed in packaging because the workflow searched only global DerivedData;
  this target writes to the repository-local `build/Release-iphoneos` path.
  The lookup now checks both locations; rerun is required to verify artifact
  packaging and upload.
- Hosted workflow run `32925095555` passed compilation, unsigned IPA packaging,
  and artifact upload. Codex downloaded the artifact and independently verified
  the IPA ZIP contains `Payload/GymLoggerPasteboardHelper.app`, the bundled
  `latest-session.example.json`, and `Info.plist`. This proves the hosted build
  route, not iPhone installation or Apple Notes behavior.
- E-004 is now accepted for exact native capture/replay. The product owner
  reported that the helper was installed on the iPhone 14 Pro Max and that
  replay preserved editable table structure, all five colours, data/order,
  and Unicode. This does not prove a newly generated Gym Logger payload.
- Current E-004 gate:
  `orchestration/evidence/HUMAN-VERIFICATION-E-004-NATIVE-CLIPBOARD-INSPECTION.md`.
  The next bounded task is to productize or honestly document the handoff from
  Gym Logger data to the proven native helper; no PWA generated-colour claim is
  accepted until a separate target-iPhone paste proves it.

## E-004 native replay result — 2026-08-26

- The product owner supplied a target-iPhone result: Inspect Notes Clipboard
  captured a coloured Apple Notes table and Replay Captured Clipboard pasted it
  back with editable table structure, all five colours, correct data/order,
  and Unicode intact.
- This closes the native capture/replay feasibility question as PASS. It does
  not establish that the helper can synthesize a new Gym Logger workout in the
  same native format, or that the PWA can launch/hand off to it automatically.
- Preserve the existing PWA Copy to Notes path and the isolated helper. Queue a
  separate bounded productization feasibility task before changing production
  clipboard behavior.

## M03-T07 productization disposition — 2026-08-26

- The bounded productization review found no safe production change that turns
  exact captured-Notes replay into a generated Gym Logger coloured export.
- A PWA JSON/share handoff would move data but would not prove a colour-bearing
  native Notes payload. Transforming Apple-private payloads without the raw
  capture and a generated-workout target-iPhone proof would be guesswork.
- The earlier M03-T07 no-production-change disposition remains documented in
  `orchestration/feasibility/E-004-native/PRODUCTIZATION.md`; its isolated
  native branch is now reopened for Phase A only.
- Keep normal editable uncoloured `Copy to Notes`, Compact colour snapshot, and
  the isolated native helper. Do not add a misleading coloured Notes export
  button.

## M03-T07 Phase A reopening — 2026-08-26

- The exact native capture/replay result remains accepted: editable table,
  five colours, data/order, and Unicode were reported PASS on the iPhone 14 Pro
  Max. This is still only captured-payload replay, not generated Gym Logger
  export.
- The product owner explicitly reopened one bounded Phase A investigation:
  identify the minimum colour-bearing native representation by replaying the
  fresh captured item once per non-empty type with that type removed.
- `ClipboardInspector` now discovers readable non-empty captured type
  identifiers and supports `Replay without <type>` while preserving all other
  captured representations and item order. The helper variant label was
  independently corrected and verified.
- Codex independently verified the isolated native harness at 20/20 checks,
  the PWA suite at 410/410 tests, `npm run build`, `git diff --check`, and no
  `src/` or `public/` production changes. The DSH `/agent-teams` implementation
  attempt timed out with no delta; the configured wrapper/plugin remain
  available and the narrow fallback is recorded.
- Historical Phase A gate: install the freshly rebuilt helper, capture a small
  coloured Notes table, inspect it, then run each displayed removal variant and
  paste it back into Notes. Record table editability, five colours, values/order,
  and Unicode in
  `orchestration/evidence/HUMAN-VERIFICATION-E-004-PHASE-A-REMOVAL-VARIANTS.md`.
- The fresh helper build is ready from hosted macOS/Xcode workflow
  `32946246114`; Codex verified the unsigned IPA contents. This does not claim
  installation or Apple Notes behavior.
- Do not start generated Gym payload synthesis or Shortcut append until this
  Phase A result identifies a viable minimum representation. Keep the PWA
  `Copy to Notes` path unchanged.

## M03-T07-A2 single-representation sufficiency — 2026-08-26

- Phase A device evidence is accepted: every tested `Replay without <type>`
  variant preserved editable table structure, all five colours, content, and
  Unicode. No single type was uniquely necessary in the complete captured set.
- The next bounded experiment is single-type sufficiency. The helper now
  exposes `Replay ONLY <type>` for each unique readable, non-empty captured
  representation and writes only that type for every captured item.
- The helper rejects blank, missing, or unreadable requested types instead of
  silently replaying the full capture, and preserves captured item order.
- Codex independently verified the native contract at 23/23 checks, the PWA
  suite at 410/410 tests, `npm run build`, `git diff --check`, and no `src/` or
  `public/` production changes. A fresh DSH `/agent-teams` implementation
  attempt timed out with no delta; the bounded fallback is recorded.
- Current human gate: install the fresh A2 helper build, capture the small
  coloured Notes table, tap Inspect, then run each displayed `Replay ONLY`
  variant—prioritizing `public.rtf`, `com.apple.flat-rtfd`, `public.html`,
  `com.apple.webarchive`, `com.apple.notes.richtext`, and
  `public.utf8-plain-text` when present. Record table editability, all five
  colours, values/order/notes, and Unicode in the Phase A evidence file.
- The fresh A2 helper build is ready from hosted macOS/Xcode workflow
  `32952585740`; Codex verified its unsigned IPA contents. This does not claim
  installation or Apple Notes behavior.
- Do not start generated Gym payload synthesis or Shortcut append until A2
  identifies at least one sufficient representation or closes the branch with
  evidence. Keep the PWA `Copy to Notes` path unchanged.

## M03-T07-B generated Gym Logger flat-RTFD proof — 2026-08-26

- Phase A/A2 is complete. The target iPhone reported `com.apple.flat-rtfd`
  alone preserved an editable table, all five category colours, correct
  content/order, and Unicode; public HTML/WebArchive/RTF only preserved the
  table, and plain text preserved neither table nor colours.
- Phase B is now authorized. `NativePayloadBuilder` generates a new payload
  from the bundled canonical `latest-session.example.json` fixture, packages
  the generated coloured `TXT.rtf` using Foundation `FileWrapper`, and exposes
  a proof action that places only `com.apple.flat-rtfd` on the pasteboard.
- Codex independently verified the native contract at 27/27 checks, the PWA
  suite at 410/410 tests, `npm run build`, `git diff --check`, and no `src/` or
  `public/` production changes. The fresh DSH `/agent-teams` implementation
  attempt timed out with no delta; the narrow fallback is recorded.
- Current human gate: install the fresh Phase B helper build, tap
  `Copy Generated Gym Session (flat-RTFD only)`, paste into a temporary Apple
  Notes Gym note, and record the generated-workout fidelity checklist in
  `orchestration/evidence/HUMAN-VERIFICATION-E-004-PHASE-B-GENERATED-FLAT-RTFD.md`.
- Do not start Phase C Shortcut append or alter production `Copy to Notes`
  until the generated flat-RTFD paste passes on the target iPhone.
- The generated Phase B helper build is ready from hosted macOS/Xcode workflow
  `32956758287`; Codex verified the unsigned IPA contents. This does not claim
  installation or Apple Notes behavior.

## M03-T07-B2 Apple Notes-shaped generated flat-RTFD proof — 2026-08-26

- The Phase B target-iPhone result was recorded at `934ddd7`: the generated
  flat-RTFD pasted as an editable table with correct content but stripped all
  five category colours. Phase C Shortcut append is not authorized.
- B2 is a bounded generated-payload correction. It uses the canonical Gym
  Logger fixture for all values and replaces generic `\\highlightN` /
  `\\chcbpatN` controls with the recorded Apple Notes-shaped controls:
  `\\cf3`/scheme `3` orange, `\\cf4`/scheme `5` blue,
  `\\cf5`/scheme `4` mint, `\\cf6`/scheme `1` purple, and
  `\\cf7`/scheme `2` pink, plus explicit Apple highlight resets.
- The generated RTF also includes Cocoa/Apple header metadata, an expanded
  colour table, font metadata, and table nesting metadata. It is packaged as
  a fresh `TXT.rtf` in a flat-RTFD container; it does not replay or patch
  captured Notes bytes and still places only `com.apple.flat-rtfd` on the
  proof pasteboard.
- The correctly patched DSH/OX Alpha B2 task produced no output or delta in
  the bounded approximately 150-second window. A prior fresh OX smoke task
  returned `OX_SMOKE_OK`, so this is recorded as a task-level worker timeout,
  not OX unavailability. Codex fallback implementation and report are
  preserved in `orchestration/reports/M03-T07-B2-APPLE-NOTES-SHAPED-FLAT-RTFD-OX-ALPHA-REPORT.md`.
- Independent Codex verification is green: native harness PASS, full PWA
  suite 410/410, production build PASS, `git diff --check` PASS, and no
  production `src/` or `public/` changes.
- Current human gate: the hosted macOS/Xcode helper build is ready from run
  `32959270742`; install it on the iPhone 14 Pro Max, tap `Copy Generated Gym Session
  (flat-RTFD only)`, paste into a temporary Apple Notes note, and verify an
  editable table, all five colours, content/order/summary/notes, and Unicode.
  No device PASS is inferred from desktop/source evidence.
- Phase C remains blocked until the B2 generated-workout result passes.

## M03-T08 Phase C native flat-RTFD Shortcut append proof — 2026-08-26

- B2 core feasibility passed on the target iPhone at `d0544c5`: a freshly
  generated Gym Logger workout pasted as an editable Apple Notes table with
  all five row/category colours and correct content. The uncoloured legend
  labels are a narrow polish item, not a reason to reopen B2.
- The bounded implementation adds Apple-highlight colouring to the five
  legend labels and adds a separate helper action that writes only the proven
  `com.apple.flat-rtfd` representation before opening
  `shortcuts://run-shortcut?name=Gym%20Logger%20to%20Gym&input=clipboard`.
  Existing capture/replay/sufficiency controls and the PWA path remain intact.
- The configured DSH Desktop `/agent-teams` task produced no output or delta in
  the bounded 150-second window. This is recorded as a task-level timeout; the
  Codex fallback is independently verified and does not claim OX-authored code.
- Current human gate: install the new hosted helper, ensure a one-time Shortcut
  named `Gym Logger to Gym` contains only `Append Shortcut Input to Gym`, tap
  `Generate & Run Gym Logger to Gym Shortcut`, and inspect the existing `Gym`
  note for an editable table, five legend/row colours, correct content/order,
  summary, notes, and Unicode. No Shortcut append success is inferred until
  this physical result is recorded.

## M03-T09 real production-session native manual-paste handoff — 2026-08-26

- Phase C is closed after target-iPhone evidence at `cda3a58`: Shortcut append
  preserved table structure but stripped colours and concatenated the legend.
- The bounded replacement keeps one manual Paste as an explicit user action.
  The PWA serializes the selected/current session as a versioned JSON handoff;
  the native helper validates it, generates Apple Notes-shaped flat-RTFD, and
  attempts to open Notes.
- The real-session route is separate from the bundled Sunday fixture proof and
  must not change the locked Tuesday `actual-2026-08-25` latest-session
  migration behavior.
- Codex fallback implementation is independently verified at 412/412 PWA
  tests, passing production build, native contract audit, and diff hygiene.
  Hosted macOS/Xcode packaging is required for this changed Swift helper.
- Current human gate: install the newest hosted helper, open the real Tuesday
  session in the PWA, tap `Prepare Coloured Notes Copy`, paste once into the
  existing `Gym` note, and record the checklist in
  `orchestration/evidence/HUMAN-VERIFICATION-M03-T09-NATIVE-MANUAL-PASTE-HANDOFF.md`.
