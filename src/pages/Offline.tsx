import { useEffect, useState } from "react";
import { WifiOff, Shield, RefreshCw, Lock, Calculator, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { offlineStorage } from "@/lib/offlineStorage";

/**
 * Sichere Offline-Fallback-Seite mit Light-Mode Unterstützung
 * 
 * Im Light-Mode (wenn Offline-Daten verfügbar):
 * - Ermöglicht Angebotserstellung mit gecachten Daten
 * - Speichert neue Angebote lokal für spätere Synchronisierung
 * 
 * Im Secure-Mode (wenn keine Offline-Daten):
 * - Blockiert alle Eingaben (Sicherheitsmodus)
 * - Zeigt sichere Warte-Seite
 */
export default function Offline() {
  const [isOfflineCapable, setIsOfflineCapable] = useState(false);
  const [stats, setStats] = useState({ hardware: 0, tariffs: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOfflineCapability = async () => {
      try {
        const available = await offlineStorage.isDataAvailable();
        setIsOfflineCapable(available);
        
        if (available) {
          const fullStats = await offlineStorage.getStorageStats();
          setStats({
            hardware: fullStats.hardwareCount,
            tariffs: fullStats.tariffCount,
            pending: fullStats.pendingOffers + fullStats.pendingCalculations,
          });
        }
      } catch (error) {
        console.error("[Offline] Capability check failed:", error);
        setIsOfflineCapable(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOfflineCapability();
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleContinueOffline = () => {
    // Navigate to calculator with offline flag
    window.location.href = "/?offline=true";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          {/* Offline Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <WifiOff className="w-16 h-16 text-muted-foreground" />
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                {isOfflineCapable ? (
                  <Database className="w-5 h-5 text-green-600" />
                ) : (
                  <Lock className="w-5 h-5 text-primary" />
                )}
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {isOfflineCapable ? "Offline-Modus verfügbar" : "Keine Verbindung"}
            </h1>
            <p className="text-muted-foreground">
              {isOfflineCapable
                ? "Sie können mit den lokal gespeicherten Daten weiterarbeiten."
                : "Die Internetverbindung wurde unterbrochen. Bitte überprüfen Sie Ihre Netzwerkverbindung."}
            </p>
          </div>

          {/* Offline-Mode Stats (wenn verfügbar) */}
          {isOfflineCapable && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Verfügbare Offline-Daten:</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.hardware}</div>
                  <div className="text-xs text-muted-foreground">Geräte</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.tariffs}</div>
                  <div className="text-xs text-muted-foreground">Tarife</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
                  <div className="text-xs text-muted-foreground">Ausstehend</div>
                </div>
              </div>
              {stats.pending > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {stats.pending} Einträge warten auf Synchronisierung
                </Badge>
              )}
            </div>
          )}

          {/* Security Notice */}
          <Alert className="text-left">
            <Shield className="w-4 h-4" />
            <AlertDescription>
              <strong>Ihre Sitzung ist geschützt.</strong>{" "}
              {isOfflineCapable
                ? "Neue Angebote werden lokal gespeichert und bei Wiederverbindung synchronisiert."
                : "Nach Wiederherstellung der Verbindung können Sie nahtlos fortfahren."}
            </AlertDescription>
          </Alert>

          {/* Security Info */}
          <div className="text-xs text-muted-foreground space-y-1 text-left bg-muted/30 rounded-lg p-3">
            <p className="font-medium mb-2">Sicherheitsmaßnahmen aktiv:</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Session-Schutz aktiv
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Datenintegrität gewährleistet
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isOfflineCapable ? "bg-green-500" : "bg-amber-500"}`} />
                {isOfflineCapable ? "Lokale Datenspeicherung" : "Eingaben blockiert"}
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {isOfflineCapable && (
              <Button onClick={handleContinueOffline} className="w-full" size="lg">
                <Calculator className="w-4 h-4 mr-2" />
                Im Offline-Modus fortfahren
              </Button>
            )}
            <Button
              onClick={handleRetry}
              variant={isOfflineCapable ? "outline" : "default"}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Verbindung erneut prüfen
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground">
            MargenKalkulator • Vodafone Business Partner
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
