// ============================================
// useDemoMode – Schalter "Beispieldaten anzeigen" (Demo-Firma)
// Pro Benutzer im localStorage, nie in echte Daten. Kein throw.
// ============================================
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const EVENT = "demo-mode-changed";
const keyFor = (userId?: string) => `demo-mode:${userId ?? "anon"}`;
const tourKeyFor = (userId?: string) => `demo-tour-seen:${userId ?? "anon"}`;

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, on: boolean) {
  try {
    if (on) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch (err) {
    console.warn("[useDemoMode] write failed", err);
  }
}

export function useDemoMode() {
  const { user } = useAuth();
  const userId = user?.id;
  const [enabled, setEnabled] = useState(() => readFlag(keyFor(userId)));
  const [tourSeen, setTourSeen] = useState(() => readFlag(tourKeyFor(userId)));

  useEffect(() => {
    const sync = () => {
      setEnabled(readFlag(keyFor(userId)));
      setTourSeen(readFlag(tourKeyFor(userId)));
    };
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [userId]);

  const setDemo = useCallback((on: boolean) => {
    writeFlag(keyFor(userId), on);
    window.dispatchEvent(new Event(EVENT));
  }, [userId]);

  const markTourSeen = useCallback(() => {
    writeFlag(tourKeyFor(userId), true);
    window.dispatchEvent(new Event(EVENT));
  }, [userId]);

  return { enabled, setDemo, tourSeen, markTourSeen };
}
