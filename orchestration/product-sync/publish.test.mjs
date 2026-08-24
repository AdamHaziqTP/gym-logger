import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { publishContext, setBuilder } from "./publish.mjs";

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
