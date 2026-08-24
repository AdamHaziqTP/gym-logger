# Product-orchestrator commissioning report

Date: 2026-08-24
Pilot: Gym Logger (`AdamHaziqTP/gym-logger`)
Scope: reverse-channel integration, reusable workflow package, builder-request safety, and bootstrap tooling only. No Gym Logger product milestone was advanced.

## A. Fully automated and live-verified

- The GitHub connector can create the designated bridge Issue #1, add an issue comment, and read the comment back. The comment used the structured `product-sync-decision` envelope and was explicitly synthetic.
- Local Codex logic opens an escalation with a stable ID and context revision, accepts one current scoped decision, records it in `DECISIONS.md`, appends an acknowledgement/ledger entry, resolves only that escalation, and republishes context.
- Duplicate/replay protection, stale revision rejection, scope validation, action allow-lists, authority validation, and high-impact approval checks are implemented and covered by tests.
- Builder-switch requests are first-class scoped decisions. Codex validates the configured registry and launcher, records the change, updates the project overlay, and retains the previous builder on an unavailable request. No worker is started by the request path.
- The product-sync Node tests pass: 3 tests, 3 passed. The Gym Logger TypeScript/Vite production build passes.

## B. Automated but polling/manual-resume dependent

- `node orchestration/product-sync/publish.mjs poll-decisions` processes repository-inbox JSON artifacts.
- `node orchestration/product-sync/publish.mjs poll-github` processes the configured issue when an authenticated `gh` CLI is available. This machine has GitHub CLI installed but is not authenticated, so that script path was not live-polled here.
- The GitHub issue transport itself was live write/read verified through the connected GitHub tooling. An existing ChatGPT conversation still needs no transcript copy/paste, but neither ChatGPT nor this repository can wake a dormant Codex session automatically.

## C. Not supported or not verified

- Direct programmatic injection into or wake-up of an existing ChatGPT conversation is not supported by the current environment and is not claimed.
- The GitHub connector’s write tools are available to this Codex environment, but the write permission of the specific dedicated ChatGPT product conversation is account- and connector-dependent. The protocol therefore supports both issue comments and a repository-file inbox.
- A true event-driven Codex wake-up requires an external scheduler/webhook runner. It is intentionally outside this pilot.

## D. Everyday workflow for Adam

1. In the dedicated product conversation, connect the project repository and ask it to read `orchestration/product-sync/PRODUCT_CONTEXT.md`.
2. For a new idea, invoke the `product-orchestrator` skill and let the conversation reverse-prompt through the domain-relevant PRD/handoff sections before implementation.
3. Codex bootstraps the control plane, plans bounded tasks, delegates to the configured DSH worker, independently verifies, and republishes context.
4. When the packet contains an open escalation, the product conversation discusses it with Adam and writes exactly one structured decision comment on the configured GitHub issue. If issue comments are unavailable, it writes one JSON file under `orchestration/product-sync/inbox/`.
5. Codex runs `poll-github` (with authenticated `gh`) or `poll-decisions`, validates the response, applies only its scope, acknowledges it, and resumes the affected engineering branch.
6. Device, visual, subjective, release, and destructive gates remain explicit human PASS/FAIL/BLOCKED records.

## E. Bootstrap steps for Grow a Biz and Treason

From each existing repository:

```powershell
node orchestration/product-orchestrator/bootstrap.mjs --root C:\path\to\repo --project-id grow-a-biz --project-name "Grow a Biz" --repository-url https://github.com/<owner>/<repo> --docs PRD.md,docs --references references --legacy-transcripts migration\legacy-transcripts
```

Use the equivalent `treason` identifiers for Treason. Then reconcile the generated `MIGRATION_MANIFEST.json` against the actual PRD, references, current milestone/state, and known-good git checkpoint. Configure the real DSH worker registry and launcher, create/connect the project’s product-sync GitHub issue, publish the packet, and start Codex at the recorded current milestone. Legacy transcripts are supplementary migration evidence only; they do not override current product documents or Codex verification.

## F. Reusable package and activation

- Installed Codex skill: `C:\Users\adam4\.codex\skills\product-orchestrator\SKILL.md`
- Pilot workflow snapshot and adapters: `orchestration/product-orchestrator/WORKFLOW_SPEC.md`, `CHATGPT_ADAPTER.md`, and `CODEX_ADAPTER.md`
- Pilot machine bridge: `orchestration/product-sync/publish.mjs`
- Pilot bootstrap: `orchestration/product-orchestrator/bootstrap.mjs`
- Product-chat template: `C:\Users\adam4\.codex\skills\product-orchestrator\references\chatgpt-template.md`

Future Codex sessions can invoke the skill by saying “use the product-orchestrator workflow for this project.” A new product conversation should use the product-chat activation template and connect the repository. The repository’s versioned workflow snapshot remains the portable project contract.

## Product safety boundary

The designated bridge issue is a transport only. It does not authorize M02, DSH execution, destructive operations, release, or any human gate. Gym Logger remains at its prior M01 final physical-iPhone verification gate.
