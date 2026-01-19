/**
 * Offline-First Dashboard Widget für Außendienstler
 * 
 * Kompakte Übersicht mit:
 * - Heute fällige Kunden (VVL, Termine, offene Angebote)
 * - Ausstehende Besuchsberichte
 * - Sync-Status
 */

import { useState } from "react";
import {
  Users,
  FileText,
  RefreshCw,
  Wifi,
  WifiOff,
  MapPin,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Calendar,
  ChevronRight,
  Briefcase,
  Cloud,
  CloudOff,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useFieldServiceDashboard } from "@/hooks/useFieldServiceDashboard";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { useNavigate } from "react-router-dom";

export function FieldServiceDashboard() {
  const navigate = useNavigate();
  const { todayCustomers, pendingReports, isLoading, refetch } = useFieldServiceDashboard();
  const { isOnline } = useNetworkStatus();
  const { stats, isSyncing, triggerSync, syncStatus } = useOfflineMode();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await triggerSync();
    } finally {
      setSyncing(false);
    }
  };

  const handleNavigateToCustomer = (customerId: string) => {
    navigate(`/kunden/${customerId}`);
  };

  const handleNavigateToReport = (reportId: string) => {
    navigate(`/besuche/${reportId}`);
  };

  const handleNewVisit = () => {
    navigate("/besuche/neu");
  };

  const pendingCount = (stats.pendingOffers || 0) + (stats.pendingCalculations || 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-primary" />
            Außendienst-Übersicht
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <Badge
              variant={isOnline ? "default" : "destructive"}
              className="gap-1"
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Offline
                </>
              )}
            </Badge>

            {/* Sync Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={!isOnline || syncing || isSyncing}
            >
              <RefreshCw className={cn(
                "h-4 w-4 mr-1",
                (syncing || isSyncing) && "animate-spin"
              )} />
              Sync
            </Button>
          </div>
        </div>

        {/* Pending Items Banner */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-warning/10 rounded-lg text-sm">
            <CloudOff className="h-4 w-4 text-warning" />
            <span className="text-warning-foreground">
              {pendingCount} ausstehende Synchronisation{pendingCount !== 1 ? "en" : ""}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Today's Customers Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Heute fällige Kunden ({todayCustomers.length})
            </h4>
            <Button variant="ghost" size="sm" onClick={handleNewVisit}>
              <Calendar className="h-4 w-4 mr-1" />
              Neuer Besuch
            </Button>
          </div>

          <ScrollArea className="h-[180px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Lade Daten...
              </div>
            ) : todayCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
                <p className="text-sm">Keine Termine für heute</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleNavigateToCustomer(customer.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {customer.company_name}
                          </span>
                          <Badge
                            variant={
                              customer.urgency === "high" ? "destructive" :
                                customer.urgency === "medium" ? "default" : "secondary"
                            }
                            className="text-xs shrink-0"
                          >
                            {customer.reason === "vvl" && "VVL"}
                            {customer.reason === "appointment" && "Termin"}
                            {customer.reason === "open_offer" && "Angebot"}
                            {customer.reason === "overdue_visit" && "Überfällig"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {customer.reasonDetail}
                        </p>
                        {customer.contact_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {customer.contact_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {customer.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${customer.phone}`;
                            }}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        {customer.address && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://maps.google.com/?q=${encodeURIComponent(customer.address || "")}`, "_blank");
                            }}
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <Separator />

        {/* Pending Reports Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Ausstehende Berichte ({pendingReports.length})
            </h4>
          </div>

          <ScrollArea className="h-[120px]">
            {pendingReports.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                <span className="text-sm">Alle Berichte abgeschlossen</span>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleNavigateToReport(report.id)}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className={cn(
                        "h-4 w-4",
                        report.days_overdue > 2 ? "text-destructive" : "text-warning"
                      )} />
                      <div>
                        <p className="text-sm font-medium truncate max-w-[180px]">
                          {report.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.days_overdue === 0
                            ? "Heute"
                            : report.days_overdue === 1
                              ? "Gestern"
                              : `Vor ${report.days_overdue} Tagen`
                          }
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Bericht
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <Separator />

        {/* Sync Status Section */}
        <div>
          <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
            <Cloud className="h-4 w-4 text-muted-foreground" />
            Sync-Status
          </h4>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-xs">Letzte Sync</p>
              <p className="font-medium">
                {stats.lastSync
                  ? formatDistanceToNow(new Date(stats.lastSync), { addSuffix: true, locale: de })
                  : "Nie"
                }
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-xs">Offline-Daten</p>
              <p className="font-medium">
                {stats.hardwareCount} Hardware, {stats.tariffCount} Tarife
              </p>
            </div>
          </div>

          {syncStatus === "error" && (
            <div className="mt-2 p-2 bg-destructive/10 rounded-lg text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Sync fehlgeschlagen. Bitte erneut versuchen.
            </div>
          )}

          {syncStatus === "success" && (
            <div className="mt-2 p-2 bg-green-500/10 rounded-lg text-sm text-green-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Synchronisation erfolgreich
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FieldServiceDashboard;
