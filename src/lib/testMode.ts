// ============================================
// Testmodus ohne Login – NUR in Vorschau/localhost erlaubt.
// Auf veröffentlichter App und eigenen Domains fest gesperrt.
// ============================================

const KEY = "test-mode";

export function isTestModeAllowed(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    /^id-preview--.*\.lovable\.app$/.test(h) ||
    h.endsWith(".lovableproject.com")
  );
}

export function isTestModeActive(): boolean {
  try {
    return isTestModeAllowed() && sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function enableTestMode() {
  if (!isTestModeAllowed()) return;
  try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ }
}

export function disableTestMode() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}
