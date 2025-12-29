/**
 * Offline Status Indicator Komponente
 * 
 * Zeigt den aktuellen Offline/Online-Status und Sync-Informationen an.
 */

import { WifiOff, Wifi, RefreshCw, CloudOff, Check, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { cn } from "@/lib/utils";

interface OfflineStatusIndicatorProps {
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

export function OfflineStatusIndicator({
  compact = false,
  showDetails = true,
  className,
}: OfflineStatusIndicatorProps) {
  const {
    isOnline,
    isOfflineCapable,
    syncStatus,
    stats,
    isSyncing,
    triggerSync,
  } = useOfflineMode();

  const hasPendingData = stats.pendingOffers > 0 || stats.pendingCalculations > 0;

  // Compact-Modus: Nur Icon anzeigen
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                isOnline
                  ? "text-green-600 dark:text-green-400"
                  : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
                className
              )}
            >
              {isOnline ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              {hasPendingData && (
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isOnline ? "Online" : "Offline"}{" "}
              {hasPendingData && `(${stats.pendingOffers + stats.pendingCalculations} ausstehend)`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Vollständige Ansicht mit Popover für Details
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2",
            !isOnline && "text-amber-600 dark:text-amber-400",
            className
          )}
        >
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span className="hidden sm:inline">Offline</span>
            </>
          )}
          {hasPendingData && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {stats.pendingOffers + stats.pendingCalculations}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      {showDetails && (
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <CloudOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                )}
                <span className="font-medium">
                  {isOnline ? "Verbunden" : "Offline-Modus"}
                </span>
              </div>
              <StatusBadge status={syncStatus} />
            </div>

            {/* Offline-Capability */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Offline-Daten verfügbar</span>
                {isOfflineCapable ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
              </div>
              
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Hardware-Katalog</span>
                <span>{stats.hardwareCount} Geräte</span>
              </div>
              
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Tarife</span>
                <span>{stats.tariffCount} Tarife</span>
              </div>
            </div>

            {/* Pending Data */}
            {hasPendingData && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Ausstehende Synchronisierung
                </p>
                {stats.pendingOffers > 0 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Angebote</span>
                    <Badge variant="outline">{stats.pendingOffers}</Badge>
                  </div>
                )}
                {stats.pendingCalculations > 0 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Berechnungen</span>
                    <Badge variant="outline">{stats.pendingCalculations}</Badge>
                  </div>
                )}
              </div>
            )}

            {/* Last Sync */}
            {stats.lastSync && (
              <div className="text-xs text-muted-foreground">
                Letzte Synchronisierung:{" "}
                {new Date(stats.lastSync).toLocaleString("de-DE", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </div>
            )}

            {/* Sync Button */}
            {isOnline && (hasPendingData || !isOfflineCapable) && (
              <Button
                className="w-full"
                size="sm"
                onClick={triggerSync}
                disabled={isSyncing}
              >
                <RefreshCw
                  className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")}
                />
                {isSyncing ? "Synchronisiere..." : "Jetzt synchronisieren"}
              </Button>
            )}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "syncing":
      return (
        <Badge variant="secondary" className="text-xs">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Sync
        </Badge>
      );
    case "success":
      return (
        <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <Check className="h-3 w-3 mr-1" />
          OK
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Fehler
        </Badge>
      );
    default:
      return null;
  }
}
