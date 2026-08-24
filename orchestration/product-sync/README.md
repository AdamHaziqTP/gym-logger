# Product sync and worker registry

This is the reusable bridge between the Codex engineering control plane and the dedicated product/design conversation.

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
       connected repository/file source
```

Codex remains responsible for scope, acceptance, runtime checks, visual checks, corrections, and escalation. Builders implement bounded tasks only. The product conversation is the authority for unresolved product decisions and human verification.

## Files and commands

- `config.json` — project identity, authority order, publication paths, and bridge limitations.
- `workers.json` — builder registry and the verified Desktop wrapper boundary.
- `SYNC_STATE.json` — active builder and publication/event state; it does not replace `orchestration/state/STATE.md`.
- `generated/active-worker.patch.yml` — generated DSH overlay targeting the supported `agent-default-model` route.
- `publish.mjs` — publication, builder selection, and launch-preparation commands.
- `PRODUCT_CONTEXT.md` and `.json` — generated compact outputs.
- `PUBLICATION_HISTORY.jsonl` — small event history; detailed records stay in `orchestration/reports/` and `orchestration/reviews/`.

Publish after dispatch, worker completion/failure, review acceptance/rejection, human verification, escalation/decision changes, or builder changes:

```powershell
node orchestration/product-sync/publish.mjs publish --event human-gate-recorded --summary "Human gate result recorded; M02 remains blocked."
```

The packet contains project identity/purpose, authority and precedence, current milestone/task/status, completed work, implementation changes, Codex and human verification, defects, escalations/decisions, evidence paths, git checkpoint, active builder, and next action. Raw transcripts are not copied into it.

## ChatGPT bridge

The best practical target is GitHub: publish this repository, connect GitHub in ChatGPT under Settings → Apps, grant access to this repository, and enable sync when that capability is available on the account. OpenAI documents that the GitHub app can search live repository files and that GitHub supports apps with sync. This checkout currently has no git remote, and the current tool environment has no supported API for injecting a message into an existing ChatGPT conversation. The packet is therefore locally generated and ready for that bridge.

Minimum product-chat action once a connector exists:

> Read `orchestration/product-sync/PRODUCT_CONTEXT.md` as the latest engineering context. Ask Codex for linked verification evidence before treating implementation as accepted.

Without a connector, Adam opens or attaches that one packet file when returning to the product conversation; raw DSH/Codex transcript copy/paste is not required.

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
- For another project, copy this directory, update `config.json`, replace `workers.json`, point the state/decision/evidence paths used by `publish.mjs` at that project, and publish before its first worker invocation.

This pilot does not start or advance Gym Logger product work.
