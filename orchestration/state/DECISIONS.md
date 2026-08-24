# Gym Logger decisions

## Locked product decisions

- Apple Notes remains the canonical archive; Gym Logger is a local convenience layer.
- Target is an iPhone-first Home Screen PWA, not a native app by default.
- No account, backend, Supabase, cloud sync, analytics, AI, timers, checklists, programs, streaks, or generic exercise database.
- All visible table cells are unrestricted strings. Preserve values such as `body weight`, `8,6`, and `8.75 + 1 weight kg` exactly.
- Fixed columns are `Exercise | Sets | Reps | Weight | Skip`.
- A row-level highlight choice applies across the row. Labels are `Arms`, `Back`, `Chest`, `Delts`, `Legs`; `None` remains available for other work.
- Normal behavior is clone the latest session into today's local date, then edit freely with autosave and no finish state.
- Skipped rows remain in the session and count toward totals. `Skip` is plain text.
- Summary totals can be manually overridden; the seed's `40 sets / 39 exercises` mismatch is intentional.
- History is reverse chronological with simple local search. Historical sessions remain editable. Deleting an app copy does not affect Apple Notes.

## Implementation choices to validate

- New-session `Skip` and bottom notes default to cleared because they describe the new day; source values remain available in the source session.
- The first vertical slice uses the simplest reliable horizontal table behavior. It must preserve Notes-like usability; frozen Exercise-column behavior is a later comparison, not an invented requirement.
- The first vertical slice may use a browser-visible seed/import path for development, but must not hardcode generic fitness behavior or discard the supplied fixture.

## Product escalation rule

If the spec, references, and this file do not determine a user-facing behavior, pause only the affected branch and write an escalation with the conflicting evidence, options, and recommendation. Do not let OX invent the product decision.

## Human-gate correction decision — 2026-08-24

The product owner directed the M01 correction loop to close the approved current-session resume, category legend, and Notes-style row interaction after the physical-iPhone gate exposed them as missing. These are genuine specification gaps, not new generic fitness features. M02 remains blocked until the correction is independently verified and the device gate is repeated.

## Final legend decision — 2026-08-24

The visible session legend contains only the five Apple highlight navigation categories: Arms, Back, Chest, Delts, and Legs. `none` remains an internal unhighlighted/white state for abs and other uncategorized rows; it is not a sixth visible legend category.

## Human-gate deferral / full-auto authorization — 2026-08-24

The product owner reported that the temporary LAN/local-host build is not reachable on the physical iPhone 14 Pro Max and explicitly chose not to block continued engineering on the remaining M01 physical-iPhone checks. The previously listed FIX-05 interaction checks are considered low-risk enough to defer to the final end-to-end device acceptance pass when the app has a reliably reachable/installable build.

This is a product-process decision, not evidence that HV-01 through HV-05 passed. Record the current FIX-05 device gate as BLOCKED/DEFERRED due to unreachable temporary runtime. Codex may resume the orchestrated implementation workflow and advance beyond M01 based on the independently green automated checkpoint, while preserving all deferred physical-device checks for a later final human acceptance gate. Continue in full-auto mode through bounded milestones and only return to the product owner for genuinely unresolved product decisions, required secrets/credentials, or human-only device/visual checks that cannot reasonably be deferred.

Do not reinterpret this as permission to waive the final real-iPhone acceptance of Apple Notes interoperability, PNG export, offline/installability, or any other human-only behavior required by the specification before the project is declared complete.

## E-002 rich Apple Notes paste decision — 2026-08-24

Choose the trusted HTTPS verification path. Do **not** accept HTTP plain-text-only copying as the product limitation at this stage.

Reasoning: `Copy to Notes` is a core v1 acceptance criterion and the authoritative spec explicitly prioritizes preservation of a real editable table after data fidelity, with category/highlight colours next. The HTTP LAN result only proves that the scoped plain-text fallback preserves the session data; it does not test the intended secure rich-clipboard path at all. Therefore it is premature to downgrade the product before exercising the supported HTTPS path on the target iPhone.

Codex is authorized to arrange the simplest trusted HTTPS build/origin for the existing PWA and repeat the M03-T01 iPhone paste gate there. This is an infrastructure/verification step, not authorization for a native rewrite or a product redesign. Preserve the HTTP plain-text fallback permanently as a truthful resilience path.

M03-T02 remains blocked until the HTTPS retest records what Apple Notes actually preserves. If HTTPS rich paste still fails to produce an editable table, return that concrete device evidence to the product decision bridge. At that point the product owner can choose between documenting plain-text-only as the accepted limitation or authorizing a bounded RTF/native/Shortcuts strategy investigation under the existing spec. Do not jump to native implementation before that evidence exists.

## E-003 Apple Notes colour interoperability decision — 2026-08-25

Authorize **one bounded native/RTF/Shortcuts feasibility spike** before accepting colour loss as a permanent v1 limitation.

Reasoning: the trusted-HTTPS iPhone evidence now proves that the PWA can transfer a real editable Apple Notes table with correct data and ordering, but Apple Notes strips both foreground and highlight colours after three independently verified HTML payload strategies. Colour is a meaningful navigation aid in the authoritative product design, so it is worth one narrowly scoped investigation beyond WebKit HTML before downgrading the requirement. However, this decision does **not** authorize a native rewrite, a paid Apple Developer dependency, or a broad architecture change.

The spike must compare the lowest-friction routes that could preserve both an editable Notes table and the five category colours, with this preference order:

1. Keep the PWA and use a lightweight iOS Shortcuts/Notes handoff if it can preserve table editability, data, and colours reliably.
2. Test an RTF/attributed clipboard or file-handoff route only if it can be exercised without redesigning the app.
3. Test a minimal native helper/wrapper only as a feasibility proof, and only if it does not imply a paid Apple Developer subscription or fragile recurring installation burden as a v1 requirement.

Success requires target-iPhone evidence that the resulting Apple Notes content preserves: real editable table structure, all values/order, the five category mappings, and usable colours. A route that preserves colours but converts the workout into a non-editable image is not a success for Copy to Notes.

Timebox the investigation to one bounded spike with no production rewrite. If none of these routes produces a materially better, low-friction result, stop the branch and return evidence to the product bridge. At that point the default product decision is to accept the current editable rich-table paste **without colours** as a documented v1 platform limitation, preserve the working plain-text fallback, and continue M03 rather than spiral into repeated clipboard experiments.

M03-T02 remains blocked only for the duration of this bounded feasibility spike and its required decision/evidence return.
