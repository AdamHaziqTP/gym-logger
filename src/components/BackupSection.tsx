import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { GymLogDB } from "../data/db";
import { collectBackup, replaceAllSessions } from "../data/backup";
import {
  deliverBackupJson,
  backupFilename,
  parseBackupJson,
  readFileText,
  safetyBackupFilename,
  serializeBackupDocument,
  summarizeBackup,
  type BackupDeliveryOutcome,
  type BackupFile,
} from "../domain/backup";
import { todayLocalDate } from "../domain/dates";

/**
 * Local Backup section on Home (spec §18; task M05-T01-BACKUP-RESTORE-01).
 * Two quiet controls beside the existing Home actions — no settings system,
 * no cloud service (§18.2: the standard browser/iOS file workflow only).
 *
 * Honesty contract carried over from Copy-to-Notes / image export:
 * - Export/import statuses report exactly what happened here — a download is
 *   "started", never "saved"; a share outcome comes only from a resolved
 *   navigator.share call. Whether iPhone Files received anything stays a
 *   physical-device question and is never claimed from jsdom/desktop.
 * - Import validates strictly BEFORE any dialog; invalid files leave every
 *   record untouched. A valid file shows its summary and requires an
 *   explicit replacement confirmation; Cancel/backdrop dismissal changes
 *   nothing (spec §18.3).
 * - Replacement first attempts a SAFETY export of the current data. The
 *   safety delivery is best-effort by design: if this browser cannot deliver
 *   it, the explicitly confirmed replacement still proceeds and the status
 *   says the safety file could not be delivered — destruction of data is
 *   never silent because the summary + explicit confirm came first.
 */

const EXPORT_STATUS: Record<BackupDeliveryOutcome, (filename: string) => string> = {
  shared: () => "Backup shared ✓",
  cancelled: () => "Share canceled",
  failed: () => "Backup could not be delivered in this browser.",
  "download-started": (filename) =>
    `Download started — look for ${filename} in your downloads.`,
};

interface PendingImport {
  fileName: string;
  data: BackupFile;
}

export function BackupSection({
  db,
  todayLocal,
}: {
  db: GymLogDB;
  /** Overrides today's local date (tests); defaults to the device date. */
  todayLocal?: string;
}) {
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [exporting, setExporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const localToday = () => todayLocal ?? todayLocalDate();

  const handleExport = async () => {
    if (exporting || pendingImport) return; // double-tap guard (spec §27.2)
    setExporting(true);
    setErrorText("");
    setStatusText("");
    try {
      // Everything is collected before delivery so the share/download call
      // happens with the document already in hand.
      const document_ = await collectBackup(db, new Date().toISOString());
      const json = serializeBackupDocument(document_);
      const filename = backupFilename(localToday());
      const outcome = await deliverBackupJson(json, filename);
      setStatusText(EXPORT_STATUS[outcome](filename));
    } catch (error) {
      console.error("Gym Logger: backup export failed", error);
      setStatusText("Backup could not be created.");
    } finally {
      setExporting(false);
    }
  };

  const handleImportPick = () => {
    if (restoring) return;
    setErrorText("");
    setStatusText("");
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    // Reset immediately so picking the SAME file again still fires change.
    input.value = "";
    if (!file) return;

    let text: string;
    try {
      text = await readFileText(file);
    } catch (error) {
      console.error("Gym Logger: backup file unreadable", error);
      setErrorText(`Import failed: "${file.name}" could not be read.`);
      return;
    }

    const result = parseBackupJson(text);
    if (!result.ok) {
      // Nothing has been touched: rejection happens before any database work.
      setErrorText(`Import failed: ${result.error}`);
      return;
    }
    setPendingImport({ fileName: file.name, data: result.data });
  };

  /** Cancel / backdrop: close the dialog; the database is never touched. */
  const cancelImport = () => {
    if (!restoring) setPendingImport(null);
  };

  /**
   * Explicit destructive confirmation (spec §18.3): safety export of CURRENT
   * data first, then one transactional replacement.
   */
  const commandConfirmRestore = async () => {
    if (!pendingImport || restoring) return;
    setRestoring(true);
    try {
      let safetyNote = SAFETY_UNAVAILABLE_NOTE;
      try {
        const safetyDoc = await collectBackup(db, new Date().toISOString());
        const safetyOutcome = await deliverBackupJson(
          serializeBackupDocument(safetyDoc),
          safetyBackupFilename(localToday()),
        );
        safetyNote = SAFETY_NOTE[safetyOutcome];
      } catch (safetyError) {
        console.error("Gym Logger: safety backup failed", safetyError);
      }

      await replaceAllSessions(db, pendingImport.data.sessions);
      const count = pendingImport.data.sessions.length;
      setStatusText(
        `Restored ${count} ${count === 1 ? "session" : "sessions"} from ${pendingImport.fileName}. ${safetyNote}`,
      );
      setPendingImport(null);
    } catch (error) {
      console.error("Gym Logger: restore failed", error);
      setPendingImport(null);
      // The replacement runs in one transaction, so a failure leaves the
      // previous sessions in place — say exactly that.
      setErrorText("Restore failed — your current sessions are unchanged.");
    } finally {
      setRestoring(false);
    }
  };

  const summary = pendingImport ? summarizeBackup(pendingImport.data) : null;

  return (
    <section className="backup-section" aria-labelledby="backup-label">
      <h2 className="section-label" id="backup-label">
        Backup
      </h2>
      <div className="backup-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void handleExport()}
          disabled={exporting}
        >
          {exporting ? "Preparing…" : "Export Backup"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleImportPick}
          disabled={restoring}
        >
          Import Backup
        </button>
      </div>

      {/* Real picker kept out of the layout; Import opens it programmatically. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="file-input-offscreen"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => void handleFileChosen(event)}
      />

      <p className="copy-notes-status" role="status" aria-live="polite">
        {statusText}
      </p>
      {errorText && (
        <p className="copy-notes-status backup-error" role="alert">
          {errorText}
        </p>
      )}

      {/* Pre-replacement summary + explicit confirmation (spec §18.3). */}
      {pendingImport && summary && (
        <div className="confirm-backdrop" onClick={cancelImport}>
          <div
            className="confirm-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="import-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="import-confirm-title">
              Replace everything currently in Gym Log with this backup?
            </h2>
            <ul className="backup-summary">
              <li>Sessions: {summary.sessionCount}</li>
              <li>Rows: {summary.rowCount}</li>
              {summary.oldestDateLocal && summary.newestDateLocal && (
                <li>
                  Dates:{" "}
                  {summary.oldestDateLocal === summary.newestDateLocal
                    ? summary.oldestDateLocal
                    : `${summary.oldestDateLocal} – ${summary.newestDateLocal}`}
                </li>
              )}
              {summary.exportedAt && <li>Exported: {summary.exportedAt}</li>}
              <li>From file: {pendingImport.fileName}</li>
            </ul>
            <p className="confirm-message">
              All current sessions are removed first. Where possible your
              current data is saved to a safety backup before replacing.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelImport}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-destructive"
                disabled={restoring}
                onClick={() => void commandConfirmRestore()}
              >
                Replace All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/** Post-restore notes per literal safety-delivery outcome. */
const SAFETY_NOTE: Record<BackupDeliveryOutcome, string> = {
  shared: "Your previous data went to the safety backup share sheet.",
  cancelled: "Safety backup share was canceled.",
  failed: "A safety backup could not be delivered in this browser.",
  "download-started":
    "A safety backup download of your previous data started.",
};

const SAFETY_UNAVAILABLE_NOTE =
  "A safety backup could not be delivered in this browser.";

export default BackupSection;
