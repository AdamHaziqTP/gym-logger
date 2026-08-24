# E-003 — Apple Notes strips category colors from editable HTML table paste

**Status:** OPEN — product/technical decision required  
**Milestone:** M03-T01 Copy to Apple Notes  
**Opened:** 2026-08-24

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

## Decision required

Choose one route for the product requirement:

1. **Authorize a native/RTF/Shortcuts technical spike** specifically for
   Apple Notes color-preserving paste. This expands the implementation route
   and must prove that table editability, values, and the five mappings remain
   intact before any rewrite is proposed.
2. **Accept the current PWA rich paste without colors** as a documented v1
   limitation, retaining the correct values/table and the plain-text category
   fallback. This does not satisfy the current color acceptance criterion.
3. **Keep M03-T01 open for another product-approved technical route** if Adam
   has a specific Apple Notes workflow or reference clipboard source to test.

No M03-T02 work is authorized until this decision is recorded. The app's own
five-color editor mapping remains intact; only cross-app Apple Notes color
transfer is unresolved.

