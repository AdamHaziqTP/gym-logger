import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { startTodaySession } from "../data/clone";
import type { GymLogDB } from "../data/db";
import { sortSessionsNewestFirst } from "../data/db";
import { BackupSection } from "./BackupSection";
import {
  describeStorage,
  readStorageSnapshot,
  type StorageArea,
} from "../domain/storageInfo";
import { formatDateDisplay, todayLocalDate } from "../domain/dates";
import { displaySummary } from "../domain/summary";

interface HomeProps {
  db: GymLogDB;
  onOpenSession: (sessionId: string) => void;
  /** Opens the History screen (spec §4.1 additional navigation; M02-T01). */
  onOpenHistory: () => void;
  /** Opens the Copy Another Session flow (spec §4.3; M02-T02). */
  onOpenCopyAnother: () => void;
  /** Opens the Settings screen (spec §§4.1, 23; M06-T02). */
  onOpenSettings: () => void;
  /** Overrides today's local date (tests); defaults to the device date. */
  todayLocal?: string;
  /** Injectable StorageManager for deterministic tests; default is real. */
  storageArea?: StorageArea | null;
}

/** Sparse Home screen (spec §4.1, §13). No analytics cards, no gamification. */
export function Home({
  db,
  onOpenSession,
  onOpenHistory,
  onOpenCopyAnother,
  onOpenSettings,
  todayLocal,
  storageArea,
}: HomeProps) {
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];
  const [starting, setStarting] = useState(false);
  /**
   * M06-T01 (spec §17.3, §23): one quiet truthful diagnostic line. Starts
   * conservative and is refined only by what the Storage API actually
   * reports — it never markets local storage as permanent.
   */
  const [storageNote, setStorageNote] = useState(
    "On-device local storage (best-effort); your browser may still clear it.",
  );

  useEffect(() => {
    let cancelled = false;
    readStorageSnapshot(storageArea)
      .then((snapshot) => {
        if (!cancelled) setStorageNote(describeStorage(snapshot));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [storageArea]);

  const today = todayLocal ?? todayLocalDate();
  const todaySession = sortSessionsNewestFirst(
    sessions.filter((session) => session.dateLocal === today),
  )[0];
  const lastWorkout = sortSessionsNewestFirst(
    sessions.filter((session) => !todaySession || session.id !== todaySession.id),
  )[0];

  const handleStart = async () => {
    if (starting) return; // double-tap guard (spec §27.2)
    setStarting(true);
    try {
      // Honor the injected todayLocal override (the prop's documented
      // contract): without this, Start silently used the DEVICE date, which
      // broke every date-override consumer whenever the device clock moved
      // past the test/verification date (baseline correction, FEAS-01).
      const result = await startTodaySession(db, { dateLocal: today });
      onOpenSession(result.session.id);
    } catch (error) {
      console.error("Gym Logger: could not start today's session", error);
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className="screen">
      <h1 className="app-title">Gym Log</h1>

      <section className="panel" aria-labelledby="today-label">
        <h2 className="section-label" id="today-label">
          Today
        </h2>
        <p className="date-line">{formatDateDisplay(today)}</p>
        {todaySession ? (
          <>
            <p className="summary-line">{summaryText(todaySession)}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onOpenSession(todaySession.id)}
            >
              Continue Today's Session
            </button>
          </>
        ) : (
          <>
            <p className="muted-line">No session yet</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStart}
              disabled={starting || !lastWorkout}
            >
              Start Today's Session
            </button>
          </>
        )}
      </section>

      {lastWorkout && (
        <section className="panel" aria-labelledby="last-label">
          <h2 className="section-label" id="last-label">
            Last Workout
          </h2>
          <p className="date-line">{formatDateDisplay(lastWorkout.dateLocal)}</p>
          <p className="summary-line">{summaryText(lastWorkout)}</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onOpenSession(lastWorkout.id)}
          >
            View
          </button>
        </section>
      )}

      {/* Secondary actions (spec §4.1, §13): clone from a chosen historical
          session — e.g. when equipment changes (spec §4.3) — plus History.
          M03-T02-HOME-LAYOUT-FIX-01: as margin-less block buttons these
          stacked flush and visually clipped/overlapped on iPhone; the single
          .home-actions flex column keeps them two distinct full-width
          controls with explicit vertical separation at every width. */}
      <div className="home-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenCopyAnother}
          disabled={sessions.length === 0}
        >
          Copy Another Session
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenHistory}
        >
          History
        </button>
      </div>

      {/* Local backup controls (spec §18; M05-T01-BACKUP-RESTORE-01): a
          small labeled section of its own so the existing .home-actions pair
          above stays exactly two buttons, and the sparse layout keeps its
          Today / Last Workout / actions rhythm. */}
      <BackupSection db={db} todayLocal={todayLocal} />

      {/* Settings entry (spec §§4.1, 13, 23; M06-T02): one quiet full-width
          control in its own section — the same rhythm as the backup section
          — replacing the earlier "arrives later" placeholder. */}
      <div className="settings-entry">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenSettings}
        >
          Settings
        </button>
      </div>

      <footer className="footnote">
        <p className="storage-note" role="note">
          {storageNote}
        </p>
        Your Apple Notes archive remains canonical.
      </footer>
    </main>
  );
}

function summaryText(session: Parameters<typeof displaySummary>[0]): string {
  const summary = displaySummary(session);
  return `${summary.sets} sets · ${summary.exercises} exercises`;
}
