# E-004 — Native Apple Notes colour helper feasibility

Status: `AUTHORIZED_FOR_BOUNDED_FEASIBILITY`
Date: 2026-08-25

## Trigger

The target-iPhone M03-T03 Shortcuts route was physically exercised and failed: it appended flattened plain text into the existing `Gym` note, lost all five category colours, and introduced UTF-8 mojibake such as `Â·` and `Â°`. See `orchestration/evidence/M03-T03-HUMAN-SHORTCUTS-RESULT.md`.

## Product decision

Authorize exactly one bounded native attributed-string / pasteboard helper feasibility proof.

This is **not** authorization to replace Gym Logger's PWA architecture or to add a paid Apple Developer Program dependency. The existing uncoloured `Copy to Notes` path remains the stable baseline and must not regress.

## Goal

Determine on the target iPhone whether a minimal native helper can take the same workout/session representation and place richer native pasteboard representations on the iOS pasteboard such that pasting into Apple Notes preserves:

1. a real editable Notes table;
2. correct date, legend, order, values, summary, and notes;
3. all five category colours;
4. correct Unicode text without mojibake.

## Preferred proof

Keep the helper minimal. Generate an attributed representation from the session HTML/data and write appropriate rich native pasteboard representations alongside safe HTML/plain fallbacks. The feasibility proof may require the user to open the helper and then paste once into the existing `Gym` note; direct programmatic editing of Apple Notes is not required for this proof.

Codex should research the smallest viable iOS implementation and packaging route, use OX Alpha as builder where practical, and independently verify the implementation. The target-device result remains a human gate.

## Stop condition

If the helper cannot preserve both editable table structure and category colours in Apple Notes, or if the installation/usage burden is disproportionate to the benefit, close the colour-recovery branch and retain the uncoloured editable-table baseline for v1. Do not continue with open-ended pasteboard-format experiments.
