import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook zur Überwachung des Netzwerkstatus
 * 
 * SICHERHEIT: Zentrale Erkennung von Online/Offline-Zuständen
 * für globale Sicherheitsmaßnahmen (Offline-Boundary)
 * 
 * @returns {Object} Netzwerkstatus und Hilfsfunktionen
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(
    typeof navigator !== "undefined" && navigator.onLine ? new Date() : null
  );

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineAt(new Date());
    
    if (wasOffline) {
      toast.success("Verbindung wiederhergestellt", {
        description: "Sie sind wieder online.",
      });
      
      // Log reconnection event (non-sensitive)
      console.info("[Security] Network reconnected");
    }
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    
    // Log offline event (security-relevant)
    console.warn("[Security] Network offline - blocking sensitive operations");
  }, []);

  useEffect(() => {
    // Initial check
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  /**
   * Manueller Retry - prüft Netzwerkstatus erneut
   */
  const retry = useCallback(() => {
    if (navigator.onLine) {
      handleOnline();
    } else {
      handleOffline();
    }
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
    lastOnlineAt,
    retry,
  };
}
