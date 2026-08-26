import {
  extractCapturedPayload,
  replayCapturedNotesClipboard,
  validateCapturedPayload,
} from "./notesClipboardReplay.mjs";

const button = document.getElementById("replay-captured-notes-html");
const status = document.getElementById("replay-status");
const fixtureDetails = document.getElementById("fixture-details");

let payload = null;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.dataset.state = isError ? "error" : "normal";
}

async function loadFixture() {
  try {
    const response = await fetch("./notes-clipboard-fingerprint.json", {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Fixture request returned HTTP ${response.status}.`);
    payload = extractCapturedPayload(await response.json());
    const validation = await validateCapturedPayload(payload);
    if (!validation.matchesPinnedFixture) {
      throw new Error("The captured fixture failed its pinned byte/hash identity check.");
    }
    fixtureDetails.textContent =
      `Captured HTML: ${validation.htmlBytes.toLocaleString()} bytes · SHA-256 ${validation.htmlSha256} · ` +
      `plain text: ${validation.plainBytes.toLocaleString()} bytes`;
    button.disabled = false;
    setStatus("Captured Notes payload loaded exactly. Ready for the one replay tap.");
  } catch (error) {
    setStatus(`The captured fixture could not be loaded safely: ${error.message}`, true);
  }
}

button.addEventListener("click", () => {
  if (!payload) return;
  button.disabled = true;
  setStatus("Writing the captured HTML and plain text to the clipboard…");

  // No await occurs before replayCapturedNotesClipboard calls clipboard.write.
  replayCapturedNotesClipboard({
    clipboard: globalThis.navigator?.clipboard,
    payload,
  }).then((result) => {
    if (result.status === "ok") {
      setStatus("Replay write succeeded. Return to Apple Notes and paste once.");
    } else {
      setStatus(result.error?.message || "Replay write was not available.", true);
      button.disabled = false;
    }
  });
});

loadFixture();
