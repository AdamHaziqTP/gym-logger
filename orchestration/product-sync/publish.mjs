import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, "../..");
const timestamp = () => new Date().toISOString();
const json = async (path, fallback) => { try { return JSON.parse(await readFile(path, "utf8")); } catch (error) { if (error.code === "ENOENT" && fallback !== undefined) return structuredClone(fallback); throw error; } };
const saveJson = async (path, value) => { await mkdir(dirname(path), { recursive: true }); await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); };
const saveText = async (path, value) => { await mkdir(dirname(path), { recursive: true }); await writeFile(path, value, "utf8"); };
const rel = (root, path) => relative(root, path).replaceAll("\\", "/");

function git(root, args) {
  try { return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return "unavailable"; }
}

function line(text, label) { return text.match(new RegExp(`^- ${label}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "Not recorded"; }
function body(text, heading) { return text.match(new RegExp(`^## ${heading}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"))?.[1]?.trim() ?? ""; }
function list(text, limit = 8) { return text.split(/\r?\n/).map((item) => item.match(/^[-*]\s+(.+)$/)?.[1]?.trim()).filter(Boolean).slice(0, limit); }
function signal(text, limit = 4) { return text.split(/\r?\n/).filter((item) => /PASS|FAIL|VERIFIED|PENDING|BLOCKED|REJECT|NOT ACCEPTED|await/i.test(item)).map((item) => item.replace(/^[-*]\s+/, "").trim()).filter(Boolean).slice(0, limit); }
async function files(root, folder, pattern) {
  try {
    const entries = await readdir(join(root, folder), { withFileTypes: true });
    const found = await Promise.all(entries.filter((item) => item.isFile() && pattern.test(item.name)).map(async (item) => ({ path: join(root, folder, item.name), mtime: (await stat(join(root, folder, item.name))).mtimeMs })));
    return found.sort((a, b) => b.mtime - a.mtime).map((item) => item.path);
  } catch (error) { if (error.code === "ENOENT") return []; throw error; }
}
function code(value) { return String.fromCharCode(96) + value + String.fromCharCode(96); }

async function load(root) {
  const base = join(root, "orchestration", "product-sync");
  const fallback = { schemaVersion: 1, activeBuilder: "ox-alpha", events: [], builderChanges: [], syncRevision: 0, openEscalations: [], decisionLedger: [] };
  const [config, registry, sync, stateText, decisionsText] = await Promise.all([
    json(join(base, "config.json")), json(join(base, "workers.json")), json(join(base, "SYNC_STATE.json"), fallback),
    readFile(join(root, "orchestration", "state", "STATE.md"), "utf8"), readFile(join(root, "orchestration", "state", "DECISIONS.md"), "utf8")
  ]);
  const builder = registry.builders.find((item) => item.id === sync.activeBuilder) ?? registry.builders.find((item) => item.id === registry.defaultBuilder);
  if (!builder) throw new Error("No usable active builder exists in workers.json.");
  return { root, base, config, registry, sync, stateText, decisionsText, builder };
}

async function verification(project) {
  const reviewPaths = (await files(project.root, "orchestration/reviews", /\.md$/i)).filter((path) => !path.endsWith("README.md")).slice(0, project.config.limits.recentReviews);
  const humanPaths = (await files(project.root, "orchestration/evidence", /\.(md|png|jpe?g)$/i)).filter((path) => /HUMAN|human-gate/i.test(path)).slice(0, project.config.limits.recentEvidence);
  const read = async (path) => ({ path: rel(project.root, path), result: signal(await readFile(path, "utf8")) });
  return { reviews: await Promise.all(reviewPaths.map(read)), human: await Promise.all(humanPaths.map(read)), refs: (await files(project.root, "references", /\.(png|jpe?g)$/i)).slice(0, 5).map((path) => rel(project.root, path)) };
}

function patchFor(builder) { return `- id: agent-default-model\n  config:\n    provider: ${builder.provider}\n    model: ${builder.model}\n`; }
async function ensurePatch(project) { const path = join(project.root, project.config.publication.workerPatchPath); await saveText(path, patchFor(project.builder)); return rel(project.root, path); }

function packetMarkdown(packet) {
  const many = (values) => values?.length ? values.map((value) => `- ${typeof value === "string" ? value : value.path}`).join("\n") : "- None recorded";
  const checks = (values) => values?.length ? values.map((value) => `- ${code(value.path)}: ${value.result.join(" ") || "Inspect the linked record."}`).join("\n") : "- None recorded";
  const decisions = packet.recordedDecisions.map((item) => `- ${item.title}${item.detail ? ` — ${item.detail}` : ""}`).join("\n") || "- None recorded";
  return [
    `# ${packet.project.name} product context`, "", `> Generated by Codex product-sync at ${packet.generatedAt}. This is the compact product-facing packet; detailed reports and raw worker output stay in the orchestration folders.`, "",
    "## Project", "", `- Identity: ${packet.project.identity}`, `- Purpose: ${packet.project.purpose}`, "",
    "## Authority and precedence", "", `- Product-chat role: ${packet.authority.productChatRole}`, `- Precedence: ${packet.authority.precedenceRule}`, ...packet.authority.authoritativeDocs.map((item) => `- ${item.precedence}. ${code(item.path)} — ${item.role}`), "",
    "## Current position", "", `- Milestone: ${packet.current.milestone}`, `- Task: ${packet.current.task}`, `- Status: ${packet.current.status}`, `- Human gate: ${packet.current.humanReviewGate}`, `- Next action: ${packet.current.nextAction}`, "",
    "## Completed work", "", many(packet.completedMilestonesAndWork), "", "## Recent implementation changes", "", many(packet.recentImplementationChanges), "",
    "## Codex verification", "", checks(packet.codexVerification), "", "## Human verification", "", checks(packet.humanVerification), "",
    "## Unresolved defects", "", many(packet.unresolvedDefects), "", "## Escalations and product decisions needed", "", many(packet.activeEscalationsAndProductDecisionsNeeded), "",
    "## Decisions since last sync", "", many(packet.decisionsMadeSinceLastSync), "", "## Recorded decisions", "", decisions, "",
    "## Evidence", "", many(packet.relevantEvidence), "", "## Git checkpoint", "", `- Commit: ${code(packet.gitCheckpoint.commit)}`, `- Branch: ${code(packet.gitCheckpoint.branch)}`, `- Working tree: ${packet.gitCheckpoint.workingTree.replaceAll("\n", " | ")}`, `- Changed files: ${many(packet.gitCheckpoint.changedFiles)}`, "",
    "## Configured builder", "", `- Builder: ${packet.builder.name} (${code(packet.builder.id)})`, `- Route: ${code(`${packet.builder.provider}/${packet.builder.model}`)}`, `- Launcher: ${code(packet.builder.launcher.path)} with profile ${code(packet.builder.launcher.profile)} and project patch ${code(packet.builder.patchPath)}`, "",
    "## Product-chat bridge", "", `- Mode: ${packet.synchronization.bridge.mode}; current access: ${packet.synchronization.bridge.currentAccess}`, `- Direct injection into an existing ChatGPT conversation: ${packet.synchronization.bridge.directChatInjection ? "supported" : "not available in this environment"}`, `- Minimum action: ${packet.synchronization.bridge.minimumUserAction}`, `- Bridge note: ${packet.synchronization.bridge.why}`, ""
  ].join("\n");
}

async function build(project, event) {
  const { root, config, registry, sync, stateText, decisionsText, builder } = project;
  const gitStatus = git(root, ["status", "--short", "--branch"]);
  const changed = gitStatus.split(/\r?\n/).slice(1).filter(Boolean).map((item) => item.slice(3).trim()).slice(0, 20);
  const reviews = await verification(project);
  const decisions = [...decisionsText.matchAll(/^## (.+)$([\s\S]*?)(?=^## |(?![\s\S]))/gm)].map((match) => ({ title: match[1].trim(), detail: list(match[2], 2).join(" ") })).slice(-config.limits.recentDecisions);
  const status = line(stateText, "Status");
  const humanGate = line(stateText, "Human review gate");
  const disposition = list(body(stateText, "Final disposition"), 3);
  return {
    schemaVersion: 1, packetType: "product-context", generatedAt: timestamp(),
    project: { id: config.projectId, name: config.projectName, identity: config.identity, purpose: config.purpose },
    authority: { productChatRole: config.productChatRole, authoritativeDocs: config.authoritativeDocs, precedenceRule: "Lower precedence numbers win. Worker reports are observations; Codex verification and human evidence control acceptance." },
    current: { milestone: line(stateText, "Current milestone"), task: line(stateText, "Current task"), status, humanReviewGate: humanGate, nextAction: (/HUMAN_REVIEW_REQUIRED|awaiting.*iPhone|human verification/i.test(`${status} ${humanGate}`) ? humanGate : (disposition[0] ?? (humanGate !== "Not recorded" ? humanGate : (/READY_FOR_OX/i.test(status) ? "Codex may prepare the bounded task for the configured builder, then independently verify it." : "Product chat should review this packet and decide the next authorized transition.")))) },
    completedMilestonesAndWork: list(body(stateText, "Completed"), 12), recentImplementationChanges: git(root, ["log", `-${config.limits.recentCommits}`, "--pretty=format:%h %s"]).split(/\r?\n/).filter(Boolean),
    codexVerification: reviews.reviews, humanVerification: reviews.human, unresolvedDefects: list(body(stateText, "Deferred"), 8), activeEscalationsAndProductDecisionsNeeded: [...list(body(stateText, "Escalations"), 8), humanGate].filter((item) => item !== "Not recorded"), decisionsMadeSinceLastSync: event?.summary ? [event.summary] : [], recordedDecisions: decisions, relevantEvidence: [...reviews.human.map((item) => item.path), ...reviews.refs],
    gitCheckpoint: { commit: git(root, ["rev-parse", "HEAD"]), branch: git(root, ["branch", "--show-current"]), workingTree: gitStatus, changedFiles: changed },
    builder: { id: builder.id, name: builder.name, provider: builder.provider, model: builder.model, launcher: registry.launcher, patchPath: config.publication.workerPatchPath },
    synchronization: {
      lastEvent: event ?? sync.lastEvent,
      contextRevision: sync.syncRevision ?? 0,
      openEscalations: sync.openEscalations ?? [],
      detailedLogs: "orchestration/reports/ and orchestration/reviews/ remain the detailed machine/reviewer record; this packet is a compact product-facing summary.",
      bridge: config.bridge
    }
  };
}

export async function publishContext({ root = DEFAULT_ROOT, eventName, summary } = {}) {
  const project = await load(resolve(root));
  const event = eventName ? { name: eventName, summary: summary ?? "", at: timestamp() } : null;
  const state = { ...project.sync, schemaVersion: 1, syncRevision: (project.sync.syncRevision ?? 0) + 1, lastPublishedAt: timestamp(), lastEvent: event, events: event ? [event, ...(project.sync.events ?? [])].slice(0, project.config.limits.recentEvents) : project.sync.events ?? [] };
  const patchPath = await ensurePatch(project);
  const packet = await build({ ...project, sync: state, builder: project.builder }, event);
  packet.builder.patchPath = patchPath;
  await saveJson(join(project.root, project.config.publication.statePath), state);
  await saveJson(join(project.root, project.config.publication.jsonPath), packet);
  await saveText(join(project.root, project.config.publication.markdownPath), packetMarkdown(packet));
  return packet;
}

export async function setBuilder({ root = DEFAULT_ROOT, builderId, reason = "" } = {}) {
  const project = await load(resolve(root));
  const candidate = project.registry.builders.find((item) => item.id === builderId);
  if (!candidate || candidate.available !== true) throw new Error(`Builder '${builderId}' is unavailable. No state was changed; active builder remains '${project.builder.id}'.`);
  if (!existsSync(project.registry.launcher.path)) throw new Error(`Verified DSH launcher is unavailable at '${project.registry.launcher.path}'. No state was changed.`);
  const change = { at: timestamp(), from: project.builder.id, to: candidate.id, reason };
  const state = { ...project.sync, schemaVersion: 1, activeBuilder: candidate.id, builderChanges: [change, ...(project.sync.builderChanges ?? [])].slice(0, project.config.limits.recentEvents) };
  await saveJson(join(project.root, project.config.publication.statePath), state);
  await saveText(join(project.root, project.config.publication.workerPatchPath), patchFor(candidate));
  const history = join(project.root, project.config.publication.historyPath);
  await mkdir(dirname(history), { recursive: true });
  await writeFile(history, `${JSON.stringify({ type: "builder-change", ...change })}\n`, { encoding: "utf8", flag: "a" });
  await publishContext({ root, eventName: "builder-switched", summary: `Builder changed from ${project.builder.name} to ${candidate.name}: ${reason || "no reason supplied"}` });
  return { builder: candidate, change };
}

export async function readBuilder({ root = DEFAULT_ROOT } = {}) { const project = await load(resolve(root)); return { ...project.builder, launcher: project.registry.launcher }; }
export async function prepareWorker({ root = DEFAULT_ROOT, taskFile } = {}) { const project = await load(resolve(root)); const patchPath = await ensurePatch(project); const task = await readFile(resolve(project.root, taskFile), "utf8"); return { executable: project.registry.launcher.path, arguments: ["--profile", project.registry.launcher.profile, project.registry.launcher.patchArgument, resolve(project.root, patchPath), task.trim()], builder: project.builder, patchPath }; }

function bridgePath(project, key, fallback) { return join(project.root, project.config.publication?.[key] ?? fallback); }
async function jsonl(path) {
  try { return (await readFile(path, "utf8")).split(/\r?\n/).filter(Boolean).map((item) => JSON.parse(item)); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
}
async function appendJsonl(path, value) { await mkdir(dirname(path), { recursive: true }); await appendFile(path, `${JSON.stringify(value)}\n`, "utf8"); }
function decisionFromText(text) {
  const fenced = text.match(/```(?:product-sync-decision|json)\s*([\s\S]*?)```/i)?.[1]?.trim() ?? text.trim();
  const value = JSON.parse(fenced);
  return value.type === "product-sync-decision" ? value : (value.decision?.type === "product-sync-decision" ? value.decision : value);
}
function githubRepository(config) { return config.bridge?.repositoryUrl?.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/i)?.[1]; }
function requiredDecisionFields(decision) { return ["schemaVersion", "type", "decisionId", "projectId", "correlationId", "expectedSyncRevision", "authority", "createdAt", "scope", "action"]; }
function highImpact(action) { return /delete|destroy|reset|force[-_ ]?push|production|publish|migration|credential|permission/i.test(action); }
function decisionSummary(decision) { return decision.payload?.rationale || decision.payload?.choice || decision.action; }
function findOpenEscalation(project, correlationId) { return (project.sync.openEscalations ?? []).find((item) => item.id === correlationId && item.status !== "resolved" && item.status !== "closed"); }
function existingDecision(project, decision) { return (project.sync.decisionLedger ?? []).find((item) => item.decisionId === decision.decisionId); }
function existingCorrelation(project, decision) { return (project.sync.decisionLedger ?? []).find((item) => item.status === "accepted" && item.correlationId === decision.correlationId); }

export function validateDecision(project, decision) {
  const missing = requiredDecisionFields(decision).filter((field) => decision[field] === undefined || decision[field] === null || decision[field] === "");
  if (decision.schemaVersion !== 1 || decision.type !== "product-sync-decision") return { ok: false, reason: "schema-invalid" };
  if (missing.length) return { ok: false, reason: `missing-fields:${missing.join(",")}` };
  if (existingDecision(project, decision)) return { ok: false, duplicate: true, reason: "duplicate-or-replay" };
  if (decision.projectId !== project.config.projectId) return { ok: false, reason: "project-mismatch" };
  if (decision.authority !== "product-owner-chat" && decision.authority !== "adam") return { ok: false, reason: "authority-not-allowed" };
  if (decision.expectedSyncRevision !== (project.sync.syncRevision ?? 0)) return { ok: false, reason: "stale-context-revision" };
  const escalation = findOpenEscalation(project, decision.correlationId);
  if (!escalation) return { ok: false, reason: "unknown-or-closed-escalation" };
  if (!decision.scope || decision.scope.level !== escalation.scope.level || decision.scope.id !== escalation.scope.id) return { ok: false, reason: "scope-mismatch" };
  if (Array.isArray(escalation.allowedActions) && !escalation.allowedActions.includes(decision.action)) return { ok: false, reason: "action-not-allowed-for-escalation" };
  if (existingCorrelation(project, decision)) return { ok: false, reason: "conflicting-decision-for-correlation" };
  if (highImpact(decision.action) && decision.humanApproval?.confirmed !== true) return { ok: false, reason: "human-approval-required" };
  if (decision.action === "builder-switch-request") {
    const builderId = decision.payload?.builderId;
    const candidate = project.registry.builders.find((item) => item.id === builderId);
    if (!candidate || candidate.available !== true) return { ok: false, reason: "builder-unavailable" };
    if (!existsSync(project.registry.launcher.path)) return { ok: false, reason: "launcher-unavailable" };
  }
  return { ok: true, escalation };
}

async function recordResult(project, decision, result) {
  const entry = { decisionId: decision.decisionId, correlationId: decision.correlationId, action: decision.action, status: result.status, reason: result.reason ?? "", at: timestamp() };
  const state = { ...project.sync, schemaVersion: 1, decisionLedger: [entry, ...(project.sync.decisionLedger ?? [])].slice(0, project.config.limits.recentEvents ?? 12) };
  await saveJson(join(project.root, project.config.publication.statePath), state);
  await appendJsonl(bridgePath(project, "decisionLedgerPath", "orchestration/product-sync/DECISION_LEDGER.jsonl"), entry);
  await appendJsonl(bridgePath(project, "acknowledgementsPath", "orchestration/product-sync/ACKNOWLEDGEMENTS.jsonl"), { ...entry, acknowledgedAt: timestamp() });
  return entry;
}

async function appendDecisionDocument(project, decision) {
  const path = join(project.root, "orchestration", "state", "DECISIONS.md");
  const current = await readFile(path, "utf8");
  const heading = `\n## Product decision ${decision.decisionId}\n\n- Correlation: ${decision.correlationId}\n- Scope: ${decision.scope.level}/${decision.scope.id}\n- Action: ${decision.action}\n- Decision: ${decisionSummary(decision)}\n- Recorded by: Codex after product-owner-chat response\n`;
  await writeFile(path, `${current.trimEnd()}\n${heading}`, "utf8");
}

export async function applyDecision({ root = DEFAULT_ROOT, decision, decisionFile } = {}) {
  const project = await load(resolve(root));
  const incoming = decision ?? decisionFromText(await readFile(resolve(root, decisionFile), "utf8"));
  const check = validateDecision(project, incoming);
  if (!check.ok) {
    if (check.duplicate) return { status: "duplicate", decisionId: incoming.decisionId, reason: check.reason };
    const entry = await recordResult(project, incoming, { status: "rejected", reason: check.reason });
    await publishContext({ root, eventName: "product-decision-rejected", summary: `${incoming.decisionId} rejected: ${check.reason}.` });
    return entry;
  }
  const next = { ...project.sync, schemaVersion: 1, decisionLedger: [{ decisionId: incoming.decisionId, correlationId: incoming.correlationId, action: incoming.action, status: "accepted", at: timestamp() }, ...(project.sync.decisionLedger ?? [])].slice(0, project.config.limits.recentEvents ?? 12), openEscalations: (project.sync.openEscalations ?? []).map((item) => item.id === incoming.correlationId ? { ...item, status: "resolved", resolvedBy: incoming.decisionId, resolvedAt: timestamp() } : item) };
  if (incoming.action === "builder-switch-request") {
    const candidate = project.registry.builders.find((item) => item.id === incoming.payload.builderId);
    const change = { at: timestamp(), from: project.builder.id, to: candidate.id, reason: incoming.payload.reason ?? `Product request ${incoming.decisionId}`, scope: incoming.scope };
    next.activeBuilder = candidate.id;
    next.builderChanges = [change, ...(project.sync.builderChanges ?? [])].slice(0, project.config.limits.recentEvents ?? 12);
    await saveText(join(project.root, project.config.publication.workerPatchPath), patchFor(candidate));
    await appendJsonl(bridgePath(project, "historyPath", "orchestration/product-sync/PUBLICATION_HISTORY.jsonl"), { type: "builder-change", ...change, decisionId: incoming.decisionId });
  }
  await appendDecisionDocument(project, incoming);
  await saveJson(join(project.root, project.config.publication.statePath), next);
  await appendJsonl(bridgePath(project, "decisionLedgerPath", "orchestration/product-sync/DECISION_LEDGER.jsonl"), next.decisionLedger[0]);
  await appendJsonl(bridgePath(project, "acknowledgementsPath", "orchestration/product-sync/ACKNOWLEDGEMENTS.jsonl"), { ...next.decisionLedger[0], acknowledgedAt: timestamp() });
  const packet = await publishContext({ root, eventName: "product-decision-accepted", summary: `${incoming.decisionId} accepted for ${incoming.correlationId}; ${incoming.action}.` });
  return { status: "accepted", decisionId: incoming.decisionId, action: incoming.action, contextRevision: packet.synchronization.contextRevision };
}

export async function pollDecisions({ root = DEFAULT_ROOT } = {}) {
  const project = await load(resolve(root));
  const inbox = bridgePath(project, "inboxPath", "orchestration/product-sync/inbox");
  let entries = [];
  try { entries = (await readdir(inbox, { withFileTypes: true })).filter((item) => item.isFile() && /\.(json|md)$/i.test(item.name)).map((item) => join(inbox, item.name)); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const results = [];
  for (const path of entries.sort()) results.push(await applyDecision({ root, decisionFile: path }));
  return results;
}

export async function pollGitHubComments({ root = DEFAULT_ROOT } = {}) {
  const project = await load(resolve(root));
  const repo = githubRepository(project.config);
  const issue = project.config.bridge?.issueNumber;
  if (!repo || !issue) throw new Error("GitHub bridge requires bridge.repositoryUrl and bridge.issueNumber in config.json.");
  let comments;
  try { comments = JSON.parse(execFileSync("gh", ["api", "--paginate", `repos/${repo}/issues/${issue}/comments`], { encoding: "utf8" })); }
  catch { throw new Error("GitHub polling requires an authenticated 'gh' CLI. The connector can still be used to write/read the issue; run poll-decisions after importing comments into the inbox when gh is unavailable."); }
  const seen = new Set(project.sync.githubCommentIds ?? []);
  const results = [];
  for (const comment of comments) {
    if (seen.has(String(comment.id))) continue;
    let incoming;
    try { incoming = decisionFromText(comment.body ?? ""); } catch { continue; }
    if (incoming.type !== "product-sync-decision" || incoming.projectId !== project.config.projectId) continue;
    results.push(await applyDecision({ root, decision: incoming }));
    const latest = await load(resolve(root));
    latest.sync.githubCommentIds = [...(latest.sync.githubCommentIds ?? []), String(comment.id)].slice(-100);
    await saveJson(join(root, project.config.publication.statePath), latest.sync);
    seen.add(String(comment.id));
  }
  return results;
}

export async function openEscalation({ root = DEFAULT_ROOT, id, summary, scope = "escalation", allowedActions = ["choose", "approve", "reject", "clarify", "builder-switch-request"] } = {}) {
  if (!id || !summary) throw new Error("Escalation id and summary are required.");
  const project = await load(resolve(root));
  if (findOpenEscalation(project, id)) throw new Error(`Escalation '${id}' is already open.`);
  const state = { ...project.sync, openEscalations: [{ id, summary, scope: { level: scope, id }, allowedActions, status: "open", openedAt: timestamp() }, ...(project.sync.openEscalations ?? [])] };
  await saveJson(join(project.root, project.config.publication.statePath), state);
  return publishContext({ root, eventName: "escalation-opened", summary: `${id}: ${summary}` });
}

export async function writeDecision({ root = DEFAULT_ROOT, decision } = {}) {
  if (!decision) throw new Error("A decision object is required.");
  const project = await load(resolve(root));
  const inbox = bridgePath(project, "inboxPath", "orchestration/product-sync/inbox");
  await mkdir(inbox, { recursive: true });
  const path = join(inbox, `${decision.decisionId}.json`);
  await saveJson(path, decision);
  return path;
}

function arg(args, name) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; }
async function main() { const [command = "publish", ...args] = process.argv.slice(2); const root = arg(args, "--root") ?? DEFAULT_ROOT; if (command === "publish") { const packet = await publishContext({ root, eventName: arg(args, "--event"), summary: arg(args, "--summary") }); console.log(`Published ${packet.project.name} context at ${packet.generatedAt} (revision ${packet.synchronization.contextRevision}).`); return; } if (command === "set-builder") { const result = await setBuilder({ root, builderId: arg(args, "--builder"), reason: arg(args, "--reason") }); console.log(`Active builder is now ${result.builder.name} (${result.builder.provider}/${result.builder.model}).`); return; } if (command === "show-builder") { console.log(JSON.stringify(await readBuilder({ root }), null, 2)); return; } if (command === "prepare-worker") { console.log(JSON.stringify(await prepareWorker({ root, taskFile: arg(args, "--task-file") }), null, 2)); return; } if (command === "open-escalation") { const packet = await openEscalation({ root, id: arg(args, "--id"), summary: arg(args, "--summary"), scope: arg(args, "--scope") ?? "escalation", allowedActions: (arg(args, "--allowed-actions") ?? "choose,approve,reject,clarify,builder-switch-request").split(",") }); console.log(`Opened ${arg(args, "--id")} at context revision ${packet.synchronization.contextRevision}.`); return; } if (command === "poll-decisions") { console.log(JSON.stringify(await pollDecisions({ root }), null, 2)); return; } if (command === "poll-github") { console.log(JSON.stringify(await pollGitHubComments({ root }), null, 2)); return; } if (command === "apply-decision") { console.log(JSON.stringify(await applyDecision({ root, decisionFile: arg(args, "--decision-file") }), null, 2)); return; } throw new Error(`Unknown command '${command}'.`); }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
