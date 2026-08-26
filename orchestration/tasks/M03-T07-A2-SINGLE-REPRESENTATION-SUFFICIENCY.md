# M03-T07-A2 — Single-representation native Notes sufficiency

Status: `HUMAN_REVIEW_REQUIRED — A2 HELPER BUILD READY`
Owner: OX Alpha builder, Codex acceptance
Scope: isolated E-004 diagnostic helper; no native rewrite and no PWA change

## Context

The target iPhone proved exact captured Apple Notes replay and then passed every
single-representation removal variant. Those removal results show redundancy,
not sufficiency: a colour-bearing alternative may still remain in each replay.

## Bounded implementation

The helper now discovers unique readable/non-empty captured type identifiers and
offers `Replay ONLY <type>` for each. A single replay contains only the exact
captured payload for the requested type for every captured item, in the original
item order. A missing, blank, or unreadable requested type fails clearly and
never falls back to the complete capture.

The preferred targets are `public.rtf`, `com.apple.flat-rtfd`, `public.html`,
`com.apple.webarchive`, `com.apple.notes.richtext`, and
`public.utf8-plain-text` as a negative control, when present. The list remains
dynamic to match the actual device capture.

## Acceptance

- each displayed single-type replay is physically tested on the iPhone 14 Pro
  Max;
- the pasted result is an editable Notes table;
- all five category colours survive;
- date, row order, values, summary, notes, and Unicode survive;
- no PWA source/public file or normal Copy to Notes behavior changes;
- Codex independently verifies the helper contract, PWA suite, build, and diff
  hygiene;
- generated Gym payload synthesis and Shortcut append remain blocked until a
  sufficient representation or minimal set is identified.

## Next human evidence

Record the result in
`orchestration/evidence/HUMAN-VERIFICATION-E-004-PHASE-A-REMOVAL-VARIANTS.md`.
If a type passes, it becomes the only candidate for the next generated-workout
proof. If none passes, close the representation-sufficiency branch with that
evidence rather than guessing at private formats.
