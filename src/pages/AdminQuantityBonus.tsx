// ============================================
// Admin: Quantity Bonus Tiers
// ============================================
//
// Verwaltung der gestaffelten Cross-Selling Boni
// Admins können hier Stufen erstellen, bearbeiten, aktivieren/deaktivieren
//
// ============================================

import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  Sparkles, 
  Plus, 
  Pencil, 
  Trash2, 
  Users, 
  User, 
  Globe,
  TrendingUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useQuantityBonus, DEFAULT_QUANTITY_BONUS_TIERS, type QuantityBonusTier } from "@/margenkalkulator/hooks/useQuantityBonus";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TierFormData {
  name: string;
  minQuantity: number;
  bonusPerContract: number;
  scopeType: "all" | "user" | "team";
  scopeId?: string;
  description?: string;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
}

const DEFAULT_FORM: TierFormData = {
  name: "",
  minQuantity: 3,
  bonusPerContract: 5,
  scopeType: "all",
  description: "",
  validFrom: new Date().toISOString().split('T')[0],
  isActive: true,
};

export default function AdminQuantityBonus() {
  const { user } = useAuth();
  const { tiers, isLoading, refetch } = useQuantityBonus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<QuantityBonusTier | null>(null);
  const [formData, setFormData] = useState<TierFormData>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Use real tiers if available, otherwise show defaults for demo
  const displayTiers = tiers.length > 0 ? tiers : DEFAULT_QUANTITY_BONUS_TIERS.map((t, i) => ({
    ...t,
    id: `demo-${i}`,
    tenantId: "demo",
  }));

  const handleOpenCreate = () => {
    setEditingTier(null);
    setFormData(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const handleOpenEdit = (tier: QuantityBonusTier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      minQuantity: tier.minQuantity,
      bonusPerContract: tier.bonusPerContract,
      scopeType: tier.scopeType,
      scopeId: tier.scopeId,
      description: tier.description,
      validFrom: tier.validFrom,
      validUntil: tier.validUntil,
      isActive: tier.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Nicht authentifiziert");
      return;
    }

    if (!formData.name || formData.minQuantity < 2 || formData.bonusPerContract <= 0) {
      toast.error("Bitte alle Pflichtfelder ausfüllen");
      return;
    }

    setIsSaving(true);
    try {
      // Get tenant_id from seat_assignments
      const { data: seatData } = await supabase
        .from("seat_assignments")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!seatData?.tenant_id) {
        toast.error("Kein Tenant gefunden");
        return;
      }

      const tierData = {
        tenant_id: seatData.tenant_id,
        name: formData.name,
        min_quantity: formData.minQuantity,
        bonus_per_contract: formData.bonusPerContract,
        scope_type: formData.scopeType,
        scope_id: formData.scopeId || null,
        description: formData.description || null,
        valid_from: formData.validFrom,
        valid_until: formData.validUntil || null,
        is_active: formData.isActive,
        created_by: user.id,
      };

      if (editingTier && !editingTier.id.startsWith("demo-")) {
        const { error } = await supabase
          .from("quantity_bonus_tiers")
          .update(tierData)
          .eq("id", editingTier.id);

        if (error) throw error;
        toast.success("Bonus-Stufe aktualisiert");
      } else {
        const { error } = await supabase
          .from("quantity_bonus_tiers")
          .insert(tierData);

        if (error) throw error;
        toast.success("Bonus-Stufe erstellt");
      }

      setDialogOpen(false);
      refetch();
    } catch (err) {
      console.error("Error saving tier:", err);
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tier: QuantityBonusTier) => {
    if (tier.id.startsWith("demo-")) {
      toast.info("Demo-Daten können nicht gelöscht werden");
      return;
    }

    if (!confirm(`"${tier.name}" wirklich löschen?`)) return;

    try {
      const { error } = await supabase
        .from("quantity_bonus_tiers")
        .delete()
        .eq("id", tier.id);

      if (error) throw error;
      toast.success("Bonus-Stufe gelöscht");
      refetch();
    } catch (err) {
      console.error("Error deleting tier:", err);
      toast.error("Fehler beim Löschen");
    }
  };

  const handleToggleActive = async (tier: QuantityBonusTier) => {
    if (tier.id.startsWith("demo-")) {
      toast.info("Demo-Daten können nicht geändert werden");
      return;
    }

    try {
      const { error } = await supabase
        .from("quantity_bonus_tiers")
        .update({ is_active: !tier.isActive })
        .eq("id", tier.id);

      if (error) throw error;
      toast.success(tier.isActive ? "Bonus-Stufe deaktiviert" : "Bonus-Stufe aktiviert");
      refetch();
    } catch (err) {
      console.error("Error toggling tier:", err);
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const getScopeIcon = (scopeType: string) => {
    switch (scopeType) {
      case "all": return <Globe className="w-4 h-4" />;
      case "team": return <Users className="w-4 h-4" />;
      case "user": return <User className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getScopeLabel = (scopeType: string) => {
    switch (scopeType) {
      case "all": return "Alle Mitarbeiter";
      case "team": return "Team";
      case "user": return "Einzelperson";
      default: return scopeType;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Quantity-Boni (Cross-Selling)
            </h1>
            <p className="text-muted-foreground">
              Gestaffelte On-Top Provisionen für Mehrfachabschlüsse
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                Neue Stufe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTier ? "Bonus-Stufe bearbeiten" : "Neue Bonus-Stufe"}
                </DialogTitle>
                <DialogDescription>
                  Definiere eine Staffelung für Cross-Selling Boni
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Cross-Sell Bronze"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minQuantity">Ab Anzahl Verträge *</Label>
                    <Input
                      id="minQuantity"
                      type="number"
                      min={2}
                      value={formData.minQuantity}
                      onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bonusPerContract">Bonus pro Vertrag (€) *</Label>
                    <Input
                      id="bonusPerContract"
                      type="number"
                      min={0}
                      step={0.5}
                      value={formData.bonusPerContract}
                      onChange={(e) => setFormData({ ...formData, bonusPerContract: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scopeType">Gültig für</Label>
                  <Select
                    value={formData.scopeType}
                    onValueChange={(value: "all" | "user" | "team") => 
                      setFormData({ ...formData, scopeType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                      <SelectItem value="team">Bestimmtes Team</SelectItem>
                      <SelectItem value="user">Einzelperson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Gültig ab</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Gültig bis (optional)</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil || ""}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value || undefined })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Aktiv</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Speichern..." : "Speichern"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  So funktioniert der Quantity-Bonus
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  Wenn ein Mitarbeiter mehrere Verträge für einen Kunden abschließt, erhält er 
                  automatisch einen On-Top Bonus pro Vertrag. Die höchste zutreffende Stufe wird angewendet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tiers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Bonus-Stufen
            </CardTitle>
            <CardDescription>
              {tiers.length === 0 && "Demo-Daten werden angezeigt. Erstelle eigene Stufen."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Ab Verträge</TableHead>
                  <TableHead className="text-right">Bonus/Vertrag</TableHead>
                  <TableHead>Gültig für</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTiers.map((tier) => (
                  <TableRow key={tier.id} className={!tier.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {tier.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{tier.minQuantity}+</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-600">
                      +{tier.bonusPerContract.toFixed(2)} €
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getScopeIcon(tier.scopeType)}
                        <span className="text-sm text-muted-foreground">
                          {getScopeLabel(tier.scopeType)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={tier.isActive}
                        onCheckedChange={() => handleToggleActive(tier as QuantityBonusTier)}
                        disabled={tier.id.startsWith("demo-")}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(tier as QuantityBonusTier)}
                          disabled={tier.id.startsWith("demo-")}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tier as QuantityBonusTier)}
                          disabled={tier.id.startsWith("demo-")}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Example Calculation */}
        <Card>
          <CardHeader>
            <CardTitle>Beispielrechnung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">3 Verträge</p>
                <p className="text-sm text-muted-foreground">Bronze-Stufe</p>
                <p className="text-lg font-semibold text-emerald-600 mt-2">
                  +15,00 € On-Top
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">5 Verträge</p>
                <p className="text-sm text-muted-foreground">Silber-Stufe</p>
                <p className="text-lg font-semibold text-emerald-600 mt-2">
                  +50,00 € On-Top
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">10 Verträge</p>
                <p className="text-sm text-muted-foreground">Gold-Stufe</p>
                <p className="text-lg font-semibold text-emerald-600 mt-2">
                  +150,00 € On-Top
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
