// ============================================
// Admin Push Provisions Page
// Manage bonus provisions for tariffs
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useIdentity } from "@/contexts/IdentityContext";
import {
  useAllPushProvisions,
  useAdminPushProvisions,
  type PushProvision,
} from "@/margenkalkulator/hooks/usePushProvisions";
import {
  Sparkles,
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Lock,
  Target,
} from "lucide-react";
import { getCatalog } from "@/margenkalkulator/engine/catalogResolver";
import { DATASETS } from "@/margenkalkulator/config";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const EMPTY_FORM: Omit<PushProvision, "id" | "createdAt" | "createdBy" | "tenantId"> = {
  scopeType: "all",
  tariffId: "",
  bonusAmount: 10,
  bonusType: "fixed",
  validFrom: new Date().toISOString().split("T")[0],
  name: "",
  isActive: true,
};

export default function AdminPushProvisions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canAccessAdmin } = useIdentity();
  const { provisions, isLoading, refresh } = useAllPushProvisions();
  const { createProvision, updateProvision, deleteProvision, deactivateProvision } = useAdminPushProvisions();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Get tariff catalog
  const catalog = getCatalog(DATASETS.CURRENT);
  const allTariffs = catalog.mobileTariffs || [];

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEditDialog = (provision: PushProvision) => {
    setEditingId(provision.id);
    setFormData({
      scopeType: provision.scopeType,
      scopeId: provision.scopeId,
      tariffId: provision.tariffId,
      tariffFamily: provision.tariffFamily,
      contractType: provision.contractType,
      bonusAmount: provision.bonusAmount,
      bonusType: provision.bonusType,
      validFrom: provision.validFrom,
      validUntil: provision.validUntil,
      name: provision.name,
      description: provision.description,
      isActive: provision.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.tariffId) {
      toast({ title: "Fehler", description: "Name und Tarif sind erforderlich", variant: "destructive" });
      return;
    }

    try {
      setIsSaving(true);

      if (editingId) {
        await updateProvision(editingId, formData);
        toast({ title: "Aktualisiert", description: "Push-Provision gespeichert." });
      } else {
        await createProvision(formData);
        toast({ title: "Erstellt", description: "Neue Push-Provision angelegt." });
      }

      setIsDialogOpen(false);
      refresh();
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Speichern fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (provision: PushProvision) => {
    if (!window.confirm(`Push-Provision "${provision.name}" wirklich löschen?`)) {
      return;
    }

    try {
      await deleteProvision(provision.id);
      toast({ title: "Gelöscht", description: "Push-Provision entfernt." });
      refresh();
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Löschen fehlgeschlagen",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (provision: PushProvision) => {
    try {
      await updateProvision(provision.id, { isActive: !provision.isActive });
      toast({
        title: provision.isActive ? "Deaktiviert" : "Aktiviert",
        description: `Push-Provision ${provision.isActive ? "pausiert" : "aktiviert"}.`,
      });
      refresh();
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Aktualisierung fehlgeschlagen",
        variant: "destructive",
      });
    }
  };

  const isExpired = (provision: PushProvision) => {
    if (!provision.validUntil) return false;
    return new Date(provision.validUntil) < new Date();
  };

  const getStatusBadge = (provision: PushProvision) => {
    if (!provision.isActive) {
      return <Badge variant="secondary">Pausiert</Badge>;
    }
    if (isExpired(provision)) {
      return <Badge variant="outline">Abgelaufen</Badge>;
    }
    return <Badge className="bg-green-500">Aktiv</Badge>;
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
                <Sparkles className="w-6 h-6 text-primary" />
                Push-Provisionen
              </h1>
              <p className="text-muted-foreground">
                Bonus-Anreize für bestimmte Tarife und Zeiträume
              </p>
            </div>
          </div>

          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Neue Push-Provision
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : provisions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Noch keine Push-Provisionen erstellt</p>
              <Button onClick={openCreateDialog} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Erste Push-Provision erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {provisions.map((provision) => (
              <Card
                key={provision.id}
                className={`transition-colors ${!provision.isActive ? "opacity-60" : ""}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{provision.name}</h3>
                        {getStatusBadge(provision)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {allTariffs.find((t) => t.id === provision.tariffId)?.name ||
                              provision.tariffId}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-green-600">
                            +{provision.bonusAmount}
                            {provision.bonusType === "percent" ? "%" : "€"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {provision.scopeType === "all"
                              ? "Alle Mitarbeiter"
                              : provision.scopeType === "team"
                              ? "Team"
                              : "Einzelperson"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(provision.validFrom), "dd.MM.yyyy", { locale: de })}
                            {provision.validUntil && (
                              <>
                                {" – "}
                                {format(new Date(provision.validUntil), "dd.MM.yyyy", { locale: de })}
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {provision.description && (
                        <p className="text-sm text-muted-foreground mt-2">{provision.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={provision.isActive}
                        onCheckedChange={() => handleToggleActive(provision)}
                      />
                      <Button variant="outline" size="icon" onClick={() => openEditDialog(provision)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(provision)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {editingId ? "Push-Provision bearbeiten" : "Neue Push-Provision"}
              </DialogTitle>
              <DialogDescription>
                Bonus-Anreiz für einen bestimmten Tarif
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Prime XL Push Juli"
                />
              </div>

              <div className="space-y-2">
                <Label>Tarif *</Label>
                <Select
                  value={formData.tariffId}
                  onValueChange={(v) => setFormData({ ...formData, tariffId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tarif wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTariffs.map((tariff) => (
                      <SelectItem key={tariff.id} value={tariff.id}>
                        {tariff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bonus</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.bonusAmount}
                    onChange={(e) => setFormData({ ...formData, bonusAmount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Typ</Label>
                  <Select
                    value={formData.bonusType}
                    onValueChange={(v) => setFormData({ ...formData, bonusType: v as "fixed" | "percent" })}
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

              <div className="space-y-2">
                <Label>Gilt für</Label>
                <Select
                  value={formData.scopeType}
                  onValueChange={(v) => setFormData({ ...formData, scopeType: v as "all" | "user" | "team" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                    <SelectItem value="team">Bestimmtes Team</SelectItem>
                    <SelectItem value="user">Einzelne Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gültig ab</Label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gültig bis (optional)</Label>
                  <Input
                    type="date"
                    value={formData.validUntil || ""}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Beschreibung (optional)</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Interne Notiz zur Aktion..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Aktiv</p>
                  <p className="text-xs text-muted-foreground">Mitarbeiter sehen diesen Bonus</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                />
              </div>
            </div>

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
