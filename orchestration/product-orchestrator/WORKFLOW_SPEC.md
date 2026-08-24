# Product Orchestrator workflow

This is the project-portable workflow contract for the product conversation, Codex, and implementation workers. A project may keep a versioned snapshot here; the reusable Codex skill is the installer and adapter for new projects.

## Roles and authority

1. Adam and the dedicated product conversation decide product intent, unresolved UX behavior, and human/device acceptance.
2. Codex is the engineering orchestrator and acceptance authority. It owns scope, task decomposition, worker selection, verification, evidence, git checkpoints, and escalation routing.
3. DSH workers implement bounded briefs. They never redefine requirements, close human gates, or self-authorize milestones.
4. The repository is the durable shared state. Lower precedence numbers win: product specification and supplied references, recorded product decisions, then orchestration state and worker reports.

## Lifecycle

1. Product mode: reverse-prompt section by section until the idea has an appropriately scoped PRD, UX/visual rules, technical shape, data/persistence/security/deployment notes, acceptance tests, references/assets, and explicit gates. Omit irrelevant domain documents.
2. Handoff: freeze the source-of-truth precedence, human gates, open questions, and implementation boundary. Codex bootstraps the repository control plane and requirements matrix.
3. Build loop: Codex creates a bounded task, selects a configured DSH worker, records the checkpoint, invokes the worker, inspects the diff and report, runs tests/build/runtime checks, and accepts or issues a correction task.
4. Escalation: if sources do not determine a user-facing choice, Codex pauses only the affected branch and publishes a stable escalation with an expected context revision and allowed response scope.
5. Product response: the product conversation reads the live packet, discusses options with Adam, and writes one structured response through the reverse bridge. It must not invoke DSH or authorize unrelated milestones.
6. Resume: Codex polls the bridge, validates and deduplicates the response, records an acknowledgement and decision history, applies only the affected transition, then republishes context.
7. Human gates: device, subjective UX, visual, destructive, release, and other explicitly human checks remain PASS/FAIL/BLOCKED records. Automated tests never silently close them.

## Reverse channel contract

The preferred transport is an append-only comment on a designated GitHub issue. A product conversation that can write through the GitHub connector may add a comment containing exactly one fenced `product-sync-decision` JSON object. The fallback transport is a committed JSON file under `orchestration/product-sync/inbox/`; it is used when the product conversation can update repository files but cannot comment on issues.

Required decision fields:

```json
{
  "schemaVersion": 1,
  "type": "product-sync-decision",
  "decisionId": "PD-20260824-001",
  "projectId": "project-id",
  "correlationId": "E-001",
  "expectedSyncRevision": 7,
  "authority": "product-owner-chat",
  "createdAt": "2026-08-24T00:00:00.000Z",
  "scope": { "level": "escalation", "id": "E-001" },
  "action": "choose",
  "payload": { "choice": "option-a", "rationale": "..." }
}
```

Codex rejects a response when the project, escalation, expected revision, scope, authority, schema, or decision ID is invalid; when the correlation already has an accepted response; or when it is a duplicate/replay. High-impact actions require an explicit human approval object and remain subject to Codex execution checks. Builder changes are requests, not direct worker invocations: Codex validates the registry and launcher, preserves the old builder on failure, records the change, and only then prepares a bounded task.

## Automation boundary

GitHub is a durable shared bridge, not an event bus for an existing ChatGPT conversation. The current supported implementation therefore provides a Codex `poll-decisions`/resume command. A scheduled local task or the normal Codex session loop can run it; no transcript copy/paste is required. Direct injection into or wake-up of an existing ChatGPT conversation is not claimed.
