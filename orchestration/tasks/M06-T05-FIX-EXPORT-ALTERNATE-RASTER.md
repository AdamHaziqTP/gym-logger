# M06-T05 correction — restore preview and replace unstable PNG raster path

## Role

You are OX Alpha, bounded implementation worker. Codex independently verifies
the result. Use the existing DSH Desktop headless invocation and return a
report or explicit failure; do not silently idle.

## New target-device evidence

After checkpoint `fa57dcb`:

- Faithful/Compact export preview now shows nothing — regression.
- Saved output still has the same blank/transparent failure.
- The product owner did not observe the new pixel-guard message.
- Previously passing preview and Close/dismissal behavior must be restored.

## Required work

1. Restore the previously known-good SVG preview behavior first. Keep preview
   rendering independent from PNG generation so a failed rasterizer cannot
   blank or suppress the preview.
2. Stop making incremental changes to the same iOS Safari
   SVG → Image → Canvas → PNG path. Evaluate and implement one materially
   different offline-first client-side rasterization strategy for actual PNG
   delivery. A pure-JS/WASM SVG rasterizer or equivalent deterministic route
   is preferred if a suitable dependency/implementation is practical within
   this repository. Do not add a backend, cloud service, native rewrite, or
   SVG-only product fallback.
3. Preserve Faithful and Compact layout/content, five category colours,
   notes, Unicode, output filename/MIME, normal preview, and Close/dismissal.
4. Add tests that inspect actual generated bitmap content for non-transparent
   visible pixels, not only PNG signature, dimensions, MIME, Blob/File
   existence, or a resolved share promise.

## Boundaries

- Do not reopen Apple Notes colours or Shortcut variants.
- Do not remove the existing reliable Copy to Notes path.
- Do not claim target-iPhone success from desktop tests.
- If the alternative rasterizer cannot be implemented safely in this bounded
  task, report the concrete blocker and leave the known-good preview restored;
  do not introduce a speculative large dependency.

## Acceptance

- Focused tests, full suite, build, runtime smoke, and diff hygiene pass.
- Codex audits that preview failure cannot be caused by PNG preparation.
- Return one saved-image-only physical retest; do not ask for preview or Close
  checks unless the correction demonstrably changes them.
