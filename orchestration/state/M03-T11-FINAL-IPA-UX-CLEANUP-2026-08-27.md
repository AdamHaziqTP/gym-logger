# Product decision — M03-T11 final one-app IPA UX cleanup

Date: 2026-08-27
Status: `AUTHORIZED`

## Human result establishing the baseline

The one-app Gym Logger IPA has physically proven the desired coloured Notes flow on the target iPhone:

Gym Logger IPA -> native coloured clipboard -> Apple Notes opens -> one manual Paste -> fully correct coloured table.

Do not regress this path.

## Final session-screen simplification

The product owner explicitly prefers the following normal session actions:

1. **Copy Coloured Notes & Open Notes** — keep as the sole Notes-copy action.
2. **Save Colour Snapshot** — Compact image only, saved directly to the iPhone Photos library / Camera Roll.

Remove from the normal session UI:

- the old ordinary uncoloured `Copy to Notes` button;
- the full `Export Image` modal/preview flow;
- the Compact/Faithful style selector;
- the Faithful image option;
- the current share-sheet/download-based `Share Colour Snapshot` behavior.

Underlying rendering code may remain internally if useful for tests or reuse, but these redundant controls should not remain visible in the product UI.

## Save Colour Snapshot behavior

`Save Colour Snapshot` must use the existing Compact PNG rendering and save directly to Photos through the native one-app bridge rather than relying on browser download/share-sheet delivery.

Preferred implementation:

- generate the existing Compact PNG from the currently visible session state;
- send the PNG bytes/data from the bundled web UI to the native Swift bridge;
- native Swift decodes the PNG and saves it to Photos using the appropriate iOS Photos API;
- use add-only Photos authorization where available;
- include the required Photos add usage description in the IPA bundle metadata;
- on first use, request the minimum permission required to add the image;
- report truthful UI states such as `Saving…`, `Saved to Photos ✓`, `Photos permission denied`, or `Save failed`;
- do not claim success merely because a share sheet or Files picker opened;
- preserve the filename/date semantics internally where useful, although Camera Roll insertion is the primary acceptance criterion.

The button should operate on the **visible session state**, including unsaved/free-form edits, using the same visible-state rule already used by Notes/image export.

## Acceptance

Target-iPhone acceptance requires:

- old `Copy to Notes` no longer visible;
- full `Export Image`/preview/Faithful UI no longer visible;
- one `Save Colour Snapshot` action remains;
- tapping it saves the Compact PNG directly into Photos/Camera Roll;
- the saved image is visible in Photos and has correct full-frame geometry/content/colours;
- the existing one-app coloured Notes action still opens Notes and produces the fully correct coloured editable table after one manual Paste;
- no regression to workout editing, persistence, history, backup/import/export, settings, or offline use.
