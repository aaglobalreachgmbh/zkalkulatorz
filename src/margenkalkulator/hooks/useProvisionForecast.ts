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

// HINWEIS: Provisionen werden jetzt bevorzugt aus den Tenant-Daten geladen
// Dieses Fallback wird nur verwendet, wenn keine Tenant-Provisionen verfügbar sind
// Für aktuelle Provisionen siehe: useTenantAwareProvisioning Hook

/**
 * Get provision for tariff - uses tenant data when available
 * This is a simplified version for the forecast; full calculation uses useTenantAwareProvisioning
 */
function getProvisionForTariff(
  tariffId: string | undefined, 
  contractType: "new" | "renewal",
  tenantProvisions?: Array<{ tariff_id: string; contract_type: string; provision_amount: number }>
): number {
  if (!tariffId) return 0;
  
  // Try tenant provisions first
  if (tenantProvisions && tenantProvisions.length > 0) {
    const contractKey = contractType === "renewal" ? "extension" : "new";
    const match = tenantProvisions.find(
      (p) => p.tariff_id.toLowerCase().includes(tariffId.toLowerCase()) && 
             p.contract_type === contractKey
    );
    if (match) {
      return match.provision_amount;
    }
  }
  
  // Fallback to defaults based on tariff family
  const normalized = tariffId.toLowerCase().replace(/[^a-z_]/g, "");
  
  // Business Prime defaults
  if (normalized.includes("prime_unlimited") || normalized.includes("primeunlimited")) {
    return contractType === "new" ? 650 : 330;
  }
  if (normalized.includes("prime_plus") || normalized.includes("primeplus")) {
    return contractType === "new" ? 360 : 150;
  }
  if (normalized.includes("prime_go") || normalized.includes("primego")) {
    return contractType === "new" ? 290 : 60;
  }
  if (normalized.includes("prime")) {
    return contractType === "new" ? 460 : 105;
  }
  
  // Business Smart defaults
  if (normalized.includes("smart_plus") || normalized.includes("smartplus")) {
    return contractType === "new" ? 170 : 145;
  }
  if (normalized.includes("smart")) {
    return contractType === "new" ? 105 : 20;
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
