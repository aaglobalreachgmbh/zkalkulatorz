// ============================================
// Tenant Admin Dashboard
// Mandantenspezifische Verwaltung für allenetze.de
// ============================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building2, FileSpreadsheet, CreditCard, Users, Shield, Info } from "lucide-react";
import { useIdentity } from "@/contexts/IdentityContext";
import { TenantHardwareManager } from "@/margenkalkulator/ui/components/TenantHardwareManager";
import { TenantProvisionManager } from "@/margenkalkulator/ui/components/TenantProvisionManager";
import { useTenantHardware } from "@/margenkalkulator/hooks/useTenantHardware";
import { useTenantProvisions } from "@/margenkalkulator/hooks/useTenantProvisions";

export default function TenantAdmin() {
  const { identity } = useIdentity();
  const { hasData: hasHardware } = useTenantHardware();
  const { hasData: hasProvisions } = useTenantProvisions();

  const isDataComplete = hasHardware && hasProvisions;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            Tenant-Verwaltung
          </h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Hardware-Preise, Provisionen und Team-Einstellungen
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Tenant: {identity.tenantId}
        </Badge>
      </div>

      {/* Data Status Overview */}
      {!isDataComplete && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Konfiguration unvollständig</AlertTitle>
          <AlertDescription>
            Bevor der Kalkulator verwendet werden kann, müssen Sie folgende Daten hochladen:
            <ul className="list-disc list-inside mt-2">
              {!hasHardware && <li>Hardware-EK-Preise (CSV-Upload im Tab "Hardware")</li>}
              {!hasProvisions && <li>Provisions-Tabelle (CSV-Upload im Tab "Provisionen")</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isDataComplete && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <Info className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-600">Konfiguration vollständig</AlertTitle>
          <AlertDescription>
            Alle erforderlichen Daten sind vorhanden. Der Kalkulator ist einsatzbereit.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="hardware" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hardware" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Hardware
            {!hasHardware && <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">!</Badge>}
          </TabsTrigger>
          <TabsTrigger value="provisions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Provisionen
            {!hasProvisions && <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">!</Badge>}
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Berechtigungen
          </TabsTrigger>
        </TabsList>

        {/* Hardware Tab */}
        <TabsContent value="hardware">
          <TenantHardwareManager />
        </TabsContent>

        {/* Provisions Tab */}
        <TabsContent value="provisions">
          <TenantProvisionManager />
        </TabsContent>

        {/* Team Tab - Placeholder for Phase 4 */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team-Verwaltung
              </CardTitle>
              <CardDescription>
                Laden Sie Mitarbeiter ein und verwalten Sie deren Rollen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Demnächst verfügbar</AlertTitle>
                <AlertDescription>
                  Die Team-Verwaltung mit E-Mail-Einladungen wird in Phase 4 implementiert.
                  Aktuell können Nutzer über den Admin-Bereich hinzugefügt werden.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab - Placeholder for Phase 4 */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Berechtigungen
              </CardTitle>
              <CardDescription>
                Steuern Sie, welche Mitarbeiter Margen sehen dürfen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Demnächst verfügbar</AlertTitle>
                <AlertDescription>
                  Die feingranulare Rechteverwaltung (z.B. "Marge verbergen für Mitarbeiter") 
                  wird in Phase 4 implementiert.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
