/**
 * Distribution Dashboard
 * 
 * Admin-Panel für Tenant-Admins zur Verwaltung ihrer Distribution:
 * - Partner-Übersicht und Einladung
 * - Provisions-Splitting Einstellungen
 * - Branding-Konfiguration
 * - Reporting über alle Partner
 */
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserPlus,
  Settings,
  Palette,
  PieChart,
  Mail,
  Check,
  X,
  Loader2,
  Building2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useDistributions, useDistributionPartners, type DistributionPartner } from "@/hooks/useDistributions";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { HelpLabel } from "@/components/ui/help-tooltip";

// Status Badge Colors
const STATUS_STYLES: Record<DistributionPartner["status"], { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "secondary", label: "Ausstehend" },
  active: { variant: "default", label: "Aktiv" },
  suspended: { variant: "destructive", label: "Suspendiert" },
  revoked: { variant: "outline", label: "Widerrufen" },
};

export default function DistributionDashboard() {
  const { role, isLoading: isLoadingRole } = useUserRole();
  const {
    myDistribution,
    isLoadingMyDistribution,
    updateDistribution,
    invitePartner,
    activatePartner,
    suspendPartner,
  } = useDistributions();
  
  // Call hook at top level - it handles undefined distributionId internally
  const { data: partners = [], isLoading: isLoadingPartners } = useDistributionPartners(myDistribution?.id);

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteProvisionSplit, setInviteProvisionSplit] = useState<string>("");
  const [isInviting, setIsInviting] = useState(false);

  const [brandingLogoUrl, setBrandingLogoUrl] = useState(myDistribution?.branding?.logo_url || "");
  const [brandingPrimaryColor, setBrandingPrimaryColor] = useState(myDistribution?.branding?.primary_color || "#e60000");
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // Stats
  const activePartners = partners.filter(p => p.status === "active").length;
  const pendingPartners = partners.filter(p => p.status === "pending").length;
  const totalSeats = partners.reduce((sum, p) => sum + (p.max_seats || 0), 0);

  const handleInvitePartner = async () => {
    if (!myDistribution || !inviteEmail) return;

    setIsInviting(true);
    try {
      await invitePartner.mutateAsync({
        distribution_id: myDistribution.id,
        email: inviteEmail,
        provision_split_pct: inviteProvisionSplit ? parseFloat(inviteProvisionSplit) : undefined,
      });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteProvisionSplit("");
    } finally {
      setIsInviting(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!myDistribution) return;

    setIsSavingBranding(true);
    try {
      await updateDistribution.mutateAsync({
        id: myDistribution.id,
        branding: {
          ...myDistribution.branding,
          logo_url: brandingLogoUrl,
          primary_color: brandingPrimaryColor,
        },
      });
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleActivatePartner = async (partnerId: string) => {
    if (!myDistribution) return;
    await activatePartner.mutateAsync({ partnerId, distributionId: myDistribution.id });
  };

  const handleSuspendPartner = async (partnerId: string) => {
    if (!myDistribution) return;
    await suspendPartner.mutateAsync({ partnerId, distributionId: myDistribution.id });
  };

  // Loading State
  if (isLoadingRole || isLoadingMyDistribution) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Access Check
  if (role !== "admin" && role !== "moderator") {
    return (
      <MainLayout>
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Zugriff verweigert
            </CardTitle>
            <CardDescription>
              Sie benötigen Tenant-Admin-Rechte, um das Distributions-Dashboard zu nutzen.
            </CardDescription>
          </CardHeader>
        </Card>
      </MainLayout>
    );
  }

  // No Distribution
  if (!myDistribution) {
    return (
      <MainLayout>
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Keine Distribution zugewiesen
            </CardTitle>
            <CardDescription>
              Ihr Tenant ist keiner Distribution zugeordnet. Bitte kontaktieren Sie den Super-Admin.
            </CardDescription>
          </CardHeader>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{myDistribution.name}</h1>
            <p className="text-muted-foreground">Distributions-Dashboard</p>
          </div>
          <Badge variant={myDistribution.status === "active" ? "default" : "secondary"}>
            {myDistribution.status === "active" ? "Aktiv" : myDistribution.status}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activePartners}</p>
                  <p className="text-xs text-muted-foreground">Aktive Partner</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingPartners}</p>
                  <p className="text-xs text-muted-foreground">Ausstehende Einladungen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSeats}</p>
                  <p className="text-xs text-muted-foreground">Gesamt-Seats</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{myDistribution.default_provision_split}%</p>
                  <p className="text-xs text-muted-foreground">
                    <HelpLabel term="provision">Standard-Split</HelpLabel>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="partners" className="space-y-4">
          <TabsList>
            <TabsTrigger value="partners" className="gap-2">
              <Users className="w-4 h-4" />
              Partner-Verwaltung
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Einstellungen
            </TabsTrigger>
          </TabsList>

          {/* Partners Tab */}
          <TabsContent value="partners" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Partner</CardTitle>
                  <CardDescription>
                    Verwalten Sie Ihre angeschlossenen Fachhändler
                  </CardDescription>
                </div>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      Partner einladen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Neuen Partner einladen</DialogTitle>
                      <DialogDescription>
                        Senden Sie eine Einladung per E-Mail an einen neuen Fachhändler.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail-Adresse</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="partner@firma.de"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="split">
                          <HelpLabel term="provision">Provisions-Split (%)</HelpLabel>
                        </Label>
                        <Input
                          id="split"
                          type="number"
                          min="0"
                          max="100"
                          placeholder={`Standard: ${myDistribution.default_provision_split}%`}
                          value={inviteProvisionSplit}
                          onChange={(e) => setInviteProvisionSplit(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Leer lassen für Standard-Split der Distribution
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        Abbrechen
                      </Button>
                      <Button onClick={handleInvitePartner} disabled={isInviting || !inviteEmail}>
                        {isInviting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Einladung senden...
                          </>
                        ) : (
                          "Einladung senden"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingPartners ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : partners.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Noch keine Partner vorhanden</p>
                    <p className="text-sm">Laden Sie Ihren ersten Partner ein</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>E-Mail / Tenant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          <HelpLabel term="provision">Split</HelpLabel>
                        </TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Beigetreten</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {partner.invited_email || partner.tenant_id}
                              </p>
                              {partner.invited_email && (
                                <p className="text-xs text-muted-foreground">
                                  {partner.tenant_id}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_STYLES[partner.status].variant}>
                              {STATUS_STYLES[partner.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {partner.provision_split_pct !== null
                              ? `${partner.provision_split_pct}%`
                              : `${myDistribution.default_provision_split}% (Standard)`}
                          </TableCell>
                          <TableCell>{partner.max_seats}</TableCell>
                          <TableCell>
                            {partner.onboarded_at
                              ? format(new Date(partner.onboarded_at), "dd.MM.yyyy", { locale: de })
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {partner.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleActivatePartner(partner.id)}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Aktivieren
                                </Button>
                              )}
                              {partner.status === "active" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => handleSuspendPartner(partner.id)}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Suspendieren
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>White-Label Branding</CardTitle>
                <CardDescription>
                  Passen Sie das Erscheinungsbild für Ihre Partner an
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo-URL</Label>
                    <Input
                      id="logo"
                      placeholder="https://ihre-firma.de/logo.png"
                      value={brandingLogoUrl}
                      onChange={(e) => setBrandingLogoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Wird im Header und auf PDFs angezeigt (empfohlen: 200x50px)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Primärfarbe</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={brandingPrimaryColor}
                        onChange={(e) => setBrandingPrimaryColor(e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={brandingPrimaryColor}
                        onChange={(e) => setBrandingPrimaryColor(e.target.value)}
                        placeholder="#e60000"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Für Buttons und Links (HEX-Code)
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Vorschau</h4>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center gap-3">
                      {brandingLogoUrl ? (
                        <img
                          src={brandingLogoUrl}
                          alt="Logo"
                          className="h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          Kein Logo
                        </div>
                      )}
                      <Button
                        size="sm"
                        style={{ backgroundColor: brandingPrimaryColor }}
                        className="text-white"
                      >
                        Beispiel-Button
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveBranding} disabled={isSavingBranding}>
                    {isSavingBranding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Speichern...
                      </>
                    ) : (
                      "Branding speichern"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Provisions-Einstellungen</CardTitle>
                <CardDescription>
                  Definieren Sie den Standard-Split für alle Partner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="defaultSplit">
                    <HelpLabel term="provision">Standard Provisions-Split (%)</HelpLabel>
                  </Label>
                  <Input
                    id="defaultSplit"
                    type="number"
                    min="0"
                    max="100"
                    value={myDistribution.default_provision_split}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 100) {
                        updateDistribution.mutate({
                          id: myDistribution.id,
                          default_provision_split: value,
                        });
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Prozentsatz der Provision, der bei Ihnen verbleibt. Der Rest geht an den Partner.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kontaktdaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">E-Mail</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      defaultValue={myDistribution.contact_email || ""}
                      onBlur={(e) => {
                        if (e.target.value !== myDistribution.contact_email) {
                          updateDistribution.mutate({
                            id: myDistribution.id,
                            contact_email: e.target.value || null,
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Telefon</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      defaultValue={myDistribution.contact_phone || ""}
                      onBlur={(e) => {
                        if (e.target.value !== myDistribution.contact_phone) {
                          updateDistribution.mutate({
                            id: myDistribution.id,
                            contact_phone: e.target.value || null,
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
