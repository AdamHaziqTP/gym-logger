# M06-T06 — Actual Tuesday session migration

Date: 2026-08-26  
Status: **ACCEPTED — Codex-verified automated scope; physical device migration remains pending**

## Outcome

The product-owner supplied Tuesday 25 Aug 2026 workout is now an authoritative repository reference and a one-time live IndexedDB migration. The migration uses the stable ID `actual-tuesday-25-aug-2026` and the marker `migration.actual-session-2026-08-25.v1`.

It inserts the 40-row, 40-set workout without replacing Sunday history or unrelated metadata. Reopening the app after the marker is written is a no-op. An unidentified Wednesday record is deliberately preserved; the existing History → session → Delete Session flow remains the smallest safe cleanup path if that record is confirmed as a development clone.

The production `AppRoot` enables the migration. Existing test renders keep migrations opt-in so the long-standing seed/fixture tests remain isolated; the migration itself has dedicated coverage.

The supplied 1024px Gym Logger icon was also installed as the PWA 512px, 192px, and Apple-touch-icon assets, with the original preserved at `references/gym_logger_app_icon_1024.png`.

## Codex → OX invocation

- Task: `orchestration/tasks/M06-T06-ACTUAL-SESSION-MIGRATION.md`
- Launcher: `C:\Users\adam4\AppData\Roaming\DSH Desktop\host-commands\desktop\bin\dsh.cmd`
- Profile: `headless`
- Active patch: `orchestration/product-sync/generated/active-worker.patch.yml`
- Routing: `openrouter` / `stealth/ox-alpha`
- Result: the fresh task produced no stdout, stderr, report, or repository delta during the bounded ~95-second window and was stopped. This is recorded as a concrete worker-task hang/timeout, matching the existing diagnostic classification; the wrapper, provider, and patched smoke route remain verified.

## Codex implementation and independent verification

- Added `src/data/actualSessionMigration.ts` with a transactional, marker-guarded import.
- Added exact source data at `references/ACTUAL_SESSION_2026-08-25.json`.
- Wired the migration into the production root without changing normal clone policy.
- Added focused once-only, exact-data, preservation, Wednesday-safety, and next-session clone coverage.
- Updated `createDb` with an optional database name solely to isolate migration tests; the default database name is unchanged.
- Applied the supplied Gym Logger icon to all PWA icon sizes.

Verification:

- Focused migration tests: **3/3 PASS**.
- Full suite: **365/365 PASS** across 32 test files.
- Production build: **PASS** (`tsc` + Vite; service-worker stamp generated).
- HTTPS runtime: **PASS** — `https://192.168.1.49:4173/` and `/manifest.webmanifest` returned 200.
- Certificate endpoint: **PASS** — `http://192.168.1.49:5174/gym-logger-dev.cer` returned 200 over the LAN address.
- Diff hygiene: **PASS** (`git diff --check`).

## Deferred / not claimed

- The migration has not been physically observed in the iPhone's existing IndexedDB from this workstation; that remains part of the consolidated iPhone pass.
- No unidentified Wednesday session was deleted or silently demoted. If one exists and is confirmed as the known test clone, use the existing History delete flow before the next workout; otherwise it remains user data.
- PNG/Notes colour behavior was not reopened or changed.
