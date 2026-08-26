import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  deleteSession,
  duplicateRowById,
  insertBlankRowAtIndex,
  removeRowById,
  replaceRowContentsById,
  replaceRows,
  setNotes as persistNotes,
  setRowHighlight as persistRowHighlight,
  setSummaryOverride as persistSummaryOverride,
  updateRowField,
  type EditableRowField,
  type GymLogDB,
} from "../data/db";
import { formatDateDisplay } from "../domain/dates";
import {
  CATEGORY_LEGEND,
  HIGHLIGHT_OPTIONS,
  HIGHLIGHT_TOKENS,
} from "../domain/highlights";
import {
  copyRowToClipboard,
  hasCopiedRow,
  peekRowClipboard,
} from "../domain/rowClipboard";
import {
  buildNotesPayload,
  type NotesPayload,
} from "../domain/notesExport";
import {
  writeNotesPayloadToClipboard,
  type ClipboardCopyOutcome,
} from "../domain/notesClipboard";
import {
  launchNativeHelper,
  writeNativeHelperHandoffToClipboard,
} from "../domain/nativeHelperHandoff";
import { CompactSnapshotShare, ImageExportPanel } from "./ImageExport";
import type { ImageExportStyle } from "../domain/imageExport";
import { orderedRows } from "../domain/rows";
import type {
  Highlight,
  SessionSummaryOverride,
  WorkoutRow,
  WorkoutSession,
} from "../domain/types";
import { calculateSummary, displaySummary } from "../domain/summary";

const AUTOSAVE_DELAY_MS = 300;
const UNDO_TOAST_MS = 5000;
/** Pointer travel before a handle press becomes a drag instead of a tap. */
const DRAG_THRESHOLD_PX = 8;

/**
 * Copy-to-Notes action states (spec §15; M03-T01). `copied-rich` is the only
 * state that may show the spec's success copy; plain fallback and failure are
 * always worded so they cannot be mistaken for full success (AC-03).
 */
type NotesCopyState = "idle" | "working" | ClipboardCopyOutcome;
type NativeHandoffState = "idle" | "working" | "prepared" | "failed";

const NOTES_COPY_STATUS: Record<NotesCopyState, string> = {
  idle: "",
  working: "Copying…",
  "copied-rich": "Copied to Notes ✓",
  "copied-plain": "Copied as plain text (rich formatting unavailable)",
  failed: "Copy failed — clipboard unavailable",
};

const NATIVE_HANDOFF_STATUS: Record<NativeHandoffState, string> = {
  idle: "",
  working: "Preparing coloured Notes copy…",
  prepared:
    "Clipboard prepared. Opening the helper; paste once in Notes. If it does not open, launch Gym Logger Pasteboard Proof manually.",
  failed:
    "Could not prepare the native Notes copy. Install Gym Logger Pasteboard Proof and try again.",
};

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
  /**
   * M06-T02 (spec §14.1): the persisted Default Image Style seeds the export
   * panel's initial selection; the panel's own toggle stays per-export.
   */
  defaultImageStyle?: ImageExportStyle;
  onBack: () => void;
}

/**
 * The session editor: a dark, restrained, Notes-like fixed five-column table
 * (spec §6, §22). Every cell is free-form text with debounced local autosave
 * (spec §6.2, §17.2, §17.4). Header content order follows the approved rule:
 * date → category legend → sets/exercises summary → table (spec §14.2).
 */
export function SessionView({
  db,
  sessionId,
  defaultImageStyle = "compact",
  onBack,
}: SessionViewProps) {
  const session = useLiveQuery(
    () => db.sessions.get(sessionId),
    [db, sessionId],
  );

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [colourOpen, setColourOpen] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [undoSnapshotRows, setUndoSnapshotRows] = useState<WorkoutRow[] | null>(
    null,
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  // Whole-session delete (spec §11.4, §27.8; M02-T03): the destructive action
  // is armed here and only executed after the explicit confirmation dialog.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);

  // Copy-to-Notes spike (spec §15; M03-T01): local clipboard only.
  const [notesCopyState, setNotesCopyState] = useState<NotesCopyState>("idle");
  // Optional native handoff: the helper generates the proven coloured,
  // editable flat-RTFD representation; the browser only transports session
  // JSON and opens the helper.
  const [nativeHandoffState, setNativeHandoffState] =
    useState<NativeHandoffState>("idle");
  // Image export (spec §14; M03-T02-IMAGE-EXPORT-01): holds the visible-state
  // session snapshot captured when the user opened the export panel, or null
  // while the panel is closed. A snapshot (not live state) keeps the preview
  // stable while the modal blocks editing.
  const [imageExportSession, setImageExportSession] =
    useState<WorkoutSession | null>(null);

  // Drag-reorder state (spec §§7.2, 7.5): press on the SELECTED handle arms a
  // potential drag; movement past the threshold drags, release without it is
  // the tap that opens the row menu.
  const [draggingRowId, setDraggingRowId] = useState<string | null>(null);
  const [previewOrderIds, setPreviewOrderIds] = useState<string[] | null>(null);

  const pendingSaves = useRef(
    new Map<string, { timer: ReturnType<typeof setTimeout>; operation: () => Promise<void> }>(),
  );
  const savedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armedHandle = useRef<{
    rowId: string;
    startX: number;
    startY: number;
    wasSelected: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  // Refs mirroring render state so window-level drag listeners never act on a
  // stale closure (the handlers are attached once).
  const selectedRowIdRef = useRef<string | null>(null);
  const draggingRowIdRef = useRef<string | null>(null);
  const previewIdsRef = useRef<string[] | null>(null);
  const displayIdsRef = useRef<string[]>([]);
  const rowsByIdRef = useRef<Record<string, WorkoutRow>>({});

  // Saves that already left the debounce queue and are still running, so a
  // flush can wait for them (pagehide, unmount, and the copy-to-Notes
  // persistence sweep) instead of racing an in-flight write.
  const activeSaves = useRef<Set<Promise<void>>>(new Set());

  const runSave = useCallback((operation: () => Promise<void>): Promise<void> => {
    const run = async () => {
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
    };
    const promise = run();
    activeSaves.current.add(promise);
    void promise.finally(() => {
      activeSaves.current.delete(promise);
    });
    return promise;
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

  /**
   * Flushes pending edits before unmount/page hide, and immediately after a
   * copy-to-Notes tap, so persistence converges with what the screen showed
   * (§17.4). FIX-01: the clipboard action no longer AWAITS this — it only
   * triggers it — because an awaited save between the tap and the clipboard
   * call costs Safari's transient user activation.
   */
  const flushSaves = useCallback((): Promise<void> => {
    const entries = [...pendingSaves.current.values()];
    pendingSaves.current.clear();
    for (const entry of entries) clearTimeout(entry.timer);
    const flushed = entries.map((entry) =>
      entry.operation().catch((error) =>
        console.error("Gym Logger: flush save failed", error),
      ),
    );
    const active = [...activeSaves.current];
    return Promise.all([...flushed, ...active]).then(() => undefined);
  }, []);

  useEffect(() => {
    const handleHide = () => flushSaves();
    window.addEventListener("pagehide", handleHide);
    window.addEventListener("beforeunload", handleHide);
    return () => {
      window.removeEventListener("pagehide", handleHide);
      window.removeEventListener("beforeunload", handleHide);
      flushSaves();
      if (undoToastTimer.current) clearTimeout(undoToastTimer.current);
      // M06-T01-CORRECTION-01: a pending Saved→idle reset must not outlive the
      // component — after unmount its late setState only surfaces as an
      // unhandled error once the test environment is gone. Clear it here,
      // alongside the undo toast timer, without touching in-flight saves.
      if (savedResetTimer.current) clearTimeout(savedResetTimer.current);
    };
  }, [flushSaves]);

  const sortedRows = orderedRows(session?.rows ?? []);

  // Keep the drag mirrors in sync with the latest render.
  selectedRowIdRef.current = selectedRowId;
  draggingRowIdRef.current = draggingRowId;
  previewIdsRef.current = previewOrderIds;
  displayIdsRef.current = previewOrderIds ?? sortedRows.map((row) => row.id);
  rowsByIdRef.current = Object.fromEntries(
    sortedRows.map((row) => [row.id, row]),
  );

  /**
   * Tap behavior for a row handle (spec §7.2): first tap selects the whole
   * row; tapping the already-selected handle opens the row menu.
   */
  const activateHandleTap = useCallback((rowId: string) => {
    setColourOpen(false);
    if (selectedRowIdRef.current === rowId) {
      setMenuOpen(true);
    } else {
      setSelectedRowId(rowId);
      setMenuOpen(false);
    }
  }, []);

  /* ---------------- Drag reorder machinery (§§7.2, 7.5) ---------------- */

  useEffect(() => {
    const beginDragIfArmed = (event: PointerEvent) => {
      const armed = armedHandle.current;
      if (!armed || !armed.wasSelected || draggingRowIdRef.current) return false;
      const distance = Math.hypot(
        event.clientX - armed.startX,
        event.clientY - armed.startY,
      );
      if (distance <= DRAG_THRESHOLD_PX) return false;
      setDraggingRowId(armed.rowId);
      setPreviewOrderIds(displayIdsRef.current.slice());
      return true;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const active =
        draggingRowIdRef.current ??
        (beginDragIfArmed(event) ? armedHandle.current?.rowId ?? null : null);
      if (!active) return;

      event.preventDefault();
      const ids = previewIdsRef.current ?? displayIdsRef.current;
      const currentIndex = ids.indexOf(active);
      if (currentIndex === -1) return;

      const target = dropIndexFromClientY(event.clientY, ids.length);
      if (target !== currentIndex) {
        setPreviewOrderIds(moveIdInList(ids, active, target));
      }
    };

    const commitDrag = () => {
      const armed = armedHandle.current;
      const activeId = draggingRowIdRef.current;
      armedHandle.current = null;

      if (activeId) {
        const ids = previewIdsRef.current;
        const byId = rowsByIdRef.current;
        setDraggingRowId(null);
        setPreviewOrderIds(null);
        suppressClickRef.current = true;
        if (ids && byId) {
          const reordered = ids.flatMap((id) => (byId[id] ? [byId[id]] : []));
          void runSave(() => replaceRows(db, sessionId, reordered));
        }
        return;
      }

      if (armed) {
        // No meaningful movement: this pointer gesture was a tap.
        suppressClickRef.current = true;
        activateHandleTap(armed.rowId);
      }
    };

    const cancelDrag = () => {
      armedHandle.current = null;
      if (draggingRowIdRef.current) {
        // Revert the visual preview; nothing has been persisted yet.
        setDraggingRowId(null);
        setPreviewOrderIds(null);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", commitDrag);
    window.addEventListener("pointercancel", cancelDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", commitDrag);
      window.removeEventListener("pointercancel", cancelDrag);
    };
  }, [db, sessionId, runSave, activateHandleTap]);

  /* --------------------------- Save helpers ---------------------------- */

  if (!session) return <div className="boot" role="status" aria-label="Loading" />;

  const rowsById = rowsByIdRef.current;
  const displayRows: WorkoutRow[] = previewOrderIds
    ? previewOrderIds.flatMap((id) => (rowsById[id] ? [rowsById[id]] : []))
    : sortedRows;

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

  /* ------------------------ Row menu commands -------------------------- */

  const closeMenu = () => setMenuOpen(false);

  const showUndoToast = (previousRows: WorkoutRow[]) => {
    setUndoSnapshotRows(previousRows.map((row) => ({ ...row })));
    if (undoToastTimer.current) clearTimeout(undoToastTimer.current);
    undoToastTimer.current = setTimeout(
      () => setUndoSnapshotRows(null),
      UNDO_TOAST_MS,
    );
  };

  const dismissUndoToast = () => {
    setUndoSnapshotRows(null);
    if (undoToastTimer.current) clearTimeout(undoToastTimer.current);
  };

  const handleUndo = () => {
    const snapshot = undoSnapshotRows;
    if (!snapshot) return;
    dismissUndoToast();
    void runSave(() => replaceRows(db, sessionId, snapshot));
  };

  const commandAddAbove = async () => {
    if (!selectedRowId) return;
    const index = sortedRows.findIndex((row) => row.id === selectedRowId);
    const newRowId = await insertBlankRowAtIndex(db, sessionId, index);
    closeMenu();
    if (newRowId) setSelectedRowId(newRowId);
  };

  const commandAddBelow = async () => {
    if (!selectedRowId) return;
    const index = sortedRows.findIndex((row) => row.id === selectedRowId);
    const newRowId = await insertBlankRowAtIndex(db, sessionId, index + 1);
    closeMenu();
    if (newRowId) setSelectedRowId(newRowId);
  };

  const commandDuplicate = async () => {
    if (!selectedRowId) return;
    const copyId = await duplicateRowById(db, sessionId, selectedRowId);
    closeMenu();
    if (copyId) setSelectedRowId(copyId);
  };

  const commandCopy = () => {
    const row = sortedRows.find((item) => item.id === selectedRowId);
    if (row) copyRowToClipboard(row);
    closeMenu();
  };

  const commandPaste = async () => {
    const copied = peekRowClipboard();
    if (!copied || !selectedRowId) return;
    const targetId = selectedRowId;
    const replaced = await replaceRowContentsById(
      db,
      sessionId,
      targetId,
      copied,
    );
    closeMenu();
    if (replaced) setSelectedRowId(targetId);
  };

  const commandColour = () => {
    setMenuOpen(false);
    setColourOpen(true);
  };

  const commandDelete = async () => {
    if (!selectedRowId) return;
    const removal = await removeRowById(db, sessionId, selectedRowId);
    setSelectedRowId(null);
    closeMenu();
    if (removal) showUndoToast(removal.previousRows);
  };

  /* --------------- Whole-session deletion (spec §11.4) ----------------- */

  const closeDeleteConfirmation = () => {
    if (deletingSession) return;
    setConfirmingDelete(false);
  };

  const commandDeleteSession = async () => {
    if (deletingSession) return; // double-tap guard (spec §27.2)
    setDeletingSession(true);
    try {
      // Transactional single-record removal (db.deleteSession): only this
      // session is touched; Apple Notes is untouched by definition (§2.2).
      const removed = await deleteSession(db, sessionId);
      setConfirmingDelete(false);
      if (removed) {
        // Return to the stable screen this session was opened from
        // (History when entered from History, Home otherwise). Never a stale
        // deleted-session view.
        onBack();
      }
    } catch (error) {
      console.error("Gym Logger: could not delete the session", error);
    } finally {
      setDeletingSession(false);
    }
  };

  /* --------------- Copy to Notes export (spec §15; M03-T01) -------------- */

  /**
   * Builds the session as the screen shows it RIGHT NOW: the cell inputs and
   * the notes textarea are uncontrolled, so their DOM values are the truth
   * for edits that may not be persisted yet. Shared by every export path
   * (Copy-to-Notes and the §14 image export), so both always agree with what
   * the user sees.
   */
  const buildVisibleSession = (): WorkoutSession | null => {
    if (!session) return null;

    // Latest visible cell values keyed by row id (DOM order matches display).
    const overrides = new Map<
      string,
      Partial<Record<EditableRowField, string>>
    >();
    document
      .querySelectorAll<HTMLTableRowElement>("#workout-tbody tr[data-row-id]")
      .forEach((tr) => {
        const rowId = tr.getAttribute("data-row-id");
        if (!rowId) return;
        const cells = tr.querySelectorAll<HTMLInputElement>("input.cell-input");
        if (cells.length < COLUMN_ORDER.length) return;
        const patch: Partial<Record<EditableRowField, string>> = {};
        COLUMN_ORDER.forEach((field, index) => {
          const cell = cells[index];
          if (cell) patch[field] = cell.value;
        });
        overrides.set(rowId, patch);
      });
    const notesInput = document.querySelector<HTMLTextAreaElement>(
      "textarea.notes-input",
    );

    return {
      ...session,
      rows: displayRows.map((row) => {
        const patch = overrides.get(row.id);
        if (!patch) return row;
        return {
          ...row,
          exercise: patch.exercise ?? row.exercise,
          sets: patch.sets ?? row.sets,
          reps: patch.reps ?? row.reps,
          weight: patch.weight ?? row.weight,
          skip: patch.skip ?? row.skip,
        };
      }),
      notes: notesInput ? notesInput.value : session.notes,
    };
  };

  /**
   * Builds the export payload from what the screen shows RIGHT NOW.
   * Synchronous by design (FIX-01): constructing the payload inside the tap
   * gesture lets the first clipboard attempt start in the same task,
   * preserving user activation.
   */
  const buildVisibleNotesPayload = (): NotesPayload | null => {
    const visibleSession = buildVisibleSession();
    return visibleSession ? buildNotesPayload(visibleSession) : null;
  };

  const commandCopyToNotes = () => {
    if (notesCopyState === "working") return; // double-tap guard (§27.2)
    setNotesCopyState("working");

    // FIX-01: capture the payload and start the clipboard attempt
    // synchronously inside this tap. Nothing may be awaited between the
    // gesture and the first clipboard call — iOS/Safari drops transient user
    // activation across awaited tasks, which surfaced as `Copy failed —
    // clipboard unavailable` on the http://LAN device test.
    const payload = buildVisibleNotesPayload();
    if (!payload) {
      setNotesCopyState("failed");
      return;
    }
    // Persistence converges without gating the clipboard on IndexedDB: the
    // payload already carries the latest visible edits verbatim.
    void flushSaves();

    void (async () => {
      try {
        const outcome = await writeNotesPayloadToClipboard(payload);
        setNotesCopyState(outcome);
      } catch (error) {
        console.error("Gym Logger: copy to Notes failed", error);
        setNotesCopyState("failed");
      }
    })();
  };

  const commandPrepareNativeNotesCopy = () => {
    if (nativeHandoffState === "working") return;
    const visibleSession = buildVisibleSession();
    if (!visibleSession) {
      setNativeHandoffState("failed");
      return;
    }

    setNativeHandoffState("working");
    // The helper needs the values currently visible in the editor, including
    // unsaved free-form edits. Saving is allowed to converge independently;
    // the handoff payload is captured before any await.
    void flushSaves();
    void writeNativeHelperHandoffToClipboard(visibleSession)
      .then((copied) => {
        if (!copied) {
          setNativeHandoffState("failed");
          return;
        }
        setNativeHandoffState("prepared");
        launchNativeHelper();
      })
      .catch(() => setNativeHandoffState("failed"));
  };

  const selectedRow = sortedRows.find((row) => row.id === selectedRowId) ?? null;
  const summaryLine = displaySummary(session);

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

      <CategoryLegend />

      {editingSummary ? (
        <SummaryEditor
          session={session}
          onApply={(override) =>
            runSave(() => persistSummaryOverride(db, sessionId, override))
          }
          onDone={() => setEditingSummary(false)}
        />
      ) : (
        <button
          type="button"
          className="summary-line editable"
          onClick={() => setEditingSummary(true)}
          aria-label="Edit session summary"
        >
          {summaryLine.sets} sets · {summaryLine.exercises} exercises
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
          <tbody id="workout-tbody">
            {displayRows.map((row, index) => {
              const tokens = HIGHLIGHT_TOKENS[row.highlight];
              const selected = row.id === selectedRowId;
              const dragging = row.id === draggingRowId;
              /**
               * Category tokens ride inline custom properties. `none` rows
               * deliberately set NONE: the CSS fallbacks (`--row-fg` →
               * `var(--text)`, `--row-bg` → transparent) render identically
               * in the approved dark theme (spec §22.1) while letting light
               * theme (M06-T02) use readable dark text instead of the
               * near-white `none` token. Highlighted rows keep their exact
               * locked category colors in both themes (spec §5).
               */
              const rowStyle = (
                row.highlight === "none"
                  ? {}
                  : { "--row-fg": tokens.fg, "--row-bg": tokens.bg }
              ) as CSSProperties;
              return (
                <tr
                  key={row.id}
                  data-row-id={row.id}
                  className={
                    selected && dragging
                      ? "selected dragging"
                      : selected
                        ? "selected"
                        : dragging
                          ? "dragging"
                          : undefined
                  }
                  style={rowStyle}
                >
                  <td className="handle-cell">
                    <button
                      type="button"
                      className={
                        selected ? "row-handle active" : "row-handle"
                      }
                      aria-label={`Select row ${index + 1}`}
                      aria-pressed={selected}
                      /* FIX-05 handle hardening: never an HTML5 drag source. */
                      draggable={false}
                      /* iOS Safari long-press must not open a callout/context
                         menu on the drag control (spec §7.2; FIX-05). */
                      onContextMenu={(event) => event.preventDefault()}
                      onPointerDown={(event) => {
                        armedHandle.current = {
                          rowId: row.id,
                          startX: event.clientX,
                          startY: event.clientY,
                          wasSelected: selected,
                        };
                      }}
                      onClick={() => {
                        // Mouse/touch taps are handled by the pointerup path;
                        // this branch serves keyboard activation only.
                        if (suppressClickRef.current) {
                          suppressClickRef.current = false;
                          return;
                        }
                        activateHandleTap(row.id);
                      }}
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
                        aria-label={`${COLUMN_LABELS[field]} row ${index + 1}`}
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

      {/* Copy to Notes (spec §15; M03-T01 spike): one quiet local clipboard
          action at the end of the screen, before the destructive zone. The
          status line is explicit — plain-text fallback and failure states
          never present as a rich success (AC-03). No Apple Notes append or
          cloud involvement happens here (§2.2). */}
      <section className="export-zone" aria-label="Copy session for Apple Notes">
        <button
          type="button"
          className="notes-copy-button"
          onClick={commandCopyToNotes}
          disabled={notesCopyState === "working"}
        >
          Copy to Notes
        </button>
        {notesCopyState !== "idle" && (
          <p className="copy-notes-status" role="status" aria-live="polite">
            {NOTES_COPY_STATUS[notesCopyState]}
          </p>
        )}
        <button
          type="button"
          className="notes-copy-button notes-shortcut-button"
          onClick={commandPrepareNativeNotesCopy}
          disabled={nativeHandoffState === "working"}
        >
          Prepare Coloured Notes Copy
        </button>
        {nativeHandoffState !== "idle" && (
          <p className="copy-notes-status" role="status" aria-live="polite">
            {NATIVE_HANDOFF_STATUS[nativeHandoffState]}
          </p>
        )}
      </section>

      {/* Image export (spec §14; M03-T02-IMAGE-EXPORT-01): one quiet local
          action beside Copy to Notes. Opening it snapshots the visible state
          (same DOM-truth rule as Copy-to-Notes); nothing is uploaded and no
          native dependency is involved — SVG→PNG in-page, then share/download. */}
      <CompactSnapshotShare session={session} />

      <section className="image-export-zone" aria-label="Export session image">
        <button
          type="button"
          className="image-export-button"
          onClick={() => setImageExportSession(buildVisibleSession() ?? session)}
        >
          Export Image
        </button>
      </section>

      {/* Whole-session delete entry point (spec §11.4; M02-T03): one quiet
          destructive row at the end of the screen — discoverable without
          competing with training-time actions. It only ARMS the confirmation
          below; nothing is removed until explicit confirmation. */}
      <section className="danger-zone" aria-label="Danger zone">
        <button
          type="button"
          className="session-delete-button"
          onClick={() => setConfirmingDelete(true)}
        >
          Delete Session
        </button>
      </section>

      {menuOpen && selectedRow && (
        <>
          <div className="menu-backdrop" onClick={closeMenu} aria-hidden="true" />
          <RowMenu
            pasteEnabled={hasCopiedRow()}
            onAddAbove={() => void commandAddAbove()}
            onAddBelow={() => void commandAddBelow()}
            onDuplicate={() => void commandDuplicate()}
            onCopy={commandCopy}
            onPaste={() => void commandPaste()}
            onColour={commandColour}
            onDelete={() => void commandDelete()}
          />
        </>
      )}

      {colourOpen && selectedRow && (
        <ColourBar
          current={selectedRow.highlight}
          onPick={handleHighlightPick}
          onClose={() => setColourOpen(false)}
        />
      )}

      {/* Image export overlay (spec §14): style choice, live preview of the
          exact document that will be delivered, and a truthful save/share
          step. Rendering the snapshot blocks nothing else; closing discards
          it without touching any record. */}
      {imageExportSession && (
        <ImageExportPanel
          session={imageExportSession}
          initialStyle={defaultImageStyle}
          onClose={() => setImageExportSession(null)}
        />
      )}

      {undoSnapshotRows && (
        <div className="undo-toast" role="status">
          <span className="undo-message">Row deleted</span>
          <button type="button" className="btn btn-secondary btn-small" onClick={handleUndo}>
            Undo
          </button>
        </div>
      )}

      {/* Whole-session delete confirmation (spec §11.4, §27.8; F6). The
          specified Apple Notes-safe copy appears verbatim, in ONE element,
          as the entire alert content; Cancel and backdrop dismissal leave
          every record untouched. */}
      {confirmingDelete && (
        <div className="confirm-backdrop" onClick={closeDeleteConfirmation}>
          <div
            className="confirm-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-session-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-session-title">
              Delete this session from Gym Log? This does not affect your
              Apple Notes archive.
            </h2>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeDeleteConfirmation}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-destructive"
                disabled={deletingSession}
                onClick={() => void commandDeleteSession()}
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/**
 * Drop target index from a pointer Y position: the first displayed row whose
 * vertical midpoint the pointer has crossed. Rows are queried in display
 * order, so indices align with the preview id list.
 */
function dropIndexFromClientY(clientY: number, count: number): number {
  const trs = document.querySelectorAll<HTMLTableRowElement>(
    "#workout-tbody tr[data-row-id]",
  );
  for (let index = 0; index < count && index < trs.length; index += 1) {
    const rect = trs[index].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) return index;
  }
  return Math.max(0, count - 1);
}

function moveIdInList(ids: string[], id: string, toIndex: number): string[] {
  const fromIndex = ids.indexOf(id);
  if (fromIndex === -1) return ids;
  const clamped = Math.max(0, Math.min(toIndex, ids.length - 1));
  if (clamped === fromIndex) return ids;
  const next = [...ids];
  next.splice(fromIndex, 1);
  next.splice(clamped, 0, id);
  return next;
}

/**
 * Approved category legend (spec §5.1, §14.2; final legend decision
 * 2026-08-24): exactly the five Apple highlight navigation categories in
 * order. `none` is the internal unhighlighted/white row state and is
 * deliberately NOT a sixth visible entry; it stays available through the row
 * colour control's `None` swatch.
 */
function CategoryLegend() {
  return (
    <ul className="category-legend" aria-label="Category legend">
      {CATEGORY_LEGEND.map(({ value, label }) => (
        <li key={label} className="legend-item" data-highlight={value}>
          <span
            className="legend-dot"
            style={{ backgroundColor: HIGHLIGHT_TOKENS[value].fg }}
            aria-hidden="true"
          />
          <span className="legend-label">{label}</span>
        </li>
      ))}
    </ul>
  );
}

interface RowMenuProps {
  pasteEnabled: boolean;
  onAddAbove: () => void;
  onAddBelow: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onColour: () => void;
  onDelete: () => void;
}

/** The Apple Notes-style row menu (spec §7.3). No permanent per-row buttons. */
function RowMenu(props: RowMenuProps) {
  return (
    <div className="row-menu" role="menu" aria-label="Row actions">
      <button type="button" role="menuitem" className="row-menu-item" onClick={props.onAddAbove}>
        Add Row Above
      </button>
      <button type="button" role="menuitem" className="row-menu-item" onClick={props.onAddBelow}>
        Add Row Below
      </button>
      <button type="button" role="menuitem" className="row-menu-item" onClick={props.onDuplicate}>
        Duplicate Row
      </button>
      <button type="button" role="menuitem" className="row-menu-item" onClick={props.onCopy}>
        Copy
      </button>
      <button
        type="button"
        role="menuitem"
        className="row-menu-item"
        disabled={!props.pasteEnabled}
        onClick={props.onPaste}
      >
        Paste
      </button>
      <button type="button" role="menuitem" className="row-menu-item" onClick={props.onColour}>
        Colour
      </button>
      <button
        type="button"
        role="menuitem"
        className="row-menu-item destructive"
        onClick={props.onDelete}
      >
        Delete Row
      </button>
    </div>
  );
}

interface SummaryEditorProps {
  session: WorkoutSession;
  /**
   * Persists the resulting override — or its removal (`undefined`) — through
   * the session's normal save path, so the header's Saved indicator applies.
   */
  onApply: (override: SessionSummaryOverride | undefined) => void;
  onDone: () => void;
}

/**
 * Manual summary override editor (spec §9.2; M02-T04). Both totals stay
 * free-form text and are stored exactly as typed — no numeric parsing,
 * casing, or whitespace normalization. Commit rules per field:
 * - blank entry → no override for that total (the calculated value shows);
 * - entry equal to the calculated value → dropped (per-field reset);
 * - anything else → stored verbatim as the display string.
 * `Reset to calculated` fills both fields with the calculated values, so
 * confirming them removes the whole override; `Cancel` writes nothing.
 */
function SummaryEditor({ session, onApply, onDone }: SummaryEditorProps) {
  const calculated = calculateSummary(session.rows);
  const current = displaySummary(session);
  const [setsText, setSetsText] = useState(current.sets);
  const [exercisesText, setExercisesText] = useState(current.exercises);

  const apply = () => {
    const override: SessionSummaryOverride = {};
    const sets = setsText.trim();
    if (sets !== "" && sets !== String(calculated.sets)) {
      override.sets = setsText;
    }
    const exercises = exercisesText.trim();
    if (exercises !== "" && exercises !== String(calculated.exercises)) {
      override.exercises = exercisesText;
    }
    onApply(Object.keys(override).length > 0 ? override : undefined);
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
          Reset to calculated
        </button>
        <button type="button" className="btn btn-secondary btn-small" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-small">
          Done
        </button>
      </div>
      <p className="summary-calculated-hint">
        Calculated from rows: {calculated.sets} sets · {calculated.exercises}{" "}
        exercises
      </p>
    </form>
  );
}

/**
 * Compact row-level colour control opened through the row menu's `Colour`
 * command: applies one category across the whole row in one tap and keeps the
 * locked Arms/Back/Chest/Delts/Legs/None mapping (spec §5.3).
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
