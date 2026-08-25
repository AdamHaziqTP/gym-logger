import type { BackupFile } from "../domain/backup";
import { buildBackupDocument } from "../domain/backup";
import type { WorkoutSession } from "../domain/types";
import type { GymLogDB, MetaRecord } from "./db";

/**
 * Dexie-backed backup collection and restore (spec §18; task
 * M05-T01-BACKUP-RESTORE-01). All shape/serialization/validation logic lives
 * in the pure `domain/backup` module; this layer only reads and writes
 * records.
 */

/**
 * Reads everything that belongs in a backup (spec §18.1): every session with
 * its rows/highlights/free-form strings/overrides/provenance timestamps plus
 * the local metadata table (the closest thing to "settings" this app has).
 * The document itself is built by the pure builder, so exports are
 * deterministic regardless of read order.
 */
export async function collectBackup(
  db: GymLogDB,
  exportedAtIso: string,
): Promise<BackupFile> {
  const [sessions, meta] = await Promise.all([
    db.sessions.toArray(),
    db.meta.toArray(),
  ]);
  return buildBackupDocument(sessions, meta, exportedAtIso);
}

/**
 * Destructive full replacement (spec §18.3) inside ONE read-write
 * transaction: either the whole imported set lands or nothing changes.
 *
 * Records are written VERBATIM — ids, dateLocal, row order and positions,
 * free-form strings, highlights, notes, summary overrides, createdAt/
 * updatedAt and provenance timestamps are never regenerated or normalized,
 * so restoring reproduces the file exactly (J2–J5). The meta table is
 * deliberately NOT replaced: those records describe THIS device's state
 * (e.g. the one-time seed flag), and overwriting them could silently re-seed
 * fixture data or drop local settings; sessions are what backup/restore is
 * for. One-session-per-local-date behavior is untouched: restored rows are
 * ordinary session records, so the existing resume/list logic applies.
 */
export async function replaceAllSessions(
  db: GymLogDB,
  sessions: WorkoutSession[],
): Promise<void> {
  await db.transaction("rw", db.sessions, async () => {
    await db.sessions.clear();
    if (sessions.length > 0) {
      await db.sessions.bulkPut(sessions);
    }
  });
}

/**
 * Full validated backup replacement: sessions AND the metadata/settings
 * records carried by the file. Both tables share one transaction so a failed
 * restore cannot leave the app with new sessions and old preferences (or the
 * reverse). Records are written verbatim; the caller has already validated
 * their shape.
 */
export async function replaceAllData(
  db: GymLogDB,
  sessions: WorkoutSession[],
  meta: MetaRecord[],
): Promise<void> {
  await db.transaction("rw", db.sessions, db.meta, async () => {
    await db.sessions.clear();
    await db.meta.clear();
    if (sessions.length > 0) await db.sessions.bulkPut(sessions);
    if (meta.length > 0) await db.meta.bulkPut(meta);
  });
}
