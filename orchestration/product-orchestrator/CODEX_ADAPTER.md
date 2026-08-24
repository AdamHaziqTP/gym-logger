# Codex engineering adapter

Use the project’s existing orchestration folders as the control plane. Read the product source of truth first, then `orchestration/state`, `orchestration/product-sync`, and the current requirements matrix.

Codex owns:

- requirements coverage, milestones, bounded task briefs, git checkpoints, DSH invocation, independent diff/test/runtime/visual verification, and evidence;
- opening an escalation when product behavior is not determined by the sources;
- publishing context after every meaningful state change;
- polling and validating product decisions before recording or applying them;
- capability-validating builder changes and retaining the previous builder on any failure.

Use:

```powershell
node orchestration/product-sync/publish.mjs poll-decisions
node orchestration/product-sync/publish.mjs poll-github
node orchestration/product-sync/publish.mjs apply-decision --decision-file <path>
node orchestration/product-sync/publish.mjs set-builder --builder <id> --reason "..."
```

The decision processor is deliberately conservative. A rejected or stale artifact is acknowledged with a reason and never applied. A valid product decision updates `orchestration/state/DECISIONS.md`, appends an acknowledgement, and republishes the packet. A builder request is validated through the same registry boundary and does not start implementation.
