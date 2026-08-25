import { useEffect, useMemo, useState } from "react";
import { Home } from "./components/Home";
import { History } from "./components/History";
import { CopySession } from "./components/CopySession";
import { SessionView } from "./components/SessionView";
import type { GymLogDB } from "./data/db";
import { createDb, sortSessionsNewestFirst } from "./data/db";
import { ensureSeeded } from "./data/seed";
import { todayLocalDate } from "./domain/dates";

/**
 * Where a session was opened from, so `‹ Gym Log` returns to the right list
 * (M02-T01): Home → History → Session → back reopens the History screen;
 * a session opened/resumed from Home goes straight back Home. The History
 * search text itself is component-local state and resets on that remount;
 * spec §11 requires no filter persistence.
 */
type View =
  | { name: "home" }
  | { name: "history" }
  | { name: "copy" }
  | { name: "session"; sessionId: string; from: "home" | "history" };

interface AppProps {
  db: GymLogDB;
  /**
   * Overrides today's local date (tests). Defaults to the device local date.
   * The device clock is never touched by production code paths.
   */
  todayLocal?: string;
}

/**
 * App shell. On launch/remount, if a session already exists for today's local
 * date it opens that session DIRECTLY (M01 human-gate correction; spec §27.1)
 * — the `Gym Log` back control in SessionView stays available for deliberate
 * navigation Home. Without a current session the sparse Home/Start flow shows.
 */
export function App({ db, todayLocal }: AppProps) {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>({ name: "home" });
  /**
   * M06-T01 (spec §27.9): when local storage cannot open at startup the app
   * must say so, non-destructively, instead of failing silently. `retryToken`
   * re-runs the bootstrap in place (e.g. after the user frees browser storage
   * or closes a conflicting tab); nothing is ever deleted on this path.
   */
  const [startupFailed, setStartupFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        // Open on first mount; also covers an externally closed connection.
        if (!db.isOpen()) await db.open();
        await ensureSeeded(db);

        // Direct resume: a current session reopens itself instead of landing
        // on Home. One session per local date (spec §4.1).
        const today = todayLocal ?? todayLocalDate();
        const todays = sortSessionsNewestFirst(
          await db.sessions.where("dateLocal").equals(today).toArray(),
        );
        if (!cancelled && todays[0]) {
          setView({ name: "session", sessionId: todays[0].id, from: "home" });
        }
      } catch (error) {
        console.error("Gym Logger: startup failed", error);
        if (!cancelled) setStartupFailed(true);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void bootstrap();

    // Best-effort persistent storage request (spec §17.3). Local API only.
    try {
      const storage = navigator.storage as StorageManager | undefined;
      void storage?.persist?.()?.catch(() => undefined);
    } catch {
      // Persistence is best-effort; Apple Notes remains the archive.
    }

    // Do not close the shared database here: closing during cleanup races the
    // pending autosaves that SessionView flushes on unmount (OpenFailedError,
    // lost edits). The browser owns the page lifetime and releases IndexedDB
    // connections when the page is destroyed; tests close their own instances.
    return () => {
      cancelled = true;
    };
  }, [db, todayLocal, retryToken]);

  if (!ready) {
    return <div className="boot" role="status" aria-label="Loading" />;
  }

  if (startupFailed) {
    return (
      <main className="screen">
        <h1 className="app-title">Gym Log</h1>
        <section
          className="panel startup-failure"
          role="alert"
          aria-labelledby="startup-failure-label"
        >
          <h2 className="section-label" id="startup-failure-label">
            Storage unavailable
          </h2>
          <p className="muted-line">
            Gym Log couldn't open this device's local database, so saved
            sessions couldn't be loaded. Nothing was deleted.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setRetryToken((token) => token + 1)}
          >
            Try Again
          </button>
          <p className="footnote">
            If this keeps happening, close other Gym Log tabs or check that your
            browser isn't blocking site data. Once storage opens again, use
            Export Backup to keep an extra copy — local storage is not a
            permanent archive.
          </p>
        </section>
      </main>
    );
  }

  return view.name === "home" ? (
    <Home
      db={db}
      onOpenSession={(sessionId) =>
        setView({ name: "session", sessionId, from: "home" })
      }
      onOpenHistory={() => setView({ name: "history" })}
      onOpenCopyAnother={() => setView({ name: "copy" })}
      todayLocal={todayLocal}
    />
  ) : view.name === "history" ? (
    <History
      db={db}
      onBack={() => setView({ name: "home" })}
      onOpenSession={(sessionId) =>
        setView({ name: "session", sessionId, from: "history" })
      }
    />
  ) : view.name === "copy" ? (
    // Copy Another Session flow (spec §4.3; M02-T02). The freshly cloned
    // session opens like any session started from Home: back returns Home.
    <CopySession
      db={db}
      onBack={() => setView({ name: "home" })}
      onSessionReady={(sessionId) =>
        setView({ name: "session", sessionId, from: "home" })
      }
      todayLocal={todayLocal}
    />
  ) : (
    <SessionView
      db={db}
      sessionId={view.sessionId}
      onBack={() =>
        setView(view.from === "history" ? { name: "history" } : { name: "home" })
      }
    />
  );
}

export default function AppRoot() {
  const db = useMemo(() => createDb(), []);
  return <App db={db} />;
}
