import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerServiceWorker } from "./pwa/serviceWorkerRegistration";
import "./styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root element");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline shell (M06-T01): fire-and-forget; internally waits for the window
// load event and never blocks rendering or editing.
void registerServiceWorker();
