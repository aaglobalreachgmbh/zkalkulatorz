// ============================================
// Admin Employee Management Page
// Manage employee provisions, tariff access, features
// ============================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useIdentity } from "@/contexts/IdentityContext";
import {
  useAllEmployeeSettings,
  useAdminEmployeeManagement,
  type EmployeeSettings,
} from "@/margenkalkulator/hooks/useEmployeeSettings";
import {
  Users,
  Settings,
  DollarSign,
  Lock,
  Sparkles,
  ChevronLeft,
  Pencil,
  Trash2,
  Search,
  Building2,
  Percent,
} from "lucide-react";
import { getCatalog } from "@/margenkalkulator/engine/catalogResolver";
import { DATASETS } from "@/margenkalkulator/config";

// Feature list for overrides
const FEATURES = [
  { key: "pdfExport", label: "PDF-Export", description: "Angebote als PDF exportieren" },
  { key: "aiConsultant", label: "AI-Berater", description: "KI-gestützte Beratung" },
  { key: "omoSelection", label: "OMO-Auswahl", description: "OMO-Rate manuell wählen" },
  { key: "compareOption2", label: "Option 2", description: "Zweite Vergleichsoption" },
  { key: "cloudSync", label: "Cloud-Sync", description: "Angebote in Cloud speichern" },
];

export default function AdminEmployees() {
  const navigate = useNavigate();
  
  const { identity, canAccessAdmin } = useIdentity();
  const { employees, isLoading, refresh } = useAllEmployeeSettings();
  const { createOrUpdateSettings, deleteEmployeeSettings } = useAdminEmployeeManagement();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<EmployeeSettings | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    displayName: "",
    department: "",
    provisionDeduction: 0,
    provisionDeductionType: "fixed" as "fixed" | "percent",
    blockedTariffs: [] as string[],
    featureOverrides: {} as Record<string, boolean>,
  });

  // Get tariff catalog for blacklist selection
  const catalog = getCatalog(DATASETS.CURRENT);
  const allTariffs = catalog.mobileTariffs || [];

  // Filter employees by search
  const filteredEmployees = employees.filter((e) => {
    const search = searchQuery.toLowerCase();
    return (
      e.displayName?.toLowerCase().includes(search) ||
      e.department?.toLowerCase().includes(search) ||
      e.userId.toLowerCase().includes(search)
    );
  });

  const openEditDialog = (employee: EmployeeSettings) => {
    setEditingEmployee(employee);
    setFormData({
      displayName: employee.displayName || "",
      department: employee.department || "",
      provisionDeduction: employee.provisionDeduction,
      provisionDeductionType: employee.provisionDeductionType,
      blockedTariffs: employee.blockedTariffs,
      featureOverrides: employee.featureOverrides,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingEmployee) return;

    try {
      setIsSaving(true);
      await createOrUpdateSettings(editingEmployee.userId, formData);
      toast.success("Gespeichert", { description: "Mitarbeiter-Einstellungen aktualisiert." });
      setIsDialogOpen(false);
      refresh();
    } catch (err) {
      toast.error("Fehler", { description: err instanceof Error ? err.message : "Speichern fehlgeschlagen" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (employee: EmployeeSettings) => {
    if (!window.confirm(`Einstellungen für ${employee.displayName || employee.userId} wirklich löschen?`)) {
      return;
    }

    try {
      await deleteEmployeeSettings(employee.userId);
      toast.success("Gelöscht", { description: "Einstellungen entfernt (Standard wird verwendet)." });
      refresh();
    } catch (err) {
      toast.error("Fehler", { description: err instanceof Error ? err.message : "Löschen fehlgeschlagen" });
    }
  };

  const toggleBlockedTariff = (tariffId: string) => {
    setFormData((prev) => ({
      ...prev,
      blockedTariffs: prev.blockedTariffs.includes(tariffId)
        ? prev.blockedTariffs.filter((t) => t !== tariffId)
        : [...prev.blockedTariffs, tariffId],
    }));
  };

  const toggleFeature = (featureKey: string) => {
    setFormData((prev) => ({
      ...prev,
      featureOverrides: {
        ...prev.featureOverrides,
        [featureKey]: !prev.featureOverrides[featureKey],
      },
    }));
  };

  if (!canAccessAdmin) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 py-12 text-center">
          <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Zugriff verweigert</h1>
          <p className="text-muted-foreground mt-2">Diese Seite ist nur für Administratoren zugänglich.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Mitarbeiter-Verwaltung
              </h1>
              <p className="text-muted-foreground">
                Provisionen, Tarif-Zugriff und Features pro Mitarbeiter steuern
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Mitarbeiter suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Employee List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Keine Mitarbeiter gefunden" : "Noch keine Mitarbeiter-Einstellungen"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {employee.displayName || employee.userId}
                        </h3>
                        {employee.department && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {employee.department}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Deduction Badge */}
                      <div className="text-center">
                        <Badge variant={employee.provisionDeduction > 0 ? "secondary" : "outline"}>
                          {employee.provisionDeductionType === "percent" ? (
                            <>-{employee.provisionDeduction}%</>
                          ) : (
                            <>-{employee.provisionDeduction}€</>
                          )}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">Abzug</p>
                      </div>

                      {/* Blocked Tariffs */}
                      <div className="text-center">
                        <Badge variant={employee.blockedTariffs.length > 0 ? "destructive" : "outline"}>
                          {employee.blockedTariffs.length}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">Gesperrt</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(employee)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(employee)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Einstellungen: {editingEmployee?.displayName || editingEmployee?.userId}
              </DialogTitle>
              <DialogDescription>
                Individuelle Provisions- und Zugriffs-Einstellungen
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="provision" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="provision" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Provision
                </TabsTrigger>
                <TabsTrigger value="tariffs" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Tarife
                </TabsTrigger>
                <TabsTrigger value="features" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Features
                </TabsTrigger>
              </TabsList>

              {/* Provision Tab */}
              <TabsContent value="provision" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Anzeigename</Label>
                      <Input
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="Name des Mitarbeiters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Abteilung</Label>
                      <Input
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="z.B. Store Berlin"
                      />
                    </div>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Provisions-Abzug
                      </CardTitle>
                      <CardDescription>
                        Dieser Betrag wird von der angezeigten Provision abgezogen
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Abzug</Label>
                          <Input
                            type="number"
                            min={0}
                            value={formData.provisionDeduction}
                            onChange={(e) =>
                              setFormData({ ...formData, provisionDeduction: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Typ</Label>
                          <Select
                            value={formData.provisionDeductionType}
                            onValueChange={(v) =>
                              setFormData({ ...formData, provisionDeductionType: v as "fixed" | "percent" })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fester Betrag (€)</SelectItem>
                              <SelectItem value="percent">Prozentual (%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted rounded-lg">
                        <strong>Beispiel:</strong> Bei 100€ Provision zeigt der Mitarbeiter{" "}
                        {formData.provisionDeductionType === "percent"
                          ? `${Math.round(100 * (1 - formData.provisionDeduction / 100))}€`
                          : `${Math.max(0, 100 - formData.provisionDeduction)}€`}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tariffs Tab */}
              <TabsContent value="tariffs" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Gesperrte Tarife (Blacklist)</CardTitle>
                    <CardDescription>
                      Diese Tarife werden dem Mitarbeiter im Wizard nicht angezeigt
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                      {allTariffs.map((tariff) => (
                        <label
                          key={tariff.id}
                          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        >
                          <div>
                            <p className="font-medium">{tariff.name}</p>
                            <p className="text-xs text-muted-foreground">{tariff.family}</p>
                          </div>
                          <Switch
                            checked={formData.blockedTariffs.includes(tariff.id)}
                            onCheckedChange={() => toggleBlockedTariff(tariff.id)}
                          />
                        </label>
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground mt-3">
                      <strong>{formData.blockedTariffs.length}</strong> Tarif(e) gesperrt
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Feature-Freigaben</CardTitle>
                    <CardDescription>
                      Überschreibt die Lizenz-Einstellungen für diesen Mitarbeiter
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {FEATURES.map((feature) => (
                        <div
                          key={feature.key}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{feature.label}</p>
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                          </div>
                          <Switch
                            checked={formData.featureOverrides[feature.key] ?? true}
                            onCheckedChange={() => toggleFeature(feature.key)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Speichern..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
