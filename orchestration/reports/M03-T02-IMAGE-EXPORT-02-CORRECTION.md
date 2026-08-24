# M03-T02-IMAGE-EXPORT-02-CORRECTION — export verification & contracts repair: worker report

**Worker:** OX Alpha
**Task:** `orchestration/tasks/M03-T02-IMAGE-EXPORT-02-CORRECTION.md`
**Result:** COMPLETE for the automated/engineering scope — focused export suite
went from **10 passed / 6 failed → 17 passed / 0 failed**, full suite
**219/219 tests across 19 files**, passing production build (`tsc && vite
build`, 53 modules), clean `git diff --check`. Production export behavior was
NOT changed: XML escaping, row order, colour mapping, summary override,
multiline notes, and Compact Skip-column rules are byte-for-byte untouched.
All six failures were defects in the test suite itself, exactly as Codex
listed. **This report does NOT claim physical PNG readability or iOS
share/save acceptance — those remain human-only device evidence for the
consolidated final pass.**

---

## 1. Diagnosis (why the suite failed)

The renderer (`src/domain/imageExport.ts`) intentionally wraps long/multiline
values into several `<text>` fragments — that is how it guarantees a tall
40+ row image without truncation while staying deterministic (no DOM text
measurement). EXPORT-01's tests asserted several complete long values as one
contiguous string in the SVG, which can never hold for wrapped values:

| # | Codex finding | Actual failure observed |
|---|---|---|
| 1 | Fixture-order/completeness tests require a complete long row string contiguously | `"Recline curl bench 30° IR uni"` (29 chars) wraps at Faithful's ~24-char Exercise line → not found as one text node |
| 2 | "both styles carry the complete session" same defect | Same value missing from the collected text list |
| 3 | Compact width test hard-codes Faithful's 24px margin | `expected 736 to be 712` — Compact's content width is `760 − 12·2 = 736` |
| 4 | Escaping test requires the escaped img tag contiguous | Skip cell wraps at its internal spaces → escaped string split across fragments |
| 5 | Preservation test requires hostile values contiguous in decoded SVG | `'SLDL (semi sumo?) {brace} \\ 30° IR'` wraps → containment fails |
| 6 | Wrap-primitive test expects `hijl` | Renderer correctly returns `["abc", "defg", "hijk", "l mn"]`; expectation was wrong |

Plus 5 `tsc` errors blocking `npm run build`: `TS2459` (`WorkoutSession`
imported from `imageExport`, which only imports it locally — it lives in
`domain/types`), two `TS7006` implicit-any rows, one `TS6133` unused `texts`,
one `TS7053` untyped `HIGHLIGHT_TOKENS` indexing (downstream of TS2459).

## 2. Files changed

| File | Change |
|---|---|
| `src/tests/imageExport.test.ts` | Corrected per §3. Only file touched. |

No production source, component, style, config, or other test file was
modified by this correction. Pre-existing working-tree modifications
(`SessionView.tsx`, `styles.css`, `orchestration/product-sync/*`,
`state/STATE.md`, other new EXPORT-01 files) were present before this task
started and were not touched.

## 3. Corrections applied (test-side only)

1. **Wrapping-aware verification primitive.** New helpers collect each body
   cell's emitted fragments *geometrically*: text elements whose x/y fall
   inside `bodyRows[rowIndex] × column` rectangle (column range taken
   relative to the header-band frame, since element coordinates carry the
   shared outer margin). Nothing else is painted inside a cell's body rect,
   so joining these fragments reconstructs that cell's wrapped content in
   emission order. Losslessness is asserted as
   `withoutWhitespace(rebuilt) === withoutWhitespace(source)`: the wrapper
   consumes characters ONLY at its own break points (a space or explicit
   newline), so equality after dropping whitespace proves every visible
   character survived exactly once, in order. No wrapping was disabled and no
   value truncated to make this pass.
2. **40-row fixture test (I1/I2).** Keeps the single-document checks
   (exactly one `<svg `, standalone open/close). Order is asserted with
   unwrappable markers via sequential search (date → `Arms Back Chest Delts
   Legs` → `40 sets · 39 exercises` → `NOTES` → both note lines); the first
   and last table rows are located by their emitted fragments and must sit
   strictly between the summary override and the NOTES label, first before
   last; all 40 exercise cells are rebuilt fragment-wise and compared
   losslessly against their sources.
3. **Compact column-width test.** No longer assumes any margin constant: it
   reads the selected document's actual table geometry (the `#111113` header
   band spans exactly the full content width inside the style's own margins)
   and asserts columns sum exactly to that width, start at x=0, and end at
   the band's right edge — for both styles across all Skip-rule fixtures.
   Also pins that Compact's narrower margins yield the wider table.
4. **Hostile escaping test.** SVG-level injection guards kept (`<img` absent,
   no `<tag …onerror` attribute injection, one root); NEW: every serialized
   `<text>` payload contains no raw `<`/`>`, and decoding the serialized
   payloads reproduces the layout's raw texts elementwise — proving escaping
   is an information-preserving round trip; the hostile Skip value is verified
   to reach the document only through escaped fragments that reassemble to
   its source.
5. **Hostile preservation test.** Per-cell reconstruction table over the
   hostile fixture: exercise with commas/degrees/braces/backslashes, sets
   `8,6`, reps `"10"`, weight `A&B 'quoted'`, Skip img-tag string, multiline
   exercise `line1\nline2\nline3` — each rebuilt from fragments and compared
   whitespace-insensitively to its source; the bottom-notes tail after
   `NOTES` must rebuild the full multiline quote/backslash-laden notes value.
6. **Wrap-primitive expectation fixed.** `wrapCellText("abc defghijkl mn", 4)`
   documents the real greedy contract: `["abc", "defg", "hijk", "l mn"]`
   (hard-break into limit-sized chunks; the next short word shares the final
   chunk's line). `hijl` was simply wrong. A lossless join check
   (`lines.join("")` whitespace-stripped equals the stripped source) pins the
   no-character-lost property.
7. **Typing/import repairs.** `WorkoutSession` imported from `../domain/
   types` (merged with `WorkoutRow`); unused local removed; highlight-token
   indexing resolves through the restored types; new helpers use exported
   `ColumnField`/`ImageElement`/`SessionImageDoc` types. Added a direct
   `escapeXmlText` unit test locking the exact five-entity mapping
   (`& < > " '` → entities).

## 4. Commands run and results

| Command | Result |
|---|---|
| Focused suite (`npx vitest run src/tests/imageExport.test.ts --reporter=dot`) | **PASS — 17/17** (was 10/16 with 6 failures before correction). One intermediate red run inside this correction: my first rewritten Skip assertion joined fragments with `""` and compared to the source verbatim, which wrongly penalizes the wrapper's break-point space; switched to the same whitespace-insensitive lossless invariant used everywhere else, then green. |
| `npm test -- --run --reporter=dot` | **PASS — 219/219 tests, 19 files** (~4.5 s). |
| `npm run build` (`tsc && vite build`) | **Passing** — 53 modules transformed; `dist/index.html` 0.48 kB, CSS 10.74 kB, JS 294.29 kB (95.10 kB gzip). Zero `tsc` errors (was 5). |
| `git diff --check` | Clean (exit 0; benign LF→CRLF working-copy notices only). |

## 5. Acceptance criteria status

| Task requirement | Status | Evidence |
|---|---|---|
| Production export behavior bounded & lossless; no weakened escaping/order/colors/summary/multiline/Skip rules | **PASS** | Diff touches only the test file; renderer module unmodified. |
| Long-value verification decodes/collects text nodes or joins emitted fragments | **PASS** | §3.1–§3.2, §3.4–§3.5. |
| Width test asserts selected document's actual table width | **PASS** | §3.3. |
| Wrap-primitive expectation consistent with documented greedy wrapper, lossless join asserted | **PASS** | §3.6. |
| All typing/import/unused/indexing errors fixed; `tsc` passes | **PASS** | §4 build row. |
| Focused export suite passes | **PASS** | 17/17. |
| `npm test -- --run --reporter=dot` passes | **PASS** | 219/219. |
| `npm run build` passes | **PASS** | §4. |
| `git diff --check` passes | **PASS** | §4. |
| Report with exact results; no PNG-readability or iOS share/save claims | **PASS** | This report; see §6. |

## 6. Remaining human-only limitations (NOT passed here)

Automated/jsdom coverage cannot prove, and this correction does not claim:

1. [ ] Physical readability of the rendered PNG on iPhone (real rasterized
       pixels, legibility of the 2× supersampled image at full zoom).
2. [ ] iOS share-sheet presentation and Save to Photos acceptance for
       `Gym-YYYY-MM-DD.png`.
3. [ ] Truthfulness of the download fallback path on a real device where
       `navigator.share`/`canShare` are unavailable.

These stay with the consolidated final iPhone gate alongside the previously
recorded deferred items (M01/M03 human verifications, Home overlap visual
gate, offline/installability). `pngExport.test.ts`'s delivery-outcome honesty
contract ("shared" only from a resolved share call, download reported only as
"started") remains the automated bound of what may be believed pre-device.

## 7. Disposition

Bounded correction complete and ready for Codex independent re-verification
of the diff, tests, build, and runtime. The Apple Notes no-colour limitation
and all EXPORT-01 scope boundaries remain accepted and untouched.
