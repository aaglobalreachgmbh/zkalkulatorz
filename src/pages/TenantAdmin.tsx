// ============================================
// Tenant Admin Dashboard
// Mandantenspezifische Verwaltung für allenetze.de
// ============================================

import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Building2, FileSpreadsheet, CreditCard, Users, Shield, Info, Key, Briefcase, ArrowLeft } from "lucide-react";
import { useIdentity } from "@/contexts/IdentityContext";
import { MainLayout } from "@/components/MainLayout";
import { TenantHardwareManager } from "@/margenkalkulator/ui/components/TenantHardwareManager";
import { TenantProvisionManager } from "@/margenkalkulator/ui/components/TenantProvisionManager";
import { TenantTeamManager } from "@/margenkalkulator/ui/components/TenantTeamManager";
import { LicenseManagement } from "@/margenkalkulator/ui/components/LicenseManagement";
import { TenantCompanySettings } from "@/margenkalkulator/ui/components/TenantCompanySettings";
import { useTenantHardware } from "@/margenkalkulator/hooks/useTenantHardware";
import { useTenantProvisions } from "@/margenkalkulator/hooks/useTenantProvisions";

export default function TenantAdmin() {
  const navigate = useNavigate();
  const { identity } = useIdentity();
  const { hasData: hasHardware } = useTenantHardware();
  const { hasData: hasProvisions } = useTenantProvisions();

  const isDataComplete = hasHardware && hasProvisions;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Building2 className="h-8 w-8" />
                Tenant-Verwaltung
              </h1>
              <p className="text-muted-foreground mt-1">
                Verwalten Sie Hardware-Preise, Provisionen und Team-Einstellungen
              </p>
            </div>
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
                {!hasHardware && <li>Hardware-EK-Preise (CSV-Upload im Tab &quot;Hardware&quot;)</li>}
                {!hasProvisions && <li>Provisions-Tabelle (CSV-Upload im Tab &quot;Provisionen&quot;)</li>}
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
        <Tabs defaultValue="company" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Unternehmen
            </TabsTrigger>
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
            <TabsTrigger value="license" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Lizenz
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Rechte
            </TabsTrigger>
          </TabsList>

          {/* Company Settings Tab */}
          <TabsContent value="company">
            <TenantCompanySettings />
          </TabsContent>

          {/* Hardware Tab */}
          <TabsContent value="hardware">
            <TenantHardwareManager />
          </TabsContent>

          {/* Provisions Tab */}
          <TabsContent value="provisions">
            <TenantProvisionManager />
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <TenantTeamManager />
          </TabsContent>

          {/* License Tab */}
          <TabsContent value="license">
            <LicenseManagement />
          </TabsContent>

          {/* Permissions Tab */}
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
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <div className="font-medium">Margen für Mitarbeiter verbergen</div>
                    <div className="text-sm text-muted-foreground">
                      Wenn aktiviert, sehen Mitarbeiter (Subuser) keine Margen-Informationen im Dealer-Modus.
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                    Aktiv via Policy
                  </Badge>
                </div>
                <Alert className="border-primary/30 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertTitle>Berechtigungen werden über Policies gesteuert</AlertTitle>
                  <AlertDescription>
                    Sensible Felder werden automatisch basierend auf der Benutzerrolle und dem aktiven Modus (Dealer/Kunden/POS) verborgen.
                    Admins haben immer vollen Zugriff auf alle Margen- und EK-Daten.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
