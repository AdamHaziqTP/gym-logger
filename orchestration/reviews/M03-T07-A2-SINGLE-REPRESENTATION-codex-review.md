# Codex review — M03-T07-A2 single-representation sufficiency

## Review disposition

`ACCEPTED FOR AUTOMATED SCOPE — TARGET-IPHONE SUFFICIENCY GATE OPEN`

The isolated helper now supports exact single-representation replay from the
real captured payload. This does not claim that any representation is
sufficient until it is pasted into Apple Notes on the iPhone 14 Pro Max.

## Independent audit

- [x] Phase A removal evidence remains recorded as a physical PASS for all
      tested removal variants, with redundancy correctly distinguished from
      sufficiency.
- [x] Single replay retains only the requested captured type for every item and
      preserves item order.
- [x] Blank, missing, and unreadable requested types fail without a full-capture
      fallback.
- [x] UI exposes correctly interpolated `Replay ONLY <type>` controls while
      preserving full replay and removal controls.
- [x] Normal PWA `Copy to Notes` and all `src/`/`public/` production files are
      unchanged.
- [x] Native contract checks: 23/23 PASS.
- [x] PWA regression suite: 410/410 PASS; `npm run build`: PASS;
      `git diff --check`: PASS.
- [x] DSH AgentTeams/OX Alpha was attempted through the verified Desktop
      wrapper; the fresh task timed out silently and the bounded Codex fallback
      was independently verified. This is not classified as OX unavailable.
- [x] Hosted macOS/Xcode workflow `32952585740` compiled and packaged the A2
      helper; Codex verified the IPA contains the helper app and bundled
      fixture.

## Remaining gate

Install the fresh hosted helper build and run the displayed single-type replay
buttons on the target iPhone. Do not start generated Gym Logger payload
synthesis or Shortcut append until at least one single type or minimal set
passes editable-table, five-colour, content, and Unicode fidelity.
