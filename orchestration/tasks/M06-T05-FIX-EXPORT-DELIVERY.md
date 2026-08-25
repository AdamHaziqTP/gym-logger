# M06-T05 correction — iPhone PNG/save delivery

## Role

You are OX Alpha, the bounded implementation worker. Correct only the
target-iPhone PNG/save/share delivery defect recorded in
`orchestration/evidence/HUMAN-VERIFICATION-M06-T05-EXPORT-DELIVERY-RETEST.md`.
Codex will independently verify the result.

## Physical evidence

- Faithful SVG preview: PASS.
- Compact SVG preview: PASS.
- Mobile Close/dismissal: PASS.
- Saving/sharing the generated image to the iPhone: FAIL; the saved result is
  black/white-looking instead of the rendered workout image.

## Boundaries

- Preserve the now-working preview and Close/dismissal paths.
- Do not reopen Apple Notes colours, native helper work, or unrelated final
  iPhone checks.
- Do not replace the PWA or add a server/cloud/native dependency.
- Keep the deterministic SVG renderer and the existing `Gym-YYYY-MM-DD.png`
  filename contract.
- Diagnose the actual browser delivery pipeline: SVG image decode, canvas
  rasterization/encoding, Blob/File construction, and Web Share/download.
- Use the narrowest reversible iPhone-compatible fix. Do not claim that a
  share promise proves Photos/Files saved the correct pixels.

## Acceptance

- Add focused automated coverage for the corrected PNG serialization/delivery
  contract where the browser environment permits it, including non-empty valid
  PNG bytes and the exact filename/MIME.
- Existing image renderer tests remain green.
- Full test suite, `npm run build`, and `git diff --check` pass.
- Codex independently audits that preview/dismissal code was not regressed.
- Return the saved-image branch for one physical retest only; do not ask for
  Faithful/Compact preview or Close retesting unless those paths changed.
