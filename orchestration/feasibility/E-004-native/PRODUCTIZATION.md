# E-004 native Notes colour route — productization disposition

Updated: 2026-08-26

Status: `PHASE B READY — GENERATED FLAT-RTFD DEVICE PROOF REQUIRED`

## Verified capability

On the product owner's iPhone 14 Pro Max, the isolated helper captured an
Apple Notes table from the native pasteboard and replayed the captured item
back into Notes. The reported result preserved an editable table, all five
category colours, values/order, and Unicode.

That is a successful **exact captured-payload replay** proof.

## Reopened Phase A — representation-removal harness

The product decision now reopens this branch for one controlled experiment. The
repository does not contain the raw payload files from the earlier device
capture, so the helper performs the safe part of the experiment on-device after
a fresh capture: it discovers each non-empty captured type identifier and
offers one `Replay without ...` action per identifier. Each variant preserves
the other captured representations and the original item order.

This is an isolated diagnostic capability, not a production PWA change. The
variant buttons are only evidence-generating; no representation is declared
colour-bearing until the owner pastes that variant back into Apple Notes on the
iPhone 14 Pro Max and records the result. Phase B generated-workout synthesis
and Phase C Shortcut append remain blocked until Phase A identifies a useful
minimum representation, or the branch is closed with evidence.

## Reopened Phase A2 — single-representation sufficiency

Phase A showed that removing any one representation still left a
fidelity-preserving alternative. The helper now exposes the complementary
experiment: after inspection, it offers one `Replay ONLY <type>` action for
each unique readable, non-empty type in the fresh capture. The action writes
only that exact captured representation for every captured item and preserves
the captured item order. Missing or unreadable requested types fail clearly;
they never fall back to the complete capture.

The preferred target types are `public.rtf`, `com.apple.flat-rtfd`,
`public.html`, `com.apple.webarchive`, `com.apple.notes.richtext`, and
`public.utf8-plain-text`, when present in the device capture. The helper remains
dynamic so the physical test can cover the identifiers Apple actually exposes.

## Phase B — generated Gym Logger flat-RTFD proof

Phase A2 physically proved that captured `com.apple.flat-rtfd` alone preserves
the required Apple Notes fidelity. The helper now generates a new payload from
the bundled canonical `latest-session.example.json` fixture instead of reading
or transforming captured Notes bytes. It creates the existing coloured RTF
table, packages it as a Foundation `FileWrapper` with `TXT.rtf`, serializes the
package, and places only `com.apple.flat-rtfd` on the pasteboard for the
dedicated proof action.

This is still an isolated feasibility helper. It does not change the PWA or
claim that generated Gym Logger data works until the target iPhone paste proves
an editable table, all five colours, correct content/order/notes, and Unicode.
Phase C Shortcut append remains blocked until that generated payload passes.

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

## Current next gate and re-open criteria

The next gate is the generated Gym Logger flat-RTFD paste described in
`orchestration/evidence/HUMAN-VERIFICATION-E-004-PHASE-B-GENERATED-FLAT-RTFD.md`.
The Phase B helper is ready from hosted macOS/Xcode workflow `32956758287`;
the artifact contains the generated flat-RTFD proof action and bundled
fixture. Only after the target-iPhone result should the project attempt
Shortcut append. It must not alter the normal PWA Notes path while the proof is
inconclusive.
