// ============================================
// useCustomerMargins Hook
// Loads and aggregates margin data for a customer
// ============================================

import { useMemo } from "react";
import { useCloudOffers } from "./useCloudOffers";
import type { ProfitabilityStatus } from "../lib/formatters";
import { getProfitabilityStatus } from "../lib/formatters";

export interface CustomerMarginEntry {
  offerId: string;
  offerName: string;
  date: string;
  margin: number;
  marginPerContract: number;
  status: ProfitabilityStatus;
}

export interface CustomerMarginStats {
  averageMargin: number;
  bestMargin: number;
  worstMargin: number;
  totalOffers: number;
  positiveCount: number;
  warningCount: number;
  criticalCount: number;
}

export interface UseCustomerMarginsReturn {
  entries: CustomerMarginEntry[];
  stats: CustomerMarginStats;
  isLoading: boolean;
}

export function useCustomerMargins(customerId?: string): UseCustomerMarginsReturn {
  const { offers, isLoading } = useCloudOffers();

  const customerOffers = useMemo(() => {
    if (!customerId) return [];
    return offers.filter(o => o.customer_id === customerId);
  }, [offers, customerId]);

  const entries = useMemo<CustomerMarginEntry[]>(() => {
    return customerOffers
      .map(offer => {
        // Estimate margin from avgMonthly (no margin stored in preview)
        const avgMonthly = offer.preview?.avgMonthly ?? 0;
        const quantity = offer.config?.mobile?.quantity ?? 1;
        // Rough margin estimate: avgMonthly * 0.1 * quantity * 24
        const estimatedMargin = avgMonthly * 0.1 * quantity * 24;
        const marginPerContract = estimatedMargin / quantity;

        return {
          offerId: offer.id,
          offerName: offer.name,
          date: offer.created_at,
          margin: estimatedMargin,
          marginPerContract,
          status: getProfitabilityStatus(marginPerContract),
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customerOffers]);

  const stats = useMemo<CustomerMarginStats>(() => {
    if (entries.length === 0) {
      return {
        averageMargin: 0,
        bestMargin: 0,
        worstMargin: 0,
        totalOffers: 0,
        positiveCount: 0,
        warningCount: 0,
        criticalCount: 0,
      };
    }

    const margins = entries.map(e => e.margin);
    const total = margins.reduce((sum, m) => sum + m, 0);

    return {
      averageMargin: total / margins.length,
      bestMargin: Math.max(...margins),
      worstMargin: Math.min(...margins),
      totalOffers: entries.length,
      positiveCount: entries.filter(e => e.status === "positive").length,
      warningCount: entries.filter(e => e.status === "warning").length,
      criticalCount: entries.filter(e => e.status === "critical").length,
    };
  }, [entries]);

  return { entries, stats, isLoading };
}
