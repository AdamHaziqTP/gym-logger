import { useEffect, useRef, useState } from "react";
import {
  buildImageLayout,
  exportImageFilename,
  renderSessionSvg,
  type ImageExportStyle,
} from "../domain/imageExport";
import {
  deliveryButtonLabel,
  rasterizeSvgToPngBlob,
  sharePngFile,
  supportsFileShare,
  triggerPngDownload,
  type ShareOutcome,
} from "../domain/pngExport";
import type { WorkoutSession } from "../domain/types";

/**
 * Full-session image export overlay (spec §14; M03-T02-IMAGE-EXPORT-01).
 * Local, bounded control: a style choice plus a live preview and a truthful
 * save/share step — no cloud, no native dependency.
 *
 * M06-T02 (spec §14.1): the initial selection comes from the persisted
 * Default Image Style setting (Compact when unset), and the toggle remains a
 * per-export choice — it never rewrites the stored preference.
 * The preview renders from the exact
 * same deterministic SVG document that gets delivered, so what the user
 * approves is byte-for-byte what leaves the device.
 *
 * Truthfulness rules carried over from Copy-to-Notes (AC-03 discipline):
 * - "Shared" appears ONLY after a resolved iOS/OS share-sheet call.
 * - The desktop/download path says "download started" — never more.
 * - When this browser cannot encode PNGs (e.g. automated DOM environments),
 *   the panel says so, keeps the vector preview, and disables saving rather
 *   than pretending.
 */

const STYLE_OPTIONS: ReadonlyArray<{
  value: ImageExportStyle;
  label: string;
}> = [
  { value: "compact", label: "Compact" },
  { value: "faithful", label: "Faithful" },
];

/** Status shown when the environment has no PNG encoder (canvas missing). */
export const PNG_UNAVAILABLE_MESSAGE =
  "PNG delivery is unavailable here — no visible pixels were verified; showing the vector preview only.";

/** Status lines per literal share outcome; never claims an unverified result. */
export const SHARE_STATUS: Record<ShareOutcome, string> = {
  shared: "Shared ✓",
  cancelled: "Share canceled",
  failed: "Sharing did not complete",
};

function downloadStartedMessage(filename: string): string {
  return `Download started — look for ${filename} in your downloads.`;
}

const DOWNLOAD_FAILED_MESSAGE =
  "Download could not be started in this browser.";

interface ImageExportPanelProps {
  /** Snapshot captured when the user opened the panel; edits are blocked behind it. */
  session: WorkoutSession;
  onClose: () => void;
  /**
   * M06-T02 (spec §14.1): initial selection comes from the persisted
   * Default Image Style setting. Defaults to Compact — the original
   * pre-setting behavior — so existing consumers are unchanged. The toggle
   * stays per-export: switching here never rewrites the stored preference.
   */
  initialStyle?: ImageExportStyle;
}

export function ImageExportPanel({
  session,
  onClose,
  initialStyle = "compact",
}: ImageExportPanelProps) {
  const [style, setStyle] = useState<ImageExportStyle>(initialStyle);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [pngReady, setPngReady] = useState(false);
  const [rendering, setRendering] = useState(true);
  const [delivering, setDelivering] = useState(false);
  const [statusText, setStatusText] = useState("");

  const pngBlobRef = useRef<Blob | null>(null);

  // Render the preview whenever the snapshot or style changes. One effect
  // owns the preview and delivery-blob lifecycle so stale async work cannot
  // update a later export selection.
  useEffect(() => {
    let cancelled = false;

    setRendering(true);
    setStatusText("");

    const doc = buildImageLayout(session, style);
    const svg = renderSessionSvg(doc);
    // Keep the preview on the source SVG. iOS WebKit can successfully encode
    // a canvas blob while displaying the resulting raster as an all-black
    // image; the deterministic vector is the same document and remains crisp
    // for tall sessions. PNG generation is still performed separately for the
    // delivery button and is never inferred from the preview.
    setPreviewSrc(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    );
    pngBlobRef.current = null;
    setPngReady(false);

    void (async () => {
      const blob = await rasterizeSvgToPngBlob(svg, doc.width, doc.height);
      if (cancelled) return;
      if (blob) {
        pngBlobRef.current = blob;
        setPngReady(true);
      } else {
        // No canvas/PNG path here: retain the identical SVG preview and disable
        // delivery rather than faking success later.
        pngBlobRef.current = null;
        setPngReady(false);
      }
      if (!cancelled) setRendering(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [session, style]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  /**
   * Delivery stays inside the tap gesture: the PNG blob was produced during
   * preview rendering, so the share call happens synchronously after the tap
   * with nothing awaited in between (same activation rule as Copy-to-Notes).
   */
  const handleDeliver = () => {
    const blob = pngBlobRef.current;
    if (!blob || delivering) return;
    const filename = exportImageFilename(session.dateLocal);

    if (supportsFileShare()) {
      setDelivering(true);
      void (async () => {
        try {
          const file = new File([blob], filename, { type: "image/png" });
          const outcome = await sharePngFile(file);
          setStatusText(SHARE_STATUS[outcome]);
        } catch {
          setStatusText(SHARE_STATUS.failed);
        } finally {
          setDelivering(false);
        }
      })();
      return;
    }

    setStatusText(
      triggerPngDownload(blob, filename)
        ? downloadStartedMessage(filename)
        : DOWNLOAD_FAILED_MESSAGE,
    );
  };

  return (
    <div className="image-backdrop" onClick={onClose}>
      <div
        className="image-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-export-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="image-card-header">
          <h2 className="image-card-title" id="image-export-title">
            Export Image
          </h2>
          <button
            type="button"
            className="image-close"
            aria-label="Close Export Image"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="style-toggle" role="group" aria-label="Export style">
          {STYLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={style === option.value}
              onClick={() => setStyle(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="image-preview">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt={`Full-session export preview, ${style} style`}
            />
          ) : (
            <p className="image-preview-empty">
              {rendering ? "Rendering…" : ""}
            </p>
          )}
        </div>

        <p className="image-status" role="status" aria-live="polite">
          {rendering
            ? "Rendering…"
            : !pngReady
              ? PNG_UNAVAILABLE_MESSAGE
              : statusText}
        </p>

        <div className="image-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!pngReady || delivering}
            onClick={handleDeliver}
          >
            {deliveryButtonLabel()}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageExportPanel;
