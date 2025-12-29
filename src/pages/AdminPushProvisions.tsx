// ============================================
// Admin Push Provisions Page
// Manage bonus provisions for tariffs
// Extended with target types and conditions
// ============================================

import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useIdentity } from "@/contexts/IdentityContext";
import {
  useAllPushProvisions,
  useAdminPushProvisions,
  usePushTariffGroups,
  type PushProvision,
  type PushProvisionConditions,
  type PushTariffGroup,
} from "@/margenkalkulator/hooks/usePushProvisions";
import {
  Sparkles,
  ChevronLeft,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Lock,
  Target,
  Package,
  Layers,
  Filter,
  Settings2,
  FolderPlus,
  Smartphone,
  Router,
  Wifi,
} from "lucide-react";
import { getCatalog } from "@/margenkalkulator/engine/catalogResolver";
import { DATASETS } from "@/margenkalkulator/config";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Target type options
const TARGET_TYPES = [
  { value: "tariff", label: "Einzelner Tarif", icon: Target },
  { value: "family", label: "Tarif-Familie", icon: Layers },
  { value: "pattern", label: "Pattern (Regex)", icon: Filter },
  { value: "group", label: "Tarif-Gruppe", icon: Package },
  { value: "all", label: "Alle Tarife", icon: Sparkles },
] as const;

const EMPTY_FORM: Omit<PushProvision, "id" | "createdAt" | "createdBy" | "tenantId"> = {
  scopeType: "all",
  tariffId: "",
  tariffFamily: undefined,
  bonusAmount: 10,
  bonusType: "fixed",
  validFrom: new Date().toISOString().split("T")[0],
  name: "",
  isActive: true,
  targetType: "tariff",
  conditions: {},
};

const EMPTY_GROUP: Omit<PushTariffGroup, "id" | "tenantId" | "createdBy" | "createdAt" | "updatedAt"> = {
  name: "",
  description: "",
  matchPattern: "",
  tariffIds: [],
  isActive: true,
};

export default function AdminPushProvisions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canAccessAdmin } = useIdentity();
  const { provisions, isLoading, refresh } = useAllPushProvisions();
  const { createProvision, updateProvision, deleteProvision } = useAdminPushProvisions();
  const { groups, isLoading: isLoadingGroups, createGroup, updateGroup, deleteGroup, refresh: refreshGroups } = usePushTariffGroups();

  const [activeTab, setActiveTab] = useState<"provisions" | "groups">("provisions");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [groupFormData, setGroupFormData] = useState(EMPTY_GROUP);
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(false);

  // Get tariff catalog
  const catalog = getCatalog(DATASETS.CURRENT);
  const allTariffs = catalog.mobileTariffs || [];
  const tariffFamilies = useMemo(() => {
    const families = new Set<string>();
    allTariffs.forEach(t => {
      if (t.family) families.add(t.family);
    });
    return Array.from(families).sort();
  }, [allTariffs]);

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setConditionsOpen(false);
    setBundleOpen(false);
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
      targetType: provision.targetType,
      conditions: provision.conditions || {},
    });
    setConditionsOpen(Object.keys(provision.conditions || {}).length > 0);
    setBundleOpen(!!provision.conditions?.bundleRequirements);
    setIsDialogOpen(true);
  };

  const openCreateGroupDialog = () => {
    setEditingGroupId(null);
    setGroupFormData(EMPTY_GROUP);
    setIsGroupDialogOpen(true);
  };

  const openEditGroupDialog = (group: PushTariffGroup) => {
    setEditingGroupId(group.id);
    setGroupFormData({
      name: group.name,
      description: group.description,
      matchPattern: group.matchPattern,
      tariffIds: group.tariffIds,
      isActive: group.isActive,
    });
    setIsGroupDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "Fehler", description: "Name ist erforderlich", variant: "destructive" });
      return;
    }

    // Validate based on target type
    if (formData.targetType === "tariff" && !formData.tariffId) {
      toast({ title: "Fehler", description: "Tarif ist erforderlich", variant: "destructive" });
      return;
    }
    if (formData.targetType === "family" && !formData.tariffFamily) {
      toast({ title: "Fehler", description: "Tarif-Familie ist erforderlich", variant: "destructive" });
      return;
    }
    if (formData.targetType === "pattern" && !formData.tariffId) {
      toast({ title: "Fehler", description: "Pattern ist erforderlich", variant: "destructive" });
      return;
    }
    if (formData.targetType === "group" && !formData.tariffId) {
      toast({ title: "Fehler", description: "Tarif-Gruppe ist erforderlich", variant: "destructive" });
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

  const handleSaveGroup = async () => {
    if (!groupFormData.name) {
      toast({ title: "Fehler", description: "Name ist erforderlich", variant: "destructive" });
      return;
    }

    try {
      setIsSaving(true);

      if (editingGroupId) {
        await updateGroup(editingGroupId, groupFormData);
        toast({ title: "Aktualisiert", description: "Tarif-Gruppe gespeichert." });
      } else {
        await createGroup(groupFormData);
        toast({ title: "Erstellt", description: "Neue Tarif-Gruppe angelegt." });
      }

      setIsGroupDialogOpen(false);
      refreshGroups();
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

  const handleDeleteGroup = async (group: PushTariffGroup) => {
    if (!window.confirm(`Tarif-Gruppe "${group.name}" wirklich löschen?`)) {
      return;
    }

    try {
      await deleteGroup(group.id);
      toast({ title: "Gelöscht", description: "Tarif-Gruppe entfernt." });
      refreshGroups();
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

  const updateConditions = (updates: Partial<PushProvisionConditions>) => {
    setFormData({
      ...formData,
      conditions: { ...formData.conditions, ...updates },
    });
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

  const getTargetLabel = (provision: PushProvision) => {
    switch (provision.targetType) {
      case "all":
        return "Alle Tarife";
      case "family":
        return `Familie: ${provision.tariffFamily}`;
      case "pattern":
        return `Pattern: ${provision.tariffId}`;
      case "group":
        const group = groups.find(g => g.id === provision.tariffId);
        return `Gruppe: ${group?.name || provision.tariffId}`;
      default:
        const tariff = allTariffs.find(t => t.id === provision.tariffId);
        return tariff?.name || provision.tariffId;
    }
  };

  const getConditionsSummary = (conditions: PushProvisionConditions) => {
    const parts: string[] = [];
    if (conditions.requireHardware) parts.push("Mit Hardware");
    if (conditions.requireFixedNet) parts.push("Mit Festnetz");
    if (conditions.requireGigaKombi) parts.push("GigaKombi");
    if (conditions.minQuantity) parts.push(`Min. ${conditions.minQuantity} Verträge`);
    if (conditions.bundleRequirements) parts.push("Bundle-Bonus");
    return parts.length > 0 ? parts.join(", ") : null;
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
                Bonus-Anreize für Tarife mit erweiterten Bedingungen
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "provisions" | "groups")}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="provisions" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Push-Provisionen
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2">
                <Package className="w-4 h-4" />
                Tarif-Gruppen
              </TabsTrigger>
            </TabsList>

            {activeTab === "provisions" ? (
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Neue Push-Provision
              </Button>
            ) : (
              <Button onClick={openCreateGroupDialog} className="gap-2">
                <FolderPlus className="w-4 h-4" />
                Neue Tarif-Gruppe
              </Button>
            )}
          </div>

          {/* Provisions Tab */}
          <TabsContent value="provisions">
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
                {provisions.map((provision) => {
                  const conditionsSummary = getConditionsSummary(provision.conditions);
                  return (
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
                              <Badge variant="outline" className="gap-1">
                                {TARGET_TYPES.find(t => t.value === provision.targetType)?.label || "Tarif"}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-muted-foreground" />
                                <span>{getTargetLabel(provision)}</span>
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

                            {conditionsSummary && (
                              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <Filter className="w-4 h-4" />
                                <span>{conditionsSummary}</span>
                              </div>
                            )}

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
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups">
            {isLoadingGroups ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Noch keine Tarif-Gruppen erstellt</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tarif-Gruppen ermöglichen es, mehrere Tarife zusammenzufassen
                  </p>
                  <Button onClick={openCreateGroupDialog} className="mt-4 gap-2">
                    <FolderPlus className="w-4 h-4" />
                    Erste Tarif-Gruppe erstellen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {groups.map((group) => (
                  <Card key={group.id} className={!group.isActive ? "opacity-60" : ""}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{group.name}</h3>
                            <Badge variant={group.isActive ? "default" : "secondary"}>
                              {group.isActive ? "Aktiv" : "Inaktiv"}
                            </Badge>
                          </div>
                          
                          {group.description && (
                            <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 text-sm">
                            {group.matchPattern && (
                              <Badge variant="outline" className="gap-1">
                                <Filter className="w-3 h-3" />
                                Pattern: {group.matchPattern}
                              </Badge>
                            )}
                            {group.tariffIds.length > 0 && (
                              <Badge variant="outline">
                                {group.tariffIds.length} Tarif(e)
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="icon" onClick={() => openEditGroupDialog(group)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteGroup(group)}
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
          </TabsContent>
        </Tabs>

        {/* Create/Edit Provision Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {editingId ? "Push-Provision bearbeiten" : "Neue Push-Provision"}
              </DialogTitle>
              <DialogDescription>
                Bonus-Anreiz für Tarife mit optionalen Bedingungen
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Prime XL Push Juli"
                  />
                </div>

                {/* Target Type Selection */}
                <div className="space-y-2">
                  <Label>Ziel-Tarife</Label>
                  <Select
                    value={formData.targetType}
                    onValueChange={(v) => setFormData({ 
                      ...formData, 
                      targetType: v as PushProvision["targetType"],
                      tariffId: "",
                      tariffFamily: undefined,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional Target Selection */}
                {formData.targetType === "tariff" && (
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
                )}

                {formData.targetType === "family" && (
                  <div className="space-y-2">
                    <Label>Tarif-Familie *</Label>
                    <Select
                      value={formData.tariffFamily || ""}
                      onValueChange={(v) => setFormData({ ...formData, tariffFamily: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Familie wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {tariffFamilies.map((family) => (
                          <SelectItem key={family} value={family}>
                            {family}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.targetType === "pattern" && (
                  <div className="space-y-2">
                    <Label>Regex-Pattern *</Label>
                    <Input
                      value={formData.tariffId}
                      onChange={(e) => setFormData({ ...formData, tariffId: e.target.value })}
                      placeholder="z.B. ^PRIME_"
                    />
                    <p className="text-xs text-muted-foreground">
                      Regulärer Ausdruck zum Matchen von Tarif-IDs
                    </p>
                  </div>
                )}

                {formData.targetType === "group" && (
                  <div className="space-y-2">
                    <Label>Tarif-Gruppe *</Label>
                    <Select
                      value={formData.tariffId}
                      onValueChange={(v) => setFormData({ ...formData, tariffId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Gruppe wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.filter(g => g.isActive).map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {groups.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Keine Tarif-Gruppen vorhanden. Erstellen Sie zuerst eine Gruppe.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Bonus Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bonus-Betrag</Label>
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

              {/* Scope */}
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

              {/* Validity Period */}
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

              <Separator />

              {/* Conditions Section */}
              <Collapsible open={conditionsOpen} onOpenChange={setConditionsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Bedingungen
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${conditionsOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Nur mit Hardware</p>
                          <p className="text-xs text-muted-foreground">Nicht bei SIM-Only</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={formData.conditions.requireHardware || false}
                        onCheckedChange={(v) => updateConditions({ requireHardware: v === true })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Router className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Nur mit Festnetz</p>
                          <p className="text-xs text-muted-foreground">Festnetz muss aktiviert sein</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={formData.conditions.requireFixedNet || false}
                        onCheckedChange={(v) => updateConditions({ requireFixedNet: v === true })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Nur bei GigaKombi</p>
                          <p className="text-xs text-muted-foreground">Mobilfunk + Festnetz + Prime</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={formData.conditions.requireGigaKombi || false}
                        onCheckedChange={(v) => updateConditions({ requireGigaKombi: v === true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Mindestmenge (Verträge)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.conditions.minQuantity || ""}
                        onChange={(e) => updateConditions({ 
                          minQuantity: e.target.value ? Number(e.target.value) : undefined 
                        })}
                        placeholder="z.B. 3"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Bundle Bonus Section */}
              <Collapsible open={bundleOpen} onOpenChange={setBundleOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Bundle-Bonus (Vollausstattung)
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${bundleOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Bonus nur wenn der Kunde mehrere Produktkategorien kauft
                  </p>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.conditions.bundleRequirements?.requireMobile !== false}
                        onCheckedChange={(v) => updateConditions({
                          bundleRequirements: {
                            ...formData.conditions.bundleRequirements,
                            requireMobile: v === true,
                          }
                        })}
                      />
                      <Label className="font-normal">Mobilfunk erforderlich</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.conditions.bundleRequirements?.requireFixedNet || false}
                        onCheckedChange={(v) => updateConditions({
                          bundleRequirements: {
                            ...formData.conditions.bundleRequirements,
                            requireFixedNet: v === true,
                          }
                        })}
                      />
                      <Label className="font-normal">Festnetz erforderlich</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.conditions.bundleRequirements?.requireHardware || false}
                        onCheckedChange={(v) => updateConditions({
                          bundleRequirements: {
                            ...formData.conditions.bundleRequirements,
                            requireHardware: v === true,
                          }
                        })}
                      />
                      <Label className="font-normal">Hardware erforderlich</Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <Label>Beschreibung (optional)</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Interne Notiz zur Aktion..."
                  rows={2}
                />
              </div>

              {/* Active Toggle */}
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

        {/* Create/Edit Group Dialog */}
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {editingGroupId ? "Tarif-Gruppe bearbeiten" : "Neue Tarif-Gruppe"}
              </DialogTitle>
              <DialogDescription>
                Fassen Sie mehrere Tarife zu einer Gruppe zusammen
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  placeholder="z.B. Alle Prime-Tarife"
                />
              </div>

              <div className="space-y-2">
                <Label>Beschreibung (optional)</Label>
                <Input
                  value={groupFormData.description || ""}
                  onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                  placeholder="Kurze Beschreibung der Gruppe"
                />
              </div>

              <div className="space-y-2">
                <Label>Match-Pattern (Regex)</Label>
                <Input
                  value={groupFormData.matchPattern || ""}
                  onChange={(e) => setGroupFormData({ ...groupFormData, matchPattern: e.target.value })}
                  placeholder="z.B. ^PRIME_"
                />
                <p className="text-xs text-muted-foreground">
                  Tarife, deren ID diesem Pattern entspricht, gehören zur Gruppe
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tarife (manuell)</Label>
                <Select
                  value=""
                  onValueChange={(v) => {
                    if (v && !groupFormData.tariffIds.includes(v)) {
                      setGroupFormData({
                        ...groupFormData,
                        tariffIds: [...groupFormData.tariffIds, v],
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tarif hinzufügen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allTariffs
                      .filter(t => !groupFormData.tariffIds.includes(t.id))
                      .map((tariff) => (
                        <SelectItem key={tariff.id} value={tariff.id}>
                          {tariff.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {groupFormData.tariffIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {groupFormData.tariffIds.map((id) => {
                      const tariff = allTariffs.find(t => t.id === id);
                      return (
                        <Badge key={id} variant="secondary" className="gap-1">
                          {tariff?.name || id}
                          <button
                            type="button"
                            className="ml-1 hover:text-destructive"
                            onClick={() => setGroupFormData({
                              ...groupFormData,
                              tariffIds: groupFormData.tariffIds.filter(t => t !== id),
                            })}
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Aktiv</p>
                  <p className="text-xs text-muted-foreground">Gruppe kann in Push-Provisionen verwendet werden</p>
                </div>
                <Switch
                  checked={groupFormData.isActive}
                  onCheckedChange={(v) => setGroupFormData({ ...groupFormData, isActive: v })}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveGroup} disabled={isSaving}>
                {isSaving ? "Speichern..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
