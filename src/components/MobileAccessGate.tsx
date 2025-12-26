/**
 * MobileAccessGate Component
 * 
 * Prüft ob der Benutzer Mobile-Zugang hat und zeigt
 * entsprechend die App oder eine Upgrade-Meldung an.
 */

import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFeature } from "@/hooks/useFeature";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface MobileAccessGateProps {
  children: ReactNode;
  /** Erlaube bestimmte Seiten immer (z.B. Auth, Datenschutz) */
  allowedPaths?: string[];
}

const TABLET_BREAKPOINT = 1024;

function useIsTablet(): boolean {
  const isMobile = useIsMobile();
  if (typeof window === "undefined") return false;
  return !isMobile && window.innerWidth < TABLET_BREAKPOINT;
}

export function MobileAccessGate({ children, allowedPaths = [] }: MobileAccessGateProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { enabled: hasMobileAccess, reason } = useFeature("mobileAccess");
  
  // Prüfe ob aktuelle Seite erlaubt ist
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const isAllowedPath = allowedPaths.some(path => 
    currentPath === path || currentPath.startsWith(path + "/")
  );
  
  // Desktop = immer erlaubt
  if (!isMobile && !isTablet) {
    return <>{children}</>;
  }
  
  // Erlaubte Seiten = immer zeigen
  if (isAllowedPath) {
    return <>{children}</>;
  }
  
  // Mobile/Tablet mit Lizenz = erlaubt
  if (hasMobileAccess) {
    return <>{children}</>;
  }
  
  // Mobile/Tablet ohne Lizenz = Upgrade-Hinweis
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">
            Mobile Nutzung nicht verfügbar
          </CardTitle>
          <CardDescription>
            {reason || "Ihr aktueller Plan beinhaltet keinen mobilen Zugang."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Geräteerkennung */}
          <div className="flex items-center justify-center gap-4 py-4 bg-muted/50 rounded-lg">
            {isMobile ? (
              <Smartphone className="h-8 w-8 text-primary" />
            ) : (
              <Monitor className="h-8 w-8 text-primary" />
            )}
            <div className="text-sm">
              <p className="font-medium">
                {isMobile ? "Smartphone erkannt" : "Tablet erkannt"}
              </p>
              <p className="text-muted-foreground">
                {isMobile ? "Bildschirm < 768px" : "Bildschirm < 1024px"}
              </p>
            </div>
          </div>
          
          {/* Features im höheren Plan */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Mit Mobile-Zugang können Sie:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                Angebote unterwegs kalkulieren
              </li>
              <li className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                Kunden direkt vor Ort beraten
              </li>
              <li className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                Schneller Zugriff auf Margen-Info
              </li>
            </ul>
          </div>
          
          {/* Upgrade CTA */}
          <div className="space-y-3 pt-4">
            <Button asChild className="w-full">
              <Link to="/license">
                Plan upgraden
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Enterprise- und Internal-Pläne beinhalten mobilen Zugang.
            </p>
          </div>
          
          {/* Alternative: Desktop nutzen */}
          <div className="pt-4 border-t">
            <p className="text-sm text-center text-muted-foreground">
              <Monitor className="inline h-4 w-4 mr-1" />
              Nutzen Sie die App auf einem Desktop-Computer für vollen Zugang.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
