# M06-T05 framing correction — bounded

The latest iPhone evidence says Canvg PNGs are visible and correctly coloured, but Faithful and Compact content occupies only the top-left portion of the 2x canvas. Do not change the Canvg renderer, SVG layout, preview, save/share path, or product scope.

Inspect `src/domain/pngExport.ts`. The canvas is allocated at `width * scale` / `height * scale`, while Canvg draws the logical SVG at its intrinsic size. Apply the smallest safe Canvas 2D transform or equivalent so the existing SVG fills the supersampled delivery canvas before `hasVisiblePixels` and PNG serialization. Keep scale 1 behavior correct. Add/update focused tests to assert the delivery context receives the intended scale transform. Do not revert to `drawImage` or add a server/native dependency. Return a concise report.
