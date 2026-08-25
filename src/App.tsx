import { useEffect, useMemo, useState } from "react";
import { Home } from "./components/Home";
import { History } from "./components/History";
import { CopySession } from "./components/CopySession";
import { SessionView } from "./components/SessionView";
import { Settings } from "./components/Settings";
import type { GymLogDB } from "./data/db";
import { createDb, sortSessionsNewestFirst } from "./data/db";
import { readAppSettings, saveDefaultImageStyleSetting, saveThemeSetting } from "./data/settings";
import {
  applyThemePreference,
  DEFAULT_SETTINGS,
  type AppSettings,
  type ImageStyleSetting,
  type ThemeSetting,
} from "./domain/settings";
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
  | { name: "settings" }
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
  /**
   * M06-T02 (spec §§22–23): the two v1 preferences, loaded from the local
   * meta table during bootstrap and updated through the Settings screen.
   * Starts at the spec defaults (System / Compact) until the stored values
   * arrive; theme application is idempotent so re-applying is harmless.
   */
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        // Open on first mount; also covers an externally closed connection.
        if (!db.isOpen()) await db.open();
        await ensureSeeded(db);

        // Settings load with the same bootstrap; a read problem falls back
        // to defaults inside readAppSettings instead of failing startup.
        const loaded = await readAppSettings(db);
        if (!cancelled) {
          setSettings(loaded);
          applyThemePreference(loaded.theme);
        }

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

  /**
   * Theme changes apply immediately without a reload (spec §22.1): the
   * explicit Dark/Light choice sets the document attribute; System removes
   * it so the stylesheet's media query follows the OS preference.
   */
  useEffect(() => {
    applyThemePreference(settings.theme);
  }, [settings.theme]);

  /** Persist + apply a theme choice. UI updates first, write follows. */
  const changeTheme = (theme: ThemeSetting) => {
    setSettings((current) =>
      current.theme === theme ? current : { ...current, theme },
    );
    saveThemeSetting(db, theme).catch((error) => {
      console.error("Gym Logger: could not save theme setting", error);
    });
  };

  /** Same contract for the default image style preference. */
  const changeDefaultImageStyle = (style: ImageStyleSetting) => {
    setSettings((current) =>
      current.defaultImageStyle === style
        ? current
        : { ...current, defaultImageStyle: style },
    );
    saveDefaultImageStyleSetting(db, style).catch((error) => {
      console.error("Gym Logger: could not save image style setting", error);
    });
  };

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
      onOpenSettings={() => setView({ name: "settings" })}
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
  ) : view.name === "settings" ? (
    // Minimal settings surface (spec §§22–23; M06-T02): theme + default
    // image style only. Choices apply immediately and persist locally.
    <Settings
      settings={settings}
      onChangeTheme={changeTheme}
      onChangeDefaultImageStyle={changeDefaultImageStyle}
      onBack={() => setView({ name: "home" })}
    />
  ) : (
    <SessionView
      db={db}
      sessionId={view.sessionId}
      defaultImageStyle={settings.defaultImageStyle}
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
