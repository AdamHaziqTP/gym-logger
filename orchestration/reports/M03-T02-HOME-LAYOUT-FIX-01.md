# M03-T02-HOME-LAYOUT-FIX-01 — Home action overlap correction: worker report

**Worker:** OX Alpha
**Task:** `orchestration/tasks/M03-T02-HOME-LAYOUT-FIX-01.md`
**Result:** COMPLETE for the automated/engineering scope — **190/190 tests**
across 17 files (186 accepted baseline + 4 new layout-contract tests), passing
production build (`tsc && vite build`, 50 modules), clean `git diff --check`.
The Home secondary actions now render inside one scoped `.home-actions` flex
column with an explicit vertical gap. **This report does NOT claim visual or
physical acceptance: jsdom cannot prove iPhone pixels, and the recorded
iPhone 14 Pro Max overlap remains a deferred visual item for the consolidated
final device gate (below).**

---

## 1. Diagnosis

- Product evidence (STATE record): on iPhone 14 Pro Max the Home-screen
  **Copy Another Session** button visually clips/overlaps the **History**
  button beneath it.
- Root cause in code: both buttons were bare `.btn` children of
  `main.screen`. `.btn` is `display: block; width: 100%` with **no vertical
  margin**, so the two full-width controls stacked with **zero separation**;
  their identical `#1c1c1e` fills and 12px rounded corners rendered flush
  together — reading as one clipped/overlapping control at narrow widths.
  (Every other button on Home gets spacing only because it follows a
  margin-bearing text line inside a panel.)
- Correction direction (scoped per task): keep both controls exactly where
  they are, with their labels, order, callbacks, disabled behavior, and
  button semantics unchanged, but give the pair one explicit container that
  guarantees separation at every viewport width.

## 2. Files changed

| File | Change |
|---|---|
| `src/components/Home.tsx` | The two secondary action buttons (`Copy Another Session`, `History`) are now wrapped in a single `<div className="home-actions">` directly under `main.screen`. Labels, order, callbacks (`onOpenCopyAnother`, `onOpenHistory`), `disabled={sessions.length === 0}`, `type="button"`, and `btn btn-secondary` classes are byte-for-byte unchanged. Today/Last Workout panels and footer untouched. Comment updated to record the defect rationale. |
| `src/styles.css` | One new scoped rule in the Home section: `.home-actions { display: flex; flex-direction: column; gap: 10px; }` — the same pattern already used by `.preview-actions` and `.confirm-actions`. No global `.btn` change; no other selector touched. |
| `src/tests/homeLayout.test.tsx` | NEW focused suite (4 tests) pinning the corrected contract (§3). |

No other production or test files were touched. Net test delta: **+4**.

## 3. New coverage (and its honest limits)

`src/tests/homeLayout.test.tsx`:

1. **Structure/class contract**: exactly two buttons live inside one
   `.home-actions` container that is a direct child of `main.screen` (never
   nested in a panel); both are real `<button type="button">` with
   `btn btn-secondary`; order preserved (Copy Another Session before
   History); Today/Last Workout labels remain present as siblings.
2. **Stylesheet contract**: `styles.css` contains a `.home-actions` rule with
   `display: flex`, `flex-direction: column`, and a positive px gap. Read via
   `node:fs` from the package root (same convention as `vite.config.ts`);
   jsdom does not load stylesheets, so this pins the rule's existence, not
   pixels.
3. **Navigation behavior preserved**: Copy Another Session still opens the
   copy picker and History still opens History, with back returning Home —
   through the new container.
4. **Disabled behavior preserved**: with every session removed after boot
   (one-time seed flag prevents reseeding), Copy Another Session disables
   while History stays enabled and navigable.

Explicit limits, stated for the record: these tests prove DOM structure,
class names, callbacks, disabled state, and the presence of a separating
flex-gap rule. They do NOT and cannot prove the physical rendering, touch
target sizes, or pixel-level separation on an iPhone 14 Pro Max.

## 4. Alternatives considered and rejected

- **Global `.btn { margin-bottom }`**: rejected — would change every button
  site (session screen, menus, dialogs) against the task's scoping rule.
- **Per-button utility margins / `<br>` spacers**: brittle magic numbers,
  weaker contract than one container owning the separation.
- **Media query only at iPhone widths**: unnecessary complexity; a constant
  flex gap gives identical distinct-control rendering at all widths and
  matches the existing in-app pattern.
- **Any redesign of navigation, labels, order, or fitness behavior**: out of
  scope per task; none made.

## 5. Commands run and results

| Command | Result |
|---|---|
| `npm test -- --run --reporter=dot` | **PASS — 190/190 tests, 17 files** (~4.6 s; 186 accepted baseline + 4 new). One intermediate red run was the new suite itself failing on `import.meta.url` resolution under vitest/jsdom ("URL must be of scheme file"); fixed by resolving the stylesheet path from `process.cwd()`, then green first re-run. |
| `npm run build` (`tsc && vite build`) | **Passing** — 50 modules transformed. |
| `git diff --check` | Clean (exit 0; only benign LF→CRLF working-copy notices). |

Pre-existing uncommitted modifications to
`orchestration/product-sync/*` and `orchestration/state/STATE.md` were in the
working tree before this task started (orchestrator-owned); they were not
touched by this correction.

## 6. Acceptance criteria status

| Task requirement | Status | Evidence |
|---|---|---|
| Two distinct full-width controls, clear vertical separation, no clipping/overlap on narrow viewports | **Engineering PASS / visual gate OPEN** | Scoped `.home-actions` flex column + 10px gap; §3 tests pin structure and stylesheet contract. Physical rendering remains unproven by design. |
| Labels, order, callbacks, disabled behavior, accessible button semantics preserved | **PASS** | §3 tests 1/3/4 assert them explicitly; all pre-existing suites pass unmodified. |
| Existing Today/Last Workout layout preserved | **PASS** | Panels untouched in diff; §3 test 1 asserts their labels still render as siblings. |
| Scope limited to Home action area; no global button changes | **PASS** | Diff touches only `Home.tsx` wrapper + one new CSS class. |
| Focused automated coverage added; no jsdom-pixel claims | **PASS** | §3 suite; limitations stated in-report. |
| Protocol commands pass | **PASS** | §5 table. |
| No deferred iPhone/visual gate marked passed | **PASS** | §7 below. |

## 7. Remaining physical-iPhone visual gate (NOT passed here)

On the trusted URL, iPhone 14 Pro Max (same conditions as the original defect
report), open Home and record each item separately:

1. [ ] **Copy Another Session** and **History** render as two clearly
       separate full-width buttons — no touching, clipping, or overlap.
2. [ ] Both buttons keep their labels, order (Copy above History), and
       enabled/disabled appearance consistent with prior behavior.
3. [ ] Today / Last Workout sections look unchanged from the accepted
       baseline.
4. [ ] No new visual regression elsewhere (session screen, History, copy
       picker) caused by the change.

Until then this defect stays in the deferred list; automated results do not
reclassify it as accepted.

## 8. Disposition

Bounded correction complete and ready for Codex independent verification of
the diff, tests, build, and runtime. The Home visual result must be preserved
for the consolidated final iPhone acceptance pass alongside the other
deferred device gates (M01 HV items, PNG export, offline/installability).
