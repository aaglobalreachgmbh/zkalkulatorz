// ============================================
// License Management Component
// Meilenstein 4: Lizenz-Dashboard
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Key, 
  Users, 
  CheckCircle, 
  XCircle, 
  Crown, 
  Trash2, 
  UserPlus,
  Calendar,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useLicense } from "@/hooks/useLicense";
import { useCloudSeats } from "@/hooks/useCloudSeats";
import { type LicenseFeatures } from "@/lib/license";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { AssignSeatModal } from "./AssignSeatModal";
import { UpgradeRequestModal } from "./UpgradeRequestModal";

// Feature display names (matching LicenseFeatures interface)
const FEATURE_LABELS: Record<keyof LicenseFeatures, string> = {
  dataGovernance: "Daten-Governance",
  compareOption2: "Vergleichs-Option 2",
  fixedNetModule: "Festnetz-Modul",
  exportPdf: "PDF-Export",
  auditLog: "Audit-Log",
  aiConsultant: "KI-Berater",
  advancedReporting: "Erweitertes Reporting",
  apiAccess: "API-Zugang",
  customBranding: "Custom Branding",
  adminFullVisibility: "Admin: Volle Sichtbarkeit",
  adminFeatureControl: "Admin: Feature-Steuerung",
  adminSecurityAccess: "Admin: Security-Zugang",
  adminBypassApproval: "Admin: Approval umgehen",
  mobileAccess: "Mobil-Zugang",
  offlineSync: "Offline-Sync",
};

// Plan display names and colors
const PLAN_CONFIG: Record<string, { label: string; color: string }> = {
  internal: { label: "Internal", color: "bg-blue-500" },
  pro: { label: "Pro", color: "bg-purple-500" },
  enterprise: { label: "Enterprise", color: "bg-amber-500" },
};

export function LicenseManagement() {
  const { license, seatUsage, isFeatureEnabled, isCloud } = useLicense();
  const { seats, isLoading, isRevoking, revokeSeat } = useCloudSeats();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const planConfig = PLAN_CONFIG[license?.plan || "internal"] || PLAN_CONFIG.internal;
  const seatPercentage = seatUsage.limit > 0 ? (seatUsage.used / seatUsage.limit) * 100 : 0;
  const isNearLimit = seatPercentage >= 80;

  // Get all features
  const allFeatures = Object.keys(FEATURE_LABELS) as (keyof LicenseFeatures)[];
  const enabledFeatures = allFeatures.filter((f) => isFeatureEnabled(f));
  const disabledFeatures = allFeatures.filter((f) => !isFeatureEnabled(f));

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy HH:mm", { locale: de });
    } catch {
      return dateString;
    }
  };

  // Handle revoke seat
  const handleRevokeSeat = async (userId: string) => {
    if (confirm("Möchten Sie diesen Seat wirklich entziehen?")) {
      await revokeSeat(userId);
    }
  };

  return (
    <div className="space-y-6">
      {/* License Status & Seat Usage Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* License Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-5 w-5" />
                Lizenz-Status
              </CardTitle>
              <Badge className={`${planConfig.color} text-white`}>
                <Crown className="h-3 w-3 mr-1" />
                {planConfig.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Modus</p>
                <p className="font-medium">{isCloud ? "Cloud" : "Lokal"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gültigkeit</p>
                <p className="font-medium flex items-center gap-1">
                  {license?.validUntil ? (
                    <>
                      <Calendar className="h-3 w-3" />
                      {format(new Date(license.validUntil), "dd.MM.yyyy", { locale: de })}
                    </>
                  ) : (
                    <span className="text-green-600">Unbegrenzt</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Aktiviert am</p>
                <p className="font-medium">
                  {license?.updatedAt 
                    ? format(new Date(license.updatedAt), "dd.MM.yyyy", { locale: de })
                    : "—"
                  }
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aktiv
                </Badge>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setShowUpgradeModal(true)}
            >
              <Crown className="h-4 w-4 mr-2" />
              Lizenz erweitern
            </Button>
          </CardContent>
        </Card>

        {/* Seat Usage Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Seat-Nutzung
              </CardTitle>
              <span className="text-2xl font-bold">
                {seatUsage.used} / {seatUsage.limit}
              </span>
            </div>
            <CardDescription>
              {seatUsage.available} Seat{seatUsage.available !== 1 ? "s" : ""} verfügbar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress 
              value={seatPercentage} 
              className={isNearLimit ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary"}
            />

            {isNearLimit && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Seat-Limit fast erreicht. Erwägen Sie ein Upgrade.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              className="w-full"
              disabled={seatUsage.available <= 0}
              onClick={() => setShowAssignModal(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Seat zuweisen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enthaltene Features</CardTitle>
          <CardDescription>
            Übersicht der in Ihrem Plan aktivierten Funktionen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {allFeatures.map((feature) => {
              const isEnabled = enabledFeatures.includes(feature);
              return (
                <div 
                  key={feature}
                  className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                    isEnabled 
                      ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isEnabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span>{FEATURE_LABELS[feature] || feature}</span>
                </div>
              );
            })}
          </div>

          {disabledFeatures.length > 0 && (
            <p className="text-xs text-muted-foreground mt-4">
              {disabledFeatures.length} Feature{disabledFeatures.length !== 1 ? "s" : ""} in höheren Plänen verfügbar
            </p>
          )}
        </CardContent>
      </Card>

      {/* Seat Assignments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Zugewiesene Seats</CardTitle>
              <CardDescription>
                Verwalten Sie die Seat-Zuweisung für Ihre Mitarbeiter
              </CardDescription>
            </div>
            <Button 
              size="sm"
              disabled={seatUsage.available <= 0}
              onClick={() => setShowAssignModal(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Seat zuweisen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : seats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Noch keine Seats zugewiesen</p>
              <p className="text-sm">Weisen Sie Mitarbeitern Seats zu, um ihnen Zugang zu geben.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Zugewiesen am</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seats.map((seat) => (
                  <TableRow key={seat.id}>
                    <TableCell className="font-medium">
                      {seat.userName || "—"}
                    </TableCell>
                    <TableCell>{seat.userEmail}</TableCell>
                    <TableCell>{formatDate(seat.assignedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={isRevoking}
                        onClick={() => handleRevokeSeat(seat.userId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AssignSeatModal 
        open={showAssignModal} 
        onOpenChange={setShowAssignModal}
      />
      <UpgradeRequestModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        currentPlan={license?.plan || "internal"}
      />
    </div>
  );
}
