import { useEffect, useMemo, useState } from "react";
import { Home } from "./components/Home";
import { History } from "./components/History";
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
        console.error("Gym Logger: seeding failed", error);
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
  }, [db, todayLocal]);

  if (!ready) {
    return <div className="boot" role="status" aria-label="Loading" />;
  }

  return view.name === "home" ? (
    <Home
      db={db}
      onOpenSession={(sessionId) =>
        setView({ name: "session", sessionId, from: "home" })
      }
      onOpenHistory={() => setView({ name: "history" })}
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
