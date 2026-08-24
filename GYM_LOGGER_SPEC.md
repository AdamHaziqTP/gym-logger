# Gym Logger
## Product, UX, Technical Architecture, Test Plan & Agent Handoff Specification

**Version:** 1.0  
**Date:** 2026-08-24  
**Status:** Source of truth for v1 implementation  
**Target:** Personal iPhone-first, offline-first gym logging utility  
**Primary implementation goal:** Make the user's existing Apple Notes workflow faster without replacing Apple Notes as the canonical archive.

---

# 1. Executive Summary

Gym Logger is intentionally **not** a conventional fitness tracker.

The user already has a workflow that works:

1. Keep one long Apple Notes document containing the entire gym history.
2. At each new session, scroll to the bottom.
3. Copy the previous session.
4. Paste it beneath the previous session.
5. Change the date.
6. During training, edit Sets / Reps / Weight and occasionally change exercise names, rows, order, or enter `skip`.
7. Optionally write cardio or other notes beneath the table.
8. Preserve muscle-group highlighting because it makes a very long full-body session visually navigable.
9. Keep the complete history in Apple Notes for continuity and safekeeping.

The current pain is not the logging model. The pain is the **interaction cost** caused by a very large Notes document:

- scrolling to the bottom every session;
- manual copy/paste;
- increasing Notes lag;
- difficulty producing one clean full-session image;
- having to move through many old tables just to reach the current one.

Gym Logger is therefore a **lightweight interaction layer around the same mental model**.

The v1 success path is:

> Open app → Start Today's Session → exact clone of latest session appears → edit it throughout the workout → optionally type `skip` / bottom notes → export a single-session image if wanted → Copy to Notes → paste once into the existing canonical Gym note.

If the application makes this path materially easier while remaining fast, battery-light, offline and familiar, it succeeds.

---

# 2. Product Philosophy

## 2.1 Preserve the existing workflow

Do not redesign the user's training methodology. Do not prescribe exercises, progression, volume, set structure, rest times or programs.

The app should feel like:

> “Apple Notes' table workflow, but each workout is its own record and cloning the previous workout is automatic.”

## 2.2 Apple Notes remains canonical

The local app database is a convenience copy for active use and structured history.

The Apple Notes document remains the canonical archive.

Consequences:

- Export back to Notes is a core v1 feature.
- The app must never require a user account.
- The app must support backup/export, but cloud sync is unnecessary.
- Deleting an app session never touches Apple Notes.
- Future automatic Notes append is desirable but is **not a v1 dependency**.

## 2.3 Avoid fitness-app feature creep

Do not add functionality simply because fitness applications normally have it.

Explicit non-goals include:

- workout timers;
- rest timers;
- per-set completion checkboxes;
- “finish workout” flow;
- program builders;
- split/routine management;
- PR badges;
- streaks;
- social features;
- calorie tracking;
- bodyweight tracking;
- leaderboards;
- exercise videos;
- generic exercise databases;
- AI coaching;
- server-side analytics;
- accounts;
- subscriptions;
- cloud dashboards;
- push notifications;
- background location;
- background network polling.

The user trains full body and expects to continue doing so. No split-routine abstraction is needed.

---

# 3. Target User and Device

## 3.1 User

One personal user.

No multi-user design is required.

## 3.2 Target device

Primary and effectively exclusive target: **iPhone**.

Other devices are bonus compatibility only and must not drive product decisions.

## 3.3 Installation strategy

### Recommended v1: Home Screen Web App / PWA

Reasons:

- safest personal installation path;
- no SideStore dependency;
- no certificate/signing expiry risk;
- no App Store review;
- no paid Apple Developer membership requirement;
- updateable from a static deployment;
- can open from a Home Screen icon like an app;
- can work offline after installation/caching.

On iOS 26, Safari can add any website to the Home Screen as a web app. A manifest and service worker are still recommended because they give predictable app identity and offline behavior.

### Native pivot rule

Do **not** move to a native IPA merely because it is “more app-like”.

Only consider React Native / Swift / Capacitor later if an iPhone technical spike proves that a critical requirement cannot be made reliable in a Home Screen web app, especially:

- rich clipboard → Apple Notes table interoperability;
- future direct Notes append;
- a system integration that is genuinely impossible in Safari/WebKit.

If a native pivot is proposed, the agent must first document exactly which v1 requirement cannot be satisfied in the PWA and why.

---

# 4. Core User Workflow

## 4.1 Home

When no session exists for today:

**Gym Log**

**Last Workout**  
Sunday 23 Aug  
40 sets · 39 exercises

Primary action:

**Start Today's Session**

Secondary action:

**Copy Another Session**

Additional navigation:

- History
- Settings

When today's session already exists:

Primary action changes to:

**Continue Today's Session**

The normal flow must never create two sessions for the same day.

## 4.2 Starting today's session

Pressing **Start Today's Session**:

1. Determines the current local phone date.
2. Clones the latest session exactly.
3. Assigns a new session ID.
4. Assigns today's local date.
5. Preserves:
   - all rows;
   - row order;
   - exercise text;
   - Sets text;
   - Reps text;
   - Weight text;
   - Skip text;
   - row highlighting;
   - bottom notes structure if desired by implementation (default recommendation: clear notes text unless user intentionally clones it; see §12.4).
6. Opens the new session immediately.
7. Persists it immediately.

The user wants literal cloning because the previous values are the reference for today's performance.

Do **not** blank Reps or Weight.

## 4.3 Copy another session

This is particularly important when gym equipment changes, e.g. travel.

Flow:

1. Tap **Copy Another Session**.
2. Show reverse-chronological History with search.
3. Tap a session.
4. Show a read preview.
5. Tap **Use This Session**.
6. Create today's session from that source.

If a today session already exists, warn before replacing/creating another. The normal product model remains one session per day.

## 4.4 During training

The user:

- taps any cell to edit free-form text;
- overwrites cloned values as needed;
- may add/remove/duplicate/reorder rows;
- may change row highlight;
- may type `skip` in Skip;
- may write arbitrary text beneath the table.

There is **no completion state**.

An unchanged row simply means the cloned value remains the value the user is keeping.

## 4.5 After / during training

There is no mandatory “Finish Session”.

Available actions:

- Share / Export Image
- Copy to Notes
- Open Notes (where technically available)
- Back to Home

The session continues autosaving regardless.

---

# 5. Visual Category System

The colors are not decorative. They are a high-value orientation aid inside a long full-body workout.

The user uses five Apple Notes highlight colors because long stretches of white text are harder to visually navigate.

## 5.1 v1 category mapping

| Category | Highlight | Meaning |
|---|---|---|
| Arms | Orange | Biceps, triceps, brachioradialis, forearm/wrist flexors/extensors |
| Back | Purple | Lats, traps, erectors and back-related work |
| Chest | Mint | Chest |
| Delts | Blue | Deltoid-region work plus shoulder internal/external rotation |
| Legs | Pink | Quads, hamstrings, glutes, hip flexors and leg-related work |
| Other | None/white | Currently mainly abs / anything not fitting the five categories |

Use the simpler label **Arms** rather than the historical `Bicep Tricep` label.

## 5.2 Highlight appearance

Match the provided Apple Notes screenshots in spirit:

- bright category-colored foreground text;
- subtle translucent/dark category highlight behind text;
- black/dark table background in dark mode;
- do **not** fill the entire table row with a bright solid color.

The app should retain high readability and strong category scanning.

## 5.3 Row-level formatting behavior

Improvement over Notes:

- selecting a row and choosing a category applies the category highlight to all fields in the row in one action;
- new text typed in the row inherits the row category.

This replaces the user's current need to separately highlight multiple cells.

## 5.4 Known mixed-highlight exception

SLDL can conceptually span Back + Legs (erectors + hamstrings), and the user has occasionally represented it using mixed purple/pink formatting.

Do not make this exception drive the entire editor architecture.

V1 baseline:

- one primary row highlight;
- preserve simple row-level coloring.

Optional enhancement only if easy:

- per-cell highlight override.

Do **not** implement arbitrary rich-text runs inside cells unless it is nearly free after the core product is complete.

---

# 6. Workout Table

## 6.1 Fixed columns

Exactly:

1. Exercise
2. Sets
3. Reps
4. Weight
5. Skip

No column creation, deletion or custom schemas are needed in v1.

## 6.2 Data types

**Every visible cell is free-form text.**

Do not model:

- Sets as mandatory integer;
- Reps as mandatory integer;
- Weight as mandatory decimal;
- Weight unit as an enum.

The history contains legitimate values such as:

- `8,6`
- `body weight`
- `35?kg added weight thing`
- `8.75 + 1 weight kg`
- notes or reminders embedded alongside values.

The UI must never reject these.

## 6.3 Keyboard

Use the normal text keyboard consistently.

Do not force a numeric keypad.

## 6.4 Horizontal behavior

The normal editing table may horizontally scroll, matching the user's Notes behavior.

Long exercise names may wrap.

Do not crush all five columns into one iPhone viewport merely to avoid horizontal scrolling.

### Prototype comparison

Implement/test both if inexpensive:

- entire table scrolls horizontally like Notes;
- Exercise column frozen while the remaining columns scroll.

Choose the version that feels least intrusive on a real iPhone.

Default bias: preserve Notes behavior unless the frozen Exercise column is clearly better.

## 6.5 Column sizing

Automatic/default widths.

No user-facing column-width configuration is necessary.

Exercise should receive the largest default width.

---

# 7. Apple Notes-Style Table Interaction

The provided screenshots are the interaction reference.

Reference files:

- `references/IMG_5550.png`
- `references/IMG_5551.png`
- `references/IMG_5552.png`
- `references/IMG_5553.png`
- `references/IMG_5554.jpeg`

## 7.1 Cell editing

Tap inside a cell:

- place cursor;
- edit text immediately;
- standard iOS selection/edit behavior;
- no separate edit form.

## 7.2 Row handle

Each row has a small three-dot handle on the left, inspired by Apple Notes.

Idle state:

- subtle;
- does not visually dominate the table.

First tap on row handle:

- selects the entire row;
- gives the row a clear selection outline / selected treatment;
- handle becomes visibly selected.

When selected:

- drag the handle vertically to reorder;
- tap the selected handle to open the row menu.

Touch targets must be large enough for reliable gym use even if the visible dots are small.

## 7.3 Row menu

Required:

- Add Row Above
- Add Row Below
- Duplicate Row
- Copy
- Cut
- Paste (when meaningful)
- Colour
- Delete Row

No permanent action buttons on every row.

## 7.4 Delete row

Delete immediately and show a temporary **Undo** snackbar/toast if simple to implement.

Do not require a confirmation modal for every row deletion.

A dedicated Undo/Redo interface is not required.

## 7.5 Reorder

Reorder using drag on the selected row handle.

No permanent drag handles occupying visual space across every row beyond the subtle Apple-style control.

## 7.6 Add row

Primary behavior is through the selected row menu, matching Notes.

A subtle end-of-table insertion affordance may be added only if it makes adding the final row materially easier.

Avoid a large floating `+` button.

---

# 8. Skip Semantics

`Skip` means:

> “This exercise is still part of the session/template and is something I wanted to train, but I did not perform it in this session.”

The user literally types `skip`.

Therefore:

- Skip is just another text field.
- No automatic completion logic.
- No dimming is required.
- No skipped-exercise deletion.
- No separate boolean is required unless useful internally.
- On cloning, Skip content should normally be cleared for the new session, because the new day has not yet been skipped. This is one deliberate exception to literal cloning and should be confirmed in the implementation prototype; if fidelity is preferred, clone it exactly and make clearing easy.
- Regardless of skip, the row remains part of session totals.

## 8.1 Totals and skip

The user's session header represents the full session, not only performed work.

Skipped rows **still count** toward the top-level total.

---

# 9. Session Summary / Totals

The current header convention is:

`40sets 39 exercises`

## 9.1 Automatic calculation

The app may calculate suggested totals:

- Sets: sum `Sets` when values are simple integers.
- Exercises: count exercise rows.

Skipped rows count.

## 9.2 Manual override is mandatory

Do not assume calculated totals are always semantically correct.

The provided latest source session says:

- `40sets`
- `39 exercises`

while the exported table contains 40 visible exercise rows with `Sets = 1`.

This source mismatch may be intentional convention or a manual historical inconsistency. Either way, the app must not overwrite the user's chosen summary.

Recommended model:

- `calculatedSets`
- `calculatedExercises`
- optional `setsDisplayOverride`
- optional `exercisesDisplayOverride`

UI:

- show calculated values normally;
- tapping the summary allows manual edit/override;
- optional reset-to-calculated action.

On cloning:

- calculate the new session from cloned rows;
- preserve override only if the product owner chooses source-fidelity behavior during implementation testing.

The seed fixture intentionally includes the 40/39 override to test this.

---

# 10. Free-Form Session Notes

Below the table is a plain Notes-like text area.

Use cases include:

- cardio;
- gym/location context;
- machine differences;
- “started using straps”;
- reminders;
- arbitrary commentary.

Do not structure cardio.

Do not add duration/distance forms.

When exporting to Notes or image, this text appears beneath the table.

---

# 11. History

## 11.1 Presentation

Reverse chronological list.

Example:

**Sun 23 Aug**  
40 sets · 39 exercises

**Fri 21 Aug**  
…

Do not show every table inline.

This is the key fix for the infinite-scroll problem.

## 11.2 Search

Single search field.

Search locally through:

- date/display date;
- exercise names;
- Sets/Reps/Weight/Skip text;
- bottom notes.

Example:

`chest press`

returns sessions containing that text.

No advanced filters are required.

## 11.3 Old session editing

Historical sessions may remain directly editable.

Do not introduce a complex locked/read-only state.

Because Apple Notes remains canonical, accidental app changes are recoverable from the archive.

## 11.4 Delete session

Deleting a whole session requires confirmation.

Copy:

> Delete this session from Gym Log? This does not affect your Apple Notes archive.

No recycle bin required in v1.

---

# 12. Session Cloning Rules

## 12.1 Clone latest

One tap.

Source = newest session by date/created state.

## 12.2 Clone another

History → preview → Use This Session.

## 12.3 Fields cloned

Clone:

- row order;
- exercise;
- sets;
- reps;
- weight;
- highlight/category;
- fixed schema.

## 12.4 Fields requiring a product decision in implementation

### Skip

Recommended: clear Skip in the new session because skip describes what happened that day.

Alternative: literal clone to match Notes exactly.

Prototype both only if the difference is trivial; otherwise use the recommended behavior and expose `Clear Skip Column`.

### Bottom notes

Recommended: clear bottom notes because cardio/context are session-specific.

If notes are deliberately used as persistent reminders, provide a “Copy notes too” option later rather than defaulting to old session text.

---

# 13. Home Screen

Keep sparse.

Suggested structure:

```
Gym Log

Today
No session yet
[ Start Today's Session ]

Last Workout
Sunday 23 Aug
40 sets · 39 exercises
[ View ]

[ Copy Another Session ]

Today   History   Settings
```

When today exists:

```
Today
Monday 24 Aug
[ Continue Today's Session ]
```

Do not add analytics cards.

---

# 14. Image Export

One of the primary quality-of-life upgrades.

The user currently has to use iPhone full-page screenshot behavior and crop segments, sometimes resulting in multiple images.

The app must generate the whole session directly.

## 14.1 Two export styles

### Faithful

- close to the normal Apple Notes-like view;
- dark background;
- table borders;
- category highlights;
- familiar spacing;
- complete session.

### Compact

Optimized to reduce height while remaining readable:

- smaller header;
- narrower outer margins;
- reduced vertical cell padding;
- wider exercise column;
- tight typography;
- category highlights retained;
- hide Skip column if every Skip cell is empty.

Ship both initially so the user can compare.

Setting:

**Default Image Style**
- Compact
- Faithful

## 14.2 Content order

1. Date
2. Category legend
3. Sets / exercises summary
4. Table
5. Bottom notes

## 14.3 Output

PNG.

Filename:

`Gym-YYYY-MM-DD.png`

Generate at full useful resolution.

Avoid arbitrary low-resolution caps.

The renderer must handle a 40+ row session on iPhone without crashing.

## 14.4 Dark export

Default image export should use the dark presentation even if the app is later used in light mode, unless a user setting is explicitly added.

The current color system is designed around the dark Notes appearance.

## 14.5 Share

After rendering:

- Preview
- Save / Share using iOS share sheet where available.

---

# 15. Copy to Apple Notes

This is a **core v1 acceptance criterion**.

## 15.1 User flow

Tap:

**Copy to Notes**

The clipboard should contain the whole session:

1. Date
2. `Arms Back Chest Delts Legs` legend
3. summary
4. five-column table
5. bottom notes

Then user opens the existing Gym note and pastes once.

## 15.2 Preferred clipboard representations

Use one `ClipboardItem` where supported with:

- `text/html`
- `text/plain`

Potentially also prepare an RTF/native strategy only if a PWA cannot preserve the desired structure.

WebKit currently supports `text/plain`, `text/html`, `text/uri-list`, and `image/png` clipboard representations, and newer Safari versions support `ClipboardItem.supports()`.

## 15.3 HTML payload

Generate standards-compliant, self-contained HTML:

- semantic `<table>`;
- explicit rows/cells;
- inline styles for robust transfer;
- no external CSS dependency;
- dark-mode colors should not make pasted content unreadable in Notes;
- include plain text fallback.

## 15.4 Acceptance priority

If Apple Notes strips some visual styling, priority order is:

1. All session data preserved.
2. Real editable table structure preserved.
3. Category/highlight colors preserved.
4. Pixel-perfect Notes styling.

Do not sacrifice editability/data just to reproduce visuals.

## 15.5 Required iPhone technical spike

Before polishing the entire app, build a minimal test page that:

1. creates a 5-column HTML table with representative row highlights;
2. writes HTML + plain text to the clipboard;
3. pastes into Apple Notes on the target iPhone;
4. records exactly what survives:
   - table structure;
   - row/cell structure;
   - text;
   - highlight/background;
   - foreground color.

Also test a traditional selected-DOM copy fallback (`execCommand("copy")` / selection-based approach) because Notes may interpret browser-copied rich content differently from Async Clipboard HTML.

Do not assume desktop behavior equals iOS Notes behavior.

## 15.6 Fallback

If rich paste is imperfect:

- preserve reliable plain text / TSV copy;
- keep image export fully working;
- document the limitation;
- do not silently switch to an unreliable format.

## 15.7 Copied state

After successful clipboard write:

`Copied to Notes ✓`

Optionally store `copiedToNotesAt`.

This is informational only and does not lock the session.

## 15.8 Open Notes

If a safe general Notes launch/deep link is possible, expose:

**Open Notes**

Do not make it a blocker.

Do not claim the app can jump to the exact Gym note until verified on-device.

---

# 16. Future Automatic Append to Notes

Desired future enhancement:

> One action appends the completed session to the existing canonical Gym Apple Note.

Not required in v1.

Future investigation paths, in order:

1. iOS Shortcuts integration / append-to-note workflow.
2. PWA → Shortcut handoff with clipboard/input.
3. Native App Intent / share extension only if justified.
4. Other supported Notes automation routes.

Rules:

- preserve the exact canonical note;
- never create silent duplicates;
- user must retain control;
- failure must not lose data;
- keep manual Copy to Notes as permanent fallback.

---

# 17. Offline-First / Battery Requirements

This requirement is strict.

During a workout the app should require **zero network activity**.

No:

- polling;
- cloud sync;
- analytics;
- AI;
- remote fonts;
- remote images;
- location;
- timers;
- background processing.

## 17.1 Offline application shell

Use a service worker to cache:

- HTML shell;
- JS/CSS;
- icons;
- local static assets.

After first install/load, app must open in airplane mode.

## 17.2 Local data

Use IndexedDB.

Recommended lightweight wrapper: Dexie.

All writes are local.

Autosave after every edit with a short debounce if needed for performance.

## 17.3 Persistence

Request persistent storage with `navigator.storage.persist()` when appropriate.

Also use `navigator.storage.estimate()` for diagnostics if useful.

WebKit storage can be evicted under storage pressure in best-effort mode, so do **not** market local browser storage as an infallible permanent archive.

Risk is acceptable because:

- Apple Notes is canonical;
- backup export exists;
- data volume is tiny;
- the app is actively used.

## 17.4 Data-loss acceptance criterion

If the user edits a cell and then:

- backgrounds the app;
- closes it;
- iOS terminates the web app;
- phone dies shortly afterward;

the last committed text should reappear on reopen.

No explicit Save button.

---

# 18. Backup / Restore

Settings:

**Export Backup**  
**Import Backup**

## 18.1 Backup format

JSON.

Filename:

`GymLog-Backup-YYYY-MM-DD.json`

Include:

- schema version;
- sessions;
- rows;
- highlights;
- settings;
- copy timestamps / metadata;
- future-compatible version field.

## 18.2 Export destination

Use the standard browser/iOS file/share workflow.

The user may save to:

- iCloud Drive;
- On My iPhone;
- any Files provider available.

No custom cloud backend.

## 18.3 Restore

- validate schema;
- show summary before destructive replacement/merge;
- make a safety export of current data if practical;
- restore all session IDs and order.

---

# 19. Historical Import

**Not a v1 blocker.**

The source Notes history has multiple eras:

1. very early shorthand / fragments;
2. increasingly sentence/list structured;
3. clean table-based sessions.

Trying to parse everything perfectly is unnecessary.

Future import strategy:

- support the clean table era first;
- be conservative;
- skip ambiguous sessions rather than inventing data;
- preserve Apple Notes as the authoritative archive of the messy early history.

Reference source:

`references/text 2.txt`

---

# 20. Data Model

Recommended TypeScript model:

```ts
type Highlight =
  | "none"
  | "orange"
  | "purple"
  | "mint"
  | "blue"
  | "pink";

interface WorkoutRow {
  id: string;
  position: number;

  exercise: string;
  sets: string;
  reps: string;
  weight: string;
  skip: string;

  highlight: Highlight;
}

interface SessionSummaryOverride {
  sets?: string;
  exercises?: string;
}

interface WorkoutSession {
  id: string;

  // Local calendar date captured at creation.
  dateLocal: string; // YYYY-MM-DD

  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp

  sourceSessionId?: string;

  rows: WorkoutRow[];
  notes: string;

  summaryOverride?: SessionSummaryOverride;

  copiedToNotesAt?: string;
}

interface AppSettings {
  schemaVersion: number;

  theme: "system" | "dark" | "light";
  defaultImageStyle: "compact" | "faithful";

  storagePersistenceRequested?: boolean;
}
```

## 20.1 IDs

Use `crypto.randomUUID()`.

Never use date as the database primary key.

Even though the normal UX is one session/day, unique IDs avoid time-zone/edit/restore problems.

## 20.2 Ordering

Rows use integer `position`.

After drag reorder, normalize positions to `0..n-1`.

No complex fractional ordering needed at this scale.

---

# 21. Suggested Technical Stack

Keep the dependency graph deliberately small.

## 21.1 Front end

- React
- TypeScript
- Vite

Why Vite instead of Next.js:

- no backend;
- no SSR requirement;
- no authentication;
- no server data;
- smaller mental model;
- static PWA deployment is sufficient.

## 21.2 PWA

- `vite-plugin-pwa` or equivalent minimal service-worker setup
- Web App Manifest
- standalone display
- app icons
- offline shell cache

## 21.3 Storage

- IndexedDB
- Dexie

## 21.4 Styling

Prefer:

- plain CSS / CSS modules;
- system font stack;
- CSS custom properties for highlight tokens.

Avoid a heavy UI framework unless the implementation agent proves it reduces complexity.

## 21.5 Drag reorder

Use either:

- pointer/touch events with a small custom implementation; or
- a lightweight well-maintained drag library.

Must be tested on iPhone touch.

Desktop drag success is not sufficient.

## 21.6 Clipboard

Use browser APIs directly.

Preferred:

```ts
const item = new ClipboardItem({
  "text/html": new Blob([html], { type: "text/html" }),
  "text/plain": new Blob([plain], { type: "text/plain" }),
});
await navigator.clipboard.write([item]);
```

Feature-detect and provide fallback.

## 21.7 Image generation

Do not commit to a heavyweight screenshot dependency without testing.

Preferred evaluation order:

1. small HTML-to-canvas/image library tested on iOS with 40+ rows;
2. custom Canvas renderer if the library is unstable with tall content;
3. keep rendering purely local.

The export renderer must not need network access.

---

# 22. Appearance

## 22.1 App theme

Settings:

- System
- Dark
- Light

Default: System.

The dark presentation should be the main design reference because that matches current usage.

## 22.2 Table visual target

Reference Apple Notes screenshots.

Design traits:

- near-black background;
- thin subtle grid lines;
- generous but not excessive touch spacing;
- system-like typography;
- no gradients;
- no gamification;
- no colorful card dashboard.

The highlights provide the color; the surrounding app should remain restrained.

---

# 23. Settings

Keep minimal.

## Appearance
- System
- Dark
- Light

## Default Image Style
- Compact
- Faithful

## Data
- Export Backup
- Import Backup

## Storage
- optional “Persistent storage: granted/not granted” diagnostic only if helpful

## About
- app version
- local-only statement
- “Apple Notes remains your archive” explanatory copy if useful

Do not create a settings maze.

---

# 24. Initial Setup / Seed

V1 does not need onboarding slides.

For the personal build, seed/import the current latest session.

Included fixture:

`seed/latest-session.example.json`

The fixture intentionally:

- preserves free-form strings;
- uses the current highlight categories;
- includes the source 40-sets / 39-exercises manual summary mismatch;
- serves as a regression test.

If the actual build is distributed beyond the user later, replace hardcoded personal data with:

- Create First Session
- Import Starting Session

---

# 25. Performance Requirements

The app should feel lighter than Notes during a long workout.

## 25.1 No unnecessary work

Avoid:

- rerendering the entire 40-row table on every keystroke where avoidable;
- writing the whole database for one character if row-level updates suffice;
- large animation libraries;
- continuous intervals;
- telemetry.

## 25.2 Target session size

Must comfortably handle:

- 40 rows baseline;
- 100 rows stress test;
- long exercise names;
- large notes field.

## 25.3 Battery

No formal battery percentage target is required, but there should be no architecture that causes continuous CPU/network activity.

An idle open session should be effectively idle.

---

# 26. Accessibility / Usability

This is a personal app, but basic ergonomics matter.

- touch targets at least comfortably finger-sized;
- no tiny permanent buttons;
- row handles visually small but hit area larger;
- high contrast in dark mode;
- do not rely on color alone for destructive/selected state;
- keyboard should not cover the active cell without scrolling it into view;
- editing one cell should not unexpectedly jump the table horizontally.

---

# 27. Edge Cases

## 27.1 Today already exists

Show Continue.

Do not create another through the normal Start action.

## 27.2 Start tapped twice

Idempotent.

One session created.

## 27.3 Time zone travel

Use the phone's local calendar date at creation time.

No server UTC-based display logic.

## 27.4 Manually edited date

Allow date change.

Session ID remains unchanged.

## 27.5 Empty row

Do not crash totals/export.

Potentially exclude completely empty exercise rows from automatic exercise count, but preserve the row itself.

## 27.6 Weird cell values

Must persist/render/export exactly.

Examples:

- `8,6`
- `body weight`
- `8.75 + 1 weight kg`
- spelling variants
- question marks
- notes in Weight
- uppercase/lowercase inconsistencies.

## 27.7 Spelling

Never autocorrect exercise names programmatically.

The user's historical terms are personal labels.

## 27.8 Accidental session deletion

Confirmation required.

## 27.9 App storage unavailable/quota error

Show non-destructive error and encourage backup.

Never silently drop edits.

---

# 28. Exercise History / Autocomplete

Not required for v1.

Possible later feature:

Long-press or row menu → View History

Could show prior occurrences without analytics.

Autocomplete based on user's previous exercise names is also optional.

Do not build an exercise library or fuzzy identity system.

If a name changes, treat it as text. No rename graph is required.

---

# 29. Implementation Sequence for Codex / Ox

The implementation agent should work in this order.

## Phase 0 — Read and preserve intent

Before coding:

1. Read this entire specification.
2. Inspect all reference screenshots.
3. Inspect the seed fixture.
4. Inspect `references/text 2.txt` enough to understand why all cells are free-form.
5. Write a short implementation plan.
6. Identify any requirement the planned stack cannot satisfy.

Do not start by adding generic fitness features.

## Phase 1 — Technical spikes

Complete these before building polish.

### Spike A: PWA offline

- install Home Screen web app;
- load once online;
- enable airplane mode;
- cold-open app;
- verify shell loads.

### Spike B: IndexedDB persistence

- edit fixture;
- close/kill;
- reopen;
- verify exact persistence.

### Spike C: Apple Notes rich paste

- copy representative HTML table;
- paste into Apple Notes on actual iPhone;
- document what survives.

This is the highest-risk integration.

### Spike D: tall image export

- render 40-row fixture;
- export PNG;
- share/save on actual iPhone;
- verify readable and no crash.

Do not spend days polishing UI before these four work.

## Phase 2 — Storage/domain

- IndexedDB schema
- sessions CRUD
- autosave
- cloning
- local date
- backup/import

## Phase 3 — Home + History

- sparse Home
- Start/Continue
- Copy Another Session
- reverse-chronological History
- local search

## Phase 4 — Table editor

- fixed 5 columns
- arbitrary text
- row handle/select/menu
- add/delete/duplicate
- drag reorder
- highlight selection
- horizontal behavior
- notes area

## Phase 5 — Export

- Faithful PNG
- Compact PNG
- Skip omission in compact image when unused
- clipboard HTML/plain
- copy state
- share sheet

## Phase 6 — Polish

- dark/light/system
- keyboard visibility
- touch target tuning
- error handling
- install icon/manifest
- performance

## Phase 7 — Regression tests

Run all acceptance tests below on a real iPhone.

---

# 30. Acceptance Test Matrix

## A. Start / Clone

### A1
Given no session today  
When Start Today's Session is tapped  
Then exactly one new session is created with today's local date.

### A2
The new session contains the same row order, values and highlight choices as the source, subject to explicit Skip/notes clearing policy.

### A3
Reopening the app shows Continue Today's Session.

### A4
Double-tapping Start cannot create duplicate sessions.

### A5
Copy Another Session can clone a non-latest historical session.

---

## B. Free-form editing

### B1
Every field accepts letters, numbers, punctuation and spaces.

### B2
`body weight` is valid Weight.

### B3
`8,6` is valid Reps.

### B4
`8.75 + 1 weight kg` is valid Weight.

### B5
No automatic normalization changes user text.

### B6
Cell edit persists after app termination/reopen.

---

## C. Table behavior

### C1
Tap cell → edit.

### C2
Tap row handle → select row.

### C3
Selected row has clear selection treatment.

### C4
Selected handle → opens row actions.

### C5
Drag selected row → reorder.

### C6
Add Above/Below works.

### C7
Duplicate produces an exact new row.

### C8
Delete row can be undone via temporary Undo if implemented.

### C9
Colour applies across the row.

### C10
40-row table remains responsive.

---

## D. Skip

### D1
Typing `skip` is preserved as plain text.

### D2
Skipped row is not deleted/dimmed automatically.

### D3
Skipped row counts toward session totals.

### D4
Compact screenshot hides the Skip column when all Skip cells are empty.

### D5
Compact screenshot shows Skip when at least one row contains Skip text.

---

## E. Summary

### E1
Automatic totals can be calculated from simple values.

### E2
Manual summary override is supported.

### E3
The supplied fixture can display the source `40 sets / 39 exercises` even if calculated row count differs.

---

## F. History

### F1
History shows dates without inline tables.

### F2
Newest session appears first.

### F3
Search `Chest Press` returns sessions containing that text.

### F4
Search bottom notes works.

### F5
Historical session remains editable.

### F6
Deleting a historical app session warns that Notes is unaffected.

---

## G. Offline

### G1
After installation/cache, airplane-mode cold launch works.

### G2
Create/edit session in airplane mode works.

### G3
Image export in airplane mode works.

### G4
History/search in airplane mode works.

### G5
Backup export in airplane mode works.

No v1 core feature should require a server.

---

## H. Apple Notes export

### H1
Copy to Notes writes the entire session to clipboard.

### H2
Plain-text fallback contains every field.

### H3
On target iPhone, paste into Apple Notes preserves all text.

### H4
Aim to preserve editable table structure.

### H5
Aim to preserve highlight colors.

### H6
Any formatting limitation is documented rather than hidden.

---

## I. Image export

### I1
40-row fixture renders as one PNG.

### I2
No row is missing.

### I3
Category colors are visible.

### I4
Bottom notes are included.

### I5
Faithful and Compact styles both work.

### I6
PNG can be saved/shared through iOS.

---

## J. Backup

### J1
Export produces valid JSON.

### J2
Import restores sessions exactly.

### J3
Free-form strings survive round trip.

### J4
Highlights survive round trip.

### J5
Manual summary overrides survive round trip.

---

# 31. Definition of Done

V1 is done when the product can replace Apple Notes **during the workout** without attempting to replace Apple Notes **as the archive**.

A release candidate must pass this real-world scenario:

1. Install/open from iPhone Home Screen.
2. Disable network.
3. Open Gym Log.
4. Start today's session from latest.
5. See all cloned values immediately.
6. Edit at least ten cells.
7. Reorder an exercise.
8. Add one row.
9. Change a row highlight.
10. Type `skip` into one row.
11. Write arbitrary bottom notes.
12. Close/kill app.
13. Reopen and see exact state.
14. Generate one full-session PNG.
15. Copy entire session.
16. Paste into Apple Notes.
17. Confirm data is intact.
18. Return next workout and repeat without scrolling the giant Notes archive.

If this is smooth, v1 succeeds.

---

# 32. Explicit Agent Guardrails

Agents must **not**:

- replace free-form cells with strict numeric inputs;
- invent an exercise database;
- build per-set checklists;
- add workout completion logic;
- add gamification;
- add accounts;
- add cloud sync;
- add AI;
- add analytics;
- redesign the training plan;
- force a conventional “routine” model;
- remove Apple Notes export;
- make network access necessary during workouts;
- overbuild historical import before the core editor works;
- switch to native solely for aesthetic reasons;
- assume rich Apple Notes paste works without testing it on iPhone.

When in doubt, choose the behavior closest to Apple Notes and the user's existing workflow.

---

# 33. Reference Material

## Current full-session screenshots

- `references/IMG_5501.jpeg`
- `references/IMG_5502.jpeg`

These demonstrate the full long session / screenshot problem.

## Apple Notes editing interaction screenshots

- `references/IMG_5550.png`
- `references/IMG_5551.png`
- `references/IMG_5552.png`
- `references/IMG_5553.png`
- `references/IMG_5554.jpeg`

These demonstrate:

- cell editing;
- three-dot row handle;
- selected-row outline;
- row context menu;
- Apple highlight palette / formatting behavior.

## Historical Notes export

- `references/text 2.txt`

Use this to validate that the user's gym data evolved from highly unstructured notes into clean tables and contains intentionally irregular free-form strings.

Do not attempt to “clean” the historical language as part of v1.

## Seed fixture

- `seed/latest-session.example.json`

Use for:

- initial personal seed;
- UI regression tests;
- clipboard tests;
- image export tests;
- summary override tests.

---

# 34. Technical Verification Notes

These are implementation references, not product requirements.

## Home Screen web app behavior

WebKit documents that in iOS 26 / iPadOS 26, websites added to Home Screen can open as web apps, and manifests/service workers can still enhance the experience.

https://webkit.org/blog/17333/webkit-features-in-safari-26-0/

## Clipboard

WebKit's Async Clipboard API supports multiple representations including `text/plain`, `text/html`, `text/uri-list`, and `image/png`.

https://webkit.org/blog/10855/async-clipboard-api/

Safari 18.4 added `ClipboardItem.supports()` and documents `text/plain`, `text/html`, and `image/png` as browser-supported clipboard formats.

https://webkit.org/blog/16574/webkit-features-in-safari-18-4/

## Storage

WebKit documents IndexedDB/service-worker storage quota, eviction, and the Storage API. Persistent mode can protect an origin from normal eviction behavior when granted.

https://webkit.org/blog/14403/updates-to-storage-policy/

The app must still keep user-visible backup/export because browser storage should not be treated as the sole permanent archive.

---

# 35. Deferred Backlog

Only consider after v1 is proven useful:

1. Automatic append into the canonical Apple Gym note.
2. Historical import of clean table-era Notes sessions.
3. Exercise history lookup.
4. Personal exercise-name autocomplete.
5. Per-cell highlight override / mixed SLDL formatting.
6. Better specific-note deep link if Apple exposes a reliable route.
7. Native wrapper only if it unlocks a demonstrated high-value capability.

Do not implement backlog items preemptively.

---

# 36. One-Sentence Product Test

> **Gym Logger is successful if the user no longer needs to scroll through the giant Apple Notes gym log during a workout, while still being able to paste every new session back into that same canonical note afterward.**
