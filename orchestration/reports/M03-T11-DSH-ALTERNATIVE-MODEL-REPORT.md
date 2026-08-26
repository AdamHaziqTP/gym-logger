# M03-T11 DSH alternative-model dispatch report

Date: 2026-08-27
Status: `INFRASTRUCTURE BLOCKED — CODEX SUBAGENT FALLBACK`

The product owner requested trying alternative DSH models before Codex
subagents, with OX Alpha explicitly disabled. Both attempts used the verified
Desktop wrapper from the Gym Logger project root, the `headless` profile, a
self-contained `/agent-teams` smoke prompt, and a temporary model overlay.

## Attempt results

| Attempt | Model overlay | Exit | Elapsed | Result |
| --- | --- | ---: | ---: | --- |
| Qwen | `Qwen/Qwen3.8-Flash-Next-FP8` | 1 | 0.5s | Desktop packaged DSH failed before worker start: `cordis:include` loader entries failed to apply. |
| GLM | `z-ai/glm-5.3-flash` | 1 | 0.4s | Same packaged DSH launcher failure before worker start. |

Neither model reached the worker or modified the repository. This is the
same DSH packaged-loader failure previously observed for OX Alpha, so M03-T11
implementation proceeds through Codex subagent/fallback work. Global DSH
configuration was not changed.
