# E-004 — Native Apple Notes colour helper feasibility

Status: `M03-T09 READY_FOR_REAL_SESSION_DEVICE_PROOF`
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

## Staged after M03-T04 — 2026-08-26

M03-T04's target-iPhone native WebKit selection-copy proof preserved the
editable table and data but stripped every category colour. E-004 remains
authorized and preserved, but Stage 1 web-visible clipboard fingerprinting is
required first. If Stage 1 cannot expose colour-bearing web representations,
advance this helper to native pasteboard inspection/replay and investigate a
GitHub-hosted macOS build plus a free-account device-test route. This remains
a bounded feasibility proof, not a PWA rewrite or paid Developer dependency.

The M03-T05 fingerprint did expose colour-bearing HTML, so E-004 is held
behind the single M03-T06 exact replay proof. If the byte-equivalent replay
fails on the target iPhone, E-004 becomes the next authorized branch; until
then, do not build or package the native helper.

## M03-T06 result; native inspection now authorized — 2026-08-26

M03-T06 physically failed only for colour: exact Notes-origin HTML replay
preserved an editable table and the fixture content but stripped all five
colours. The browser-HTML branch is closed. Advance E-004 to native pasteboard
inspection and exact replay; do not perform more HTML experiments.

The next helper must inspect the pasteboard Apple Notes actually produces,
including `public.rtf`, RTFD/flat-RTFD, HTML, webarchive, attributed-string
compatible data, and Apple-private identifiers where exposed. It must retain
type order, sizes, hashes, and permitted raw payloads, then replay the captured
item unchanged. Representation-removal tests and synthetic Gym Logger output
are allowed only after a successful exact replay proves the colour-bearing
representation.

The GitHub-hosted macOS/Xcode workflow is reopened to produce a truthful build
artifact or an explicit build blocker. No paid Developer dependency, native
rewrite, or production `Copy to Notes` change is authorized.

## M03-T08 result; M03-T09 fallback — 2026-08-26

Phase C was physically tested and failed at `cda3a58`: Shortcut append reached
the correct note and preserved a table, but stripped colours and concatenated
the legend. Close automatic append and do not iterate Shortcut or browser HTML
routes further.

The next bounded route is authorized and implemented: the production PWA sends
the selected/current session as a versioned JSON clipboard handoff to the
helper; the helper generates a fresh Apple Notes-shaped flat-RTFD item, writes
only `com.apple.flat-rtfd`, and opens Notes when possible. The user pastes once
manually. The bundled fixture remains diagnostic-only.

The new helper build and its real-session result still require a hosted
macOS/Xcode package and one target-iPhone proof. This is not a native rewrite,
does not require a paid Developer membership, and does not alter ordinary PWA
`Copy to Notes`.
