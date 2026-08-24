# Product decision inbox

This is the repository-file fallback for the product conversation. Each file must contain exactly one `product-sync-decision` JSON object. Use the current `synchronization.contextRevision` and an open `correlationId` from `PRODUCT_CONTEXT.json`.

Codex processes the inbox with:

```powershell
node orchestration/product-sync/publish.mjs poll-decisions
```

Processed artifacts remain durable and are replay-safe. Do not delete them to make a decision apply.
