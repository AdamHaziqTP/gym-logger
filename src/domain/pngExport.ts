import { Canvg } from "canvg";

/**
 * Browser-side image delivery (spec §§14.3, 14.5; task M03-T02-IMAGE-EXPORT-01).
 * Separated from the pure renderer in `imageExport.ts` so every layout and
 * serialization guarantee stays testable without a canvas.
 *
 * Rasterization: SVG document → pure-JS SVG renderer → 2D canvas at the
 * largest safe integer scale → PNG Blob (`toDataURL`, with a `toBlob`
 * fallback). Any missing piece resolves to `null`; callers must degrade
 * truthfully instead of pretending a PNG exists.
 *
 * Delivery honesty contract (task requirement): an iOS share-sheet outcome is
 * only ever reported from a resolved `navigator.share` call — never inferred
 * on desktop or in tests. The download path reports "download started", which
 * is exactly all it can know.
 */

/**
 * Conservative raster pixel budget below iOS WebKit's historic ~16.7M-pixel
 * canvas area limit (spec §14.3 forbids low-resolution caps; scaling down to
 * stay inside a real platform limit is not an arbitrary cap).
 */
export const DEFAULT_RASTER_BUDGET_PX = 16_000_000;

export type RasterScale = 1 | 2;

/**
 * Chooses the supersampling scale for rasterization: 2× when the result fits
 * comfortably inside the platform pixel budget, otherwise 1× (never below
 * logical size). Pure and exported for tests.
 */
export function chooseRasterScale(
  width: number,
  height: number,
  budgetPx: number = DEFAULT_RASTER_BUDGET_PX,
): RasterScale {
  const pixels = width * height;
  if (pixels <= 0) return 1;
  return pixels * 4 <= budgetPx ? 2 : 1;
}

/**
 * Prevents a blank bitmap from ever becoming a shareable file. Checking the
 * actual delivery canvas immediately before encoding is deliberately stronger
 * than checking a Blob's type, dimensions, or PNG signature.
 */
function hasVisiblePixels(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
): boolean {
  if (typeof context.getImageData !== "function") return false;
  try {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let index = 0; index + 3 < pixels.length; index += 4) {
      if (
        pixels[index + 3]! > 0 &&
        (pixels[index]! > 0 || pixels[index + 1]! > 0 || pixels[index + 2]! > 0)
      ) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

function pngDataUrlToBlob(dataUrl: string): Blob | null {
  const marker = "base64,";
  const base64Start = dataUrl.indexOf(marker);
  if (base64Start === -1) return null;
  try {
    const binary = atob(dataUrl.slice(base64Start + marker.length));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index) & 0xff;
    }
    return new Blob([bytes], { type: "image/png" });
  } catch {
    return null;
  }
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  // iOS WebKit can produce a visually corrupt file from canvas.toBlob for
  // this SVG-backed path even when the on-screen SVG preview is correct.
  // Prefer synchronous PNG serialization and retain toBlob as a fallback.
  if (typeof canvas.toDataURL === "function") {
    try {
      const blob = pngDataUrlToBlob(canvas.toDataURL("image/png"));
      if (blob) return Promise.resolve(blob);
    } catch {
      // Fall through to toBlob when synchronous serialization is unavailable.
    }
  }
  return new Promise((resolve) => {
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob((blob) => {
        resolve(blob?.type === "image/png" ? blob : null);
      }, "image/png");
      return;
    }
    resolve(null);
  });
}

/**
 * Rasterizes one standalone SVG document into a PNG blob at up to 2× scale.
 * Resolves `null` whenever the environment cannot produce a PNG (no 2D
 * canvas, renderer failure, encoding refusal) — jsdom among them — so the UI
 * can say so honestly.
 */
export async function rasterizeSvgToPngBlob(
  svg: string,
  width: number,
  height: number,
): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  if (typeof window === "undefined") {
    return null;
  }

  const scale = chooseRasterScale(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  let context: CanvasRenderingContext2D | null = null;
  try {
    // The draw target and the encoded target must be the same canvas. A
    // separate capability probe here would leave the delivery canvas
    // transparent even though the SVG preview remains visible.
    context = canvas.getContext("2d");
  } catch {
    return null;
  }
  if (!context) return null;

  try {
    // Canvg parses the known standalone SVG and issues ordinary Canvas 2D
    // drawing calls. This avoids the failing iOS WebKit SVG-image drawImage
    // bridge while keeping the renderer client-side and offline-first.
    // The SVG is expressed in logical pixels, while the delivery canvas is
    // supersampled. Scale the exact delivery context before Canvg draws;
    // otherwise iOS receives a correctly rasterized image occupying only the
    // top-left logical-size portion of the larger 2x PNG.
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const renderer = Canvg.fromString(context, svg, {
      window,
      DOMParser,
    });
    await renderer.render({
      ignoreAnimation: true,
      ignoreMouse: true,
      ignoreDimensions: true,
    });
    if (!hasVisiblePixels(context, canvas)) return null;
    return canvasToPngBlob(canvas);
  } catch {
    return null;
  }
}

/* ------------------------------- delivery ------------------------------- */

export type ShareOutcome = "shared" | "cancelled" | "failed";
export type DownloadOutcome = "download-started" | "failed";
export type ImageDeliveryOutcome = ShareOutcome | DownloadOutcome;

/**
 * Whether THIS device could hand a PNG file to the OS share sheet. Both APIs
 * must exist; the per-file `navigator.canShare({ files })` check still runs
 * at share time because support varies by payload and platform.
 */
export function supportsFileShare(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    typeof File === "function"
  );
}

/**
 * Hands one PNG file to the iOS/OS share sheet (spec §14.5). The caller must
 * invoke this directly inside the user gesture with the blob already in hand.
 * Outcomes are literal: only a RESOLVED share promise is `"shared"`; a user
 * dismissal (`AbortError`) is `"cancelled"`, never success and never failure.
 * Any other rejection is `"failed"` — this function deliberately does NOT
 * silently fall back to download, because the user just saw the system fail.
 */
export async function sharePngFile(file: File): Promise<ShareOutcome> {
  if (!supportsFileShare()) return "failed";
  try {
    if (!navigator.canShare({ files: [file] })) return "failed";
  } catch {
    return "failed";
  }
  try {
    await navigator.share({ files: [file] });
    return "shared";
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError"
      ? "cancelled"
      : "failed";
  }
}

/**
 * Truthful download fallback for environments without a file share sheet:
 * programmatic `<a download>` click. Returns whether the click was actually
 * performed; nothing here can verify what the browser did afterwards, and
 * callers must word their status accordingly ("download started").
 */
export function triggerPngDownload(blob: Blob, filename: string): boolean {
  if (typeof document === "undefined" || typeof URL?.createObjectURL !== "function") {
    return false;
  }
  try {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
  } catch {
    return false;
  }
}

/**
 * Label for the primary delivery button: iOS gets the share sheet wording,
 * everything else gets plain download wording (§14.5).
 */
export function deliveryButtonLabel(): string {
  return supportsFileShare() ? "Save / Share Image" : "Download PNG";
}
