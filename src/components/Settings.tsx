import {
  APP_VERSION,
  type AppSettings,
  type ThemeSetting,
} from "../domain/settings";

/**
 * Minimal Settings surface (spec §§22–23; task M06-T02-SETTINGS-THEME-STYLE).
 * The remaining v1 preference plus the §23 About lines — no accounts, no
 * cloud, no storage maze, no generic fitness behavior.
 *
 * The final IPA keeps only the theme preference here. Compact image rendering
 * is fixed for the direct Photos action, so the retired Faithful/export-style
 * selector is intentionally no longer exposed.
 */

const THEME_OPTIONS: ReadonlyArray<{ value: ThemeSetting; label: string }> = [
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

interface SettingsProps {
  settings: AppSettings;
  /** Applies + persists a theme choice immediately (no reload). */
  onChangeTheme: (theme: ThemeSetting) => void;
  onBack: () => void;
}

export function Settings({
  settings,
  onChangeTheme,
  onBack,
}: SettingsProps) {
  return (
    <main className="screen">
      <header className="session-header">
        <button type="button" className="back-button" onClick={onBack}>
          ‹ Gym Log
        </button>
      </header>

      <h1 className="session-title">Settings</h1>

      <section className="settings-section" aria-labelledby="theme-label">
        <h2 className="section-label" id="theme-label">
          Appearance
        </h2>
        <div className="style-toggle" role="group" aria-label="Theme">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              data-setting-value={option.value}
              aria-pressed={settings.theme === option.value}
              onClick={() => onChangeTheme(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="settings-hint">
          System follows this device's light or dark appearance.
        </p>
      </section>

      {/* Spec §23 About: version + local-only/archive wording. Truthful by
          construction — nothing here may imply cloud sync or permanence. */}
      <section className="settings-section" aria-labelledby="about-label">
        <h2 className="section-label" id="about-label">
          About
        </h2>
        <p className="muted-line">Version {APP_VERSION}</p>
        <p className="muted-line">
          Gym Log keeps everything on this device. No account, no cloud sync,
          no analytics — and local browser storage is not a permanent archive.
        </p>
        <p className="muted-line">Your Apple Notes archive remains canonical.</p>
      </section>
    </main>
  );
}

export default Settings;
