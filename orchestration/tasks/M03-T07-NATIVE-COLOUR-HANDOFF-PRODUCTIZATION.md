# M03-T07 — Native coloured Notes handoff productization

Status: `READY_FOR_OX`
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
