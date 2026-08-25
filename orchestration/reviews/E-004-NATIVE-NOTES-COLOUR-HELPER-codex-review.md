# Codex review — E-004 native Apple Notes colour-helper proof

Review status: `SOURCE-VERIFIED; DEVICE-PROOF-BLOCKED`

## Acceptance checklist

- [x] Isolated from `src/` and the existing PWA clipboard path.
- [x] Uses the canonical 40-row fixture and preserves the intentional 40/39
  summary override.
- [x] Emits one pasteboard item with native plain text, HTML, and RTF data.
- [x] HTML has a semantic table, inline colours, and UTF-8 declaration.
- [x] RTF has a real table, colour table, and Unicode escapes.
- [x] One obvious user-triggered copy action; no Notes automation.
- [x] Platform-neutral harness: 12/12 checks passed.
- [x] Existing PWA regression suite/build remain green: 359/359 and build pass.
- [ ] Swift/Xcode compilation — unavailable on this Windows workstation.
- [ ] iPhone installation and Apple Notes paste — human/device gate.

## Finding

The source proof is the smallest credible native route found: a one-screen
helper, one bundled canonical fixture, and one native pasteboard item. It is
appropriate for one device experiment if a legitimate iOS build/install route
is available.

The native APIs and source representation do not prove that Apple Notes will
choose RTF/HTML, preserve table editability, retain colours, or decode Unicode
correctly. Those remain the only meaningful success criteria for E-004.

## Stop rule

If the helper cannot be compiled/installed without disproportionate recurring
friction, or if the target iPhone loses table structure/colours/Unicode, close
E-004 and keep the standard uncoloured editable-table PWA path. No further
native format iteration is authorized by the current decision.
