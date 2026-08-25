# DSH/OX Alpha recovery diagnostic

Date: 2026-08-26
Project: Gym Logger
Status: **WRAPPER AND ROUTING VERIFIED; LARGER WORKER TASK HUNG**

## Configuration verified

- Desktop wrapper: `C:\Users\adam4\AppData\Roaming\DSH Desktop\host-commands\desktop\bin\dsh.cmd`
- Wrapper target: `C:\Program Files\DSH Desktop\DSH Desktop.exe`
- Profile: `headless`
- Worker: `ox-alpha`
- Provider: `openrouter`
- Model: `stealth/ox-alpha`
- Active patch: `orchestration/product-sync/generated/active-worker.patch.yml`
- DSH settings: `C:\Users\adam4\.dsh\settings.yaml`
- API routing is configured through `OPENROUTER_API_KEY`; no DSH environment
  override was present in the process environment.
- DSH Desktop processes were present during the diagnostic.

## Fresh smoke results

### Unpatched wrapper smoke

- Invocation: Desktop wrapper, `--profile headless`, self-contained read-only
  package inspection prompt.
- stdout: `OX_SMOKE_OK`, package `gym-logger`, no files changed.
- stderr: empty.
- exit code: 0.
- elapsed: 16.65 seconds.

### Patched wrapper smoke

- Invocation: same Desktop wrapper/profile plus the active worker patch.
- stdout: `OX_PATCHED_SMOKE_OK`, package `gym-logger`, no files changed.
- stderr: empty.
- exit code: 0.
- elapsed: 25.33 seconds.

These two runs prove the Desktop wrapper, headless profile, OpenRouter/OX
routing, and active patch can launch a fresh worker successfully.

## Actual worker-task retry

A fresh patched process received a self-contained read-only review of the
current M06-T05 alternate-raster checkpoint, asking it to inspect four
repository files and return `OX_WORKER_OK` plus a concise defect report.

- stdout: empty.
- stderr: empty.
- process result: **90.08-second timeout**.
- files changed: none observed.

## Classification and policy

This is not a wrapper launch failure, auth failure, provider failure, model
routing failure, or patch failure. It is classified as **DSH/OX worker task
hang/timeout for a larger tool-bearing multi-file task**. The prior OX silence
should not be recorded as “OX unavailable.” Codex fallback remains an emergency
path only; the two smoke runs are the known-good recovery route for future
diagnostics and can be used to test smaller bounded worker tasks.
