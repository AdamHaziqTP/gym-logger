# M03-T03 — bounded Shortcuts colour-recovery feasibility

## Role

You are OX Alpha, the bounded implementation worker. Explore one practical
optional PWA → iOS Shortcuts → Apple Notes route for preserving the five Gym
Logger category colours. Codex will independently review the diff, tests,
build, and runtime evidence. Physical iPhone proof remains a human gate.

## Product decision and boundaries

- The product owner explicitly reopened Apple Notes colour recovery on
  2026-08-25. This supersedes the earlier decision to stop colour experiments.
- Keep the existing one-tap `Copy to Notes` action unchanged and reliable. It
  remains the uncoloured editable-table fallback and must not regress.
- Do not run more HTML clipboard variants already disproven by the prior
  iPhone evidence.
- Do not build a native helper, native rewrite, paid Apple Developer route,
  cloud service, account, or generic fitness feature. A native attributed-string
  helper requires a later product decision if this branch fails.
- Do not claim that a desktop test proves Apple Notes table editability or
  colours.
- Preserve the user's existing uncommitted workflow-policy edits in
  `orchestration/product-orchestrator/WORKFLOW_SPEC.md` and
  `orchestration/product-orchestrator/bootstrap.mjs`; do not touch those files.

## Preferred route to investigate

Use the lowest-friction file/share handoff that the current PWA can provide:

1. Reuse the existing self-contained `buildNotesHtml(session)` output as the
   source representation.
2. Where the platform supports file sharing, create an in-memory `.html` file
   with MIME type `text/html` and share it through the existing Web Share
   capability. Keep the operation inside the user's tap gesture.
3. Prepare one-time Shortcuts instructions for a shortcut that accepts a File
   or Rich Text input, extracts/receives the HTML, uses Apple's `Make Rich Text
   from HTML` action, then uses Notes `Create Note` or `Append to Note`.
4. Prefer a single optional action such as `Share for Notes Colours`; do not
   silently replace or rename `Copy to Notes`. Hide/disable the optional action
   truthfully when file sharing is unavailable.

If the exact Shortcuts handoff cannot be implemented safely from the PWA,
record the narrowest reason and stop this branch rather than inventing a
different clipboard representation. Do not add manual MIME/RTF plumbing for
the user.

## Required engineering work

- Add the smallest reusable pure/helper contract needed to create the HTML
  handoff file and identify whether file sharing is available. Keep the
  existing clipboard writer and status wording untouched.
- Add an optional SessionView action only if the handoff can be invoked as a
  normal user gesture without disrupting the existing export zone.
- Add a concise, exact one-time Shortcut setup document under
  `orchestration/evidence/` that clearly labels what is and is not proven.
- Add focused automated tests for file name/MIME/payload fidelity, feature
  detection, share outcome honesty, and unchanged legacy Copy to Notes behavior.
- Do not claim success for Notes table structure or colours in worker output;
  state that target-iPhone execution is required.

## Acceptance

- Existing Notes payload/clipboard tests remain green.
- New focused tests plus the full suite pass with zero unhandled failures.
- `npm run build` and `git diff --check` pass.
- HTTPS runtime smoke confirms the normal PWA shell and optional route assets.
- Codex review decides whether the optional route is technically ready for one
  physical iPhone proof. If it is not a credible low-friction route, reject
  the branch with evidence and recommend keeping the accepted baseline or
  requesting a separate native-helper decision.
