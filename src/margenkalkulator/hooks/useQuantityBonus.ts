// ============================================
// Quantity Bonus Hook (Cross-Selling On-Top)
// ============================================
//
// Lädt gestaffelte Cross-Selling Boni aus der Datenbank
// und berechnet den anwendbaren Bonus basierend auf Anzahl
//
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface QuantityBonusTier {
  id: string;
  tenantId: string;
  scopeType: "all" | "user" | "team";
  scopeId?: string;
  minQuantity: number;
  bonusPerContract: number;
  name: string;
  description?: string;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
}

interface UseQuantityBonusReturn {
  tiers: QuantityBonusTier[];
  isLoading: boolean;
  error: Error | null;
  getBonusForQuantity: (quantity: number) => QuantityBonusTier | null;
  calculateTotalBonus: (quantity: number) => number;
  refetch: () => Promise<void>;
}

export function useQuantityBonus(): UseQuantityBonusReturn {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<QuantityBonusTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTiers = useCallback(async () => {
    if (!user) {
      setTiers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error: queryError } = await supabase
        .from("quantity_bonus_tiers")
        .select("*")
        .eq("is_active", true)
        .lte("valid_from", today)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("min_quantity", { ascending: true });

      if (queryError) throw queryError;

      const mappedTiers: QuantityBonusTier[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        tenantId: row.tenant_id as string,
        scopeType: row.scope_type as "all" | "user" | "team",
        scopeId: row.scope_id as string | undefined,
        minQuantity: row.min_quantity as number,
        bonusPerContract: Number(row.bonus_per_contract),
        name: row.name as string,
        description: row.description as string | undefined,
        isActive: row.is_active as boolean,
        validFrom: row.valid_from as string,
        validUntil: row.valid_until as string | undefined,
      }));

      // Filter tiers applicable to current user
      const applicableTiers = mappedTiers.filter(tier => {
        if (tier.scopeType === "all") return true;
        if (tier.scopeType === "user" && tier.scopeId === user.id) return true;
        // Team scope would need team membership check
        return false;
      });

      setTiers(applicableTiers);
      setError(null);
    } catch (err) {
      console.error("[useQuantityBonus] Error fetching tiers:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  // Find the highest applicable tier for a given quantity
  const getBonusForQuantity = useCallback((quantity: number): QuantityBonusTier | null => {
    if (quantity < 2) return null; // Cross-selling bonus only applies for 2+ contracts
    
    const applicableTiers = tiers.filter(t => t.minQuantity <= quantity);
    if (applicableTiers.length === 0) return null;
    
    // Return the tier with highest minQuantity (most beneficial)
    return applicableTiers.reduce((highest, current) => 
      current.minQuantity > highest.minQuantity ? current : highest
    );
  }, [tiers]);

  // Calculate total bonus for a given quantity
  const calculateTotalBonus = useCallback((quantity: number): number => {
    const tier = getBonusForQuantity(quantity);
    if (!tier) return 0;
    return tier.bonusPerContract * quantity;
  }, [getBonusForQuantity]);

  return {
    tiers,
    isLoading,
    error,
    getBonusForQuantity,
    calculateTotalBonus,
    refetch: fetchTiers,
  };
}

// Default tiers for demo/local mode (no Supabase)
export const DEFAULT_QUANTITY_BONUS_TIERS: Omit<QuantityBonusTier, "id" | "tenantId">[] = [
  {
    scopeType: "all",
    minQuantity: 3,
    bonusPerContract: 5,
    name: "Cross-Sell Bronze",
    description: "Ab 3 Verträgen: 5€ On-Top pro Vertrag",
    isActive: true,
    validFrom: "2025-01-01",
  },
  {
    scopeType: "all",
    minQuantity: 5,
    bonusPerContract: 10,
    name: "Cross-Sell Silber",
    description: "Ab 5 Verträgen: 10€ On-Top pro Vertrag",
    isActive: true,
    validFrom: "2025-01-01",
  },
  {
    scopeType: "all",
    minQuantity: 10,
    bonusPerContract: 15,
    name: "Cross-Sell Gold",
    description: "Ab 10 Verträgen: 15€ On-Top pro Vertrag",
    isActive: true,
    validFrom: "2025-01-01",
  },
];
