import { afterEach, describe, expect, it, vi } from "vitest";
import {
  copyTextViaSelection,
  supportsCombinedClipboardWrite,
  writeNotesPayloadToClipboard,
} from "../domain/notesClipboard";

/* ---------------------------------------------------------------------- */
/* Legacy/plain clipboard mechanics (task M03-T01-FIX-01): the Async      */
/* Clipboard API does not exist on non-secure origins such as the tested  */
/* http://LAN server, so the scoped execCommand("copy") fallback must be  */
/* truthful about success/failure and leave no selection or DOM residue.  */
/* ---------------------------------------------------------------------- */

const PAYLOAD = {
  html: "<div><strong>Monday 24 Aug</strong></div>",
  text: "Monday 24 Aug\nCategory\tExercise\tSets\tReps\tWeight\tSkip",
};

function installExecCommand(impl: () => boolean): ReturnType<typeof vi.fn> {
  const spy = vi.fn(impl);
  Object.defineProperty(document, "execCommand", {
    configurable: true,
    value: spy,
  });
  return spy;
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window.navigator as { clipboard?: unknown }).clipboard;
  Reflect.deleteProperty(document, "execCommand");
});

describe("supportsCombinedClipboardWrite", () => {
  it("is false when the environment has neither ClipboardItem nor navigator.clipboard", () => {
    // jsdom default: no global ClipboardItem, no navigator.clipboard.
    expect(supportsCombinedClipboardWrite()).toBe(false);
  });

  it("requires both pieces before claiming rich support", () => {
    vi.stubGlobal("ClipboardItem", class {});
    // navigator.clipboard still missing.
    expect(supportsCombinedClipboardWrite()).toBe(false);

    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { write: async () => {} },
    });
    expect(supportsCombinedClipboardWrite()).toBe(true);
  });
});

describe("copyTextViaSelection", () => {
  it("returns false when document.execCommand is unavailable", () => {
    expect(copyTextViaSelection(PAYLOAD.text)).toBe(false);
  });

  it("selects only a temporary helper carrying exactly the payload text and removes it", () => {
    let selectedAtCopyTime: string | null = null;
    installExecCommand(() => {
      const helper = document.querySelector<HTMLTextAreaElement>(
        "textarea[aria-hidden='true']",
      );
      selectedAtCopyTime = helper ? helper.value : null;
      return true;
    });

    expect(copyTextViaSelection(PAYLOAD.text)).toBe(true);
    expect(selectedAtCopyTime).toBe(PAYLOAD.text);
    expect(document.querySelector("textarea[aria-hidden='true']")).toBeNull();
  });

  it("maps an execCommand throw to failure and still cleans up the helper", () => {
    installExecCommand(() => {
      throw new Error("gesture rejected");
    });

    expect(copyTextViaSelection(PAYLOAD.text)).toBe(false);
    expect(document.querySelector("textarea[aria-hidden='true']")).toBeNull();
  });

  it("restores a pre-existing selection after the copy", () => {
    installExecCommand(() => true);

    const anchor = document.createElement("p");
    anchor.textContent = "anchor text";
    document.body.appendChild(anchor);
    const range = document.createRange();
    range.selectNodeContents(anchor);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    try {
      expect(copyTextViaSelection(PAYLOAD.text)).toBe(true);
      const after = document.getSelection();
      expect(after?.rangeCount).toBe(1);
      expect(after?.getRangeAt(0).toString()).toBe("anchor text");
    } finally {
      selection?.removeAllRanges();
      anchor.remove();
    }
  });

  it("returns focus to the previously focused element", () => {
    installExecCommand(() => true);

    const button = document.createElement("button");
    button.textContent = "focus holder";
    document.body.appendChild(button);
    button.focus();
    expect(document.activeElement).toBe(button);

    try {
      expect(copyTextViaSelection(PAYLOAD.text)).toBe(true);
      expect(document.activeElement).toBe(button);
    } finally {
      button.remove();
    }
  });
});

describe("writeNotesPayloadToClipboard attempt order", () => {
  it("reports rich success through the combined write without touching the legacy path", async () => {
    class FakeClipboardItem {
      readonly entries: Record<string, Blob>;
      constructor(items: Record<string, string | Blob>) {
        this.entries = items as Record<string, Blob>;
      }
    }
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { write: async () => {} },
    });
    const exec = installExecCommand(() => true);

    const outcome = await writeNotesPayloadToClipboard(PAYLOAD);

    expect(outcome).toBe("copied-rich");
    expect(exec).not.toHaveBeenCalled();
  });

  it("uses async writeText before the legacy fallback when both exist", async () => {
    const written: string[] = [];
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          written.push(text);
        },
      },
    });
    const exec = installExecCommand(() => true);

    const outcome = await writeNotesPayloadToClipboard(PAYLOAD);

    expect(outcome).toBe("copied-plain");
    expect(written).toEqual([PAYLOAD.text]);
    expect(exec).not.toHaveBeenCalled();
  });

  it("resolves copied-plain through the legacy selection path alone when no Async Clipboard API exists", async () => {
    // No navigator.clipboard at all (the LAN http:// condition).
    const exec = installExecCommand(() => true);

    const outcome = await writeNotesPayloadToClipboard(PAYLOAD);

    expect(outcome).toBe("copied-plain");
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it("falls back to the legacy path when both async attempts are denied", async () => {
    const denial = () => Promise.reject(new Error("denied"));
    class FakeClipboardItem {
      constructor(_: Record<string, string | Blob>) {}
    }
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { write: denial, writeText: denial },
    });
    const exec = installExecCommand(() => true);

    const outcome = await writeNotesPayloadToClipboard(PAYLOAD);

    expect(outcome).toBe("copied-plain");
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it("fails when every mechanism is unavailable or refuses", async () => {
    const denial = () => Promise.reject(new Error("denied"));
    class FakeClipboardItem {
      constructor(_: Record<string, string | Blob>) {}
    }
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { write: denial, writeText: denial },
    });
    installExecCommand(() => false);

    const outcome = await writeNotesPayloadToClipboard(PAYLOAD);

    expect(outcome).toBe("failed");
  });
});
