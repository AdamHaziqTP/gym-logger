# HUMAN VERIFICATION — M03-T01 Apple Notes clipboard integration spike

**Status: PARTIAL — human-only gate. No automated or engineering result may mark
these items PASS.** The automated suite proves payload generation and button
behavior only (jsdom + fake-indexeddb). Whether anything survives a real
iPhone Safari → Apple Notes paste is unknowable from this workstation.

## Recorded device result — 2026-08-24

- Device: **iPhone 14 Pro Max**
- Result supplied by product owner: pressing **Copy to Notes** showed **`Copy failed — clipboard unavailable`**.
- **HV-M03-3: FAIL.** The app did not reach either rich or plain clipboard success.
- **HV-M03-1: BLOCKED/NOT EXECUTED.** No clipboard payload was available to paste into Apple Notes.
- **HV-M03-2: BLOCKED/NOT EXECUTED.** Plain fallback could not be exercised after the failed copy.
- No screenshot was supplied with this result.
- This is not Apple Notes acceptance and is not a reason to mark the gate passed. Route the clipboard failure through `M03-T01-FIX-01` before repeating the device gate.

## FIX-01 retest status

Codex independently accepted the FIX-01 engineering correction at 140/140 tests, passing build, and passing LAN runtime smoke. The original device failure remains recorded above; it is not retroactively changed. Repeat the affected copy on the corrected build. On the current HTTP LAN origin, the expected status is **`Copied as plain text (rich formatting unavailable)`**. Rich HTML/table/color behavior requires a secure HTTPS build and remains unverified.

## Recorded FIX-01 retest result — 2026-08-24

- Device: **iPhone 14 Pro Max**
- Copy status: **`Copied as plain text (rich formatting unavailable)`**.
- **Plain-content result: PASS as reported.** The user reported that the text values were all correct.
- **Rich-format result: FAIL/UNAVAILABLE on the HTTP LAN build.** The pasted result was strict text rather than the Notes-style table; formatting, table structure, and colors did not survive.
- This is consistent with the documented non-secure-origin ceiling: the HTTP path cannot provide HTML clipboard data. It is not evidence that Apple Notes rich paste works or fails on a secure origin.
- **HV-M03-1 rich paste: BLOCKED/UNAVAILABLE** pending a trusted HTTPS build.
- **HV-M03-2 plain fallback: PASS for reported text fidelity;** category/table formatting remains unavailable on this path.
- **HV-M03-3 plain fallback state: PASS.** The app no longer reported clipboard failure and truthfully identified the plain result.
- No screenshot or iOS/Safari version was supplied.

## Recorded secure-origin retest result — 2026-08-24

- Device: **iPhone 14 Pro Max**
- Origin: trusted HTTPS build at `https://192.168.1.49:5173`.
- Copy status: rich copy succeeded; the user reported that the editable Notes table and all values were filled correctly.
- **Table/data result: PASS as reported.**
- **Category text/highlight color result: FAIL.** The pasted table had no Notes-style category text/highlight colors.
- This is now a genuine rich-payload compatibility defect, not the previous HTTP limitation. Keep M03-T02 blocked and route the color representation through `M03-T01-FIX-02`.

## Preconditions

- Build served over LAN HTTPS/HTTP reachable from the iPhone 14 Pro Max (same
  blocker class as the deferred M01 FIX-05 checks; if that runtime path is
  still unreachable, this whole gate stays deferred with it).
- One session exists on the iPhone with: at least one highlighted row per
  category if possible, one `none` row, one fully empty row, free-form values
  (`8,6`, `body weight`, `8.75 + 1 weight kg`), a manual summary override,
  multi-line bottom notes.
- A target note in Apple Notes to paste into (the canonical Gym note).

## HV-M03-1 — Rich paste attempt (ClipboardItem HTML + plain)

1. Open the session screen in Safari on the iPhone.
2. Tap **Copy to Notes**. Expected status line: `Copied to Notes ✓`.
3. Switch to Apple Notes, open the Gym note, long-press → **Paste** (once).
4. Record exactly what survives:
   - [ ] Table structure (real editable Notes table vs plain text lines)
   - [ ] Row/cell structure and order (date → legend → summary → table → notes)
   - [ ] All cell text intact (spot-check the weird values above)
   - [ ] Highlight/background colors per row
   - [ ] Foreground text colors per row
   - [ ] Readability in BOTH light and dark Notes appearance (the payload uses
         dark-mode colors on a dark block background; check white-on-white risk)
   - [ ] Manual summary override string appears verbatim
   - [ ] Multi-line notes keep their line breaks

## HV-M03-2 — Plain fallback behavior

1. If HV-M03-1 shows stripped/unusable structure, repeat the copy but force
   the plain path (e.g., paste into Notes after copying from a context where
   only text survives, or verify via the app's plain-only fallback state by
   denying clipboard rich write if iOS surfaces such a prompt).
2. Confirm:
   - [ ] Plain text contains all five columns plus the leading Category column
   - [ ] Category column names the color category (Arms/Back/Chest/Delts/Legs),
         empty for unhighlighted rows
   - [ ] Date/legend/summary/table/notes order preserved as text lines

## HV-M03-3 — Honest state reporting

- [ ] With clipboard permission denied (iOS Settings → Safari → deny, or
      first-prompt denial), the app shows
      `Copy failed — clipboard unavailable` and never `Copied to Notes ✓`.
- [ ] When only the plain representation can be written, the app says
      `Copied as plain text (rich formatting unavailable)`.

## HV-M03-4 — Verdict recording

Record per-item PASS/FAIL plus screenshots into `orchestration/evidence/`, and
update `orchestration/state/STATE.md` deferred list accordingly. Per spec
§15.4, judge in priority order: data preserved → table structure → colors →
pixel fidelity. A FAIL here must NOT be silently downgraded; it feeds the
documented-limitations list and possibly an RTF/native strategy decision
(spec §15.2), which is explicitly out of scope for this spike.

## FIX-02 Codex verification — secure-origin color retest required

- OX completed the bounded FIX-02 correction through the configured headless
  Desktop wrapper. The correction places the unchanged category foreground and
  background tokens on every colored `<td>` and its inline text `<span>`;
  `none` rows remain uncolored.
- Codex independently verified **141/141 tests**, `npm run build`, clean
  `git diff --check`, and the HTTPS runtime at
  `https://192.168.1.49:5173/` (HTTP 200; certificate resource HTTP 200).
- These are engineering results only. Apple Notes color survival remains
  **PENDING HUMAN RETEST** and M03-T02 remains blocked.

### Next iPhone retest

Using the trusted certificate and the same iPhone 14 Pro Max, open
`https://192.168.1.49:5173`, tap **Copy to Notes** once, and paste once into
the canonical Gym note. Record each result separately:

- [ ] Status says `Copied to Notes ✓`.
- [ ] Paste is a real editable Notes table.
- [ ] Date, legend, summary, row order, all values, weird free-form values,
      summary override, and multiline notes survive.
- [ ] Foreground text colors survive: Arms orange, Back purple, Chest mint,
      Delts blue, Legs pink; `none` rows remain default-colored.
- [ ] Background/highlight colors survive as subtle row/cell tints.
- [ ] The result remains readable in both light and dark Notes appearance.

If foreground or background colors fail again, record them separately with
screenshots if possible. Keep M03-T02 blocked; that result becomes platform
evidence for the next product/technical decision.

## FIX-03 Codex verification — secure-origin color retest required

- OX completed FIX-03 using the exact locked mapping: Arms orange, Back
  purple, Chest mint, Delts blue, Legs pink; `none` remains unhighlighted.
- The correction adds opaque derived highlight colors plus legacy-compatible
  `<td bgcolor>`, `<font color>`, cell CSS, and text-run CSS while preserving
  the existing table/data/fallback contract.
- Codex independently verified **153/153 tests**, `npm run build`, clean
  `git diff --check`, and the HTTPS runtime at
  `https://192.168.1.49:5173/` (app HTTP 200; certificate resource HTTP 200).
- Apple Notes color survival remains **PENDING HUMAN RETEST**. M03-T02
  remains blocked.

### Next iPhone retest

Use the trusted HTTPS URL on the iPhone 14 Pro Max, copy once, and paste once:

- [ ] Real editable Notes table and all values/order remain correct.
- [ ] Foreground text colors appear: Arms orange, Back purple, Chest mint,
      Delts blue, Legs pink.
- [ ] Text highlight/background colors appear for the same categories.
- [ ] `none` rows remain unhighlighted and the result is readable in both light
      and dark Notes appearance.

If either color channel still fails, record foreground and background
separately and keep M03-T02 blocked for the next product/technical decision.

## Recorded FIX-03 iPhone retest result — 2026-08-24

- Device: **iPhone 14 Pro Max**, trusted HTTPS build.
- User result: **no category color appeared** after the FIX-03 retest.
- **Editable table/data: PASS as previously reported.**
- **Foreground text colors: FAIL.**
- **Text highlight/background colors: FAIL.**
- FIX-03 is now recorded as platform interoperability evidence, not another
  unverified implementation defect. Three bounded HTML representations have
  been independently tested: row-level CSS, per-cell/text-wrapper CSS, and
  opaque legacy-compatible text-run/cell markup.
- Open escalation: `orchestration/escalations/E-003-apple-notes-colors-platform-limit.md`.
  M03-T02 remains blocked pending a product/technical decision about a
  native/RTF/Shortcuts spike, accepting the color limitation, or another
  explicitly approved route.

## Recorded FIX-02 iPhone retest result — 2026-08-24

- Device: **iPhone 14 Pro Max** on the trusted HTTPS build.
- The user reconfirmed that the pasted table and all values are correct.
- **Foreground text colors: FAIL.** No category colors appeared in Apple
  Notes.
- **Text highlight/background colors: FAIL.** No Apple Notes-style highlight
  colors appeared either.
- Product clarification: the intended result is the five Apple Notes highlight
  choices mapped from the supplied screenshots/spec — Arms orange, Back purple,
  Chest mint, Delts blue, Legs pink — applied to the exercise/table text. The
  visible legend remains only those five categories; `none` is unhighlighted.
- This is routed to `orchestration/tasks/M03-T01-FIX-03.md`. M03-T02 remains
  blocked. No color acceptance is claimed.
