import { afterEach, describe, expect, it, vi } from "vitest";
import {
  chooseRasterScale,
  rasterizeSvgToPngBlob,
  sharePngFile,
  supportsFileShare,
  triggerPngDownload,
} from "../domain/pngExport";

/* ---------------------------------------------------------------------- */
/* Browser-side PNG/delivery mechanics (spec §§14.3, 14.5; task           */
/* M03-T02-IMAGE-EXPORT-01). jsdom has no canvas, so the rasterizer's     */
/* graceful null path is exercised by the flow suite; here we pin the     */
/* pure scale choice and the HONESTY contract of each delivery outcome:   */
/* "shared" only from a resolved share call, "cancelled" for user         */
/* dismissal, download reported only as "started". iOS behavior itself    */
/* remains a human device gate.                                           */
/* ---------------------------------------------------------------------- */

describe("chooseRasterScale", () => {
  it("supersamples 2x while the result stays inside the platform pixel budget", () => {
    expect(chooseRasterScale(760, 2000)).toBe(2); // 1.52M px → 6.1M at 2x
  });

  it("drops to 1x — never below logical size — when 2x would exceed the budget", () => {
    expect(chooseRasterScale(760, 6000)).toBe(1); // 4.56M px → 18.2M at 2x
    expect(
      chooseRasterScale(760, 2000, 5_000_000),
    ).toBe(1);
  });

  it("treats degenerate sizes conservatively", () => {
    expect(chooseRasterScale(0, 100)).toBe(1);
  });
});

describe("rasterizeSvgToPngBlob", () => {
  const validPngDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  function readBlobBytes(blob: Blob): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("serializes the rendered canvas as a non-empty PNG before using the WebKit toBlob fallback", async () => {
    const drawImages: Array<ReturnType<typeof vi.fn>> = [];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => {
        const drawImage = vi.fn();
        drawImages.push(drawImage);
        return { drawImage } as unknown as CanvasRenderingContext2D;
      },
    );
    const toDataURL = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue(validPngDataUrl);
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, "toBlob");

    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", FakeImage);

    const blob = await rasterizeSvgToPngBlob(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" />',
      1,
      1,
    );

    expect(blob).not.toBeNull();
    expect(blob!.type).toBe("image/png");
    const bytes = await readBlobBytes(blob!);
    expect(bytes.byteLength).toBeGreaterThan(8);
    expect(bytes.slice(0, 8)).toEqual(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    // There must be exactly one canvas in this path: the canvas that receives
    // drawImage is the canvas whose toDataURL bytes are delivered.
    expect(drawImages).toHaveLength(1);
    expect(drawImages[0]).toHaveBeenCalledTimes(1);
    expect(toDataURL).toHaveBeenCalledWith("image/png");
    expect(toBlob).not.toHaveBeenCalled();
  });

  it("falls back to toBlob when synchronous PNG serialization is unavailable", async () => {
    const fallbackBlob = new Blob(["png"], { type: "image/png" });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(() => {
      throw new Error("serialization unavailable");
    });
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => callback(fallbackBlob),
    );

    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", FakeImage);

    await expect(
      rasterizeSvgToPngBlob("<svg />", 1, 1),
    ).resolves.toBe(fallbackBlob);
  });
});

describe("supportsFileShare", () => {
  const nav = window.navigator as {
    share?: unknown;
    canShare?: unknown;
  };

  afterEach(() => {
    Reflect.deleteProperty(nav, "share");
    Reflect.deleteProperty(nav, "canShare");
    vi.restoreAllMocks();
  });

  it("is false without the OS share APIs (desktop/jsdom default)", () => {
    expect(supportsFileShare()).toBe(false);
  });

  it("is true only when share AND canShare exist", () => {
    Object.defineProperty(nav, "share", { value: () => {}, configurable: true });
    Object.defineProperty(nav, "canShare", {
      value: () => true,
      configurable: true,
    });
    expect(supportsFileShare()).toBe(true);
  });
});

describe("sharePngFile outcomes are literal", () => {
  const nav = window.navigator as {
    share?: unknown;
    canShare?: unknown;
  };
  const FILE = new File(["png-bytes"], "Gym-2026-08-24.png", {
    type: "image/png",
  });

  function install(overrides: {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[] }) => Promise<void>;
  }): void {
    Object.defineProperty(nav, "canShare", {
      value: overrides.canShare,
      configurable: true,
    });
    Object.defineProperty(nav, "share", {
      value: overrides.share,
      configurable: true,
    });
  }

  afterEach(() => {
    Reflect.deleteProperty(nav, "share");
    Reflect.deleteProperty(nav, "canShare");
  });

  it("reports shared ONLY after navigator.share resolves", async () => {
    install({
      canShare: () => true,
      share: (data) => {
        expect(data.files[0]!.name).toBe("Gym-2026-08-24.png");
        return Promise.resolve();
      },
    });
    await expect(sharePngFile(FILE)).resolves.toBe("shared");
  });

  it("reports cancelled on user dismissal (AbortError), never success or failure", async () => {
    install({
      canShare: () => true,
      share: () =>
        Promise.reject(new DOMException("user aborted", "AbortError")),
    });
    await expect(sharePngFile(FILE)).resolves.toBe("cancelled");
  });

  it("reports failed on any other rejection", async () => {
    install({
      canShare: () => true,
      share: () => Promise.reject(new Error("sheet crashed")),
    });
    await expect(sharePngFile(FILE)).resolves.toBe("failed");
  });

  it("reports failed without calling share when the payload is not sharable", async () => {
    let shareCalled = false;
    install({
      canShare: () => false,
      share: () => {
        shareCalled = true;
        return Promise.resolve();
      },
    });
    await expect(sharePngFile(FILE)).resolves.toBe("failed");
    expect(shareCalled).toBe(false);
  });

  it("reports failed when no share sheet exists (download fallback territory)", async () => {
    await expect(sharePngFile(FILE)).resolves.toBe("failed");
  });
});

describe("triggerPngDownload is a truthful best effort", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("clicks an anchor with the exact filename and reports that it started", () => {
    const created = "blob:mock-url";
    URL.createObjectURL = () => created;
    URL.revokeObjectURL = () => {};

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const captured: { anchor?: HTMLAnchorElement } = {};
    const originalAppend = document.body.appendChild.bind(document.body);
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) captured.anchor = node;
      return originalAppend(node);
    });

    const blob = new Blob(["png"], { type: "image/png" });
    expect(triggerPngDownload(blob, "Gym-2026-08-23.png")).toBe(true);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(captured.anchor!.download).toBe("Gym-2026-08-23.png");
    expect(captured.anchor!.href).toContain("blob:mock-url");
  });

  it("returns false instead of pretending when object URLs are unavailable", () => {
    // jsdom lacks URL.createObjectURL by default; simulate explicitly.
    Reflect.deleteProperty(URL, "createObjectURL");
    const blob = new Blob(["png"], { type: "image/png" });
    expect(triggerPngDownload(blob, "Gym-2026-08-23.png")).toBe(false);
  });
});
