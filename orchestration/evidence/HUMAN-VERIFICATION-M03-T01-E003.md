# HUMAN VERIFICATION — M03-T01-E003 Apple Notes colour feasibility

**Status: CLOSED BY PRODUCT DECISION — feasibility harness not adopted for v1.**

The engineering spike was accepted automatically, but no non-HTML route is being
adopted into v1. The product owner is not required to continue probing auxiliary
RTF/file/Shortcuts workflows.

## Preconditions

- Device: **iPhone 14 Pro Max**.
- Trusted feasibility URL prepared by engineering: `https://192.168.1.49:5173/feasibility/`.
- The intended harness offered RTF clipboard, RTF file, HTML file and optional Shortcuts probes.

## Recorded product-owner evidence — 2026-08-25

- Device: **iPhone 14 Pro Max**.
- The owner reported that another Copy-to-Notes attempt still produced **no category colour** in Apple Notes.
- The owner also reported that the additional feasibility instructions/routes were not understandable enough to be a reasonable personal-workflow requirement.
- Existing trusted-HTTPS evidence remains authoritative for the standard app path: a real editable Apple Notes table and correct values/order are preserved, while category foreground/highlight colours are stripped.
- The auxiliary RTF/file/Shortcuts routes were **not fully exercised**, so this record does not claim that every technically possible route failed.
- Product conclusion: the extra setup/probing friction is itself outside the desired simple one-tap workflow. Do not require further human feasibility testing for v1.

## Product disposition

Accept the current standard PWA rich paste as the v1 behavior:

- **PASS:** editable Apple Notes table.
- **PASS:** correct values and row order.
- **PASS:** summary/data fidelity from the previously verified rich path.
- **LIMITATION:** Apple Notes strips Arms/Back/Chest/Delts/Legs foreground/highlight colours from the cross-app paste.
- **FALLBACK:** retain the working plain-text copy path for insecure/unsupported clipboard environments.

The app itself must continue preserving and displaying the five category colours. The colour loss applies only to the Apple Notes transfer.

Do not start another open-ended RTF/native/Shortcuts experiment for v1. A future route may be reconsidered only if it is materially simpler and can be proven without adding recurring setup, paid developer requirements, or a fragile install workflow.

## Additional iPhone visual feedback captured during this gate

The supplied iPhone screenshot shows the Home screen's **Copy Another Session** button visually clipping/overlapping the **History** button below it. Treat this as a genuine responsive-layout defect to fix before final product acceptance. It does not need to block M03 clipboard continuation.
