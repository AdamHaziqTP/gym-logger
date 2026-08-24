import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  setNotes as persistNotes,
  setRowHighlight as persistRowHighlight,
  setSummaryOverride as persistSummaryOverride,
  updateRowField,
  type EditableRowField,
} from "../data/db";
import type { GymLogDB } from "../data/db";
import { formatDateDisplay } from "../domain/dates";
import {
  HIGHLIGHT_OPTIONS,
  HIGHLIGHT_TOKENS,
} from "../domain/highlights";
import type {
  Highlight,
  SessionSummaryOverride,
  WorkoutSession,
} from "../domain/types";
import { calculateSummary, displaySummary } from "../domain/summary";

const AUTOSAVE_DELAY_MS = 300;

const COLUMN_ORDER: EditableRowField[] = [
  "exercise",
  "sets",
  "reps",
  "weight",
  "skip",
];

const COLUMN_LABELS: Record<EditableRowField, string> = {
  exercise: "Exercise",
  sets: "Sets",
  reps: "Reps",
  weight: "Weight",
  skip: "Skip",
};

interface SessionViewProps {
  db: GymLogDB;
  sessionId: string;
  onBack: () => void;
}

/**
 * The session editor: a dark, restrained, Notes-like fixed five-column table
 * (spec §6, §22). Every cell is free-form text with debounced local autosave
 * (spec §6.2, §17.2, §17.4).
 */
export function SessionView({ db, sessionId, onBack }: SessionViewProps) {
  const session = useLiveQuery(
    () => db.sessions.get(sessionId),
    [db, sessionId],
  );

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editingSummary, setEditingSummary] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const pendingSaves = useRef(
    new Map<string, { timer: ReturnType<typeof setTimeout>; operation: () => Promise<void> }>(),
  );
  const savedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSave = useCallback(async (operation: () => Promise<void>) => {
    setSaveState("saving");
    try {
      await operation();
      setSaveState("saved");
      if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
      savedResetTimer.current = setTimeout(() => setSaveState("idle"), 1500);
    } catch (error) {
      console.error("Gym Logger: save failed", error);
      setSaveState("idle");
    }
  }, []);

  const scheduleSave = useCallback(
    (key: string, operation: () => Promise<void>, immediate = false) => {
      const existing = pendingSaves.current.get(key);
      if (existing) clearTimeout(existing.timer);

      if (immediate) {
        pendingSaves.current.delete(key);
        void runSave(operation);
        return;
      }

      pendingSaves.current.set(key, {
        timer: setTimeout(() => {
          pendingSaves.current.delete(key);
          void runSave(operation);
        }, AUTOSAVE_DELAY_MS),
        operation,
      });
    },
    [runSave],
  );

  /** Flushes pending edits before unmount/page hide so nothing is lost (§17.4). */
  const flushSaves = useCallback(() => {
    const entries = [...pendingSaves.current.values()];
    pendingSaves.current.clear();
    for (const entry of entries) clearTimeout(entry.timer);
    for (const entry of entries) {
      void entry.operation().catch((error) =>
        console.error("Gym Logger: flush save failed", error),
      );
    }
  }, []);

  useEffect(() => {
    const handleHide = () => flushSaves();
    window.addEventListener("pagehide", handleHide);
    window.addEventListener("beforeunload", handleHide);
    return () => {
      window.removeEventListener("pagehide", handleHide);
      window.removeEventListener("beforeunload", handleHide);
      flushSaves();
    };
  }, [flushSaves]);

  if (!session) return <div className="boot" role="status" aria-label="Loading" />;

  const rows = [...session.rows].sort((a, b) => a.position - b.position);

  const handleCellChange = (
    rowId: string,
    field: EditableRowField,
    value: string,
    immediate = false,
  ) => {
    scheduleSave(
      `${rowId}:${field}`,
      () => updateRowField(db, sessionId, rowId, field, value),
      immediate,
    );
  };

  const handleNotesChange = (value: string, immediate = false) => {
    scheduleSave(
      "notes",
      () => persistNotes(db, sessionId, value),
      immediate,
    );
  };

  const handleHighlightPick = (highlight: Highlight) => {
    if (!selectedRowId) return;
    const rowId = selectedRowId;
    void runSave(() => persistRowHighlight(db, sessionId, rowId, highlight));
  };

  const saveLabel =
    saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "";

  return (
    <main className="screen">
      <header className="session-header">
        <button type="button" className="back-button" onClick={onBack}>
          ‹ Gym Log
        </button>
        <span className="save-indicator" role="status" aria-live="polite">
          {saveLabel}
        </span>
      </header>

      <h1 className="session-title">{formatDateDisplay(session.dateLocal)}</h1>

      {editingSummary ? (
        <SummaryEditor
          db={db}
          session={session}
          onDone={() => setEditingSummary(false)}
        />
      ) : (
        <button
          type="button"
          className="summary-line editable"
          onClick={() => setEditingSummary(true)}
          aria-label="Edit session summary"
        >
          {displaySummary(session).sets} sets ·{" "}
          {displaySummary(session).exercises} exercises
        </button>
      )}

      <div className="table-scroll">
        <table className="workout-table">
          <colgroup>
            <col className="col-handle" />
            <col className="col-exercise" />
            <col className="col-sets" />
            <col className="col-reps" />
            <col className="col-weight" />
            <col className="col-skip" />
          </colgroup>
          <thead>
            <tr>
              <th aria-hidden="true" />
              <th scope="col">Exercise</th>
              <th scope="col">Sets</th>
              <th scope="col">Reps</th>
              <th scope="col">Weight</th>
              <th scope="col">Skip</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tokens = HIGHLIGHT_TOKENS[row.highlight];
              const selected = row.id === selectedRowId;
              const rowStyle = {
                "--row-fg": tokens.fg,
                "--row-bg": tokens.bg,
              } as CSSProperties;
              return (
                <tr
                  key={row.id}
                  className={selected ? "selected" : undefined}
                  style={rowStyle}
                >
                  <td className="handle-cell">
                    <button
                      type="button"
                      className={
                        selected ? "row-handle active" : "row-handle"
                      }
                      aria-label={`Select row ${row.position + 1}`}
                      aria-pressed={selected}
                      onClick={() =>
                        setSelectedRowId(selected ? null : row.id)
                      }
                    >
                      ⋮
                    </button>
                  </td>
                  {COLUMN_ORDER.map((field) => (
                    <td key={field} className="cell">
                      <input
                        type="text"
                        className="cell-input"
                        defaultValue={row[field]}
                        aria-label={`${COLUMN_LABELS[field]} row ${row.position + 1}`}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        onChange={(event) =>
                          handleCellChange(row.id, field, event.target.value)
                        }
                        onBlur={(event) =>
                          handleCellChange(
                            row.id,
                            field,
                            event.currentTarget.value,
                            true,
                          )
                        }
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="notes-section" aria-labelledby="notes-label">
        <h2 className="section-label" id="notes-label">
          Notes
        </h2>
        <textarea
          className="notes-input"
          defaultValue={session.notes}
          rows={4}
          placeholder="Cardio, location, machine notes, reminders…"
          aria-label="Session notes"
          onChange={(event) => handleNotesChange(event.target.value)}
          onBlur={(event) => handleNotesChange(event.currentTarget.value, true)}
        />
      </section>

      {selectedRowId && (
        <ColourBar
          current={
            rows.find((row) => row.id === selectedRowId)?.highlight ?? "none"
          }
          onPick={handleHighlightPick}
          onClose={() => setSelectedRowId(null)}
        />
      )}
    </main>
  );
}

interface SummaryEditorProps {
  db: GymLogDB;
  session: WorkoutSession;
  onDone: () => void;
}

/** Manual summary override editor (spec §9.2). Values stay free-form text. */
function SummaryEditor({ db, session, onDone }: SummaryEditorProps) {
  const calculated = calculateSummary(session.rows);
  const current = displaySummary(session);
  const [setsText, setSetsText] = useState(current.sets);
  const [exercisesText, setExercisesText] = useState(current.exercises);

  const apply = () => {
    const override: SessionSummaryOverride = {};
    if (setsText.trim() !== String(calculated.sets)) {
      override.sets = setsText.trim();
    }
    if (exercisesText.trim() !== String(calculated.exercises)) {
      override.exercises = exercisesText.trim();
    }
    const hasOverride = Object.keys(override).length > 0;
    void persistSummaryOverride(
      db,
      session.id,
      hasOverride ? override : undefined,
    ).catch((error) =>
      console.error("Gym Logger: summary save failed", error),
    );
    onDone();
  };

  return (
    <form
      className="summary-editor"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <label className="summary-field">
        <span>Sets</span>
        <input
          type="text"
          value={setsText}
          onChange={(event) => setSetsText(event.target.value)}
          aria-label="Sets display override"
        />
      </label>
      <label className="summary-field">
        <span>Exercises</span>
        <input
          type="text"
          value={exercisesText}
          onChange={(event) => setExercisesText(event.target.value)}
          aria-label="Exercises display override"
        />
      </label>
      <div className="summary-editor-actions">
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() => {
            setSetsText(String(calculated.sets));
            setExercisesText(String(calculated.exercises));
          }}
        >
          Use calculated ({calculated.sets}/{calculated.exercises})
        </button>
        <button type="button" className="btn btn-secondary btn-small" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-small">
          Done
        </button>
      </div>
    </form>
  );
}

/**
 * Compact row-level colour control (task item 8): the full Apple Notes row
 * menu is out of scope for M01; this applies one category across the whole row
 * in one tap (spec §5.3).
 */
function ColourBar(props: {
  current: Highlight;
  onPick: (highlight: Highlight) => void;
  onClose: () => void;
}) {
  return (
    <div className="colour-bar" role="toolbar" aria-label="Row colour">
      <span className="colour-bar-title">Row colour</span>
      <div className="swatches">
        {HIGHLIGHT_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={
              props.current === value ? "swatch current" : "swatch"
            }
            aria-pressed={props.current === value}
            onClick={() => props.onPick(value)}
          >
            <span
              className={value === "none" ? "swatch-dot none-dot" : "swatch-dot"}
              style={{ backgroundColor: HIGHLIGHT_TOKENS[value].fg }}
              aria-hidden="true"
            />
            <span className="swatch-label">{label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-secondary btn-small"
        onClick={props.onClose}
      >
        Done
      </button>
    </div>
  );
}

export default SessionView;
