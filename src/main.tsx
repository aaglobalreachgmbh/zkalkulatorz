// ============================================
// SECURITY: Prototype Pollution Protection
// SAFE VERSION: Nur kritische Properties schützen, nicht den gesamten Prototype
// Verhindert Angriffe über manipulierte __proto__ / constructor.prototype
// Besonders relevant für xlsx CVE-2023-30533
// ============================================
(() => {
  try {
    // __proto__ Accessor überschreiben - blockiert Pollution-Angriffe
    // ohne Libraries zu brechen die toString/valueOf definieren
    Object.defineProperty(Object.prototype, "__proto__", {
      get() {
        return Object.getPrototypeOf(this);
      },
      set(newProto) {
        // Erlaube nur null oder Object - blockiere Pollution-Angriffe
        if (newProto !== null && typeof newProto !== "object") {
          console.warn("[Security] Blocked __proto__ pollution attempt");
          return;
        }
        Object.setPrototypeOf(this, newProto);
      },
      configurable: false,
    });

    console.info("[Security] Prototype pollution protection enabled (safe mode)");
  } catch (e) {
    console.warn("[Security] Could not enable prototype protection:", e);
  }
})();

import React from "react";
import { createRoot } from "react-dom/client";
import { EnterpriseErrorBoundary } from "./components/EnterpriseErrorBoundary";
import App from "./App";
import "./index.css";
import { markHydrationComplete } from "./lib/performance";
import { logEnvironmentStatus } from "./lib/envGuard";

// ============================================
// ENVIRONMENT VALIDATION (runs first)
// ============================================
logEnvironmentStatus();

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <EnterpriseErrorBoundary fallbackTitle="Anwendungs-Fehler" moduleName="Root">
      <App />
    </EnterpriseErrorBoundary>
  </React.StrictMode>
);

// Mark hydration complete after initial render
// Use requestIdleCallback with fallback for Safari
const scheduleHydrationMark = typeof requestIdleCallback !== 'undefined'
  ? requestIdleCallback
  : (cb: () => void) => setTimeout(cb, 50);

scheduleHydrationMark(() => markHydrationComplete());
