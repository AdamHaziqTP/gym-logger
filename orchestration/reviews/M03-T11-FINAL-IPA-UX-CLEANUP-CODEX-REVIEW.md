# M03-T11 — Codex independent review

Status: `AUTOMATED SCOPE ACCEPTED — PHYSICAL DEVICE GATE OPEN`

## Implementation reviewed

Checkpoint: `fbcb062` (`feat: save compact snapshots directly to Photos`)

The session UI now contains only `Copy Coloured Notes & Open Notes` and
`Save Colour Snapshot` as export actions. The old ordinary Notes copy action,
Export Image modal/style controls, Faithful option, and share snapshot action
are absent from the rendered session flow.

The Compact snapshot captures the visible session state, rasterizes the
existing Compact layout, base64-encodes the PNG, and sends it to the embedded
Swift bridge. Swift validates the PNG, requests only Photos add authorization,
creates the Photos asset directly, and reports `saving`, `saved`, `denied`, or
`failed` back to the web UI. The native coloured Notes path remains separate
and waits for its asynchronous completion event before claiming success.

## Independent verification

- `npm test -- --run --reporter=dot`: **PASS — 37 files, 410/410 tests**
- `npm run build`: **PASS**
- `node orchestration/ios/verify-one-app.mjs`: **PASS — 27/27 checks**
- `node orchestration/feasibility/E-004-native/verify.mjs`: **PASS**
- `git diff --check`: **PASS**

The first hosted attempt (`32990405957`) reached Swift compilation but exposed
an Xcode 15.4 API rename for `PHAssetCreationRequest`. Codex corrected the
call to `PHAssetCreationRequest.forAsset()` and reran the local checks above;
a replacement hosted build is required before claiming the IPA is ready.

No physical iPhone behavior is inferred from these checks. Hosted
macOS/Xcode compilation, IPA inspection, installation, Photos delivery, and
the final Notes paste remain separate gates.

## Worker routing record

The requested DSH alternatives were attempted before fallback:

- `Qwen/Qwen3.8-Flash-Next-FP8`: Desktop packaged DSH failed before worker
  startup with the `cordis:include` loader failure.
- `z-ai/glm-5.3-flash`: the same pre-worker Desktop loader failure.

The Codex subagent completed the bounded implementation in an isolated
worktree; Codex inspected and cherry-picked the scoped change. No OX Alpha
dispatch was used for M03-T11.
