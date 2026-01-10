/**
 * Hook for fetching promotional bundles (Aktionspakete)
 * These are bundles marked as is_promo by admin with validity periods
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { OfferOptionState } from "../engine/types";

export type Sector = "private" | "business" | "enterprise";

export interface PromoBundleExtended {
  id: string;
  sector: Sector;
  name: string;
  description: string | null;
  tags: string[];
  featured: boolean;
  config: OfferOptionState;
  image_url: string | null;
  created_by: string | null;
  tenant_id: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Promo-specific fields
  is_promo: boolean;
  promo_valid_from: string | null;
  promo_valid_until: string | null;
  promo_badge_text: string | null;
}

interface UsePromoBundlesOptions {
  sector?: Sector;
  includeExpired?: boolean;
}

/**
 * Hook for fetching promotional bundles
 */
export function usePromoBundles(options?: UsePromoBundlesOptions) {
  const { sector, includeExpired = false } = options || {};

  const { data: bundles = [], isLoading, error } = useQuery({
    queryKey: ["promo-bundles", sector, includeExpired],
    queryFn: async (): Promise<PromoBundleExtended[]> => {
      let query = supabase
        .from("corporate_bundles")
        .select("*")
        .eq("is_promo", true)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (sector) {
        query = query.eq("sector", sector);
      }

      if (!includeExpired) {
        const today = new Date().toISOString().split("T")[0];
        query = query
          .or(`promo_valid_from.is.null,promo_valid_from.lte.${today}`)
          .or(`promo_valid_until.is.null,promo_valid_until.gte.${today}`);
      }

      const { data, error } = await query;

      if (error) {
        console.warn("[usePromoBundles] Query error:", error.message);
        return [];
      }

      return (data || []).map(bundle => ({
        ...bundle,
        sector: bundle.sector as Sector,
        tags: bundle.tags || [],
        featured: bundle.featured || false,
        is_active: bundle.is_active ?? true,
        sort_order: bundle.sort_order || 0,
        is_promo: bundle.is_promo ?? false,
        config: bundle.config as unknown as OfferOptionState,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    bundles,
    isLoading,
    error,
  };
}
