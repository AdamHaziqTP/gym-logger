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

## E-003 final v1 disposition — 2026-08-25

Close the feasibility branch and **accept editable Apple Notes rich paste without category colours as a documented v1 iOS/Notes limitation**.

The standard trusted-HTTPS path already satisfies the two highest-priority transfer requirements: the workout arrives as a real editable Apple Notes table, and the values/order are correct. Apple Notes strips the category foreground/highlight colours. The bounded RTF/file/Shortcuts harness was implemented and verified, but requiring the product owner to learn auxiliary transfer routes adds workflow friction that conflicts with the product's core goal of making Notes logging simpler, not more complicated.

The product owner explicitly reported that the extra feasibility instructions/routes were not understandable enough to be useful and that another standard Copy-to-Notes attempt still had no colours. Treat that usability cost as sufficient reason to stop the branch even though every theoretical auxiliary route was not physically exhausted.

V1 rules from this decision:

- Keep the one-tap rich Copy to Notes path that produces an editable table.
- Keep all values/order/data fidelity.
- Document that category colours do not survive the Apple Notes cross-app paste on iPhone.
- Keep the five colours fully intact inside Gym Logger itself.
- Retain the truthful plain-text fallback for unsupported/insecure clipboard environments.
- Do not add RTF/native/Shortcuts setup to the normal v1 workflow.
- Do not run further open-ended clipboard experiments before v1 completion.

M03-T02 is now unblocked for Codex to continue automatically.

## iPhone Home layout defect — 2026-08-25

The product owner supplied an iPhone 14 Pro Max screenshot showing **Copy Another Session** visually clipping/overlapping the **History** button beneath it on the Home screen. This is a genuine responsive-layout defect, not a product ambiguity.

Codex should route a bounded correction before final acceptance. The fix must preserve the sparse Home layout and should not redesign the navigation. This defect does not block M03 clipboard continuation.

## Batch human verification / overnight full-auto policy — 2026-08-25

The product owner is unavailable for repeated device checks for the remainder of the current work period and explicitly authorizes Codex to maximize autonomous progress before asking for more human testing.

Operational rule:

- Continue full-auto through every bounded implementation milestone, correction, automated test, build check, runtime check, code review, and non-human acceptance step that can be completed from the authoritative product sources.
- **Do not stop at a human-only iPhone/visual gate if that gate can be safely deferred without creating architectural ambiguity or risking destructive work.** Record it as DEFERRED/PENDING and continue with independent branches/milestones.
- Accumulate deferred device/visual checks into **one consolidated final iPhone acceptance pass** once the app is as complete, polished, reachable/installable, and internally verified as possible.
- The final consolidated pass should include the already-deferred M01 touch/legend checks, Home overlap correction, offline/installability, Faithful/Compact PNG export, final Notes copy behavior, and any other human-only iPhone checks accumulated later.
- Only interrupt the product owner before that final pass for a genuinely blocking product decision that the spec/references/recorded decisions cannot resolve, required secrets/credentials, destructive/high-impact approval, or a human-only result whose outcome determines the architecture of subsequent work and therefore cannot reasonably be deferred.
- Do not mark deferred human checks PASS from automation. Preserve them as unresolved evidence until the final physical-device pass.
- If a later task is technically dependent on a human gate but can be built behind an isolated assumption without irreversible work, proceed with the lowest-risk spec-consistent assumption and record it for the consolidated acceptance pass rather than waking the product owner immediately.

This policy is intended to let Codex/OX finish as much of v1 as possible unattended and then present the product owner with one concise final test checklist rather than a sequence of small interruptions.

## Final iPhone failure correction authorization — 2026-08-25

The first consolidated iPhone 14 Pro Max pass exposed concrete failures that supersede the previous `HUMAN_REVIEW_REQUIRED` stopping condition for the affected branches. Codex is authorized to resume full-auto correction work immediately and should use DSH/OX Alpha as the primary builder where practical, with normal independent Codex verification.

Observed release-blocking failures from the physical iPhone:

- Faithful export preview is blank/black.
- Compact export preview is blank/black.
- Export Image is difficult to dismiss on mobile and lacks an obvious reliable close/escape control in the supplied screenshots.
- The supposedly trusted local HTTPS origin still presents Safari's `Connection Not Private` / `Not Secure` state after the supplied certificate/profile was installed, forcing the product owner through a manual visit interstitial.
- The installed Home Screen icon is only a plain `G`; treat this as placeholder-level polish and replace it with a deliberate, minimal Gym Logger icon without broad visual redesign.

Correction policy:

- Treat the current final human gate as failed for these branches and resume bounded autonomous correction rather than asking for more human testing now.
- Fix image preview/render/delivery on iPhone-compatible WebKit paths, not merely desktop mocks.
- Add an obvious and reliable mobile dismissal path for Export Image while preserving the existing sparse interface.
- Repair the local certificate/origin setup so the final test environment is genuinely trusted by Safari; do not call the origin trusted while iOS still presents a certificate warning/interstitial.
- Replace the `G` icon with a simple deliberate Gym Logger icon consistent with the current minimal product identity; this is polish, not a branding redesign.
- Independently run focused tests, the full suite, build, HTTPS/runtime/static-host checks, and diff hygiene after each correction.
- Do not ask the product owner to retest each individual fix. Batch the corrections and return one new consolidated iPhone pass once all automatable correction work is complete.

The session text pasted into the product conversation does **not** reopen E-003 by itself: plain text cannot demonstrate colour survival. Apple Notes category-colour transfer remains the accepted v1 limitation unless the product owner explicitly changes that product decision.

## Final iPhone correction batch — 2026-08-25

The consolidated iPhone 14 Pro Max acceptance pass found genuine release
failures: Faithful and Compact image previews were blank/black, the Export
Image mobile sheet was hard to dismiss, the local HTTPS origin was still not
trusted normally on the device after the certificate/profile attempt, and the
Home Screen icon appeared placeholder-like. These are bounded corrections, not
new product scope. Route them through M06-T05, keep Apple Notes colour loss as
the accepted v1 limitation, and request one consolidated retest only after
independent automated verification and a repaired HTTPS setup.

## Apple Notes colour recovery reopened — 2026-08-25

The product owner has now explicitly asked to pursue a way to preserve the category highlight/text colours when transferring a workout into Apple Notes. This supersedes the earlier instruction not to run further colour experiments, but it does **not** invalidate the existing one-tap uncoloured rich-copy path; that path remains the reliable fallback/baseline.

Authorize one new **bounded, practical colour-recovery branch** with the following order and constraints:

1. **Preferred route: iOS Shortcuts rich-text handoff.** Build/test the lowest-friction PWA-to-Shortcuts flow that can take the session's self-contained HTML/rich representation, convert it using iOS Shortcuts rich-text capabilities, and create/append it to Apple Notes. The target is a real editable Notes table with correct data/order and the five category highlight/text colours.
2. Keep the normal PWA `Copy to Notes` button unchanged until the coloured route is physically proven. If a coloured route succeeds, expose it as an optional clearly named action rather than silently replacing the reliable baseline.
3. Do not require the product owner to understand RTF, MIME types, or manual file plumbing. Codex should make setup as close to one-time/one-tap as practical and provide exact simple device instructions only when a physical proof is ready.
4. If the Shortcuts path cannot preserve both table editability and colours, stop that route and return evidence. Do not start an open-ended series of HTML variants already disproven by prior iPhone evidence.
5. A native attributed-string/pasteboard helper may be proposed only as a **separate subsequent product decision** if Shortcuts fails; do not start a native rewrite or paid Apple Developer dependency automatically.
6. Success requires target-iPhone evidence: editable Notes table, correct date/legend/order/values/summary/notes, and visible category colours. Image-only export is not a Copy-to-Notes success.

This colour-recovery branch may proceed in parallel with the remaining final iPhone acceptance work. Failure of the optional coloured route must not regress the already working editable uncoloured Notes transfer.

## E-004 native Apple Notes colour-helper proof — 2026-08-25

The target-iPhone M03-T03 Shortcuts route is now physically failed and closed.
It flattened the workout into plain text, lost all five colours, and mangled
Unicode such as `·` and `°` into `Â·` and `Â°`. Do not iterate that Shortcut or
try more HTML variants.

Authorize exactly one bounded native attributed-string/pasteboard feasibility
proof. The helper must remain isolated from the PWA and normal `Copy to Notes`
path, use the canonical session fixture, and test native Unicode, HTML, and
RTF/pasteboard representations against the existing Apple Notes `Gym` note.
It must prove a real editable table, correct data/order/summary/notes, all five
category colours, and correct Unicode on the target iPhone before any colour
claim is accepted.

This is not authorization for a native Gym Logger rewrite, a paid Apple
Developer dependency, direct Notes automation, or an ongoing native workflow.
If the helper cannot prove editable table plus colours, or installation burden
is disproportionate, close E-004 and retain the standard uncoloured editable
table as the v1 baseline.

## E-004 parked pending legitimate iOS toolchain — 2026-08-25

The native helper source proof is preserved, but this Windows workstation has
no Swift/Xcode toolchain and therefore cannot compile, sign, install, or run
the helper on the target iPhone. Park E-004 as
`BLOCKED/DEFERRED — NEEDS MAC/XCODE`; do not classify the native idea as a
failure, buy a service, or delete/redesign the proof.

E-004 does not block completion of the otherwise accepted PWA v1. Resume the
consolidated PWA/iPhone acceptance workflow for the remaining image export,
dismissal, installability/trust, offline, Home icon/layout, table interaction,
backup/restore, and ordinary uncoloured Notes-copy checks. Reopen E-004 only
when a legitimate Mac/Xcode or equivalent iOS build/install route is available.

## M06-T07 final polish — 2026-08-26

The latest physical iPhone pass confirms that Compact and Faithful PNG export,
the Tuesday migration, offline behavior, backup/import/export, and ordinary
editable Copy to Notes are functionally good. The remaining bounded polish is:

- Compact is the preferred initial export style; Faithful remains available as
  the secondary style.
- Add a direct **Share Colour Snapshot** action near Copy to Notes. It shares
  the already-working Compact PNG as an image snapshot and must not be
  described as an editable Notes export or replace Copy to Notes.
- Remove Cut from the personal row menu. Paste replaces the selected row's
  contents while retaining that row's identity, position, and row count.
- Version the existing deliberate Gym Logger icon URLs/assets and require a
  one-time remove-from-Home-Screen then fresh re-add for iOS cache refresh.
- Keep E-004 `BLOCKED/DEFERRED — NEEDS MAC/XCODE`; do not reopen Shortcuts or
  HTML colour experiments. Apple Notes colour loss remains the accepted v1
  limitation for the normal editable-table path.

The three bounded M06-T07 OX tasks were each dispatched through the verified
DSH Desktop headless wrapper. Each produced no usable output or repository
delta within its bounded task window, so Codex used the permitted fallback and
independently verified the resulting batch. This is recorded as a task-level
worker timeout, not as evidence that the wrapper or OX provider is unavailable.

## Apple Notes colour recovery reopened — 2026-08-26

The product owner explicitly reopens Apple Notes colour recovery as a
high-priority bounded investigation. The previous v1 acceptance of uncoloured
editable Notes paste is superseded for this investigation, but the existing
normal `Copy to Notes` path remains the reliable fallback and must not regress.

Investigate in this order:

1. **WebKit native selection-copy proof:** render the canonical coloured table
   as a real offscreen DOM tree, select it with a DOM `Range`, and invoke the
   browser's native `document.execCommand("copy")` path inside the user gesture.
   Do not intercept `copy`, call `clipboardData.setData`, or use
   `ClipboardItem` in this proof.
2. **Clipboard fingerprint:** if needed, inspect the web-visible clipboard
   types and sanitized HTML from a small coloured table copied directly from
   Apple Notes, then compare it with Gym Logger's generated payload.
3. **Direct Shortcut bridge:** separately test
   `shortcuts://run-shortcut?name=...&input=clipboard` with a Shortcut that
   initially only appends Shortcut Input to the existing Gym note. Do not use
   Get Text or Make Rich Text from HTML in this experiment.
4. **Native helper / toolchain proof:** only after the web experiments,
   extend E-004 to inspect and replay the real native pasteboard types, and
   investigate a GitHub-hosted macOS build artifact for the isolated helper.

No HTML styling permutation already tested is authorized. No native Gym Logger
rewrite, paid Apple Developer membership, or automatic colour claim is
authorized. Success still requires target-iPhone proof of an editable table,
correct Unicode/data/order, and all five colours.

## M03-T04 closed; proceed to Notes clipboard fingerprint — 2026-08-26

The target-iPhone WebKit native-selection-copy proof is closed as a genuine
colour-fidelity failure. Apple Notes received a real editable table with the
intentional short fixture, representative values, order, summary, notes, and
Unicode intact, but stripped all five category colours. The short Sunday
fixture was deliberate and is not a product defect.

Do not iterate HTML/CSS encodings or the WebKit selection-copy route further.
Proceed with exactly one isolated Stage 1 diagnostic: copy a small coloured
table directly in Apple Notes, then use `navigator.clipboard.read()` on the
trusted HTTPS fingerprint page to capture web-visible item/type order, text
payloads, byte lengths, and hashes without writing to or mutating the
clipboard. The diagnostic must not alter production `Copy to Notes`.

If the Notes-origin web-visible payload contains no colour-bearing
representation, advance the already-authorized E-004 native helper branch to
inspect and replay the actual native pasteboard. Do not claim colour support
from desktop evidence or from the fingerprint alone.

## M03-T05 fingerprint result; exact HTML replay next — 2026-08-26

The product owner supplied a valid target-iPhone fingerprint JSON. Apple Notes
exposed `text/html` and `text/plain`; the HTML is 184,878 UTF-8 bytes and
contains an actual table plus explicit Apple Notes colour-bearing markup.
Observed exact tokens include Arms `rgb(255, 146, 48)` with
`rgba(255, 146, 48, 0.15)`, Back `rgb(219, 52, 242)`, Chest
`rgb(0, 218, 195)`, Delts `rgb(0, 145, 255)`, and Legs `rgb(255, 55, 95)`,
with matching translucent backgrounds.

This is evidence about the browser-visible source representation, not yet
evidence that Safari is allowed to write it back with equal fidelity. Preserve
the complete fixture unchanged and run exactly one isolated replay using the
captured HTML and matching plain text in a `ClipboardItem`. Do not sanitize,
regenerate, simplify, substitute colour tokens, or change production `Copy to
Notes` before the physical replay result exists.

If exact replay preserves an editable table and all five colours, compare the
captured HTML with the existing generator and then implement only a bounded
Notes-compatible generator. If exact replay fails, record that browser-read
HTML is not equivalent to a writable Notes pasteboard representation and only
then advance E-004 native inspection.

## M03-T06 closed; advance E-004 native pasteboard inspection — 2026-08-26

The target-iPhone exact replay of the complete Apple Notes-generated HTML
preserved the editable table, data/order, summary, notes, and Unicode, but
stripped all five category colours. This closes the browser-HTML recovery
branch. Do not iterate HTML/CSS markup, colour tokens, Apple-specific classes,
or additional WebKit clipboard variants.

Advance the already-authorized E-004 native feasibility proof. The helper must
first inspect the actual pasteboard produced by Apple Notes after copying a
small coloured table, enumerate type identifiers in fidelity order, record
byte sizes and hashes, export raw payloads where permitted, and replay the
captured representations unchanged. Run representation-removal tests only if
exact replay preserves both an editable table and all five colours. Do not
synthesize Gym Logger payloads until the colour-bearing representation is
identified.

Reopen the GitHub-hosted macOS/Xcode build route for this isolated helper. A
free-account/device-test route is allowed for this one-time feasibility proof;
no paid Apple Developer membership, native PWA rewrite, or change to the
production Copy to Notes path is authorized.

## E-004 native capture/replay result — 2026-08-26

The product owner supplied target-iPhone evidence that the helper captured a
coloured Apple Notes table and replayed it back into Notes with an editable
table, all five category colours, correct data/order, and Unicode intact.
This resolves the **exact native capture/replay** question in favour of the
native route.

This result does not prove that a newly generated Gym Logger workout can be
synthesized into the same native representation, and it does not prove a
PWA-to-helper handoff. Therefore:

- keep the normal PWA `Copy to Notes` path unchanged;
- keep the isolated helper and hosted build artifacts preserved;
- allow one bounded productization task to evaluate the smallest honest
  structured-data handoff and user flow;
- do not claim automatic coloured Gym Logger export until a generated workout
  is physically pasted into Notes and verified on the target iPhone; and
- do not expand this into a native rewrite, paid Developer requirement, or
  open-ended Notes reverse-engineering effort.

## M03-T07 native route productization disposition — 2026-08-26

The bounded review after the successful native capture/replay proof found no
safe implementation that can generate a new Gym Logger workout in the proven
colour-preserving native Notes format. The existing helper can replay an exact
captured Notes item, but its synthetic plain/HTML/RTF builder is not a proven
colour-bearing generated route, and the raw native capture needed for a
deterministic transformation is not present in the repository.

Close M03-T07 without changing production code. Keep the ordinary editable
uncoloured PWA Notes path and Compact colour snapshot. Preserve E-004 as an
isolated proof. Do not add a coloured Notes export action or claim direct Notes
append. Re-open only if the raw capture is available and a new bounded
generated-workout target-iPhone proof is authorized.
