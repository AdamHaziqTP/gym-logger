import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { applyDecision, markChatNotified, openEscalation, pollDecisions, publishContext, setBuilder, writeDecision } from "./publish.mjs";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "product-sync-"));
  await mkdir(join(root, "orchestration", "state"), { recursive: true });
  await mkdir(join(root, "orchestration", "product-sync"), { recursive: true });
  await writeFile(join(root, "orchestration", "state", "STATE.md"), "# State\n\n## Current status\n\n- Project: Pilot\n- Current milestone: M01 — foundation\n- Current task: M01-T01\n- Status: READY_FOR_OX\n- Human review gate: awaiting review\n\n## Completed\n\n- Bootstrap complete\n\n## Deferred\n\n- Real-device verification\n\n## Final disposition\n\n- Keep M02 blocked\n", "utf8");
  await writeFile(join(root, "orchestration", "state", "DECISIONS.md"), "# Decisions\n\n## Locked choice\n\n- Preserve the product boundary.\n", "utf8");
  await writeFile(join(root, "orchestration", "product-sync", "config.json"), JSON.stringify({ schemaVersion: 1, projectId: "pilot", projectName: "Pilot", identity: "Test project", purpose: "Test publication", authoritativeDocs: [{ path: "SPEC.md", role: "authority", precedence: 1 }], productChatRole: "Product authority", publication: { markdownPath: "orchestration/product-sync/PRODUCT_CONTEXT.md", jsonPath: "orchestration/product-sync/PRODUCT_CONTEXT.json", statePath: "orchestration/product-sync/SYNC_STATE.json", historyPath: "orchestration/product-sync/PUBLICATION_HISTORY.jsonl", workerPatchPath: "orchestration/product-sync/generated/active-worker.patch.yml" }, bridge: { mode: "repository-file", currentAccess: "local-only", directChatInjection: false, minimumUserAction: "Read the packet.", why: "No direct injection." }, limits: { recentCommits: 2, recentReviews: 2, recentDecisions: 2, recentEvidence: 2, recentEvents: 2 } }), "utf8");
  await writeFile(join(root, "orchestration", "product-sync", "workers.json"), JSON.stringify({ schemaVersion: 1, defaultBuilder: "one", launcher: { path: process.execPath, profile: "headless", patchArgument: "--patch", verified: true }, builders: [{ id: "one", name: "Builder One", provider: "provider", model: "model-one", available: true }, { id: "two", name: "Builder Two", provider: "provider", model: "model-two", available: true }] }), "utf8");
  await writeFile(join(root, "orchestration", "product-sync", "SYNC_STATE.json"), JSON.stringify({ schemaVersion: 1, activeBuilder: "one", events: [], builderChanges: [] }), "utf8");
  return root;
}

test("a state event and later state change update the packet", async () => {
  const root = await fixture();
  await publishContext({ root, eventName: "state-changed", summary: "Human review result recorded." });
  const first = JSON.parse(await readFile(join(root, "orchestration/product-sync/PRODUCT_CONTEXT.json"), "utf8"));
  assert.equal(first.current.status, "READY_FOR_OX");
  assert.deepEqual(first.decisionsMadeSinceLastSync, ["Human review result recorded."]);
  const path = join(root, "orchestration/state/STATE.md");
  await writeFile(path, (await readFile(path, "utf8")).replace("READY_FOR_OX", "IN_PROGRESS"), "utf8");
  await publishContext({ root, eventName: "worker-started", summary: "Codex authorized the bounded task." });
  const second = JSON.parse(await readFile(join(root, "orchestration/product-sync/PRODUCT_CONTEXT.json"), "utf8"));
  assert.equal(second.current.status, "IN_PROGRESS");
  assert.equal(second.synchronization.lastEvent.name, "worker-started");
});

test("builder switching is safe and unavailable selections do not mutate state", async () => {
  const root = await fixture();
  const result = await setBuilder({ root, builderId: "two", reason: "Pilot routing test" });
  assert.equal(result.builder.id, "two");
  assert.equal(JSON.parse(await readFile(join(root, "orchestration/product-sync/SYNC_STATE.json"), "utf8")).activeBuilder, "two");
  assert.match(await readFile(join(root, "orchestration/product-sync/generated/active-worker.patch.yml"), "utf8"), /model: model-two/);
  await assert.rejects(setBuilder({ root, builderId: "missing" }), /unavailable.*active builder remains 'two'/i);
  assert.equal(JSON.parse(await readFile(join(root, "orchestration/product-sync/SYNC_STATE.json"), "utf8")).activeBuilder, "two");
});

test("the reverse channel accepts one current decision, rejects replay, and rejects stale context", async () => {
  const root = await fixture();
  const opened = await openEscalation({ root, id: "SYN-001", summary: "Choose the harmless synthetic option.", scope: "task", allowedActions: ["choose"] });
  const decision = { schemaVersion: 1, type: "product-sync-decision", decisionId: "PD-SYN-001", projectId: "pilot", correlationId: "SYN-001", expectedSyncRevision: opened.synchronization.contextRevision, authority: "product-owner-chat", createdAt: new Date().toISOString(), scope: { level: "task", id: "SYN-001" }, action: "choose", payload: { choice: "synthetic-option-a", rationale: "Commissioning only; no build is authorized." } };
  await writeDecision({ root, decision });
  assert.deepEqual((await pollDecisions({ root })).map((item) => item.status), ["accepted"]);
  assert.match(await readFile(join(root, "orchestration/state/DECISIONS.md"), "utf8"), /Product decision PD-SYN-001/);
  assert.equal((await applyDecision({ root, decision })).status, "duplicate");

  const openedAgain = await openEscalation({ root, id: "SYN-002", summary: "Choose another harmless option.", scope: "task", allowedActions: ["choose"] });
  const stale = { ...decision, decisionId: "PD-SYN-002", correlationId: "SYN-002", expectedSyncRevision: openedAgain.synchronization.contextRevision - 1, scope: { level: "task", id: "SYN-002" } };
  assert.equal((await applyDecision({ root, decision: stale })).status, "rejected");
  assert.match((await readFile(join(root, "orchestration/product-sync/ACKNOWLEDGEMENTS.jsonl"), "utf8")), /stale-context-revision/);

  const builderEscalation = await openEscalation({ root, id: "SYN-BUILDER", summary: "Select the configured test builder.", scope: "project", allowedActions: ["builder-switch-request"] });
  const builderDecision = { schemaVersion: 1, type: "product-sync-decision", decisionId: "PD-SYN-BUILDER", projectId: "pilot", correlationId: "SYN-BUILDER", expectedSyncRevision: builderEscalation.synchronization.contextRevision, authority: "product-owner-chat", createdAt: new Date().toISOString(), scope: { level: "project", id: "SYN-BUILDER" }, action: "builder-switch-request", payload: { builderId: "two", reason: "Synthetic validation only; do not start a worker." } };
  assert.equal((await applyDecision({ root, decision: builderDecision })).status, "accepted");
  assert.equal(JSON.parse(await readFile(join(root, "orchestration/product-sync/SYNC_STATE.json"), "utf8")).activeBuilder, "two");

  const failedBuilderEscalation = await openEscalation({ root, id: "SYN-BUILDER-FAIL", summary: "Reject an unavailable test builder.", scope: "project", allowedActions: ["builder-switch-request"] });
  const failedBuilderDecision = { ...builderDecision, decisionId: "PD-SYN-BUILDER-FAIL", correlationId: "SYN-BUILDER-FAIL", expectedSyncRevision: failedBuilderEscalation.synchronization.contextRevision, scope: { level: "project", id: "SYN-BUILDER-FAIL" }, payload: { builderId: "missing", reason: "Synthetic failure path." } };
  assert.equal((await applyDecision({ root, decision: failedBuilderDecision })).status, "rejected");
  assert.equal(JSON.parse(await readFile(join(root, "orchestration/product-sync/SYNC_STATE.json"), "utf8")).activeBuilder, "two");
});

test("chat notification markers are revision-scoped", async () => {
  const root = await fixture();
  await publishContext({ root, eventName: "escalation-opened", summary: "Synthetic escalation." });
  const marker = await markChatNotified({ root, revision: 1, threadId: "synthetic-chat" });
  assert.equal(marker.revision, 1);
  assert.equal(JSON.parse(await readFile(join(root, "orchestration/product-sync/SYNC_STATE.json"), "utf8")).chatNotifications[0].threadId, "synthetic-chat");
});
