import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { startTodaySession } from "../data/clone";
import type { GymLogDB } from "../data/db";
import { sortSessionsNewestFirst } from "../data/db";
import { formatDateDisplay, todayLocalDate } from "../domain/dates";
import { displaySummary } from "../domain/summary";

interface HomeProps {
  db: GymLogDB;
  onOpenSession: (sessionId: string) => void;
  /** Overrides today's local date (tests); defaults to the device date. */
  todayLocal?: string;
}

/** Sparse Home screen (spec §4.1, §13). No analytics cards, no gamification. */
export function Home({ db, onOpenSession, todayLocal }: HomeProps) {
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];
  const [starting, setStarting] = useState(false);

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
      const result = await startTodaySession(db);
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

      <footer className="footnote">
        Copy Another Session, History and Settings arrive in later milestones.
        Your Apple Notes archive remains canonical.
      </footer>
    </main>
  );
}

function summaryText(session: Parameters<typeof displaySummary>[0]): string {
  const summary = displaySummary(session);
  return `${summary.sets} sets · ${summary.exercises} exercises`;
}
