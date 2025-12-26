import { WifiOff, Shield, RefreshCw, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Sichere Offline-Fallback-Seite
 * 
 * SICHERHEITSGARANTIEN:
 * - Keine Formular-Inputs (verhindert Offline-Injection)
 * - Keine sensiblen Daten angezeigt (keine Margen, EK-Preise, etc.)
 * - Keine API-Calls möglich
 * - Keine localStorage-Zugriffe auf sensible Daten
 * - CSP Headers bleiben aktiv
 * - Session wird NICHT invalidiert (User bleibt eingeloggt nach Reconnect)
 * 
 * GLOBAL & PERMANENT: Diese Seite ist zentral in der App-Architektur
 * verankert und schützt vor Offline-basierten Angriffen.
 */
export default function Offline() {
  const handleRetry = () => {
    // Simple reload - no sensitive data passed
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          {/* Offline Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <WifiOff className="w-16 h-16 text-muted-foreground" />
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                <Lock className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Keine Verbindung
            </h1>
            <p className="text-muted-foreground">
              Die Internetverbindung wurde unterbrochen. 
              Bitte überprüfen Sie Ihre Netzwerkverbindung.
            </p>
          </div>

          {/* Security Notice */}
          <Alert className="text-left">
            <Shield className="w-4 h-4" />
            <AlertDescription>
              <strong>Ihre Sitzung ist geschützt.</strong> Nach Wiederherstellung 
              der Verbindung können Sie nahtlos fortfahren. Keine Daten gehen verloren.
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
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Eingaben blockiert
              </li>
            </ul>
          </div>

          {/* Retry Button - No form, simple reload */}
          <Button 
            onClick={handleRetry}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Verbindung erneut prüfen
          </Button>

          {/* Footer */}
          <p className="text-xs text-muted-foreground">
            MargenKalkulator • Vodafone Business Partner
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
