# Gym Logger requirements matrix

Source precedence: finalized `GYM_LOGGER_SPEC.md` first, supplied references/fixture second, Build Gym Logger conversation export third. Status values are `PLANNED`, `IN_PROGRESS`, `VERIFIED`, `DEFERRED`, or `ESCALATE`.

| ID | Requirement / acceptance intent | Source | Milestone | Status | Evidence |
|---|---|---|---|---|---|
| REQ-001 | Preserve the existing clone/edit/export-to-Notes workflow. | Spec §§1-2 | M01-M06 | VERIFIED (automated; device pending) | M06-T03 review; final device gate |
| REQ-002 | Apple Notes remains canonical; app is a local convenience copy. | Spec §2.2 | M01-M06 | VERIFIED (policy) | DECISIONS.md; final device gate |
| REQ-003 | No account, backend, cloud sync, analytics, AI, timers, checklists, programs, streaks, or fitness-platform features. | Spec §§2.3, 32 | All | VERIFIED (source/build audit) | M06-T03 review |
| REQ-004 | iPhone-first installable PWA with native pivot only for a proven blocked capability. | Spec §3 | M01/M06 | VERIFIED (automated; device pending) | M06-T01 manifest/service worker review; final install gate |
| REQ-005 | Home shows Today, Last Workout, Start/Continue, Copy Another, History, Settings. | Spec §§4.1, 13 | M02 | VERIFIED (automated; device pending) | M06-T02 review; final visual gate |
| REQ-006 | Start today's session uses local phone date and creates exactly one session. | Spec §§4.2, 27.1-27.3; A1-A4 | M01-M02 | VERIFIED (automated; device pending) | clone/App tests; final device gate |
| REQ-007 | Clone rows, order, text, and highlights; do not blank Reps/Weight. | Spec §§4.2, 12.3; A2 | M01-M02 | VERIFIED (automated) | M02-T02-FIX-01 Codex review; 91/91 |
| REQ-008 | Skip remains plain text, is not auto-dimmed/deleted, and counts in totals. | Spec §8; D1-D5 | M01-M05 | VERIFIED (automated; device pending) | export/summary tests; final device gate |
| REQ-009 | Summary supports calculated values plus manual overrides including 40/39 fixture mismatch. | Spec §9; E1-E3 | M01-M02 | VERIFIED (automated) | M02-T04 Codex review; 105/105 |
| REQ-010 | All five visible columns accept arbitrary strings without normalization. | Spec §§6.1-6.3, 27.6-27.7; B1-B5 | M01-M04 | VERIFIED (automated) | M01 evidence; 32/32 |
| REQ-011 | Row-level color system: Arms orange, Back purple, Chest mint, Delts blue, Legs pink, None. | Spec §5; references/IMG_5550-5554 | M01-M04 | VERIFIED (automated; device pending) | FIX-05 exact five-entry legend; none internal; final device gate |
| REQ-012 | Dark Notes-like presentation uses restrained background, subtle grid, readable colored text/highlights. | Spec §§5.2, 22; IMG_5501-5502 | M01-M04 | VERIFIED (automated; device pending) | FIX-04 source audit; HV-06/HV-07 |
| REQ-013 | Tap cell edits immediately with normal text behavior. | Spec §7.1; C1 | M01 | VERIFIED (automated) | M01 evidence; App tests |
| REQ-014 | Apple Notes-like row handle selects a row; selected treatment is clear. | Spec §7.2; C2-C3 | M01 human-gate correction / M04 | VERIFIED (automated; device pending) | FIX-04 tests; HV-04/HV-05 |
| REQ-015 | Selected row actions support add above/below, duplicate, copy/paste, colour, and delete. Paste replaces the selected row contents; Cut is intentionally omitted as redundant with Delete. | Spec §§7.3-7.6; C4-C9; 2026-08-26 product decision | M01 human-gate correction / M04 / M06-T07 | VERIFIED (automated; device pending) | M06-T07 review; sessionInteraction tests; final device gate |
| REQ-016 | 40-row table remains responsive; target stress is 100 rows. | Spec §25; C10 | M01/M04/M06 | VERIFIED (automated; device pending) | M06-T03 releaseReadiness.test.ts; final device gate |
| REQ-017 | Notes area below table accepts arbitrary text and travels with export. | Spec §10 | M01/M04-M05 | VERIFIED (automated; device pending) | export/persistence tests; final device gate |
| REQ-018 | History is reverse chronological, searchable locally, and old sessions editable. | Spec §11; F1-F5 | M02 | VERIFIED (automated; device pending) | M02-T01-FIX-01 review; 81/81 tests |
| REQ-019 | Deleting an app session confirms and explicitly says Apple Notes is unaffected. | Spec §11.4; F6 | M02 | VERIFIED (automated) | M02-T03 Codex review; 98/98 |
| REQ-020 | IndexedDB persistence with immediate/debounced autosave survives termination/reopen. | Spec §§17.2-17.4; B6, G2 | M01 | VERIFIED (automated; device pending) | remount test; HV-02/HV-03 |
| REQ-021 | Offline shell is cached and core use does not require network. | Spec §17; G1-G5 | M01/M06 | VERIFIED (automated; device pending) | M06-T01 service-worker tests/review; final airplane-mode gate |
| REQ-022 | Request persistent storage where appropriate and surface non-destructive storage errors. | Spec §§17.3, 27.9 | M01/M06 | VERIFIED (source/test) | App bootstrap; build/tests; device pending |
| REQ-023 | Rich Copy to Notes includes date, legend, summary, table, notes with HTML and plain fallback. | Spec §15; H1-H6 | M03/M05 | VERIFIED (automated; device pending) | M03 reviews; trusted HTTPS editable table/data/order evidence |
| REQ-024 | Never claim rich Notes structure/color works without target-iPhone paste evidence. | Spec §§15.4-15.6, 32 | M03 | PARTIALLY VERIFIED (captured native replay PASS; generated Gym payload pending) | M03-T06 exact HTML replay: editable table/data/order PASS, colours FAIL; E-004 exact captured Notes replay: editable table/data/order/Unicode/colours PASS; generated Gym Logger native payload remains unproven |
| REQ-025 | Faithful and Compact full-session PNG export handle 40+ rows, preserve colors and notes. | Spec §14; I1-I6 | M03/M05/M06 | VERIFIED (automated; device pending) | M06-T05 framing review; M06-T07 share review; final icon/share device gate |
| REQ-026 | Compact export hides Skip only when all Skip cells are empty. | Spec §§14.1, 30; D4-D5 | M05 | VERIFIED (automated; device pending) | image/export tests; final device gate |
| REQ-027 | Backup JSON includes schema, sessions, rows, highlights, settings, metadata and restores exactly. | Spec §18; J1-J5 | M03/M05/M06 | VERIFIED (automated; device pending) | M06-T04 review; 45 focused / 352 full; final device gate |
| REQ-028 | Generic historical import is deferred; do not clean or invent data from `text 2.txt`. The explicit owner-supplied Tuesday reference is handled separately by REQ-037. | Spec §19, §35 | M07 | DEFERRED | — |
| REQ-029 | IDs use UUIDs; local date is separate from primary key; positions normalize to 0..n-1. | Spec §20 | M01 | VERIFIED (automated) | schema/seed/clone tests |
| REQ-030 | Suggested stack is React + TypeScript + Vite + IndexedDB/Dexie + small CSS/PWA layer. | Spec §21 | M01 | VERIFIED (automated) | build/runtime |
| REQ-031 | No heavy UI framework or remote fonts/images; no unnecessary animation/CPU/network work. | Spec §§17, 21, 25 | All | VERIFIED (static audit) | M06-T03 review |
| REQ-032 | Theme supports System/Dark/Light; export defaults dark; image style supports Compact/Faithful. Compact is the preferred initial export style; Faithful remains available. | Spec §§14, 22-23; 2026-08-26 product decision | M05-M06/M06-T07 | VERIFIED (automated; device pending) | M06-T02 review; M06-T07 review; 374 full |
| REQ-033 | Touch targets are comfortable, color is not the only selected/destructive signal, and keyboard does not hide edits. | Spec §26 | M04-M06 | VERIFIED (automated; device pending) | interaction/style tests; final device gate |
| REQ-034 | Weird values, empty rows, spelling, date edits, duplicate starts, quota errors do not crash or silently mutate data. | Spec §27 | M01-M06 | VERIFIED (automated; device pending) | persistence/backup/startup-failure suites; final device/storage gate |
| REQ-035 | No exercise identity system, autocomplete, analytics, or exercise-history dashboard in v1. | Spec §28, §32 | All | VERIFIED (source audit) | M06-T03 review |
| REQ-036 | Every accepted task has a Codex review, actual diff inspection, tests/build/runtime evidence, and known-good git checkpoint. | orchestration/README | All | VERIFIED | M06-T03 review and checkpoint |
| REQ-037 | The owner-supplied Tuesday 25 Aug workout can be imported once into an existing device without duplicates, data loss, or string normalization, and can seed the next session clone. | Product handoff and `references/ACTUAL_SESSION_2026-08-25.json` | M06 | VERIFIED (automated; device pending) | M06-T06 migration review/evidence |

## Pilot disposition

M01 remains limited to its first-slice intent, with FIX-05 physical checks explicitly deferred rather than passed. M02-T01 through M02-T04, M03 clipboard/image work, M05 backup/export, M06 PWA/settings/release-readiness, and M06-T07 final-polish work are accepted for automated scope where their reviews say so. The remaining v1 device gate is limited to a fresh Home Screen icon install and direct Compact colour-snapshot share check; no requirement may be marked physically verified by desktop evidence alone.

The normal editable Notes-table path remains accepted for table/data/order, but Apple Notes colour transfer is not accepted as solved. M03-T04's distinct WebKit native selection-copy route physically failed on colours, so M03-T05 must fingerprint the web-visible Notes clipboard before E-004 native inspection is advanced.
