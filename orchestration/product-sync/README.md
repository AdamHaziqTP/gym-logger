# Product sync and worker registry

This is the pilot adapter for the generic product-orchestrator workflow. The versioned contract is in `../product-orchestrator/WORKFLOW_SPEC.md`.

## Data flow

```text
state + decisions + reviews + evidence + git
                    │
                    ▼
          product-sync/publish.mjs
             │                 │
             ▼                 ▼
   PRODUCT_CONTEXT.md  PRODUCT_CONTEXT.json
   compact human packet machine packet
                    │
                    ▼
       GitHub issue comment or repository inbox
```

Codex remains responsible for scope, acceptance, runtime checks, visual checks, corrections, and escalation. Builders implement bounded tasks only. The product conversation is the authority for unresolved product decisions and human verification.

## Files and commands

- `config.json` — project identity, authority order, publication paths, and bridge limitations.
- `workers.json` — builder registry and the verified Desktop wrapper boundary.
- `SYNC_STATE.json` — active builder and publication/event state; it does not replace `orchestration/state/STATE.md`.
- `generated/active-worker.patch.yml` — generated DSH overlay targeting the supported `agent-default-model` route.
- `inbox/` — fallback product decision artifacts written by the product conversation when issue comments are unavailable.
- `DECISION_LEDGER.jsonl` and `ACKNOWLEDGEMENTS.jsonl` — append-only Codex validation/application records.
- `publish.mjs` — publication, builder selection, and launch-preparation commands.
- `PRODUCT_CONTEXT.md` and `.json` — generated compact outputs.
- `PUBLICATION_HISTORY.jsonl` — small event history; detailed records stay in `orchestration/reports/` and `orchestration/reviews/`.
- `POLL_ERRORS.json` — bounded records of distinct poll failures; it is created only after a real poll error and is never written for a no-op.

Publish after dispatch, worker completion/failure, review acceptance/rejection, human verification, escalation/decision changes, or builder changes:

```powershell
node orchestration/product-sync/publish.mjs publish --event human-gate-recorded --summary "Human gate result recorded; M02 remains blocked."
```

The packet contains project identity/purpose, authority and precedence, current milestone/task/status, completed work, implementation changes, Codex and human verification, defects, escalations/decisions, evidence paths, git checkpoint, active builder, and next action. Raw transcripts are not copied into it.

## ChatGPT bridge

The repository target is configured and published at `https://github.com/AdamHaziqTP/gym-logger`. Connect GitHub in ChatGPT under Settings → Apps and grant access to this repository. The GitHub tooling available to this environment supports creating/updating repository files, creating issues, and adding issue comments; the write permission of a particular existing ChatGPT conversation is account-dependent and must not be assumed.

Minimum product-chat action once a connector exists:

> Read `orchestration/product-sync/PRODUCT_CONTEXT.md` as the latest engineering context. Ask Codex for linked verification evidence before treating implementation as accepted.

When a product decision is needed, the product conversation writes one `product-sync-decision-v1` JSON object as an append-only comment on the designated issue. If issue comments are not writable, it writes one JSON file under `orchestration/product-sync/inbox/`. Codex validates it with:

```powershell
node orchestration/product-sync/publish.mjs poll-decisions
# When an authenticated GitHub CLI is available:
node orchestration/product-sync/publish.mjs poll-github
```

The local automation polls every five minutes and can notify the existing product conversation through the supported Codex app thread bridge. Instant webhook wake-up is not implemented. Without the automation or a connector, Adam opens or attaches the packet; raw DSH/Codex transcript copy/paste is not required.

The poll commands are deliberately silent when they find nothing new. A processed decision still writes the canonical decision/acknowledgement records, while a poll failure is recorded once per distinct error signature in the bounded `POLL_ERRORS.json` file. No per-run log or temporary file is created in the project on a successful no-op. The Codex app may retain its own automation run history outside this repository; project code cannot remove that app-level history.

The decision schema and rejection rules are documented in `../product-orchestrator/WORKFLOW_SPEC.md`. A valid response must match the current `synchronization.contextRevision` and an open escalation. Replays, conflicts, stale responses, unrelated scopes, unavailable builders, and high-impact actions without explicit human approval are rejected and acknowledged.

## Builder switching

The verified DSH launcher has no model flag. DSH does expose `--patch`; an overlay targeting `agent-default-model` was verified with `--dump-config`. Switching therefore changes only project state and the generated overlay; it does not edit global `C:\Users\adam4\.dsh\settings.yaml`.

```powershell
node orchestration/product-sync/publish.mjs show-builder
node orchestration/product-sync/publish.mjs set-builder --builder openrouter-free --reason "Use the alternate configured route for the next bounded task."
node orchestration/product-sync/publish.mjs prepare-worker --task-file orchestration/tasks/M01-T01-FIX-05.md
```

`prepare-worker` prints the exact wrapper path, `--profile headless`, generated `--patch`, and task text. Codex then executes that prepared command through the existing loop. Switching does not reset state, bypass review, alter product docs, or authorize a milestone. An unknown/unavailable builder fails before writing state and retains the previous builder.

## Recovery and bootstrap

- On worker failure or DSH rate limiting, keep task/state/review records, publish the failure event, and follow the existing bounded correction policy.
- If a builder is unavailable, select the last known-good registry entry; this layer never edits global DSH settings.
- If output is stale, rerun `publish`; source-of-truth documents remain authoritative.
- For another project, run `node orchestration/product-orchestrator/bootstrap.mjs --root <project> --project-id <id> --project-name "<name>"`, then ingest the existing PRD/docs/references and current state into the generated manifest. Bootstrap is additive and does not discard existing work. Configure the GitHub repository and worker registry before the first worker invocation.

This pilot does not start or advance Gym Logger product work.

## Global polling

Gym Logger is registered in the user-level `Product Orchestrator Bridge Watcher` at `C:\Users\adam4\.codex\product-orchestrator\registry.json`. The single global Codex app automation runs every five minutes and invokes this project’s existing `publish.mjs poll-github` validator only when this registration is enabled.

Do not create a Gym Logger-specific polling automation. Pausing this project in the global registry skips it without deleting its registration or changing `SYNC_STATE.json`, decisions, evidence, or milestones. The watcher never invokes DSH, advances M01, or closes the physical-iPhone gate. No-op polls remain silent; meaningful decisions and bounded errors are retained through the existing project-sync records.
