// ============================================
// Provision Forecast Hook
// Calculates expected provisions from completed offers
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { OfferOptionState } from "../engine/types";
import type { TimeRange } from "./useReporting";

export interface ForecastRow {
  offerName: string;
  customerName: string;
  tariff: string;
  hardware: string;
  ekPrice: number;
  expectedProvision: number;
  expectedMargin: number;
  createdAt: string;
}

interface ProvisionForecastResult {
  rows: ForecastRow[];
  totals: {
    totalProvision: number;
    totalEk: number;
    netMargin: number;
  };
  isLoading: boolean;
  error: Error | null;
}

// Simple provision lookup based on tariff family and contract type
const PROVISION_MAP: Record<string, { new: number; renewal: number }> = {
  prime_xs: { new: 200, renewal: 100 },
  prime_s: { new: 300, renewal: 150 },
  prime_m: { new: 450, renewal: 225 },
  prime_l: { new: 600, renewal: 300 },
  prime_xl: { new: 800, renewal: 400 },
  smart_xs: { new: 100, renewal: 50 },
  smart_s: { new: 150, renewal: 75 },
  smart_m: { new: 200, renewal: 100 },
  smart_l: { new: 250, renewal: 125 },
  smart_xl: { new: 300, renewal: 150 },
};

function getProvisionForTariff(tariffId: string | undefined, contractType: "new" | "renewal"): number {
  if (!tariffId) return 0;
  
  // Normalize tariff ID
  const normalized = tariffId.toLowerCase().replace(/[^a-z_]/g, "");
  
  // Try exact match first
  if (PROVISION_MAP[normalized]) {
    return PROVISION_MAP[normalized][contractType];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(PROVISION_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value[contractType];
    }
  }
  
  // Default provision based on contract type
  return contractType === "new" ? 250 : 125;
}

function getDateRange(range: TimeRange) {
  const now = new Date();
  const startDate = new Date();
  
  switch (range) {
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(now.getMonth() - 3);
      break;
  }
  
  return { startDate, endDate: now };
}

export function useProvisionForecast(timeRange: TimeRange = "month"): ProvisionForecastResult {
  const { user } = useAuth();
  const { startDate, endDate } = getDateRange(timeRange);

  const { data, isLoading, error } = useQuery({
    queryKey: ["provision-forecast", timeRange, user?.id],
    queryFn: async () => {
      if (!user) return { rows: [], totals: { totalProvision: 0, totalEk: 0, netMargin: 0 } };

      // Fetch offers with customer data
      const { data: offers, error: offersError } = await supabase
        .from("saved_offers")
        .select(`
          id,
          name,
          config,
          preview,
          created_at,
          customer_id,
          customer:customers!saved_offers_customer_id_fkey (
            id,
            company_name,
            customer_status
          )
        `)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (offersError) throw offersError;

      // Filter to offers where customer status is "abgeschlossen"
      const completedOffers = (offers || []).filter(
        (o) => o.customer && (o.customer as { customer_status: string | null }).customer_status === "abgeschlossen"
      );

      // Calculate forecast for each offer
      const rows: ForecastRow[] = completedOffers.map((offer) => {
        const config = offer.config as unknown as OfferOptionState;
        const customer = offer.customer as { company_name: string };
        
        const tariffId = config?.mobile?.tariffId;
        const contractType = config?.mobile?.contractType || "new";
        const quantity = config?.mobile?.quantity || 1;
        const ekPrice = (config?.hardware?.ekNet || 0) * quantity;
        
        const provisionPerContract = getProvisionForTariff(tariffId, contractType);
        const expectedProvision = provisionPerContract * quantity;
        const expectedMargin = expectedProvision - ekPrice;

        const preview = offer.preview as { tariff?: string; hardware?: string } | null;
        return {
          offerName: offer.name,
          customerName: customer?.company_name || "Unbekannt",
          tariff: preview?.tariff || tariffId || "-",
          hardware: preview?.hardware || config?.hardware?.name || "SIM-Only",
          ekPrice,
          expectedProvision,
          expectedMargin,
          createdAt: offer.created_at,
        };
      });

      // Calculate totals
      const totals = rows.reduce(
        (acc, row) => ({
          totalProvision: acc.totalProvision + row.expectedProvision,
          totalEk: acc.totalEk + row.ekPrice,
          netMargin: acc.netMargin + row.expectedMargin,
        }),
        { totalProvision: 0, totalEk: 0, netMargin: 0 }
      );

      return { rows, totals };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    rows: data?.rows || [],
    totals: data?.totals || { totalProvision: 0, totalEk: 0, netMargin: 0 },
    isLoading,
    error: error as Error | null,
  };
}
