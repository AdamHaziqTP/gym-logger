# M03-T03 — Shortcuts colour-recovery feasibility report

Date: 2026-08-25
Status: `ACCEPTED_FOR_AUTOMATED_SCOPE; TARGET-IPHONE-PROOF-REQUIRED`

## Decision and scope

The product owner explicitly reopened Apple Notes colour recovery and
authorized one bounded iOS Shortcuts route. The existing one-tap `Copy to
Notes` path remains unchanged and remains the reliable uncoloured fallback.
No native helper, native rewrite, paid Apple Developer dependency, or further
open-ended HTML clipboard variants were introduced.

## Worker execution

OX Alpha was dispatched through the verified DSH Desktop headless wrapper with
`orchestration/tasks/M03-T03-SHORTCUTS-COLOUR-FEASIBILITY.md` and the active
product-sync patch. The invocation produced no output or repository delta in
the bounded 90-second window and was terminated after the wrapper remained
silent. Codex fallback implementation was used, consistent with the existing
infrastructure-failure policy; this did not consume an implementation defect
correction attempt.

## Implemented route

- `src/domain/notesShortcut.ts` creates a stable `text/html` file from the
  exact self-contained `buildNotesHtml` payload, checks file-share support, and
  reports only literal share outcomes.
- `SessionView` exposes an optional `Share for Notes Colours` action only when
  the OS file-share APIs are present. It does not replace or relabel `Copy to
  Notes`.
- The action hands `Gym-Logger-Notes.html` to the iOS share sheet from the tap
  gesture. It reports `Shared for Shortcuts`, not Apple Notes success.
- `orchestration/evidence/M03-T03-SHORTCUTS-SETUP.md` contains the one-time
  Shortcuts setup and the exact target-device proof checklist.

## Independent verification

- Focused Notes/clipboard/Shortcuts tests: **41/41 passed**.
- Full suite: **359/359 tests passed** across 31 test files.
- Production build: **passed**.
- `git diff --check`: **passed**.
- LAN HTTPS runtime: `https://192.168.1.49:4173/` returned HTTP 200 and
  `Gym Log`; manifest, service worker, icon, and built JavaScript assets all
  returned HTTP 200.
- Certificate endpoint: `http://192.168.1.49:5174/gym-logger-dev.cer` returned
  HTTP 200, `application/x-x509-ca-cert`, 793 bytes.

## Acceptance boundary

The engineering handoff is ready for one physical iPhone 14 Pro Max proof.
Desktop verification does **not** prove that Shortcuts accepts the HTML file,
that `Make Rich Text from HTML` preserves a real editable Notes table, or that
the five category colours survive into Apple Notes. If the route produces an
attachment/plain text or loses colours, record the bounded route as failed and
request a separate product decision before any native-helper work.
