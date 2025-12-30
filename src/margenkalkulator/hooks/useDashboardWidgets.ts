// ============================================
// Dashboard Widgets Data Hook
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { subDays, startOfDay } from "date-fns";

interface TariffCount {
  tariffName: string;
  count: number;
}

interface DashboardWidgetData {
  // Widget 1: Sent offers in last 30 days
  sentOffersLast30Days: number;
  
  // Widget 2: Monthly revenue potential (from pending/sent offers)
  monthlyRevenuePotential: number;
  
  // Widget 3: Top 3 tariffs in last 90 days
  topTariffs: TariffCount[];
  
  // Loading states
  isLoading: boolean;
  error: Error | null;
}

export function useDashboardWidgets(): DashboardWidgetData {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-widgets", user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          sentOffersLast30Days: 0,
          monthlyRevenuePotential: 0,
          topTariffs: [],
        };
      }

      const now = new Date();
      const thirtyDaysAgo = startOfDay(subDays(now, 30)).toISOString();
      const ninetyDaysAgo = startOfDay(subDays(now, 90)).toISOString();

      // Parallel queries for performance
      const [emailsResult, offersResult] = await Promise.all([
        // Query 1: Count emails sent in last 30 days
        supabase
          .from("offer_emails")
          .select("id, offer_data, created_at")
          .gte("created_at", thirtyDaysAgo),
        
        // Query 2: Get all emails from last 90 days for tariff analysis
        supabase
          .from("offer_emails")
          .select("offer_data, created_at")
          .gte("created_at", ninetyDaysAgo),
      ]);

      // Widget 1: Sent offers count
      const sentOffersLast30Days = emailsResult.data?.length || 0;

      // Widget 2: Monthly revenue potential
      // Sum avgMonthly from all offer_data in pending/sent emails
      let monthlyRevenuePotential = 0;
      
      if (emailsResult.data) {
        for (const email of emailsResult.data) {
          const offerData = email.offer_data as { items?: Array<{ avgMonthly?: number }> } | null;
          if (offerData?.items) {
            for (const item of offerData.items) {
              if (item.avgMonthly && typeof item.avgMonthly === 'number') {
                monthlyRevenuePotential += item.avgMonthly;
              }
            }
          }
        }
      }

      // Widget 3: Top 3 tariffs from last 90 days
      const tariffCounts: Record<string, number> = {};
      
      if (offersResult.data) {
        for (const email of offersResult.data) {
          const offerData = email.offer_data as { items?: Array<{ tariffName?: string }> } | null;
          if (offerData?.items) {
            for (const item of offerData.items) {
              if (item.tariffName) {
                tariffCounts[item.tariffName] = (tariffCounts[item.tariffName] || 0) + 1;
              }
            }
          }
        }
      }

      // Sort and get top 3
      const topTariffs: TariffCount[] = Object.entries(tariffCounts)
        .map(([tariffName, count]) => ({ tariffName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return {
        sentOffersLast30Days,
        monthlyRevenuePotential,
        topTariffs,
      };
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute cache
    refetchOnWindowFocus: false,
  });

  return {
    sentOffersLast30Days: data?.sentOffersLast30Days || 0,
    monthlyRevenuePotential: data?.monthlyRevenuePotential || 0,
    topTariffs: data?.topTariffs || [],
    isLoading,
    error: error as Error | null,
  };
}
