# E-004 native Notes colour route — productization disposition

Updated: 2026-08-26

## Verified capability

On the product owner's iPhone 14 Pro Max, the isolated helper captured an
Apple Notes table from the native pasteboard and replayed the captured item
back into Notes. The reported result preserved an editable table, all five
category colours, values/order, and Unicode.

That is a successful **exact captured-payload replay** proof.

## Boundary that remains unproven

The proof did not generate a new Gym Logger workout. The helper's synthetic
fixture action writes ordinary `public.utf8-plain-text`, `public.html`, and
`public.rtf` representations; the repository has no target-device evidence
that those synthesized representations preserve Notes colours. The supplied
report also does not include the raw captured payloads needed to safely inspect
or transform the Apple-private/native representation.

Consequently, none of these claims is currently justified:

- the PWA can directly inject the colour-bearing native Notes representation;
- a JSON/share/custom-URL handoff alone creates a coloured editable Notes
  table;
- replacing text inside a captured private payload is safe or deterministic;
- a helper can append a generated workout directly to the existing `Gym` note.

## Route evaluation

| Route | Disposition | Reason |
|---|---|---|
| Normal PWA `Copy to Notes` | Keep in production | Real editable table and data/order are proven; Notes colour loss is the accepted baseline. |
| Compact colour snapshot | Keep in production | Preserves the visual colour treatment as an image, but is not an editable Notes table. |
| Exact native capture/replay | Preserve as isolated proof | Colours and editability are proven only for the captured Notes item itself. |
| PWA JSON/share handoff to helper | Not productized | It would safely move data only; no colour-bearing generated native payload is proven. |
| Private-payload transformation | Deferred | Requires the actual raw capture plus bounded transformation tests and a new target-iPhone generated-workout proof. |
| Direct Notes append/custom URL automation | Not claimed | No supported, tested path exists in the current isolated helper, and automatic append is not a v1 dependency. |

## Current product recommendation

Ship the PWA v1 behavior already accepted: use `Copy to Notes` for the
editable table/data path and Compact colour snapshot when the visual category
treatment matters. Keep the native helper and hosted build artifacts for a
later, explicitly bounded investigation. Do not add a misleading
`Export to Notes (Colours)` button until a newly generated Gym Logger session
has passed the same editable-table/five-colour/Unicode test on the target
iPhone.

## Re-open criteria

Re-open only with the raw native capture available and a concrete bounded plan
to transform one canonical Gym Logger session. The first re-open task must
identify the minimum representation by removal tests, then build one generated
workout payload, run the platform-neutral checks, and request one physical
paste proof. It must not alter the normal PWA Notes path while the proof is
inconclusive.
