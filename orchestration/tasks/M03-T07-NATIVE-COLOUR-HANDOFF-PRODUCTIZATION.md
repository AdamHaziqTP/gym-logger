# M03-T07 — Native coloured Notes handoff productization

Status: `CLOSED — NO SAFE PRODUCTION CHANGE; LIMITATION DOCUMENTED`
Owner: OX Alpha builder, Codex acceptance
Scope: bounded productization feasibility; no native rewrite

## Context

E-004 exact capture/replay is now physically reported PASS on the iPhone 14 Pro
Max: a coloured Apple Notes table was captured by the isolated helper and
replayed with editable structure, all five colours, correct data/order, and
Unicode. This proves replay of an existing Notes payload, not generation of a
new Gym Logger payload.

## Goal

Determine and, if low-risk, implement the smallest honest path from a Gym Logger
session to the proven native helper. Prefer a practical one-time setup plus a
single manual paste over any claim of unsupported direct Notes automation.

## Required work

1. Read the E-004 source, current product spec, state, evidence, and existing
   PWA export/clipboard boundaries.
2. Evaluate the minimum viable handoff options: structured JSON file/open-in,
   custom URL or share handoff, helper-side fixture/session import, and a
   documented manual workflow. Keep the normal PWA `Copy to Notes` path intact.
3. Do not synthesize private Apple Notes types by guesswork. Only use a
   representation proven by the captured replay evidence.
4. If the helper can safely accept the canonical Gym Logger session JSON
   without a broad native rewrite, implement that isolated input path and
   add platform-neutral tests. Otherwise produce a concrete implementation
   plan and honest limitation report.
5. Keep the supplied app icon work and PWA production behavior out of scope.

## Acceptance

- no regression to the PWA or ordinary uncoloured editable Notes copy;
- exact distinction between captured-payload replay and generated-workout
  export;
- bounded files/reports/tests only;
- Codex can independently run all applicable checks;
- any new iPhone check is recorded as one consolidated gate, not assumed PASS.

## Worker execution note

The DSH headless profile was extended with the installed AgentTeams bundle and
`/agent-teams` was dispatched to OX Alpha. The productization session remained
silent for the bounded window and produced no usable output or delta. A
separate smoke team did spawn an OX Alpha investigator that completed its
read-only task, but the captain returned no final productization report. See
`orchestration/reports/M03-T07-NATIVE-COLOUR-HANDOFF-OX-ALPHA-AGENTTEAMS-REPORT.md`.
This is an infrastructure timeout, not an implementation result.

## Codex disposition

The bounded review found no safe production change that would turn the proven
captured-Notes replay into a generated Gym Logger coloured export. The current
helper can replay an exact captured Apple Notes item, while its synthetic
fixture builder still emits ordinary plain/HTML/RTF representations whose
colour fidelity in Notes is unproven. Transforming a captured private payload
without the raw capture and a target-iPhone proof would be guesswork.

The task is therefore closed with the limitation documented in
`orchestration/feasibility/E-004-native/PRODUCTIZATION.md`. The PWA's normal
editable uncoloured `Copy to Notes` path, Compact colour snapshot, and the
isolated native helper remain preserved.
