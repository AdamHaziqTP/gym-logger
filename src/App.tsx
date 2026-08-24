import { useEffect, useMemo, useState } from "react";
import { Home } from "./components/Home";
import { SessionView } from "./components/SessionView";
import type { GymLogDB } from "./data/db";
import { createDb } from "./data/db";
import { ensureSeeded } from "./data/seed";

type View = { name: "home" } | { name: "session"; sessionId: string };

export function App({ db }: { db: GymLogDB }) {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>({ name: "home" });

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        // Open on first mount; also covers an externally closed connection.
        if (!db.isOpen()) await db.open();
        await ensureSeeded(db);
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
  }, [db]);

  if (!ready) {
    return <div className="boot" role="status" aria-label="Loading" />;
  }

  return view.name === "home" ? (
    <Home
      db={db}
      onOpenSession={(sessionId) => setView({ name: "session", sessionId })}
    />
  ) : (
    <SessionView
      db={db}
      sessionId={view.sessionId}
      onBack={() => setView({ name: "home" })}
    />
  );
}

export default function AppRoot() {
  const db = useMemo(() => createDb(), []);
  return <App db={db} />;
}
