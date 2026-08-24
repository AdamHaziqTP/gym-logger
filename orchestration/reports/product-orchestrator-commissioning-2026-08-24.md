# Product-orchestrator commissioning report

Date: 2026-08-24
Pilot: Gym Logger (`AdamHaziqTP/gym-logger`)
Scope: reverse-channel integration, reusable workflow package, builder-request safety, and bootstrap tooling only. No Gym Logger product milestone was advanced.

## A. Fully automated and live-verified

- The GitHub connector can create the designated bridge Issue #1, add an issue comment, and read the comment back. The comment used the structured `product-sync-decision` envelope and was explicitly synthetic.
- The supported Codex app thread bridge sent a user-visible commissioning message to the existing product conversation `6a8bc798-0620-83ec-8c94-4daeb6eeab19`.
- Local Codex logic opens an escalation with a stable ID and context revision, accepts one current scoped decision, records it in `DECISIONS.md`, appends an acknowledgement/ledger entry, resolves only that escalation, and republishes context.
- Duplicate/replay protection, stale revision rejection, scope validation, action allow-lists, authority validation, and high-impact approval checks are implemented and covered by tests.
- Builder-switch requests are first-class scoped decisions. Codex validates the configured registry and launcher, records the change, updates the project overlay, and retains the previous builder on an unavailable request. No worker is started by the request path.
- The product-sync Node tests pass: 3 tests, 3 passed. The Gym Logger TypeScript/Vite production build passes.

## B. Automated but polling dependent

- `node orchestration/product-sync/publish.mjs poll-decisions` processes repository-inbox JSON artifacts.
- The active local Codex automation polls every five minutes, processes the configured issue when an authenticated `gh` CLI is available, and can notify the product conversation through the supported thread bridge. This machine has GitHub CLI installed but is not authenticated, so the user must complete the one-time login below.
- The GitHub issue transport itself was live write/read verified through the connected GitHub tooling. No transcript copy/paste or manual Codex resume is needed after authentication and automation activation.

## C. Not supported or not verified

- Instant event-driven wake-up is not implemented; the current safe automation checks every five minutes. A webhook/service could reduce latency later, but is not needed for the durable workflow.
- The GitHub connector’s write tools are available to this Codex environment, but product-chat GitHub write permission remains account-dependent. The Codex app thread bridge is the verified notification path; GitHub Issue/repository inbox remains the durable decision path.

## D. Everyday workflow for Adam

1. In the dedicated product conversation, connect the project repository and ask it to read `orchestration/product-sync/PRODUCT_CONTEXT.md`.
2. For a new idea, invoke the `product-orchestrator` skill and let the conversation reverse-prompt through the domain-relevant PRD/handoff sections before implementation.
3. Codex bootstraps the control plane, plans bounded tasks, delegates to the configured DSH worker, independently verifies, and republishes context.
4. The local automation notifies the product conversation when the packet contains a new open escalation. The conversation discusses it with Adam and writes exactly one structured decision comment on the configured GitHub issue. If issue comments are unavailable, it writes one JSON file under `orchestration/product-sync/inbox/`.
5. The same automation runs `poll-github` (with authenticated `gh`), validates the response, applies only its scope, acknowledges it, and resumes the affected engineering branch.
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

## One-time action required from Adam

In a terminal on this machine, run:

```powershell
gh auth login
```

Choose GitHub.com, HTTPS, and the browser login flow. Confirm that `gh auth status` succeeds. After that, the active automation will poll Issue #1 every five minutes and use the supported app thread bridge for new escalations. No token should be pasted into chat or committed to the repository.
