# Reusable product-orchestrator package

`WORKFLOW_SPEC.md` is the versioned project snapshot of the generic workflow. The ChatGPT and Codex adapters are intentionally thin. The machine implementation lives in `orchestration/product-sync/publish.mjs` so the same protocol can be tested locally and used by a scheduled Codex resume loop.

For a new or existing project, run the bootstrap script from the reusable skill or use the project copy:

```powershell
node orchestration/product-orchestrator/bootstrap.mjs --root C:\path\to\project --project-id my-project --project-name "My Project"
```

Then connect that repository in the product conversation and ask it to read `orchestration/product-sync/PRODUCT_CONTEXT.md`. Bootstrap is additive: it does not overwrite existing PRDs, state, decisions, references, or orchestration records.
