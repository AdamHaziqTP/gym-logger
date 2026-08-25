# M06-T05 — PNG framing correction

Date: 2026-08-26  
Status: **ACCEPTED — Codex-verified automated scope; target-iPhone retest required**

## Problem

The latest target-iPhone evidence showed that Canvg had solved the earlier
transparent-output failure: Faithful and Compact PNGs contained visible
content. However, the content occupied only the logical-size top-left region
of the supersampled delivery canvas, leaving excessive unused black space.

## Bounded correction

`src/domain/pngExport.ts` now applies the selected raster scale to the exact
delivery canvas context before Canvg renders the existing standalone SVG. This
keeps the working Canvg renderer, SVG layout, visible-pixel guard, PNG
serialization, share/save delivery, offline-first behavior, and preview path
unchanged. No server, native dependency, or SVG-image `drawImage` bridge was
introduced.

## OX invocation

- Launcher: `C:\Users\adam4\AppData\Roaming\DSH Desktop\host-commands\desktop\bin\dsh.cmd`
- Profile: `headless`
- Active patch: `orchestration/product-sync/generated/active-worker.patch.yml`
- Routing: `openrouter` / `stealth/ox-alpha`
- Result: no usable stdout, stderr, report, or bounded completion after
  approximately 90 seconds; the fresh process was stopped and classified as a
  task-level worker timeout. This does not invalidate the previously verified
  wrapper/smoke route.
- The timeout also left an unreported test-file rewrite. Codex audited it,
  retained the useful App integration coverage, and corrected its assumptions
  against the canonical remote session reference before acceptance.

## Independent verification

- PNG framing-focused tests: **15/15 PASS**.
- Migration integration tests: **12/12 PASS**.
- Combined focused tests: **27/27 PASS**.
- Full suite: **374/374 PASS** across 32 test files.
- Production build: **PASS** (`tsc` + Vite; service-worker stamp generated).
- HTTPS runtime: **PASS** — `https://192.168.1.49:4173/` returned 200.
- Certificate endpoint: **PASS** —
  `http://192.168.1.49:5174/gym-logger-dev.cer` returned 200 over LAN.
- Diff hygiene: **PASS** (`git diff --check`).

## Handoff

Return to the existing consolidated iPhone 14 Pro Max checklist. Retest one
Faithful and one Compact saved PNG and confirm that each image is visible and
properly framed, then continue the remaining deferred device checks. Desktop
verification must not be recorded as physical acceptance.
