// ============================================
// Testmodus ohne Login – NUR in Vorschau/localhost erlaubt.
// Auf veröffentlichter App und eigenen Domains fest gesperrt.
// Bleibt 7 Tage im Browser aktiv (auch nach Schließen des Tabs).
// ============================================

const KEY = "test-mode";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function isTestModeAllowed(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    /^(id-)?preview--.*\.lovable\.app$/.test(h) ||
    h.endsWith(".lovableproject.com")
  );
}

export function isTestModeActive(): boolean {
  if (!isTestModeAllowed()) return false;
  try {
    if (sessionStorage.getItem(KEY) === "1") return true;
    const until = Number(localStorage.getItem(KEY) ?? 0);
    return until > Date.now();
  } catch {
    return false;
  }
}

export function enableTestMode() {
  if (!isTestModeAllowed()) return;
  try {
    sessionStorage.setItem(KEY, "1");
    localStorage.setItem(KEY, String(Date.now() + TTL_MS));
  } catch { /* ignore */ }
}

export function disableTestMode() {
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}
