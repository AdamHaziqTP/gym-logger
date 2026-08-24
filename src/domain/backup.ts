/**
 * Local JSON backup/restore domain (spec §18; task M05-T01-BACKUP-RESTORE-01).
 *
 * This module is PURE: no Dexie, no React. It defines the backup document
 * shape, builds a deterministic document from plain data, validates a parsed
 * file strictly (no coercion, no invented values — spec §6.2/§27.6 carry over
 * to backups), summarizes it for the pre-replacement confirmation, and hands
 * serialized JSON to the standard browser download / OS share path with the
 * same truthfulness contract as image export (§14.5): "shared" only from a
 * resolved share call, downloads reported only as started.
 */

import { HIGHLIGHT_TOKENS } from "./highlights";
import { supportsFileShare } from "./pngExport";
import type {
  Highlight,
  SessionSummaryOverride,
  WorkoutRow,
  WorkoutSession,
} from "./types";

/** Bumped only by future format changes; v1 is the initial format. */
export const BACKUP_SCHEMA_VERSION = 1;

/** Stable marker so a file can be identified as a Gym Log backup. */
export const BACKUP_KIND = "gym-log-backup";

const HIGHLIGHT_VALUES = Object.keys(HIGHLIGHT_TOKENS) as Highlight[];

/* ------------------------------ document ------------------------------- */

/** Plain JSON row exactly as stored on disk — key order fixed for determinism. */
export interface BackupRow {
  id: string;
  position: number;
  exercise: string;
  sets: string;
  reps: string;
  weight: string;
  skip: string;
  highlight: Highlight;
}

/** Plain JSON session; optional provenance keys appear only when set. */
export interface BackupSession {
  id: string;
  dateLocal: string;
  createdAt: string;
  updatedAt: string;
  sourceSessionId?: string;
  rows: BackupRow[];
  notes: string;
  summaryOverride?: SessionSummaryOverride;
  copiedToNotesAt?: string;
}

/** Local metadata/settings records (spec §18.1 "settings"), e.g. seed flag. */
export interface BackupMetaRecord {
  key: string;
  value: string;
  at: string;
}export interface BackupFile {
  schemaVersion: number;
  kind: string;
  exportedAt: string;
  sessions: BackupSession[];
  meta: BackupMetaRecord[];
}

/**
 * Builds the backup document from plain data. Deterministic: identical inputs
 * produce byte-identical JSON regardless of database read order — sessions
 * sort by (dateLocal, createdAt, id), rows by (position, id), meta by key,
 * and every object's keys are written in one fixed order.
 */
export function buildBackupDocument(
  sessions: WorkoutSession[],
  meta: BackupMetaRecord[],
  exportedAtIso: string,
): BackupFile {
  const sortedSessions = [...sessions].sort(
    (a, b) =>
      a.dateLocal.localeCompare(b.dateLocal) ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
  const sortedMeta = [...meta].sort((a, b) => a.key.localeCompare(b.key));

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    kind: BACKUP_KIND,
    exportedAt: exportedAtIso,
    sessions: sortedSessions.map(plainSession),
    meta: sortedMeta.map((record) => ({
      key: record.key,
      value: record.value,
      at: record.at,
    })),
  };
}

function plainSession(session: WorkoutSession): BackupSession {
  const base: BackupSession = {
    id: session.id,
    dateLocal: session.dateLocal,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    rows: [...session.rows]
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
      .map(plainRow),
    notes: session.notes,
  };
  if (session.sourceSessionId !== undefined) {
    base.sourceSessionId = session.sourceSessionId;
  }
  if (session.summaryOverride !== undefined) {
    const override: SessionSummaryOverride = {};
    if (session.summaryOverride.sets !== undefined) {
      override.sets = session.summaryOverride.sets;
    }
    if (session.summaryOverride.exercises !== undefined) {
      override.exercises = session.summaryOverride.exercises;
    }
    if (override.sets !== undefined || override.exercises !== undefined) {
      base.summaryOverride = override;
    }
  }
  if (session.copiedToNotesAt !== undefined) {
    base.copiedToNotesAt = session.copiedToNotesAt;
  }
  return base;
}

function plainRow(row: WorkoutRow): BackupRow {
  return {
    id: row.id,
    position: row.position,
    exercise: row.exercise,
    sets: row.sets,
    reps: row.reps,
    weight: row.weight,
    skip: row.skip,
    highlight: row.highlight,
  };
}

export function serializeBackupDocument(document: BackupFile): string {
  return JSON.stringify(document, null, 2);
}

/* ------------------------------ filenames ------------------------------ */

export function backupFilename(dateLocal: string): string {
  return `GymLog-Backup-${dateLocal}.json`;
}

/** Distinct name so a pre-replacement safety export never shadows an export. */
export function safetyBackupFilename(dateLocal: string): string {
  return `GymLog-Backup-${dateLocal}.pre-restore.json`;
}

/* ------------------------------ validation ----------------------------- */

export type BackupParseResult =
  | { ok: true; data: BackupFile }
  | { ok: false; error: string };

const DATE_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Parses and validates one backup file's text. Strict by design: wrong types
 * are rejected rather than coerced ("42" is not a number, 42 is not a
 * string), unknown schema versions are refused, duplicate ids are refused,
 * and every rejection names the offending path so the summary dialog can show
 * exactly why a file was refused.
 */
export function parseBackupJson(text: string): BackupParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "The file is not valid JSON." };
  }
  return validateBackupObject(parsed);
}

export function validateBackupObject(value: unknown): BackupParseResult {
  if (!isPlainObject(value)) {
    return { ok: false, error: "The backup must be a JSON object." };
  }

  if (value.kind !== undefined && value.kind !== BACKUP_KIND) {
    return {
      ok: false,
      error: `This file is not a Gym Log backup (kind ${JSON.stringify(value.kind)}).`,
    };
  }

  if (typeof value.schemaVersion !== "number" || !Number.isInteger(value.schemaVersion)) {
    return { ok: false, error: "The backup has no valid schemaVersion." };
  }
  if (value.schemaVersion > BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `This backup uses a newer format (schemaVersion ${value.schemaVersion}); update Gym Log first.`,
    };
  }
  if (value.schemaVersion < BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `This backup uses an unsupported older format (schemaVersion ${value.schemaVersion}).`,
    };
  }

  if (!Array.isArray(value.sessions)) {
    return { ok: false, error: "The backup has no sessions list." };
  }
  const sessions: BackupSession[] = [];
  const seenSessions = new Set<string>();
  for (let index = 0; index < value.sessions.length; index += 1) {
    const result = validateSession(value.sessions[index], index);
    if (!result.ok) return result;
    const session = result.data;
    if (seenSessions.has(session.id)) {
      return {
        ok: false,
        error: `Duplicate session id ${JSON.stringify(session.id)} in the backup.`,
      };
    }
    seenSessions.add(session.id);
    sessions.push(session);
  }

  const meta: BackupMetaRecord[] = [];
  if (value.meta !== undefined) {
    if (!Array.isArray(value.meta)) {
      return { ok: false, error: "meta must be a list of settings records." };
    }
    for (let index = 0; index < value.meta.length; index += 1) {
      const record = value.meta[index];
      if (
        !isPlainObject(record) ||
        !isNonEmptyString(record.key) ||
        typeof record.value !== "string" ||
        !isNonEmptyString(record.at)
      ) {
        return {
          ok: false,
          error: `meta[${index}] is not a {key, value, at} settings record.`,
        };
      }
      meta.push({ key: record.key, value: record.value, at: record.at });
    }
  }

  if (value.exportedAt !== undefined && typeof value.exportedAt !== "string") {
    return { ok: false, error: "exportedAt must be a timestamp string." };
  }

  return {
    ok: true,
    data: {
      schemaVersion: value.schemaVersion,
      kind: typeof value.kind === "string" ? value.kind : BACKUP_KIND,
      exportedAt:
        value.exportedAt !== undefined ? value.exportedAt : "",
      sessions,
      meta,
    },
  };
}

function validateSession(
  value: unknown,
  index: number,
): { ok: true; data: BackupSession } | { ok: false; error: string } {
  const at = `sessions[${index}]`;
  if (!isPlainObject(value)) {
    return { ok: false, error: `${at} is not an object.` };
  }
  if (!isNonEmptyString(value.id)) {
    return { ok: false, error: `${at}.id must be a non-empty string.` };
  }
  if (
    typeof value.dateLocal !== "string" ||
    !DATE_LOCAL_PATTERN.test(value.dateLocal)
  ) {
    return {
      ok: false,
      error: `${at}.dateLocal must be a YYYY-MM-DD date.`,
    };
  }
  if (!isNonEmptyString(value.createdAt)) {
    return { ok: false, error: `${at}.createdAt must be a timestamp string.` };
  }
  if (!isNonEmptyString(value.updatedAt)) {
    return { ok: false, error: `${at}.updatedAt must be a timestamp string.` };
  }
  if (
    value.sourceSessionId !== undefined &&
    !isNonEmptyString(value.sourceSessionId)
  ) {
    return { ok: false, error: `${at}.sourceSessionId must be a string.` };
  }
  if (value.copiedToNotesAt !== undefined && typeof value.copiedToNotesAt !== "string") {
    return { ok: false, error: `${at}.copiedToNotesAt must be a timestamp string.` };
  }
  if (typeof value.notes !== "string") {
    return { ok: false, error: `${at}.notes must be a string.` };
  }
  if (value.summaryOverride !== undefined && !isPlainSummaryOverride(value.summaryOverride)) {
    return {
      ok: false,
      error: `${at}.summaryOverride.sets/.exercises must be strings.`,
    };
  }
  if (!Array.isArray(value.rows)) {
    return { ok: false, error: `${at}.rows must be a list of rows.` };
  }

  const rows: BackupRow[] = [];
  const seenRows = new Set<string>();
  for (let rowIndex = 0; rowIndex < value.rows.length; rowIndex += 1) {
    const result = validateRow(value.rows[rowIndex], index, rowIndex);
    if (!result.ok) return result;
    const row = result.data;
    if (seenRows.has(row.id)) {
      return {
        ok: false,
        error: `Duplicate row id ${JSON.stringify(row.id)} in sessions[${index}].`,
      };
    }
    seenRows.add(row.id);
    rows.push(row);
  }

  const session: BackupSession = {
    id: value.id,
    dateLocal: value.dateLocal,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    rows,
    notes: value.notes,
  };
  if (value.sourceSessionId !== undefined) {
    session.sourceSessionId = value.sourceSessionId;
  }
  if (value.summaryOverride !== undefined) {
    const override = value.summaryOverride as Record<string, unknown>;
    const clean: SessionSummaryOverride = {};
    if (override.sets !== undefined) clean.sets = override.sets as string;
    if (override.exercises !== undefined) {
      clean.exercises = override.exercises as string;
    }
    if (clean.sets !== undefined || clean.exercises !== undefined) {
      session.summaryOverride = clean;
    }
  }
  if (value.copiedToNotesAt !== undefined) {
    session.copiedToNotesAt = value.copiedToNotesAt;
  }
  return { ok: true, data: session };
}

function isPlainSummaryOverride(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  return (
    (value.sets === undefined || typeof value.sets === "string") &&
    (value.exercises === undefined || typeof value.exercises === "string")
  );
}

function validateRow(
  value: unknown,
  sessionIndex: number,
  rowIndex: number,
): { ok: true; data: BackupRow } | { ok: false; error: string } {
  const at = `sessions[${sessionIndex}].rows[${rowIndex}]`;
  if (!isPlainObject(value)) {
    return { ok: false, error: `${at} is not an object.` };
  }
  if (!isNonEmptyString(value.id)) {
    return { ok: false, error: `${at}.id must be a non-empty string.` };
  }
  if (
    typeof value.position !== "number" ||
    !Number.isInteger(value.position) ||
    value.position < 0
  ) {
    return { ok: false, error: `${at}.position must be a whole number ≥ 0.` };
  }
  for (const field of ["exercise", "sets", "reps", "weight", "skip"] as const) {
    if (typeof value[field] !== "string") {
      return { ok: false, error: `${at}.${field} must be a string.` };
    }
  }
  if (
    typeof value.highlight !== "string" ||
    !HIGHLIGHT_VALUES.includes(value.highlight as Highlight)
  ) {
    return {
      ok: false,
      error: `${at}.highlight must be one of: ${HIGHLIGHT_VALUES.join(", ")}.`,
    };
  }
  return {
    ok: true,
    data: {
      id: value.id,
      position: value.position,
      exercise: value.exercise as string,
      sets: value.sets as string,
      reps: value.reps as string,
      weight: value.weight as string,
      skip: value.skip as string,
      highlight: value.highlight as Highlight,
    },
  };
}

/* ------------------------------- summary ------------------------------- */

export interface BackupSummary {
  sessionCount: number;
  rowCount: number;
  oldestDateLocal?: string;
  newestDateLocal?: string;
  exportedAt?: string;
  includesMetadata: boolean;
}

/**
 * The facts shown before destructive replacement. Derived ONLY from what the
 * file actually contains — nothing is inferred or invented.
 */
export function summarizeBackup(data: BackupFile): BackupSummary {
  const dates = data.sessions.map((session) => session.dateLocal).sort();
  return {
    sessionCount: data.sessions.length,
    rowCount: data.sessions.reduce((sum, session) => sum + session.rows.length, 0),
    oldestDateLocal: dates[0],
    newestDateLocal: dates[dates.length - 1],
    exportedAt: data.exportedAt || undefined,
    includesMetadata: data.meta.length > 0,
  };
}

/* ------------------------------ delivery ------------------------------- */

/**
 * Reads a picked file's text. Uses the modern `blob.text()` where present
 * (all browsers) and falls back to FileReader where it is not (jsdom), so
 * import behaves identically in production and in the automated suite.
 */
export function readFileText(blob: Blob): Promise<string> {
  if (typeof blob.text === "function") return blob.text();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Backup file could not be read."));
    reader.readAsText(blob);
  });
}

export type BackupDeliveryOutcome =
  | "shared"
  | "cancelled"
  | "failed"
  | "download-started";

/**
 * Hands serialized JSON to the platform's standard file workflow (spec
 * §18.2): the OS share sheet where files can be shared (iOS Files/iCloud
 * Drive targets), otherwise a programmatic browser download. Outcomes are
 * literal — "shared" only after a resolved share call, "cancelled" for user
 * dismissal, "download-started" meaning nothing more than that the click was
 * performed.
 */
export async function deliverBackupJson(
  json: string,
  filename: string,
): Promise<BackupDeliveryOutcome> {
  let blob: Blob;
  try {
    blob = new Blob([json], { type: "application/json" });
  } catch {
    return "failed";
  }

  if (supportsFileShare()) {
    try {
      const file = new File([blob], filename, { type: "application/json" });
      if (!navigator.canShare({ files: [file] })) return "failed";
      await navigator.share({ files: [file] });
      return "shared";
    } catch (error) {
      return error instanceof DOMException && error.name === "AbortError"
        ? "cancelled"
        : "failed";
    }
  }

  return triggerJsonDownload(blob, filename) ? "download-started" : "failed";
}

/**
 * Truthful `<a download>` fallback (same mechanics as the PNG path): returns
 * whether the click was actually performed; what the browser does afterwards
 * cannot be verified here.
 */
export function triggerJsonDownload(blob: Blob, filename: string): boolean {
  if (
    typeof document === "undefined" ||
    typeof URL?.createObjectURL !== "function"
  ) {
    return false;
  }
  try {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
  } catch {
    return false;
  }
}
