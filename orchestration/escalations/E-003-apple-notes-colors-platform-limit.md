# E-003 — Apple Notes strips category colors from editable HTML table paste

**Status:** RESOLVED — bounded feasibility route authorized  
**Milestone:** M03-T01 Copy to Apple Notes  
**Opened:** 2026-08-24  
**Resolved:** 2026-08-25

## Evidence

On the trusted HTTPS build and the target iPhone 14 Pro Max:

- the app reports rich copy success;
- Apple Notes receives a real editable table;
- all values and table content survive;
- category foreground colors and text-highlight/background colors do not
  survive.

This result persisted through three bounded payload representations:

1. row-level inline CSS;
2. per-cell and text-wrapper inline CSS;
3. opaque derived colors plus `bgcolor`, `<font color>`, cell CSS, and
   text-run CSS.

Codex independently verified the third correction at 153/153 tests, passing
build, diff audit, and HTTPS runtime. The remaining failure is therefore
platform interoperability evidence, not an unverified worker defect.

## Product decision

Authorize one bounded native/RTF/Shortcuts feasibility spike specifically for
Apple Notes color-preserving editable transfer before accepting colour loss as
a permanent v1 limitation.

This does **not** authorize a native rewrite, a paid Apple Developer dependency,
or a broad architecture change.

Preference order:

1. Keep the PWA and test a lightweight iOS Shortcuts/Notes handoff if it can
   preserve editable table structure, all values/order, and the five category
   colours.
2. Test an RTF/attributed clipboard or file-handoff route only if it can be
   exercised without redesigning the app.
3. Test a minimal native helper/wrapper only as a feasibility proof and only if
   it does not make a paid Apple Developer subscription or fragile recurring
   installation burden part of v1.

A route succeeds only if the target iPhone proves that Apple Notes receives a
real editable table with correct data/order and usable category colours. An
image-only transfer is not a Copy-to-Notes success.

The investigation is timeboxed to one bounded spike. If no materially better,
low-friction route works, stop the branch and return the evidence to the product
bridge. The default follow-up decision will then be to accept the existing
editable rich-table paste without colours as a documented v1 platform
limitation, preserve the truthful plain-text fallback, and continue M03 rather
than repeat open-ended clipboard experiments.

M03-T02 remains blocked only for this bounded feasibility spike and its evidence
return.

## Later engineering research note (2026-08-25)

Authoritative Apple documentation confirms that RTF/attributed strings can carry
font and color attributes and that native pasteboards can expose multiple rich
representations, while WebKit documents HTML as the browser rich-clipboard
representation. That supports the earlier conclusion: a native/RTF-capable
producer could be technically viable, but it is not a direct PWA-to-iPhone
Notes guarantee and would require a separate native/helper/Shortcuts workflow.
The three bounded HTML attempts plus the user's trusted-HTTPS iPhone result
remain the controlling product evidence; this note does not reopen E-003 or
change the accepted v1 limitation.
