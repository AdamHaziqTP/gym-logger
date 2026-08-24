import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
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
  const fallback = { schemaVersion: 1, activeBuilder: "ox-alpha", events: [], builderChanges: [] };
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
    synchronization: { lastEvent: event ?? sync.lastEvent, detailedLogs: "orchestration/reports/ and orchestration/reviews/ remain the detailed machine/reviewer record; this packet is a compact product-facing summary.", bridge: config.bridge }
  };
}

export async function publishContext({ root = DEFAULT_ROOT, eventName, summary } = {}) {
  const project = await load(resolve(root));
  const event = eventName ? { name: eventName, summary: summary ?? "", at: timestamp() } : null;
  const state = { ...project.sync, schemaVersion: 1, lastPublishedAt: timestamp(), lastEvent: event, events: event ? [event, ...(project.sync.events ?? [])].slice(0, project.config.limits.recentEvents) : project.sync.events ?? [] };
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

function arg(args, name) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; }
async function main() { const [command = "publish", ...args] = process.argv.slice(2); const root = arg(args, "--root") ?? DEFAULT_ROOT; if (command === "publish") { const packet = await publishContext({ root, eventName: arg(args, "--event"), summary: arg(args, "--summary") }); console.log(`Published ${packet.project.name} context at ${packet.generatedAt}.`); return; } if (command === "set-builder") { const result = await setBuilder({ root, builderId: arg(args, "--builder"), reason: arg(args, "--reason") }); console.log(`Active builder is now ${result.builder.name} (${result.builder.provider}/${result.builder.model}).`); return; } if (command === "show-builder") { console.log(JSON.stringify(await readBuilder({ root }), null, 2)); return; } if (command === "prepare-worker") { console.log(JSON.stringify(await prepareWorker({ root, taskFile: arg(args, "--task-file") }), null, 2)); return; } throw new Error(`Unknown command '${command}'.`); }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
