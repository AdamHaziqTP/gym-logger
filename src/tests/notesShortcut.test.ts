import { afterEach, describe, expect, it } from "vitest";
import {
  buildNotesShortcutFile,
  NOTES_SHORTCUT_FILENAME,
  shareNotesShortcutFile,
  supportsNotesShortcutShare,
} from "../domain/notesShortcut";

const payload = {
  html: '<table><tr style="color: rgb(255, 159, 10)"><td>Arms</td></tr></table>',
  text: "Arms\tCurl",
};

const nav = window.navigator as {
  share?: (data: { files: File[] }) => Promise<void>;
  canShare?: (data: { files: File[] }) => boolean;
};

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

afterEach(() => {
  Reflect.deleteProperty(nav, "share");
  Reflect.deleteProperty(nav, "canShare");
});

describe("Shortcuts HTML handoff", () => {
  it("creates a text/html file with the exact HTML payload and stable name", async () => {
    const file = buildNotesShortcutFile(payload);
    expect(file.name).toBe(NOTES_SHORTCUT_FILENAME);
    expect(file.type).toBe("text/html");
    await expect(readFileText(file)).resolves.toBe(payload.html);
  });

  it("requires both file share APIs", () => {
    expect(supportsNotesShortcutShare()).toBe(false);
    Object.defineProperty(nav, "share", { value: () => Promise.resolve(), configurable: true });
    Object.defineProperty(nav, "canShare", { value: () => true, configurable: true });
    expect(supportsNotesShortcutShare()).toBe(true);
  });

  it("reports shared only after the OS share promise resolves", async () => {
    let received: File | undefined;
    Object.defineProperty(nav, "canShare", {
      value: ({ files }: { files: File[] }) => {
        received = files[0];
        return true;
      },
      configurable: true,
    });
    Object.defineProperty(nav, "share", {
      value: async ({ files }: { files: File[] }) => {
        expect(files[0]?.type).toBe("text/html");
      },
      configurable: true,
    });

    await expect(shareNotesShortcutFile(buildNotesShortcutFile(payload))).resolves.toBe("shared");
    expect(received?.name).toBe(NOTES_SHORTCUT_FILENAME);
  });

  it("reports cancellation and failure honestly", async () => {
    Object.defineProperty(nav, "canShare", { value: () => true, configurable: true });
    Object.defineProperty(nav, "share", {
      value: () => Promise.reject(new DOMException("dismissed", "AbortError")),
      configurable: true,
    });
    await expect(shareNotesShortcutFile(buildNotesShortcutFile(payload))).resolves.toBe("cancelled");

    Object.defineProperty(nav, "share", {
      value: () => Promise.reject(new Error("share unavailable")),
      configurable: true,
    });
    await expect(shareNotesShortcutFile(buildNotesShortcutFile(payload))).resolves.toBe("failed");
  });

  it("does not call share when the file is not accepted", async () => {
    let called = false;
    Object.defineProperty(nav, "canShare", { value: () => false, configurable: true });
    Object.defineProperty(nav, "share", {
      value: () => {
        called = true;
        return Promise.resolve();
      },
      configurable: true,
    });
    await expect(shareNotesShortcutFile(buildNotesShortcutFile(payload))).resolves.toBe("failed");
    expect(called).toBe(false);
  });
});
