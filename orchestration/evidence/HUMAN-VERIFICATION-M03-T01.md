# HUMAN VERIFICATION — M03-T01 Apple Notes clipboard integration spike

**Status: OPEN — human-only gate. No automated or engineering result may mark
these items PASS.** The automated suite proves payload generation and button
behavior only (jsdom + fake-indexeddb). Whether anything survives a real
iPhone Safari → Apple Notes paste is unknowable from this workstation.

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
