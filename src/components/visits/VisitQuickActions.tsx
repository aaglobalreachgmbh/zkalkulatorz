/**
 * Quick Actions für Außendienst-Modus
 * Schnellzugriff auf häufige Aktionen
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MapPin,
  Camera,
  ClipboardList,
  Plus,
  WifiOff,
  Cloud,
  Loader2,
} from "lucide-react";
import { useWorkplaceMode } from "@/contexts/WorkplaceModeContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { cn } from "@/lib/utils";

interface VisitQuickActionsProps {
  compact?: boolean;
}

export function VisitQuickActions({ compact = false }: VisitQuickActionsProps) {
  const navigate = useNavigate();
  const { isField } = useWorkplaceMode();
  const { isOnline } = useNetworkStatus();
  const { stats, isSyncing } = useOfflineMode();

  // Nur im Field-Modus anzeigen
  if (!isField) return null;

  const pendingCount = (stats.pendingOffers || 0) + (stats.pendingCalculations || 0);

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <MapPin className="h-5 w-5" />
            {pendingCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
              >
                {pendingCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <QuickActionsList />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <QuickActionsList />
    </div>
  );
}

function QuickActionsList() {
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  const { stats, isSyncing, triggerSync } = useOfflineMode();

  const pendingCount = (stats.pendingOffers || 0) + (stats.pendingCalculations || 0);

  return (
    <div className="space-y-2">
      {/* Status */}
      <div className="flex items-center gap-2 px-2 py-1">
        {isOnline ? (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Cloud className="h-3 w-3 text-green-600" />
            Online
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 text-xs bg-amber-100 text-amber-700">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        )}
        {pendingCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {pendingCount} ausstehend
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-9"
          onClick={() => navigate("/visits/new")}
        >
          <MapPin className="h-4 w-4" />
          Besuch starten
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-9"
          onClick={() => navigate("/calculator")}
        >
          <Plus className="h-4 w-4" />
          Neues Angebot
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-9"
          onClick={() => navigate("/visits")}
        >
          <ClipboardList className="h-4 w-4" />
          Meine Besuche
        </Button>
      </div>

      {/* Sync Button */}
      {pendingCount > 0 && isOnline && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={triggerSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Cloud className="h-4 w-4" />
          )}
          Jetzt synchronisieren
        </Button>
      )}
    </div>
  );
}
