// ============================================
// SECURITY: Prototype Pollution Protection
// Muss VOR allen anderen Imports ausgeführt werden
// Verhindert Angriffe über manipulierte __proto__ / constructor.prototype
// Besonders relevant für xlsx CVE-2023-30533
// ============================================
(() => {
  try {
    Object.freeze(Object.prototype);
    Object.freeze(Array.prototype);
    Object.freeze(Function.prototype);
    Object.freeze(String.prototype);
    Object.freeze(Number.prototype);
    Object.freeze(Boolean.prototype);
    Object.freeze(RegExp.prototype);
    Object.freeze(Date.prototype);
    Object.freeze(Error.prototype);
    console.info("[Security] Prototype pollution protection enabled");
  } catch (e) {
    console.warn("[Security] Could not freeze prototypes:", e);
  }
})();

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
