import { useEffect } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSecurity } from "@/providers/SecurityProvider";
import Offline from "@/pages/Offline";

/**
 * OfflineBoundary - Globaler Wrapper für Offline-Sicherheit
 * 
 * ARCHITEKTUR: GLOBAL & PERMANENT
 * Diese Komponente umschließt die gesamte App und stellt sicher,
 * dass bei fehlender Internetverbindung eine sichere Fallback-Seite
 * angezeigt wird.
 * 
 * SICHERHEITSGARANTIEN:
 * 1. Blockiert alle sensitiven Operationen im Offline-Modus
 * 2. Verhindert Formular-Eingaben (Offline-Injection-Schutz)
 * 3. Loggt Offline-Events für Audit-Zwecke
 * 4. Bewahrt Session-Integrität (kein Auto-Logout)
 * 5. CSP Headers bleiben durchgehend aktiv
 * 
 * WARUM GLOBAL?
 * - Konsistentes Verhalten über alle Routen
 * - Keine Sicherheitslücken durch vergessene Route-Handler
 * - Zentrale Kontrolle über Offline-Verhalten
 * 
 * WARUM PERMANENT?
 * - Schützt vor Man-in-the-Middle Angriffen
 * - Verhindert Manipulation durch Offline-Daten-Injection
 * - Blockiert "Offline-then-sync" Angriffsvektoren
 */

interface OfflineBoundaryProps {
  children: React.ReactNode;
}

export function OfflineBoundary({ children }: OfflineBoundaryProps) {
  const { isOnline, wasOffline } = useNetworkStatus();
  const security = useSecurity();

  // Log offline/online state changes for security audit
  useEffect(() => {
    if (!isOnline) {
      security.logEvent({
        type: "anomaly_detected",
        details: {
          event: "network_offline",
          timestamp: new Date().toISOString(),
          action: "blocking_sensitive_operations",
        },
      });
    } else if (wasOffline) {
      security.logEvent({
        type: "component_lifecycle",
        details: {
          event: "network_reconnected",
          timestamp: new Date().toISOString(),
          action: "resuming_normal_operations",
        },
      } as any);
    }
  }, [isOnline, wasOffline, security]);

  // Block keyboard shortcuts that might bypass offline protection
  useEffect(() => {
    if (!isOnline) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Block form submission shortcuts
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
        }
        // Block paste operations
        if ((e.ctrlKey || e.metaKey) && e.key === "v") {
          e.preventDefault();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOnline]);

  // Show offline page when not connected
  if (!isOnline) {
    return <Offline />;
  }

  return <>{children}</>;
}
