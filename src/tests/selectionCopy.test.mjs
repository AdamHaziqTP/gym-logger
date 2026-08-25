import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FIXTURE_SESSION } from "../../public/feasibility/fixture.mjs";
import {
  buildSelectionCopyMarkup,
  copyRenderedSelection,
} from "../../public/feasibility/selectionCopy.mjs";

afterEach(() => {
  Reflect.deleteProperty(document, "execCommand");
  document.body.innerHTML = "";
});

describe("M03-T04 WebKit native-selection-copy proof", () => {
  it("renders the canonical five-colour table and complete free-form content", () => {
    const markup = buildSelectionCopyMarkup(FIXTURE_SESSION);
    expect(markup).toContain("data-selection-copy-proof");
    expect(markup).toContain("<table");
    for (const label of ["Arms", "Back", "Chest", "Delts", "Legs"]) {
      expect(markup).toContain(label);
    }
    for (const value of ["8,6", "body weight", "30°", "—", "<strict>", "Notes"]) {
      expect(markup).toContain(value === "<strict>" ? "&lt;strict&gt;" : value);
    }
    expect(markup).toContain("#ff9f0a");
    expect(markup).toContain("#bf5af2");
    expect(markup).toContain("#66d4cf");
    expect(markup).toContain("#0a84ff");
    expect(markup).toContain("#ff375f");
  });

  it("uses only the native synchronous copy command and restores focus/selection", () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });
    const root = document.createElement("div");
    root.innerHTML = "<table><tbody><tr><td>Gym</td></tr></tbody></table>";
    document.body.append(root);
    const input = document.createElement("input");
    document.body.append(input);
    input.focus();
    const selection = document.getSelection();
    const prior = document.createRange();
    prior.selectNodeContents(input);
    selection?.removeAllRanges();
    selection?.addRange(prior);

    expect(copyRenderedSelection(root)).toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.activeElement).toBe(input);
  });

  it("keeps the proof page isolated from async clipboard and copy-event interception", () => {
    const source = readFileSync(
      resolve(process.cwd(), "public", "feasibility", "selectionCopy.mjs"),
      "utf8",
    );
    expect(source).not.toMatch(/\bClipboardItem\s*\(/);
    expect(source).not.toMatch(/navigator\.clipboard\s*\./);
    expect(source).not.toMatch(/\bwriteText\s*\(/);
    expect(source).not.toMatch(/\bsetData\s*\(/);
    expect(source).not.toContain('addEventListener("copy"');
    expect(readFileSync(resolve(process.cwd(), "public", "feasibility", "selection-copy.html"), "utf8")).not.toContain("display:none");
  });
});
