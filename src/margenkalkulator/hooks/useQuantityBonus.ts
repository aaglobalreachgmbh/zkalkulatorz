// ============================================
// Quantity Bonus Hook (Stacked On-Top Bonuses)
// ============================================
//
// Lädt gestaffelte Position-basierte On-Top Boni aus der Datenbank
// und berechnet den Gesamt-Bonus basierend auf Anzahl der Tarife
//
// WICHTIG: Position 1 = erster Tarif, Position 2 = zweiter Tarif, etc.
// Der Bonus ist GESTAFFELT, nicht multipliziert!
//
// Beispiel bei 3 Tarifen:
//   Position 1: +50€
//   Position 2: +70€
//   Position 3: +80€
//   Gesamt: 200€ (nicht 50€ × 3 = 150€!)
//
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PositionBonus {
  id: string;
  tenantId: string;
  scopeType: "all" | "user" | "team";
  scopeId?: string;
  positionNumber: number;
  positionBonus: number;
  name: string;
  description?: string;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
}

// Legacy interface for backward compatibility
export interface QuantityBonusTier extends PositionBonus {
  minQuantity: number;
  bonusPerContract: number;
}

interface StackedBonusResult {
  /** Total stacked bonus for all positions */
  totalBonus: number;
  /** Breakdown per position */
  breakdown: Array<{
    position: number;
    bonus: number;
    name: string;
  }>;
  /** Number of positions with bonuses */
  positionsWithBonus: number;
}

interface UseQuantityBonusReturn {
  /** Position-based bonus tiers */
  tiers: PositionBonus[];
  /** Legacy: same as tiers with old field names */
  legacyTiers: QuantityBonusTier[];
  isLoading: boolean;
  error: Error | null;
  
  /** Get bonus for a specific position (1-indexed) */
  getBonusForPosition: (position: number) => PositionBonus | null;
  
  /** Calculate total stacked bonus for N contracts */
  calculateStackedBonus: (quantity: number) => StackedBonusResult;
  
  /** Legacy: same as calculateStackedBonus but returns just the total */
  calculateTotalBonus: (quantity: number) => number;
  
  /** Get the bonus tier for a quantity (legacy compatibility) */
  getBonusForQuantity: (quantity: number) => QuantityBonusTier | null;
  
  refetch: () => Promise<void>;
}

export function useQuantityBonus(): UseQuantityBonusReturn {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<PositionBonus[]>([]);
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
        .order("position_number", { ascending: true });

      if (queryError) {
        console.warn("[useQuantityBonus] Query error, using empty array:", queryError.message);
        setTiers([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      const mappedTiers: PositionBonus[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        tenantId: row.tenant_id as string,
        scopeType: row.scope_type as "all" | "user" | "team",
        scopeId: row.scope_id as string | undefined,
        // Use position_number if available, fallback to min_quantity for legacy data
        positionNumber: (row.position_number as number) ?? (row.min_quantity as number),
        positionBonus: Number(row.bonus_per_contract),
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

      // Sort by position number
      applicableTiers.sort((a, b) => a.positionNumber - b.positionNumber);

      setTiers(applicableTiers);
      setError(null);
    } catch (err) {
      console.warn("[useQuantityBonus] Unexpected error, using empty array:", err);
      setTiers([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  // Get bonus for a specific position (1-indexed)
  const getBonusForPosition = useCallback((position: number): PositionBonus | null => {
    return tiers.find(t => t.positionNumber === position) ?? null;
  }, [tiers]);

  // Calculate stacked bonus for N contracts
  const calculateStackedBonus = useCallback((quantity: number): StackedBonusResult => {
    if (quantity < 1) {
      return { totalBonus: 0, breakdown: [], positionsWithBonus: 0 };
    }

    const breakdown: Array<{ position: number; bonus: number; name: string }> = [];
    let totalBonus = 0;

    for (let position = 1; position <= quantity; position++) {
      const tier = tiers.find(t => t.positionNumber === position);
      if (tier) {
        breakdown.push({
          position,
          bonus: tier.positionBonus,
          name: tier.name,
        });
        totalBonus += tier.positionBonus;
      } else {
        // No bonus defined for this position
        breakdown.push({
          position,
          bonus: 0,
          name: `${position}. Tarif`,
        });
      }
    }

    return {
      totalBonus,
      breakdown,
      positionsWithBonus: breakdown.filter(b => b.bonus > 0).length,
    };
  }, [tiers]);

  // Legacy: Calculate total bonus (just returns the sum)
  const calculateTotalBonus = useCallback((quantity: number): number => {
    return calculateStackedBonus(quantity).totalBonus;
  }, [calculateStackedBonus]);

  // Legacy: Get bonus for quantity (returns the last applicable tier)
  const getBonusForQuantity = useCallback((quantity: number): QuantityBonusTier | null => {
    if (quantity < 1) return null;
    
    const tier = tiers.find(t => t.positionNumber === quantity);
    if (!tier) return null;
    
    // Map to legacy format
    return {
      ...tier,
      minQuantity: tier.positionNumber,
      bonusPerContract: tier.positionBonus,
    };
  }, [tiers]);

  // Legacy format for backward compatibility
  const legacyTiers = useMemo((): QuantityBonusTier[] => {
    return tiers.map(tier => ({
      ...tier,
      minQuantity: tier.positionNumber,
      bonusPerContract: tier.positionBonus,
    }));
  }, [tiers]);

  return {
    tiers,
    legacyTiers,
    isLoading,
    error,
    getBonusForPosition,
    calculateStackedBonus,
    calculateTotalBonus,
    getBonusForQuantity,
    refetch: fetchTiers,
  };
}

// Default tiers for demo/local mode (no Supabase)
export const DEFAULT_POSITION_BONUSES: Omit<PositionBonus, "id" | "tenantId">[] = [
  {
    scopeType: "all",
    positionNumber: 1,
    positionBonus: 50,
    name: "1. Tarif On-Top",
    description: "On-Top Bonus für den ersten Tarif im Angebot",
    isActive: true,
    validFrom: "2025-01-01",
  },
  {
    scopeType: "all",
    positionNumber: 2,
    positionBonus: 70,
    name: "2. Tarif On-Top",
    description: "On-Top Bonus für den zweiten Tarif im Angebot",
    isActive: true,
    validFrom: "2025-01-01",
  },
  {
    scopeType: "all",
    positionNumber: 3,
    positionBonus: 80,
    name: "3. Tarif On-Top",
    description: "On-Top Bonus für den dritten Tarif im Angebot",
    isActive: true,
    validFrom: "2025-01-01",
  },
  {
    scopeType: "all",
    positionNumber: 4,
    positionBonus: 90,
    name: "4. Tarif On-Top",
    description: "On-Top Bonus für den vierten Tarif im Angebot",
    isActive: true,
    validFrom: "2025-01-01",
  },
  {
    scopeType: "all",
    positionNumber: 5,
    positionBonus: 100,
    name: "5. Tarif On-Top",
    description: "On-Top Bonus für den fünften Tarif im Angebot",
    isActive: true,
    validFrom: "2025-01-01",
  },
];

// Legacy export for backward compatibility
export const DEFAULT_QUANTITY_BONUS_TIERS = DEFAULT_POSITION_BONUSES.map(tier => ({
  ...tier,
  minQuantity: tier.positionNumber,
  bonusPerContract: tier.positionBonus,
}));
