// ============================================
// Bonus Rules Hook (Admin-definable Rules)
// ============================================
//
// Verwaltet regelbasierte Zusatzboni wie:
// - "50+ Verträge im Monat → +100€ Bonus"
// - "Quartals-Champion: 150+ Verträge → +500€"
// - "Aktions-Multiplikator im Januar: 1.2×"
//
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type RuleType = 
  | "monthly_threshold"    // Monatliche Schwelle (z.B. 50+ Verträge)
  | "quarterly_threshold"  // Quartalsschwelle
  | "special_period"       // Aktionszeitraum (Multiplikator)
  | "tariff_family"        // Bestimmte Tariffamilie
  | "team_performance";    // Team-basiert

export type ConditionOperator = "gte" | "lte" | "eq" | "between";
export type BonusType = "fixed" | "percentage" | "multiplier";

export interface BonusRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  
  // Rule configuration
  ruleType: RuleType;
  conditionField: string;
  conditionOperator: ConditionOperator;
  conditionValue: number;
  conditionValueMax?: number;
  conditionText?: string;
  
  // Bonus configuration
  bonusType: BonusType;
  bonusValue: number;
  
  // Validity
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  
  // Scope
  scopeType: "all" | "team" | "user";
  scopeId?: string;
  
  // Stacking
  isStackable: boolean;
  priority: number;
  
  // Metadata
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppliedRule {
  rule: BonusRule;
  appliedBonus: number;
  reason: string;
}

interface UseBonusRulesReturn {
  rules: BonusRule[];
  isLoading: boolean;
  error: Error | null;
  
  // CRUD operations
  createRule: (rule: Omit<BonusRule, "id" | "createdAt" | "updatedAt">) => Promise<BonusRule | null>;
  updateRule: (id: string, updates: Partial<BonusRule>) => Promise<boolean>;
  deleteRule: (id: string) => Promise<boolean>;
  toggleRuleActive: (id: string, isActive: boolean) => Promise<boolean>;
  
  // Evaluation
  evaluateRules: (context: RuleContext) => AppliedRule[];
  calculateRuleBonus: (context: RuleContext) => number;
  
  refetch: () => Promise<void>;
}

export interface RuleContext {
  userId: string;
  teamId?: string;
  monthlyContracts?: number;
  quarterlyContracts?: number;
  tariffFamily?: string;
  baseBonus?: number; // For multiplier rules
  currentDate?: Date;
}

export function useBonusRules(): UseBonusRulesReturn {
  const { user } = useAuth();
  const [rules, setRules] = useState<BonusRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRules = useCallback(async () => {
    if (!user) {
      setRules([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error: queryError } = await supabase
        .from("bonus_rules")
        .select("*")
        .order("priority", { ascending: false });

      if (queryError) {
        console.warn("[useBonusRules] Query error, using empty array:", queryError.message);
        setRules([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      const mappedRules: BonusRule[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        tenantId: row.tenant_id as string,
        name: row.name as string,
        description: row.description as string | undefined,
        ruleType: row.rule_type as RuleType,
        conditionField: row.condition_field as string,
        conditionOperator: row.condition_operator as ConditionOperator,
        conditionValue: Number(row.condition_value),
        conditionValueMax: row.condition_value_max ? Number(row.condition_value_max) : undefined,
        conditionText: row.condition_text as string | undefined,
        bonusType: row.bonus_type as BonusType,
        bonusValue: Number(row.bonus_value),
        validFrom: row.valid_from as string,
        validUntil: row.valid_until as string | undefined,
        isActive: row.is_active as boolean,
        scopeType: row.scope_type as "all" | "team" | "user",
        scopeId: row.scope_id as string | undefined,
        isStackable: row.is_stackable as boolean,
        priority: row.priority as number,
        createdBy: row.created_by as string | undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      }));

      setRules(mappedRules);
      setError(null);
    } catch (err) {
      console.warn("[useBonusRules] Unexpected error:", err);
      setRules([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Create a new rule
  const createRule = useCallback(async (
    rule: Omit<BonusRule, "id" | "createdAt" | "updatedAt">
  ): Promise<BonusRule | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from("bonus_rules")
        .insert({
          tenant_id: rule.tenantId,
          name: rule.name,
          description: rule.description,
          rule_type: rule.ruleType,
          condition_field: rule.conditionField,
          condition_operator: rule.conditionOperator,
          condition_value: rule.conditionValue,
          condition_value_max: rule.conditionValueMax,
          condition_text: rule.conditionText,
          bonus_type: rule.bonusType,
          bonus_value: rule.bonusValue,
          valid_from: rule.validFrom,
          valid_until: rule.validUntil,
          is_active: rule.isActive,
          scope_type: rule.scopeType,
          scope_id: rule.scopeId,
          is_stackable: rule.isStackable,
          priority: rule.priority,
          created_by: rule.createdBy,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[useBonusRules] Create error:", insertError.message);
        return null;
      }

      await fetchRules();
      return data as unknown as BonusRule;
    } catch (err) {
      console.error("[useBonusRules] Create exception:", err);
      return null;
    }
  }, [fetchRules]);

  // Update a rule
  const updateRule = useCallback(async (
    id: string, 
    updates: Partial<BonusRule>
  ): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.ruleType !== undefined) dbUpdates.rule_type = updates.ruleType;
      if (updates.conditionField !== undefined) dbUpdates.condition_field = updates.conditionField;
      if (updates.conditionOperator !== undefined) dbUpdates.condition_operator = updates.conditionOperator;
      if (updates.conditionValue !== undefined) dbUpdates.condition_value = updates.conditionValue;
      if (updates.conditionValueMax !== undefined) dbUpdates.condition_value_max = updates.conditionValueMax;
      if (updates.conditionText !== undefined) dbUpdates.condition_text = updates.conditionText;
      if (updates.bonusType !== undefined) dbUpdates.bonus_type = updates.bonusType;
      if (updates.bonusValue !== undefined) dbUpdates.bonus_value = updates.bonusValue;
      if (updates.validFrom !== undefined) dbUpdates.valid_from = updates.validFrom;
      if (updates.validUntil !== undefined) dbUpdates.valid_until = updates.validUntil;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.scopeType !== undefined) dbUpdates.scope_type = updates.scopeType;
      if (updates.scopeId !== undefined) dbUpdates.scope_id = updates.scopeId;
      if (updates.isStackable !== undefined) dbUpdates.is_stackable = updates.isStackable;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;

      const { error: updateError } = await supabase
        .from("bonus_rules")
        .update(dbUpdates)
        .eq("id", id);

      if (updateError) {
        console.error("[useBonusRules] Update error:", updateError.message);
        return false;
      }

      await fetchRules();
      return true;
    } catch (err) {
      console.error("[useBonusRules] Update exception:", err);
      return false;
    }
  }, [fetchRules]);

  // Delete a rule
  const deleteRule = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from("bonus_rules")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("[useBonusRules] Delete error:", deleteError.message);
        return false;
      }

      await fetchRules();
      return true;
    } catch (err) {
      console.error("[useBonusRules] Delete exception:", err);
      return false;
    }
  }, [fetchRules]);

  // Toggle active status
  const toggleRuleActive = useCallback(async (
    id: string, 
    isActive: boolean
  ): Promise<boolean> => {
    return updateRule(id, { isActive });
  }, [updateRule]);

  // Evaluate which rules apply to current context
  const evaluateRules = useCallback((context: RuleContext): AppliedRule[] => {
    const today = context.currentDate || new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const appliedRules: AppliedRule[] = [];

    for (const rule of rules) {
      // Skip inactive rules
      if (!rule.isActive) continue;
      
      // Check validity period
      if (rule.validFrom > todayStr) continue;
      if (rule.validUntil && rule.validUntil < todayStr) continue;
      
      // Check scope
      if (rule.scopeType === "user" && rule.scopeId !== context.userId) continue;
      if (rule.scopeType === "team" && rule.scopeId !== context.teamId) continue;
      
      // Evaluate condition
      let conditionMet = false;
      let contextValue = 0;

      switch (rule.conditionField) {
        case "contracts_submitted":
          if (rule.ruleType === "monthly_threshold") {
            contextValue = context.monthlyContracts ?? 0;
          } else if (rule.ruleType === "quarterly_threshold") {
            contextValue = context.quarterlyContracts ?? 0;
          }
          break;
        case "tariff_family":
          if (context.tariffFamily === rule.conditionText) {
            conditionMet = true;
          }
          break;
      }

      if (!conditionMet && rule.conditionField !== "tariff_family") {
        switch (rule.conditionOperator) {
          case "gte":
            conditionMet = contextValue >= rule.conditionValue;
            break;
          case "lte":
            conditionMet = contextValue <= rule.conditionValue;
            break;
          case "eq":
            conditionMet = contextValue === rule.conditionValue;
            break;
          case "between":
            conditionMet = contextValue >= rule.conditionValue && 
                          contextValue <= (rule.conditionValueMax ?? rule.conditionValue);
            break;
        }
      }

      if (conditionMet) {
        let appliedBonus = 0;
        let reason = "";

        switch (rule.bonusType) {
          case "fixed":
            appliedBonus = rule.bonusValue;
            reason = `+${rule.bonusValue}€ ${rule.name}`;
            break;
          case "percentage":
            appliedBonus = (context.baseBonus ?? 0) * (rule.bonusValue / 100);
            reason = `+${rule.bonusValue}% ${rule.name}`;
            break;
          case "multiplier":
            appliedBonus = (context.baseBonus ?? 0) * (rule.bonusValue - 1);
            reason = `×${rule.bonusValue} ${rule.name}`;
            break;
        }

        appliedRules.push({
          rule,
          appliedBonus,
          reason,
        });
      }
    }

    // Sort by priority (highest first)
    return appliedRules.sort((a, b) => b.rule.priority - a.rule.priority);
  }, [rules]);

  // Calculate total bonus from rules
  const calculateRuleBonus = useCallback((context: RuleContext): number => {
    const appliedRules = evaluateRules(context);
    return appliedRules.reduce((sum, applied) => sum + applied.appliedBonus, 0);
  }, [evaluateRules]);

  return {
    rules,
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleActive,
    evaluateRules,
    calculateRuleBonus,
    refetch: fetchRules,
  };
}

// Helper to get human-readable rule description
export function getRuleDescription(rule: BonusRule): string {
  const operatorText: Record<ConditionOperator, string> = {
    gte: "≥",
    lte: "≤",
    eq: "=",
    between: "zwischen",
  };

  const fieldText: Record<string, string> = {
    contracts_submitted: "Verträge eingereicht",
    revenue_generated: "Umsatz generiert",
    tariff_family: "Tariffamilie",
  };

  let condition = "";
  if (rule.conditionField === "tariff_family") {
    condition = `Tariffamilie = "${rule.conditionText}"`;
  } else if (rule.conditionOperator === "between") {
    condition = `${rule.conditionValue}-${rule.conditionValueMax} ${fieldText[rule.conditionField] || rule.conditionField}`;
  } else {
    condition = `${operatorText[rule.conditionOperator]}${rule.conditionValue} ${fieldText[rule.conditionField] || rule.conditionField}`;
  }

  let bonus = "";
  switch (rule.bonusType) {
    case "fixed":
      bonus = `+${rule.bonusValue}€`;
      break;
    case "percentage":
      bonus = `+${rule.bonusValue}%`;
      break;
    case "multiplier":
      bonus = `×${rule.bonusValue}`;
      break;
  }

  return `Wenn ${condition} → ${bonus}`;
}
