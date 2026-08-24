import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { startTodayFromSession } from "../data/clone";
import type { GymLogDB } from "../data/db";
import { sortSessionsNewestFirst } from "../data/db";
import { formatDateDisplay, todayLocalDate } from "../domain/dates";
import { filterSessionsBySearch } from "../domain/historySearch";
import { orderedRows } from "../domain/rows";
import { displaySummary } from "../domain/summary";
import type { WorkoutSession } from "../domain/types";

interface CopySessionProps {
  db: GymLogDB;
  /** Back to Home. */
  onBack: () => void;
  /** Called with the freshly cloned session id; App opens it immediately. */
  onSessionReady: (sessionId: string) => void;
  /** Overrides today's local date (tests); defaults to the device date. */
  todayLocal?: string;
}

/**
 * Copy Another Session flow (spec §4.3, §12.2; M02-T02): a reverse-
 * chronological, searchable source picker followed by a compact READ preview
 * — date, summary, row count, and notes text only, never an editable table
 * (spec §11.1 contrast; AC-03). `Use This Session` clones the chosen source
 * into today's local date under DEFAULT_CLONE_POLICY and opens it.
 *
 * Today-session conflict policy (spec §4.3; M02-T02 decision, see
 * orchestration/reports/M02-T02.md): when a session already exists for the
 * target date, tapping `Use This Session` first shows an explicit replace
 * confirmation. Nothing is created or destroyed until that confirmation, and
 * confirming REPLACES the existing same-date session rather than creating a
 * second one — the one-session-per-local-date model (§4.1, §27.1) holds even
 * in this non-normal path, and no duplication can happen silently.
 */
export function CopySession({
  db,
  onBack,
  onSessionReady,
  todayLocal,
}: CopySessionProps) {
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  /** Source awaiting explicit confirmation while today's session exists. */
  const [pendingReplace, setPendingReplace] = useState<WorkoutSession | null>(
    null,
  );
  const [working, setWorking] = useState(false);

  const today = todayLocal ?? todayLocalDate();

  // Pick from the full stored history newest-first; the same local search
  // surfaces as History apply (spec §4.3 step 2; AC-02).
  const newestFirst = sortSessionsNewestFirst(sessions);
  const visible = filterSessionsBySearch(newestFirst, query);
  const picked = pickedId
    ? newestFirst.find((session) => session.id === pickedId)
    : undefined;

  const useThisSession = async (source: WorkoutSession) => {
    if (working) return; // double-tap guard (spec §27.2)
    setWorking(true);
    try {
      // Fresh existence check drives the conflict warning (AC-05): an
      // existing same-date session must never be duplicated or replaced
      // silently — this tap ends at the explicit confirmation instead.
      const existingToday = await db.sessions
        .where("dateLocal")
        .equals(today)
        .toArray();
      if (existingToday.length > 0) {
        setPendingReplace(source);
        return;
      }
      const result = await startTodayFromSession(db, source.id, {
        dateLocal: today,
      });
      onSessionReady(result.session.id);
    } catch (error) {
      console.error("Gym Logger: could not copy that session", error);
    } finally {
      setWorking(false);
    }
  };

  const confirmReplace = async () => {
    if (!pendingReplace || working) return;
    const source = pendingReplace;
    setPendingReplace(null);
    setWorking(true);
    try {
      // The transaction inside re-checks and deletes any same-date session,
      // so the confirmed replacement can never leave a duplicate behind.
      const result = await startTodayFromSession(db, source.id, {
        dateLocal: today,
      });
      onSessionReady(result.session.id);
    } catch (error) {
      console.error("Gym Logger: could not copy that session", error);
    } finally {
      setWorking(false);
    }
  };

  if (picked) {
    const rows = orderedRows(picked.rows);
    const summary = displaySummary(picked);
    return (
      <main className="screen">
        <header className="session-header">
          <button
            type="button"
            className="back-button"
            onClick={() => {
              setPendingReplace(null);
              setPickedId(null);
            }}
          >
            ‹ All Sessions
          </button>
        </header>

        {/* Read-oriented preview (spec §4.3 step 4; AC-03): date, summary,
            counts, notes text. No table, no inputs. */}
        <h1 className="session-title">{formatDateDisplay(picked.dateLocal)}</h1>
        <p className="summary-line">
          {summary.sets} sets · {summary.exercises} exercises
        </p>
        <p className="preview-meta">
          {rows.length} {rows.length === 1 ? "row" : "rows"} ·{" "}
          {rows.some((row) => row.skip.trim() !== "")
            ? "has Skip entries"
            : "Skip empty"}
        </p>

        {picked.notes.trim() !== "" && (
          <section aria-label="Source session notes">
            <h2 className="section-label">Notes</h2>
            <p className="preview-notes">{picked.notes}</p>
          </section>
        )}

        <div className="preview-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void useThisSession(picked)}
            disabled={working}
          >
            Use This Session
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setPendingReplace(null);
              setPickedId(null);
            }}
            disabled={working}
          >
            Choose Another Session
          </button>
        </div>

        <footer className="footnote">
          Use This Session starts today from this workout: rows, order, values,
          and highlights carry over; Skip and notes start empty.
        </footer>

        {pendingReplace && (
          <div
            className="confirm-backdrop"
            onClick={() => setPendingReplace(null)}
          >
            <div
              className="confirm-card"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="replace-title"
              aria-describedby="replace-message"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="replace-title">Replace today's session?</h2>
              <p id="replace-message" className="confirm-message">
                A session for {formatDateDisplay(today)} already exists. Use
                This Session replaces it with a fresh copy of{" "}
                {formatDateDisplay(pendingReplace.dateLocal)}. Your Apple Notes
                archive is not affected.
              </p>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPendingReplace(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-destructive"
                  onClick={() => void confirmReplace()}
                >
                  Replace Today's Session
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="screen">
      <header className="session-header">
        <button type="button" className="back-button" onClick={onBack}>
          ‹ Gym Log
        </button>
      </header>

      <h1 className="session-title">Copy Another Session</h1>

      <input
        type="search"
        className="history-search"
        placeholder="Search sessions"
        aria-label="Search sessions"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {visible.length === 0 ? (
        <p className="history-empty" role="status">
          {query.trim() === "" ? "No sessions yet." : "No sessions match."}
        </p>
      ) : (
        <ul className="history-list" aria-label="Copy source sessions">
          {visible.map((session) => (
            <li key={session.id}>
              <button
                type="button"
                className="history-item"
                onClick={() => setPickedId(session.id)}
                aria-label={`Pick session ${formatDateDisplay(session.dateLocal)}`}
              >
                <span className="history-item-date">
                  {formatDateDisplay(session.dateLocal)}
                </span>
                <span className="history-item-summary">
                  {pickerSummaryLine(session)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function pickerSummaryLine(session: WorkoutSession): string {
  const summary = displaySummary(session);
  return `${summary.sets} sets · ${summary.exercises} exercises`;
}

export default CopySession;
