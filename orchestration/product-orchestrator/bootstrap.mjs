import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (args, name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const args = process.argv.slice(2);
const root = resolve(arg(args, "--root") ?? process.cwd());
const projectId = arg(args, "--project-id");
const projectName = arg(args, "--project-name") ?? projectId;
if (!projectId || !projectName) throw new Error("--project-id and --project-name are required.");
const csv = (value) => (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
const docs = csv(arg(args, "--docs"));
const references = csv(arg(args, "--references"));
const transcripts = csv(arg(args, "--legacy-transcripts"));
const repositoryUrl = arg(args, "--repository-url") ?? "";
const builderId = arg(args, "--builder") ?? "unconfigured";
const builderProvider = arg(args, "--provider") ?? "unconfigured";
const builderModel = arg(args, "--model") ?? "unconfigured";
const registerGlobal = args.includes("--register-global");
const base = join(root, "orchestration");
const sync = join(base, "product-sync");
const state = join(base, "state");

async function writeIfMissing(path, content) {
  if (existsSync(path)) return false;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
  return true;
}
async function markdownPaths(folder) {
  try { return (await readdir(join(root, folder), { withFileTypes: true })).filter((item) => item.isFile() && /\.(md|txt|pdf)$/i.test(item.name)).map((item) => join(folder, item.name).replaceAll("\\", "/")); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
}

await mkdir(join(sync, "generated"), { recursive: true });
await mkdir(join(sync, "inbox"), { recursive: true });
await mkdir(state, { recursive: true });

const existingDocs = [...await markdownPaths("."), ...docs, ...references, ...transcripts].filter(Boolean);
await writeIfMissing(join(sync, "config.json"), `${JSON.stringify({
  schemaVersion: 1, projectId, projectName,
  identity: `${projectName} project`, purpose: "Product-defined project managed through the product-orchestrator workflow.",
  authoritativeDocs: [{ path: "PRD.md", role: "Product requirements and acceptance authority", precedence: 1 }, { path: "references/", role: "Supplied references and assets", precedence: 2 }, { path: "orchestration/state/DECISIONS.md", role: "Recorded product decisions", precedence: 3 }, { path: "orchestration/", role: "Engineering state and evidence", precedence: 4 }],
  productChatRole: "Product authority and human interface; it consumes context and records scoped decisions, but never invokes workers.",
  publication: { markdownPath: "orchestration/product-sync/PRODUCT_CONTEXT.md", jsonPath: "orchestration/product-sync/PRODUCT_CONTEXT.json", statePath: "orchestration/product-sync/SYNC_STATE.json", historyPath: "orchestration/product-sync/PUBLICATION_HISTORY.jsonl", workerPatchPath: "orchestration/product-sync/generated/active-worker.patch.yml", inboxPath: "orchestration/product-sync/inbox", decisionLedgerPath: "orchestration/product-sync/DECISION_LEDGER.jsonl", acknowledgementsPath: "orchestration/product-sync/ACKNOWLEDGEMENTS.jsonl" },
  bridge: { mode: "github-issue-comment-or-repository-inbox", currentAccess: repositoryUrl ? "github-repository" : "local-repository", repositoryUrl, writeProtocol: "product-sync-decision-v1", directChatInjection: false, eventDrivenWakeup: false, minimumUserAction: "Connect the repository in the product conversation and ask it to read orchestration/product-sync/PRODUCT_CONTEXT.md.", why: "Issue/file writes are durable, but an existing ChatGPT conversation cannot be injected or awakened by this workflow." },
  limits: { recentCommits: 5, recentReviews: 3, recentDecisions: 8, recentEvidence: 8, recentEvents: 12 }
}, null, 2)}\n`);
await writeIfMissing(join(sync, "workers.json"), `${JSON.stringify({ schemaVersion: 1, defaultBuilder: builderId, launcher: { path: "", profile: "headless", patchArgument: "--patch", verified: false }, switchPolicy: { changesProjectSelectionOnly: true, doesNotEditGlobalDshSettings: true, doesNotResetTaskState: true, doesNotBypassCodexReview: true, unavailableRequestBehavior: "Reject before writing state and retain the previous active builder." }, builders: [{ id: builderId, name: builderId, provider: builderProvider, model: builderModel, available: false, source: "bootstrap; validate before use" }] }, null, 2)}\n`);
await writeIfMissing(join(sync, "SYNC_STATE.json"), `${JSON.stringify({ schemaVersion: 1, activeBuilder: builderId, syncRevision: 0, events: [], builderChanges: [], openEscalations: [], decisionLedger: [] }, null, 2)}\n`);
await writeIfMissing(join(state, "STATE.md"), `# Orchestration state\n\n## Current status\n\n- Project: ${projectName}\n- Control mode: Codex orchestrator → configured DSH builder → Codex verification\n- Current milestone: Bootstrap / discovery\n- Current task: Product handoff review\n- Status: PRODUCT_DISCOVERY\n- Human review gate: none recorded\n\n## Completed\n\n- Existing project ingested without overwriting source documents.\n\n## Deferred\n\n- Requirements and domain-specific handoff pack require product conversation review.\n\n## Final disposition\n\n- Codex must not invoke a worker until the product handoff and requirements matrix are sufficiently precise.\n`);
await writeIfMissing(join(state, "DECISIONS.md"), `# Decisions\n\n## Workflow boundary\n\n- Product authority decides product intent; Codex owns engineering acceptance; workers implement bounded briefs only.\n`);
await writeIfMissing(join(sync, "inbox", "README.md"), "Each file contains one product-sync-decision-v1 JSON object. Codex processes it with publish.mjs poll-decisions.\n");
const manifest = { schemaVersion: 1, generatedAt: new Date().toISOString(), projectId, projectName, repositoryUrl, sourceDocuments: [...new Set(existingDocs)], legacyTranscripts: transcripts, notes: "Migration manifest only; source documents and existing orchestration state remain authoritative until reconciled by Codex and the product conversation." };
await writeIfMissing(join(sync, "MIGRATION_MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await writeIfMissing(join(base, "product-orchestrator", "WORKFLOW_SPEC.md"), await readFile(join(HERE, "WORKFLOW_SPEC.md"), "utf8"));
if (registerGlobal) {
  const registerPath = join(process.env.USERPROFILE ?? "", ".codex", "product-orchestrator", "register-project.mjs");
  if (!existsSync(registerPath)) throw new Error(`Global product-orchestrator registrar not found at ${registerPath}.`);
  const registerArgs = [registerPath, "--root", root, "--project-id", projectId, "--project-name", projectName];
  for (const name of ["--issue-number", "--product-thread-id", "--repository-url"]) {
    const value = arg(args, name);
    if (value) registerArgs.push(name, value);
  }
  registerArgs.push(args.includes("--paused") ? "--paused" : "--enabled");
  execFileSync(process.execPath, registerArgs, { stdio: "inherit" });
}
console.log(JSON.stringify({ root, projectId, created: ["product-sync/config.json", "product-sync/workers.json", "product-sync/SYNC_STATE.json", "state/STATE.md", "state/DECISIONS.md", "product-sync/MIGRATION_MANIFEST.json"], sourceDocuments: manifest.sourceDocuments }, null, 2));
