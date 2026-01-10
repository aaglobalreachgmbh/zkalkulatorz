import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

export interface ProvisionDetail {
  offerId: string;
  offerName: string;
  customerName?: string;
  tariffName?: string;
  contractType: string; // 'neu' | 'vvl' | 'hw_only'
  baseProvision: number;
  bonusProvision: number;
  totalProvision: number;
  createdAt: string;
}

export interface ProvisionSummary {
  baseProvision: number;
  bonusAmount: number;
  goalBonus: number;
  deductions: number;
  netProvision: number;
  contractCount: number;
  details: ProvisionDetail[];
  status: "draft" | "calculated" | "approved" | "paid";
}

export interface ProvisionCalculation {
  id: string;
  tenant_id: string;
  user_id: string;
  month: string;
  base_provision: number;
  bonus_amount: number;
  deductions: number;
  net_provision: number;
  contract_count: number;
  status: "draft" | "calculated" | "approved" | "paid";
  calculation_details: Json;
  calculated_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  user?: {
    display_name: string | null;
    email: string | null;
  };
}

export function useProvisionCalculator(options?: {
  userId?: string;
  month?: Date;
  includeTeam?: boolean;
}) {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  const targetUserId = options?.userId || user?.id;
  const monthDate = options?.month || new Date();
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const monthKey = format(monthStart, "yyyy-MM-dd");

  // Fetch saved offers for the month (contracts)
  const {
    data: offers = [],
    isLoading: offersLoading,
  } = useQuery({
    queryKey: ["user-offers-for-provision", targetUserId, monthKey, options?.includeTeam],
    queryFn: async () => {
      try {
        let query = supabase
          .from("saved_offers")
          .select(`
            id,
            name,
            config,
            preview,
            status,
            created_at,
            user_id,
            customer:customers(company_name)
          `)
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString())
          .in("status", ["won", "completed", "submitted"]);

        if (!options?.includeTeam && targetUserId) {
          query = query.eq("user_id", targetUserId);
        } else if (identity.tenantId) {
          query = query.eq("tenant_id", identity.tenantId);
        }

        const { data, error } = await query;

        if (error) {
          console.warn("[useProvisionCalculator] Offers fetch error:", error.message);
          return [];
        }

        return data || [];
      } catch (err) {
        console.warn("[useProvisionCalculator] Exception:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch tenant provisions (provision rates)
  const { data: provisionRates = [] } = useQuery({
    queryKey: ["tenant-provisions", identity.tenantId],
    queryFn: async () => {
      try {
        if (!identity.tenantId) return [];

        const { data, error } = await supabase
          .from("tenant_provisions")
          .select("*")
          .eq("tenant_id", identity.tenantId);

        if (error) {
          console.warn("[useProvisionCalculator] Provisions fetch error:", error.message);
          return [];
        }

        return data || [];
      } catch (err) {
        console.warn("[useProvisionCalculator] Exception:", err);
        return [];
      }
    },
    enabled: !!identity.tenantId,
  });

  // Fetch employee settings (for deductions)
  const { data: employeeSettings } = useQuery({
    queryKey: ["employee-settings", targetUserId],
    queryFn: async () => {
      try {
        if (!targetUserId) return null;

        const { data, error } = await supabase
          .from("employee_settings")
          .select("*")
          .eq("user_id", targetUserId)
          .maybeSingle();

        if (error) {
          console.warn("[useProvisionCalculator] Settings fetch error:", error.message);
          return null;
        }

        return data;
      } catch (err) {
        console.warn("[useProvisionCalculator] Exception:", err);
        return null;
      }
    },
    enabled: !!targetUserId,
  });

  // Fetch employee goals (for bonus calculation)
  const { data: goals = [] } = useQuery({
    queryKey: ["employee-goals", targetUserId, monthKey],
    queryFn: async () => {
      try {
        if (!targetUserId) return [];

        const { data, error } = await supabase
          .from("employee_goals")
          .select("*")
          .eq("user_id", targetUserId)
          .eq("month", monthKey);

        if (error) {
          console.warn("[useProvisionCalculator] Goals fetch error:", error.message);
          return [];
        }

        return data || [];
      } catch (err) {
        console.warn("[useProvisionCalculator] Exception:", err);
        return [];
      }
    },
    enabled: !!targetUserId,
  });

  // Fetch existing calculation for the month
  const {
    data: existingCalculation,
    isLoading: calculationLoading,
  } = useQuery({
    queryKey: ["provision-calculation", targetUserId, monthKey],
    queryFn: async () => {
      try {
        if (!targetUserId) return null;

        const { data, error } = await supabase
          .from("provision_calculations")
          .select("*")
          .eq("user_id", targetUserId)
          .eq("month", monthKey)
          .maybeSingle();

        if (error) {
          console.warn("[useProvisionCalculator] Calculation fetch error:", error.message);
          return null;
        }

        if (!data) return null;

        return {
          ...data,
          status: data.status as ProvisionCalculation["status"],
        } as ProvisionCalculation;
      } catch (err) {
        console.warn("[useProvisionCalculator] Exception:", err);
        return null;
      }
    },
    enabled: !!targetUserId,
  });

  // Calculate provision for a single offer
  const calculateOfferProvision = (offer: typeof offers[0]): ProvisionDetail => {
    const config = offer.config as Record<string, unknown> || {};
    const preview = offer.preview as Record<string, unknown> || {};
    
    // Extract tariff info
    const tariffName = (config.tariffName as string) || (preview.tariff as string) || "Unbekannt";
    const contractType = (config.contractType as string) || (config.vertragsart as string) || "neu";
    const customerName = (offer.customer as { company_name: string } | null)?.company_name || "Unbekannt";

    // Find matching provision rate
    const matchingRate = provisionRates.find((rate) => {
      const rateTariff = (rate as { tariff_id?: string }).tariff_id || "";
      const rateType = (rate as { contract_type?: string }).contract_type || "";
      return tariffName.toLowerCase().includes(rateTariff.toLowerCase()) &&
             (rateType === contractType || rateType === "all");
    });

    // Calculate base provision
    let baseProvision = 0;
    if (matchingRate) {
      baseProvision = (matchingRate as { provision_amount?: number }).provision_amount || 0;
    } else {
      // Default provision based on contract type
      baseProvision = contractType === "neu" ? 100 : contractType === "vvl" ? 50 : 30;
    }

    // Extract any bonus from the offer config
    const bonusProvision = (config.bonusProvision as number) || 0;

    return {
      offerId: offer.id,
      offerName: offer.name,
      customerName,
      tariffName,
      contractType,
      baseProvision,
      bonusProvision,
      totalProvision: baseProvision + bonusProvision,
      createdAt: offer.created_at,
    };
  };

  // Calculate monthly summary
  const monthlySummary = useMemo((): ProvisionSummary => {
    // If we have an existing approved calculation, use that
    if (existingCalculation && existingCalculation.status !== "draft") {
      const details = Array.isArray(existingCalculation.calculation_details) 
        ? existingCalculation.calculation_details as unknown as ProvisionDetail[]
        : [];
      return {
        baseProvision: existingCalculation.base_provision,
        bonusAmount: existingCalculation.bonus_amount,
        goalBonus: 0,
        deductions: existingCalculation.deductions,
        netProvision: existingCalculation.net_provision,
        contractCount: existingCalculation.contract_count,
        details,
        status: existingCalculation.status,
      };
    }

    // Calculate from offers
    const details = offers.map(calculateOfferProvision);
    const baseProvision = details.reduce((sum, d) => sum + d.baseProvision, 0);
    const bonusAmount = details.reduce((sum, d) => sum + d.bonusProvision, 0);

    // Goal bonus calculation
    let goalBonus = 0;
    goals.forEach((goal) => {
      const targetValue = (goal as { target_value?: number }).target_value || 0;
      const currentValue = (goal as { current_value?: number }).current_value || 0;
      const bonusAmt = (goal as { bonus_amount?: number }).bonus_amount || 0;
      
      if (targetValue > 0 && currentValue >= targetValue && bonusAmt > 0) {
        goalBonus += bonusAmt;
      }
    });

    // Calculate deductions
    let deductions = 0;
    if (employeeSettings) {
      const deductionValue = employeeSettings.provision_deduction || 0;
      const deductionType = employeeSettings.provision_deduction_type || "fixed";
      
      if (deductionType === "percent") {
        deductions = (baseProvision + bonusAmount + goalBonus) * (deductionValue / 100);
      } else {
        deductions = deductionValue;
      }
    }

    const netProvision = baseProvision + bonusAmount + goalBonus - deductions;

    return {
      baseProvision,
      bonusAmount,
      goalBonus,
      deductions,
      netProvision,
      contractCount: details.length,
      details,
      status: existingCalculation?.status || "draft",
    };
  }, [offers, provisionRates, goals, employeeSettings, existingCalculation]);

  // Save calculation mutation
  const saveCalculationMutation = useMutation({
    mutationFn: async () => {
      if (!targetUserId || !identity.tenantId) {
        console.warn("[useProvisionCalculator] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const calculationData = {
        tenant_id: identity.tenantId,
        user_id: targetUserId,
        month: monthKey,
        base_provision: monthlySummary.baseProvision,
        bonus_amount: monthlySummary.bonusAmount + monthlySummary.goalBonus,
        deductions: monthlySummary.deductions,
        net_provision: monthlySummary.netProvision,
        contract_count: monthlySummary.contractCount,
        status: "calculated" as const,
        calculation_details: JSON.parse(JSON.stringify(monthlySummary.details)),
        calculated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("provision_calculations")
        .upsert(calculationData, { onConflict: "tenant_id,user_id,month" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provision-calculation"] });
      toast.success("Provision berechnet und gespeichert");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Berechnung fehlgeschlagen");
    },
  });

  // Approve calculation mutation
  const approveCalculationMutation = useMutation({
    mutationFn: async (calculationId: string) => {
      if (!user) {
        console.warn("[useProvisionCalculator] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const { data, error } = await supabase
        .from("provision_calculations")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", calculationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provision-calculation"] });
      toast.success("Provision genehmigt");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Genehmigung fehlgeschlagen");
    },
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (calculationId: string) => {
      const { data, error } = await supabase
        .from("provision_calculations")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", calculationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provision-calculation"] });
      toast.success("Als bezahlt markiert");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Aktion fehlgeschlagen");
    },
  });

  return {
    // Data
    monthlySummary,
    existingCalculation,
    offers,
    goals,
    monthKey,
    
    // State
    isLoading: offersLoading || calculationLoading,
    
    // Actions
    saveCalculation: saveCalculationMutation.mutateAsync,
    approveCalculation: approveCalculationMutation.mutateAsync,
    markAsPaid: markAsPaidMutation.mutateAsync,
    calculateOfferProvision,
    
    // Mutation states
    isSaving: saveCalculationMutation.isPending,
    isApproving: approveCalculationMutation.isPending,
  };
}

// Hook for team provision overview (admin)
export function useTeamProvisions(month?: Date) {
  const { user } = useAuth();
  const { identity } = useIdentity();

  const monthDate = month || new Date();
  const monthKey = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const prevMonthKey = format(startOfMonth(subMonths(monthDate, 1)), "yyyy-MM-dd");

  const {
    data: calculations = [],
    isLoading,
  } = useQuery({
    queryKey: ["team-provisions", identity.tenantId, monthKey],
    queryFn: async () => {
      try {
        if (!identity.tenantId) return [];

        const { data, error } = await supabase
          .from("provision_calculations")
          .select("*")
          .eq("tenant_id", identity.tenantId)
          .eq("month", monthKey)
          .order("net_provision", { ascending: false });

        if (error) {
          console.warn("[useTeamProvisions] Fetch error:", error.message);
          return [];
        }

        return (data || []).map((c) => ({
          ...c,
          status: c.status as ProvisionCalculation["status"],
        })) as ProvisionCalculation[];
      } catch (err) {
        console.warn("[useTeamProvisions] Exception:", err);
        return [];
      }
    },
    enabled: !!user && !!identity.tenantId,
  });

  // Previous month for comparison
  const { data: prevCalculations = [] } = useQuery({
    queryKey: ["team-provisions-prev", identity.tenantId, prevMonthKey],
    queryFn: async () => {
      try {
        if (!identity.tenantId) return [];

        const { data, error } = await supabase
          .from("provision_calculations")
          .select("user_id, net_provision")
          .eq("tenant_id", identity.tenantId)
          .eq("month", prevMonthKey);

        if (error) return [];
        return data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!user && !!identity.tenantId,
  });

  // Team statistics
  const teamStats = useMemo(() => {
    const totalNet = calculations.reduce((sum, c) => sum + (c.net_provision || 0), 0);
    const totalBase = calculations.reduce((sum, c) => sum + (c.base_provision || 0), 0);
    const totalBonus = calculations.reduce((sum, c) => sum + (c.bonus_amount || 0), 0);
    const avgNet = calculations.length > 0 ? totalNet / calculations.length : 0;
    const pendingApproval = calculations.filter((c) => c.status === "calculated").length;
    const approved = calculations.filter((c) => c.status === "approved").length;
    const paid = calculations.filter((c) => c.status === "paid").length;

    return {
      totalNet,
      totalBase,
      totalBonus,
      avgNet,
      memberCount: calculations.length,
      pendingApproval,
      approved,
      paid,
    };
  }, [calculations]);

  return {
    calculations,
    prevCalculations,
    teamStats,
    isLoading,
    monthKey,
  };
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}
