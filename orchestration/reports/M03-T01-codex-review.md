# M03-T01 Codex review

Date: 2026-08-24

## Decision

**ACCEPTED for automated engineering scope; HUMAN_REVIEW_REQUIRED for Apple Notes interoperability.**

The clipboard spike is implemented and independently verified as a deterministic local payload/action flow. No automated result is being treated as proof that iPhone Safari or Apple Notes preserves rich structure or colors.

## Independent evidence

- `npm test -- --run --reporter=dot`: **125/125 passed**, 13 test files.
- `npm run build`: **PASS**, TypeScript compilation and Vite production build; 50 modules transformed.
- `git diff --check`: **clean**.
- Runtime smoke after starting the dev server: `http://localhost:5173/` and `http://192.168.1.49:5173/` returned HTTP 200 with title `Gym Log`.
- Scoped source audit found no network calls or debug residue.

## Scope accepted

Copy to Notes entry point, deterministic date/legend/summary/table/notes payload order, escaped HTML, plain-text category fallback, preservation of arbitrary values/highlights/Skip/overrides/notes, rich→plain→failure outcome handling, save flushing before export, and focused success/failure tests.

## Exact open human/product gate

Complete `orchestration/evidence/HUMAN-VERIFICATION-M03-T01.md` on the target **iPhone 14 Pro Max** using a reliably reachable build:

1. HV-M03-1: real Safari Copy to Notes → Apple Notes paste; record whether structure, row/cell order, all free-form text, colors, foreground text, light/dark readability, summary override, and multiline notes survive.
2. HV-M03-2: verify the plain fallback representation, including the leading Category column and date/legend/summary/table/notes order.
3. HV-M03-3: verify honest UI states for rich success, plain-only fallback, and denied/unavailable clipboard.
4. HV-M03-4: record PASS/FAIL per item with screenshots and update the evidence/state bridge.

The previous M01 FIX-05 physical checks remain BLOCKED/DEFERRED because the temporary LAN runtime was unreachable. If this same reachability issue occurs, record the M03 gate as BLOCKED/DEFERRED rather than passing it.

## Not claimed

No Apple Notes interoperability, rich structure/color survival, physical-iPhone behavior, visual acceptance, PNG export, automatic append, RTF/native strategy, PWA installability, or M03 milestone completion is claimed. M03-T02 PNG export remains blocked behind this gate/task sequence.
