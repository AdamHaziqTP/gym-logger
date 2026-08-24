import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { GymLogDB } from "../data/db";
import { sortSessionsNewestFirst } from "../data/db";
import { formatDateDisplay } from "../domain/dates";
import { filterSessionsBySearch } from "../domain/historySearch";
import { displaySummary } from "../domain/summary";
import type { WorkoutSession } from "../domain/types";

interface HistoryProps {
  db: GymLogDB;
  onOpenSession: (sessionId: string) => void;
  onBack: () => void;
}

/**
 * Reverse-chronological session history (spec §11.1, §11.2; M02-T01). Date and
 * summary only — never inline tables — with one local case-insensitive search
 * field. Tapping a row opens the existing editable SessionView for that
 * historical session (spec §11.3): history is never read-only.
 */
export function History({ db, onOpenSession, onBack }: HistoryProps) {
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];
  const [query, setQuery] = useState("");

  const newestFirst = sortSessionsNewestFirst(sessions);
  const visible = filterSessionsBySearch(newestFirst, query);
  const trimmed = query.trim();

  return (
    <main className="screen">
      <header className="session-header">
        <button type="button" className="back-button" onClick={onBack}>
          ‹ Gym Log
        </button>
      </header>

      <h1 className="session-title">History</h1>

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
          {trimmed === "" ? "No sessions yet." : "No sessions match."}
        </p>
      ) : (
        <ul className="history-list" aria-label="Session history">
          {visible.map((session) => (
            <li key={session.id}>
              <button
                type="button"
                className="history-item"
                onClick={() => onOpenSession(session.id)}
                aria-label={`Open session ${formatDateDisplay(session.dateLocal)}`}
              >
                <span className="history-item-date">
                  {formatDateDisplay(session.dateLocal)}
                </span>
                <span className="history-item-summary">{summaryLine(session)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function summaryLine(session: WorkoutSession): string {
  const summary = displaySummary(session);
  return `${summary.sets} sets · ${summary.exercises} exercises`;
}

export default History;
