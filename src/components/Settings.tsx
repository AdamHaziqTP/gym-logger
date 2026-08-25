import {
  APP_VERSION,
  type AppSettings,
  type ImageStyleSetting,
  type ThemeSetting,
} from "../domain/settings";

/**
 * Minimal Settings surface (spec §§22–23; task M06-T02-SETTINGS-THEME-STYLE).
 * Exactly the two v1 preferences plus the §23 About lines — no accounts, no
 * cloud, no storage maze, no generic fitness behavior.
 *
 * Both groups use the same quiet segmented-button treatment as the export
 * panel's style toggle (`aria-pressed` marks the active choice), and each tap
 * applies immediately through the App-level handlers (no reload, no separate
 * save step). The image-style choice here seeds the Export Image panel's
 * initial selection while the panel keeps its own per-export toggle.
 */

const THEME_OPTIONS: ReadonlyArray<{ value: ThemeSetting; label: string }> = [
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

const IMAGE_STYLE_OPTIONS: ReadonlyArray<{
  value: ImageStyleSetting;
  label: string;
}> = [
  { value: "compact", label: "Compact" },
  { value: "faithful", label: "Faithful" },
];

interface SettingsProps {
  settings: AppSettings;
  /** Applies + persists a theme choice immediately (no reload). */
  onChangeTheme: (theme: ThemeSetting) => void;
  /** Applies + persists the default image style choice immediately. */
  onChangeDefaultImageStyle: (style: ImageStyleSetting) => void;
  onBack: () => void;
}

export function Settings({
  settings,
  onChangeTheme,
  onChangeDefaultImageStyle,
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

      <section className="settings-section" aria-labelledby="image-style-label">
        <h2 className="section-label" id="image-style-label">
          Default Image Style
        </h2>
        <div
          className="style-toggle"
          role="group"
          aria-label="Default image style"
        >
          {IMAGE_STYLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              data-setting-value={option.value}
              aria-pressed={settings.defaultImageStyle === option.value}
              onClick={() => onChangeDefaultImageStyle(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="settings-hint">
          Used when Export Image opens. You can still switch per export.
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
