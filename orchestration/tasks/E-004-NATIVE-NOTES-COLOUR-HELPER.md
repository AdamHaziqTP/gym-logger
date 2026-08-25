# E-004 — bounded native Apple Notes colour-helper feasibility proof

## Role

You are OX Alpha, the bounded implementation worker. Build one isolated,
minimal iOS helper proof for native pasteboard interoperability. Codex will
independently inspect the diff, run all available verification, and decide
whether the proof is ready for one target-iPhone test.

## Authoritative trigger and boundaries

- The target iPhone 14 Pro Max physically failed M03-T03 Shortcuts. Evidence:
  `orchestration/evidence/M03-T03-HUMAN-SHORTCUTS-RESULT.md`.
- E-004 is explicitly authorized in
  `orchestration/escalations/E-004-NATIVE-NOTES-COLOUR-HELPER.md`.
- Keep the existing PWA, `src/`, normal `Copy to Notes`, and optional Shortcuts
  route unchanged. Do not modify product code to depend on this helper.
- Do not build a native Gym Logger app, sync service, share backend, App Store
  product, or general-purpose editor.
- Do not require a paid Apple Developer subscription as a v1 dependency. If a
  physical proof cannot be installed without a Mac/signing route that is not
  available, document that as an explicit infrastructure gate rather than
  pretending the helper succeeded.
- Do not start a second native format experiment after this bounded proof.
- Preserve the user's existing uncommitted edits in
  `orchestration/product-orchestrator/WORKFLOW_SPEC.md` and
  `orchestration/product-orchestrator/bootstrap.mjs`.

## Proof goal

Determine whether a tiny native helper can put richer native pasteboard data on
the iOS pasteboard so that pasting once into the existing Apple Notes `Gym`
note preserves all of the following:

1. a real editable Notes table;
2. date, five-entry legend, row order, values, summary override, and notes;
3. the five category foreground/highlight colours;
4. Unicode such as `·`, `°`, curly punctuation, and arbitrary free-form cell
   values without mojibake.

The proof may use the exact canonical `seed/latest-session.example.json` as a
bundled fixture. It must retain the intentional `40 sets · 39 exercises`
summary override and the full 40-row order so the device result is meaningful.

## Implementation requirements

Create a self-contained proof under `orchestration/feasibility/E-004-native/`
or an equally isolated `native-feasibility/` folder. Do not place Swift code
under `src/`.

The smallest acceptable helper is an iOS Swift/SwiftUI app or equivalent
minimal Xcode project with:

- one screen and one obvious action such as **Copy Gym Session to Pasteboard**;
- the canonical seed fixture bundled or mechanically verified against the
  repository fixture;
- one pasteboard item containing, at minimum:
  - `public.utf8-plain-text` with correct native Unicode;
  - `public.html` containing a semantic table and inline five-category colours;
  - `public.rtf` containing a real RTF table, a colour table, and Unicode `\\uN?`
    escapes for non-ASCII text;
- `UIPasteboard.general.setItems` used only inside the button action;
- no direct automation of Apple Notes and no claim that the paste succeeded;
- a simple README with the minimum install/test steps and a clear statement
  that the target iPhone must paste into the existing `Gym` note.

If an Xcode project cannot be safely generated in this environment, provide
the smallest buildable Swift source set plus an honest toolchain/install
blocker report. Do not fabricate an IPA or device result.

## Independent verification required from the worker

- deterministic payload tests or a platform-neutral harness pin exact Unicode,
  table markers, colour representations, and data/order;
- project/source audit proves all three pasteboard representations are present;
- no production PWA files changed;
- report states whether local Xcode/Swift compilation was actually run;
- no claim of Apple Notes editability/colour success without target-iPhone
  evidence.

## Acceptance boundary

Codex will accept this task only as `READY_FOR_TARGET_IPHONE_PROOF` if the
helper is genuinely minimal, isolated, installable through a documented
low-friction route, and independently verified. If it cannot preserve both
editable table structure and colours on the device, or installation burden is
disproportionate, close E-004 and retain the standard uncoloured editable-table
PWA path for v1. Do not continue iterating native pasteboard types after that
decision.
