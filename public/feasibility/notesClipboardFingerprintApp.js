import {
  createFingerprintDownload,
  readClipboardFingerprint,
  serializeFingerprint,
} from "./notesClipboardFingerprint.mjs";

const inspectButton = document.getElementById("inspect-clipboard");
const status = document.getElementById("fingerprint-status");
const output = document.getElementById("fingerprint-output");
const download = document.getElementById("fingerprint-download");

function setStatus(message, isError = false) {
  status.textContent = message;
  status.dataset.state = isError ? "error" : "normal";
}

inspectButton.addEventListener("click", async () => {
  inspectButton.disabled = true;
  download.replaceChildren();
  output.textContent = "Reading the browser-visible clipboard…";
  setStatus("Reading only; the clipboard will not be changed.");

  const fingerprint = await readClipboardFingerprint({
    clipboard: globalThis.navigator?.clipboard,
  });
  output.textContent = serializeFingerprint(fingerprint);

  if (fingerprint.status === "ok" || fingerprint.status === "partial") {
    setStatus(
      fingerprint.status === "partial"
        ? "Clipboard read completed with one or more representation errors; see the JSON."
        : "Clipboard read completed without changing the clipboard.",
      fingerprint.status === "partial",
    );
    try {
      const result = createFingerprintDownload(fingerprint);
      download.append(result.link);
    } catch (error) {
      setStatus(`Read completed, but the JSON download could not be prepared: ${error.message}`, true);
    }
  } else {
    setStatus(
      fingerprint.error?.message || "The browser did not allow a clipboard read.",
      true,
    );
  }

  inspectButton.disabled = false;
});
