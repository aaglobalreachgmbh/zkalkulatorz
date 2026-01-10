// ============================================
// Admin: Quantity Bonus (Stacked On-Top Bonuses)
// ============================================
//
// Verwaltung der gestaffelten On-Top Boni pro Position
// UND regelbasierter Zusatzboni (z.B. "50+ Verträge im Monat")
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Trophy,
  Target,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useQuantityBonus, DEFAULT_POSITION_BONUSES, type PositionBonus } from "@/margenkalkulator/hooks/useQuantityBonus";
import { useBonusRules, type BonusRule, getRuleDescription } from "@/margenkalkulator/hooks/useBonusRules";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ============================================
// Types
// ============================================

interface PositionFormData {
  name: string;
  positionNumber: number;
  positionBonus: number;
  scopeType: "all" | "user" | "team";
  scopeId?: string;
  description?: string;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
}

interface RuleFormData {
  name: string;
  description?: string;
  ruleType: "monthly_threshold" | "quarterly_threshold" | "special_period";
  conditionField: string;
  conditionOperator: "gte" | "lte" | "eq" | "between";
  conditionValue: number;
  conditionValueMax?: number;
  bonusType: "fixed" | "percentage" | "multiplier";
  bonusValue: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  scopeType: "all" | "team" | "user";
  priority: number;
}

const DEFAULT_POSITION_FORM: PositionFormData = {
  name: "",
  positionNumber: 1,
  positionBonus: 50,
  scopeType: "all",
  description: "",
  validFrom: new Date().toISOString().split('T')[0],
  isActive: true,
};

const DEFAULT_RULE_FORM: RuleFormData = {
  name: "",
  description: "",
  ruleType: "monthly_threshold",
  conditionField: "contracts_submitted",
  conditionOperator: "gte",
  conditionValue: 50,
  bonusType: "fixed",
  bonusValue: 100,
  validFrom: new Date().toISOString().split('T')[0],
  isActive: true,
  scopeType: "all",
  priority: 0,
};

// ============================================
// Component
// ============================================

export default function AdminQuantityBonus() {
  const { user } = useAuth();
  const { tiers, isLoading, refetch: refetchTiers, calculateStackedBonus } = useQuantityBonus();
  const { rules, isLoading: rulesLoading, refetch: refetchRules, createRule, updateRule, deleteRule, toggleRuleActive } = useBonusRules();
  
  // Position dialog state
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionBonus | null>(null);
  const [positionForm, setPositionForm] = useState<PositionFormData>(DEFAULT_POSITION_FORM);
  
  // Rule dialog state
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BonusRule | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleFormData>(DEFAULT_RULE_FORM);
  
  const [isSaving, setIsSaving] = useState(false);

  // Use real tiers or defaults for demo
  const displayTiers = tiers.length > 0 ? tiers : DEFAULT_POSITION_BONUSES.map((t, i) => ({
    ...t,
    id: `demo-${i}`,
    tenantId: "demo",
  }));

  // Calculate example stacked bonus
  const exampleBonus3 = calculateStackedBonus(3);
  const exampleBonus5 = calculateStackedBonus(5);

  // ============================================
  // Position Handlers
  // ============================================

  const handleOpenCreatePosition = () => {
    const nextPosition = displayTiers.length > 0 
      ? Math.max(...displayTiers.map(t => t.positionNumber)) + 1 
      : 1;
    setEditingPosition(null);
    setPositionForm({ ...DEFAULT_POSITION_FORM, positionNumber: nextPosition });
    setPositionDialogOpen(true);
  };

  const handleOpenEditPosition = (tier: PositionBonus) => {
    setEditingPosition(tier);
    setPositionForm({
      name: tier.name,
      positionNumber: tier.positionNumber,
      positionBonus: tier.positionBonus,
      scopeType: tier.scopeType,
      scopeId: tier.scopeId,
      description: tier.description,
      validFrom: tier.validFrom,
      validUntil: tier.validUntil,
      isActive: tier.isActive,
    });
    setPositionDialogOpen(true);
  };

  const handleSavePosition = async () => {
    if (!user) {
      toast.error("Nicht authentifiziert");
      return;
    }

    if (!positionForm.name || positionForm.positionNumber < 1 || positionForm.positionBonus <= 0) {
      toast.error("Bitte alle Pflichtfelder ausfüllen");
      return;
    }

    setIsSaving(true);
    try {
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
        name: positionForm.name,
        position_number: positionForm.positionNumber,
        min_quantity: positionForm.positionNumber, // Legacy compatibility
        bonus_per_contract: positionForm.positionBonus,
        scope_type: positionForm.scopeType,
        scope_id: positionForm.scopeId || null,
        description: positionForm.description || null,
        valid_from: positionForm.validFrom,
        valid_until: positionForm.validUntil || null,
        is_active: positionForm.isActive,
        created_by: user.id,
      };

      if (editingPosition && !editingPosition.id.startsWith("demo-")) {
        const { error } = await supabase
          .from("quantity_bonus_tiers")
          .update(tierData)
          .eq("id", editingPosition.id);

        if (error) throw error;
        toast.success("Position aktualisiert");
      } else {
        const { error } = await supabase
          .from("quantity_bonus_tiers")
          .insert(tierData);

        if (error) throw error;
        toast.success("Position erstellt");
      }

      setPositionDialogOpen(false);
      refetchTiers();
    } catch (err) {
      console.error("Error saving position:", err);
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePosition = async (tier: PositionBonus) => {
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
      toast.success("Position gelöscht");
      refetchTiers();
    } catch (err) {
      console.error("Error deleting position:", err);
      toast.error("Fehler beim Löschen");
    }
  };

  const handleTogglePositionActive = async (tier: PositionBonus) => {
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
      toast.success(tier.isActive ? "Deaktiviert" : "Aktiviert");
      refetchTiers();
    } catch (err) {
      console.error("Error toggling position:", err);
      toast.error("Fehler beim Aktualisieren");
    }
  };

  // ============================================
  // Rule Handlers
  // ============================================

  const handleOpenCreateRule = () => {
    setEditingRule(null);
    setRuleForm(DEFAULT_RULE_FORM);
    setRuleDialogOpen(true);
  };

  const handleOpenEditRule = (rule: BonusRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType as "monthly_threshold" | "quarterly_threshold" | "special_period",
      conditionField: rule.conditionField,
      conditionOperator: rule.conditionOperator,
      conditionValue: rule.conditionValue,
      conditionValueMax: rule.conditionValueMax,
      bonusType: rule.bonusType,
      bonusValue: rule.bonusValue,
      validFrom: rule.validFrom,
      validUntil: rule.validUntil,
      isActive: rule.isActive,
      scopeType: rule.scopeType,
      priority: rule.priority,
    });
    setRuleDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!user) {
      toast.error("Nicht authentifiziert");
      return;
    }

    if (!ruleForm.name || ruleForm.conditionValue < 0 || ruleForm.bonusValue <= 0) {
      toast.error("Bitte alle Pflichtfelder ausfüllen");
      return;
    }

    setIsSaving(true);
    try {
      const { data: seatData } = await supabase
        .from("seat_assignments")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      const tenantId = seatData?.tenant_id || "";

      if (editingRule) {
        const success = await updateRule(editingRule.id, {
          name: ruleForm.name,
          description: ruleForm.description,
          ruleType: ruleForm.ruleType,
          conditionField: ruleForm.conditionField,
          conditionOperator: ruleForm.conditionOperator,
          conditionValue: ruleForm.conditionValue,
          conditionValueMax: ruleForm.conditionValueMax,
          bonusType: ruleForm.bonusType,
          bonusValue: ruleForm.bonusValue,
          validFrom: ruleForm.validFrom,
          validUntil: ruleForm.validUntil,
          isActive: ruleForm.isActive,
          scopeType: ruleForm.scopeType,
          priority: ruleForm.priority,
        });

        if (success) {
          toast.success("Regel aktualisiert");
          setRuleDialogOpen(false);
        } else {
          toast.error("Fehler beim Aktualisieren");
        }
      } else {
        const newRule = await createRule({
          tenantId,
          name: ruleForm.name,
          description: ruleForm.description,
          ruleType: ruleForm.ruleType,
          conditionField: ruleForm.conditionField,
          conditionOperator: ruleForm.conditionOperator,
          conditionValue: ruleForm.conditionValue,
          conditionValueMax: ruleForm.conditionValueMax,
          bonusType: ruleForm.bonusType,
          bonusValue: ruleForm.bonusValue,
          validFrom: ruleForm.validFrom,
          validUntil: ruleForm.validUntil,
          isActive: ruleForm.isActive,
          scopeType: ruleForm.scopeType,
          isStackable: true,
          priority: ruleForm.priority,
          createdBy: user.id,
        });

        if (newRule) {
          toast.success("Regel erstellt");
          setRuleDialogOpen(false);
        } else {
          toast.error("Fehler beim Erstellen");
        }
      }
    } catch (err) {
      console.error("Error saving rule:", err);
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (rule: BonusRule) => {
    if (!confirm(`"${rule.name}" wirklich löschen?`)) return;

    const success = await deleteRule(rule.id);
    if (success) {
      toast.success("Regel gelöscht");
    } else {
      toast.error("Fehler beim Löschen");
    }
  };

  const handleToggleRuleActive = async (rule: BonusRule) => {
    const success = await toggleRuleActive(rule.id, !rule.isActive);
    if (success) {
      toast.success(rule.isActive ? "Deaktiviert" : "Aktiviert");
    } else {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  // ============================================
  // Helpers
  // ============================================

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
      case "all": return "Alle";
      case "team": return "Team";
      case "user": return "Einzelperson";
      default: return scopeType;
    }
  };

  const getRuleTypeIcon = (ruleType: string) => {
    switch (ruleType) {
      case "monthly_threshold": return <Target className="w-4 h-4" />;
      case "quarterly_threshold": return <Trophy className="w-4 h-4" />;
      case "special_period": return <Zap className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getRuleTypeLabel = (ruleType: string) => {
    switch (ruleType) {
      case "monthly_threshold": return "Monatsziel";
      case "quarterly_threshold": return "Quartalsziel";
      case "special_period": return "Aktionszeitraum";
      default: return ruleType;
    }
  };

  const getBonusTypeLabel = (bonusType: string) => {
    switch (bonusType) {
      case "fixed": return "Festbetrag";
      case "percentage": return "Prozent";
      case "multiplier": return "Multiplikator";
      default: return bonusType;
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              On-Top Boni
            </h1>
            <p className="text-muted-foreground">
              Gestaffelte Positions-Boni & regelbasierte Zusatzboni
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  So funktioniert das On-Top Bonus System
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  <strong>Positions-Boni:</strong> Jeder Tarif im Angebot erhält einen individuellen On-Top Bonus 
                  (z.B. 1. Tarif +50€, 2. Tarif +70€, 3. Tarif +80€ = <strong>200€ gesamt</strong>)
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  <strong>Bonus-Regeln:</strong> Zusätzliche Boni bei Erreichen von Zielen 
                  (z.B. "50+ Verträge im Monat → +100€ Extra")
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="positions" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="positions" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Positions-Boni
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <Trophy className="w-4 h-4" />
              Bonus-Regeln
            </TabsTrigger>
          </TabsList>

          {/* Tab: Positions-Boni */}
          <TabsContent value="positions" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Gestaffelte On-Top Boni
                  </CardTitle>
                  <CardDescription>
                    Bonus pro Position im Angebot (1. Tarif, 2. Tarif, etc.)
                  </CardDescription>
                </div>
                <Button onClick={handleOpenCreatePosition} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Neue Position
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Position</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">On-Top Bonus</TableHead>
                      <TableHead>Gültig für</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayTiers.sort((a, b) => a.positionNumber - b.positionNumber).map((tier) => (
                      <TableRow key={tier.id} className={!tier.isActive ? "opacity-50" : ""}>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {tier.positionNumber}.
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            {tier.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-600 font-semibold">
                          +{tier.positionBonus.toFixed(2)} €
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
                            onCheckedChange={() => handleTogglePositionActive(tier)}
                            disabled={tier.id.startsWith("demo-")}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditPosition(tier)}
                              disabled={tier.id.startsWith("demo-")}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePosition(tier)}
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
                <CardTitle>Beispielrechnung (Gestaffelt)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 3 Tarife */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold">3 Tarife im Angebot</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      {exampleBonus3.breakdown.map((b) => (
                        <div key={b.position} className="flex justify-between">
                          <span>{b.position}. Tarif:</span>
                          <span className={b.bonus > 0 ? "text-emerald-600 font-mono" : "text-muted-foreground"}>
                            {b.bonus > 0 ? `+${b.bonus.toFixed(2)} €` : "-"}
                          </span>
                        </div>
                      ))}
                      <div className="border-t pt-1 flex justify-between font-semibold">
                        <span>Gesamt:</span>
                        <span className="text-emerald-600 font-mono">
                          +{exampleBonus3.totalBonus.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5 Tarife */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold">5 Tarife im Angebot</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      {exampleBonus5.breakdown.map((b) => (
                        <div key={b.position} className="flex justify-between">
                          <span>{b.position}. Tarif:</span>
                          <span className={b.bonus > 0 ? "text-emerald-600 font-mono" : "text-muted-foreground"}>
                            {b.bonus > 0 ? `+${b.bonus.toFixed(2)} €` : "-"}
                          </span>
                        </div>
                      ))}
                      <div className="border-t pt-1 flex justify-between font-semibold">
                        <span>Gesamt:</span>
                        <span className="text-emerald-600 font-mono">
                          +{exampleBonus5.totalBonus.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Bonus-Regeln */}
          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Bonus-Regeln
                  </CardTitle>
                  <CardDescription>
                    Zusatzboni bei Erreichen von Zielen (z.B. monatliche Vertragszahl)
                  </CardDescription>
                </div>
                <Button onClick={handleOpenCreateRule} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Neue Regel
                </Button>
              </CardHeader>
              <CardContent>
                {rules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Noch keine Bonus-Regeln definiert</p>
                    <p className="text-sm mt-1">
                      Erstelle Regeln wie "50+ Verträge im Monat → +100€ Bonus"
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Bedingung</TableHead>
                        <TableHead className="text-right">Bonus</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule) => (
                        <TableRow key={rule.id} className={!rule.isActive ? "opacity-50" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getRuleTypeIcon(rule.ruleType)}
                              {rule.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getRuleTypeLabel(rule.ruleType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {getRuleDescription(rule)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-emerald-600 font-semibold">
                            {rule.bonusType === "fixed" && `+${rule.bonusValue.toFixed(2)} €`}
                            {rule.bonusType === "percentage" && `+${rule.bonusValue}%`}
                            {rule.bonusType === "multiplier" && `×${rule.bonusValue}`}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={rule.isActive}
                              onCheckedChange={() => handleToggleRuleActive(rule)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditRule(rule)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRule(rule)}
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
                )}
              </CardContent>
            </Card>

            {/* Example Rules */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Beispiel-Regeln</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted/30 text-sm">
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <Target className="w-4 h-4 text-blue-500" />
                    Top-Seller Bonus
                  </div>
                  <p className="text-muted-foreground">
                    50+ Verträge/Monat → <span className="text-emerald-600">+100€</span>
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-sm">
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Quartals-Champion
                  </div>
                  <p className="text-muted-foreground">
                    150+ Verträge/Quartal → <span className="text-emerald-600">+500€</span>
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-sm">
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <Zap className="w-4 h-4 text-purple-500" />
                    Aktions-Booster
                  </div>
                  <p className="text-muted-foreground">
                    Im Januar 2026 → <span className="text-emerald-600">×1.2 Multiplikator</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Position Dialog */}
        <Dialog open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPosition ? "Position bearbeiten" : "Neue Position"}
              </DialogTitle>
              <DialogDescription>
                On-Top Bonus für eine bestimmte Position im Angebot
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="positionNumber">Position *</Label>
                  <Input
                    id="positionNumber"
                    type="number"
                    min={1}
                    value={positionForm.positionNumber}
                    onChange={(e) => setPositionForm({ ...positionForm, positionNumber: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    1 = erster Tarif, 2 = zweiter, etc.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionBonus">On-Top Bonus (€) *</Label>
                  <Input
                    id="positionBonus"
                    type="number"
                    min={0}
                    step={5}
                    value={positionForm.positionBonus}
                    onChange={(e) => setPositionForm({ ...positionForm, positionBonus: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="positionName">Name *</Label>
                <Input
                  id="positionName"
                  value={positionForm.name}
                  onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })}
                  placeholder={`${positionForm.positionNumber}. Tarif On-Top`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scopeType">Gültig für</Label>
                <Select
                  value={positionForm.scopeType}
                  onValueChange={(value: "all" | "user" | "team") => 
                    setPositionForm({ ...positionForm, scopeType: value })
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
                  <Label htmlFor="positionValidFrom">Gültig ab</Label>
                  <Input
                    id="positionValidFrom"
                    type="date"
                    value={positionForm.validFrom}
                    onChange={(e) => setPositionForm({ ...positionForm, validFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionValidUntil">Gültig bis</Label>
                  <Input
                    id="positionValidUntil"
                    type="date"
                    value={positionForm.validUntil || ""}
                    onChange={(e) => setPositionForm({ ...positionForm, validUntil: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="positionActive">Aktiv</Label>
                <Switch
                  id="positionActive"
                  checked={positionForm.isActive}
                  onCheckedChange={(checked) => setPositionForm({ ...positionForm, isActive: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPositionDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSavePosition} disabled={isSaving}>
                {isSaving ? "Speichern..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rule Dialog */}
        <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Regel bearbeiten" : "Neue Bonus-Regel"}
              </DialogTitle>
              <DialogDescription>
                Definiere Bedingungen für zusätzliche Boni
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="ruleName">Name *</Label>
                <Input
                  id="ruleName"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="z.B. Top-Seller Bonus"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ruleType">Regel-Typ</Label>
                <Select
                  value={ruleForm.ruleType}
                  onValueChange={(value: "monthly_threshold" | "quarterly_threshold" | "special_period") => 
                    setRuleForm({ ...ruleForm, ruleType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly_threshold">Monatsziel</SelectItem>
                    <SelectItem value="quarterly_threshold">Quartalsziel</SelectItem>
                    <SelectItem value="special_period">Aktionszeitraum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conditionOperator">Bedingung</Label>
                  <Select
                    value={ruleForm.conditionOperator}
                    onValueChange={(value: "gte" | "lte" | "eq" | "between") => 
                      setRuleForm({ ...ruleForm, conditionOperator: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gte">≥ Mindestens</SelectItem>
                      <SelectItem value="lte">≤ Höchstens</SelectItem>
                      <SelectItem value="eq">= Genau</SelectItem>
                      <SelectItem value="between">Zwischen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conditionValue">Wert *</Label>
                  <Input
                    id="conditionValue"
                    type="number"
                    min={0}
                    value={ruleForm.conditionValue}
                    onChange={(e) => setRuleForm({ ...ruleForm, conditionValue: Number(e.target.value) })}
                    placeholder="z.B. 50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bonusType">Bonus-Typ</Label>
                  <Select
                    value={ruleForm.bonusType}
                    onValueChange={(value: "fixed" | "percentage" | "multiplier") => 
                      setRuleForm({ ...ruleForm, bonusType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Festbetrag (€)</SelectItem>
                      <SelectItem value="percentage">Prozent (%)</SelectItem>
                      <SelectItem value="multiplier">Multiplikator (×)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonusValue">
                    Bonus-Wert *
                    {ruleForm.bonusType === "fixed" && " (€)"}
                    {ruleForm.bonusType === "percentage" && " (%)"}
                    {ruleForm.bonusType === "multiplier" && " (×)"}
                  </Label>
                  <Input
                    id="bonusValue"
                    type="number"
                    min={0}
                    step={ruleForm.bonusType === "multiplier" ? 0.1 : 1}
                    value={ruleForm.bonusValue}
                    onChange={(e) => setRuleForm({ ...ruleForm, bonusValue: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ruleValidFrom">Gültig ab</Label>
                  <Input
                    id="ruleValidFrom"
                    type="date"
                    value={ruleForm.validFrom}
                    onChange={(e) => setRuleForm({ ...ruleForm, validFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruleValidUntil">Gültig bis</Label>
                  <Input
                    id="ruleValidUntil"
                    type="date"
                    value={ruleForm.validUntil || ""}
                    onChange={(e) => setRuleForm({ ...ruleForm, validUntil: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="ruleActive">Aktiv</Label>
                <Switch
                  id="ruleActive"
                  checked={ruleForm.isActive}
                  onCheckedChange={(checked) => setRuleForm({ ...ruleForm, isActive: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveRule} disabled={isSaving}>
                {isSaving ? "Speichern..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
