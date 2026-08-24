# Gym Logger orchestration

This folder is the durable control plane for the Codex engineering orchestrator and the DSH/OX Alpha implementation worker.

## Authority order

1. `GYM_LOGGER_SPEC.md` and the supplied reference files are the product source of truth.
2. `orchestration/state/DECISIONS.md` records implementation decisions that preserve that source of truth.
3. The Build Gym Logger conversation export is supplementary history only.
4. OX reports are observations, not acceptance evidence.
5. Codex owns scope, verification, acceptance, corrections, and escalation.

## Roles

- Adam: product authority for unresolved product decisions.
- Codex: engineering orchestrator, reviewer, runtime/test operator, and visual verifier.
- OX Alpha: bounded implementation worker. It must not redefine product behavior and must not be relied on for visual verification.

## Worker invocation

Use the verified Desktop wrapper, never the npm-global `dsh` command:

```powershell
& 'C:\Users\adam4\AppData\Roaming\DSH Desktop\host-commands\desktop\bin\dsh.cmd' --profile headless 'Read orchestration/tasks/M01-T01.md and execute it exactly. Write your completion report to orchestration/reports/M01-T01.md.'
```

Every task must be self-contained because a headless worker starts fresh. It must include the relevant source sections, scope, out-of-scope rules, acceptance criteria, tests, and report format.

## Loop

1. Codex records the current commit in the task and state.
2. Codex invokes a fresh headless OX worker.
3. Codex records the invocation and exit status.
4. Codex reads the worker report and inspects the actual diff independently.
5. Codex runs the narrowest relevant tests, then build/typecheck/lint where available.
6. Codex launches and exercises the affected runtime when applicable.
7. Codex independently inspects UI evidence and compares it with the references.
8. Codex accepts, writes a review, updates the matrix/state, and commits a known-good checkpoint—or rejects with a precise correction task.

Automatic correction is capped at two attempts per task. A repeated failure then requires root-cause analysis and, where product behavior is unresolved, an escalation under `escalations/`.

## Evidence rules

- Never accept a worker's prose as proof.
- Never fabricate a defect or pretend an untested iPhone integration passed.
- Desktop/browser evidence cannot close a real-iPhone acceptance criterion.
- Do not expose secrets in reports or evidence.

## Current pilot boundary

The commissioning run executes only M01: the offline foundation vertical slice. It must stop after Codex verification and a known-good checkpoint for human review. Rich Apple Notes paste and 40-row PNG export are intentionally later technical spikes requiring a real iPhone.
