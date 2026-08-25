# M06-T05 iPhone export delivery retest

Date: 2026-08-25
Device: iPhone 14 Pro Max
Status: `FAIL — SAVED PNG REMAINS FULLY TRANSPARENT AFTER 0cb9b46`

Physical result supplied by the product owner during the consolidated PWA acceptance pass:

- **PASS — Faithful preview:** the Faithful export preview now visibly renders the workout on the iPhone instead of showing the earlier blank/black preview.
- **PASS — Compact preview:** the Compact export preview now visibly renders the workout on the iPhone instead of showing the earlier blank/black preview.
- **PASS — mobile dismissal:** the Close control is easy to read and use.
- **FAIL — save-to-device image delivery:** after saving the export to the device, the resulting saved image is not the rendered workout. The product owner reports a black image / white-looking thumbnail rather than the actual export image.

This is target-device evidence. Do not mark PNG delivery accepted from the successful in-app previews. The remaining defect is narrowed to the generated/saved image payload or save/share delivery path on iPhone rather than the preview surface itself.

## Retest after correction checkpoint `0cb9b46`

The product owner physically retested both Faithful and Compact saved outputs after the PNG delivery correction was pushed and product-sync refreshed.

- **FAIL — Faithful saved output:** supplied saved PNG is blank in Photos.
- **FAIL — Compact saved output:** supplied saved PNG is blank in Photos.
- Direct inspection of the two user-supplied PNG files shows that both are RGBA images whose RGB channels are all zero and whose alpha channel is also zero for every pixel. In other words, the files are **fully transparent PNGs**, not merely black-rendered workout images.
  - Faithful evidence file dimensions: `1520 × 4842`.
  - Compact evidence file dimensions: `1520 × 2456`.
- This proves the current failure is in raster serialization/output content: dimensions are produced, but no visible pixels survive into the saved PNG payload.
- Previously passed in-app preview and mobile Close behavior remain accepted unless a subsequent correction regresses them.

Route another bounded correction specifically around iPhone rasterization/PNG serialization. The correction must verify non-transparent pixel content in the produced bitmap, not only file signature, dimensions, MIME type, or successful Blob creation. Preserve the working SVG preview and dismissal behavior. After independent automated verification, return only the saved-image branch for physical retest.
