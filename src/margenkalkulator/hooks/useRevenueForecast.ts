// ============================================
// Revenue Forecast Hook
// Calculates Q+1 forecast based on pipeline
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { addMonths, startOfMonth, endOfMonth, startOfQuarter, addQuarters } from "date-fns";

interface ForecastData {
  // Current quarter metrics
  currentQuarterRevenue: number;
  currentQuarterOffers: number;
  
  // Next quarter forecast
  nextQuarterForecast: number;
  nextQuarterStart: Date;
  nextQuarterEnd: Date;
  
  // Trend analysis
  conversionRate: number; // % of offers that become contracts
  avgDealValue: number; // Average monthly value per offer
  pipelineValue: number; // Total value of pending offers
  
  // Confidence
  confidence: "high" | "medium" | "low";
  
  isLoading: boolean;
  error: Error | null;
}

export function useRevenueForecast(): ForecastData {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["revenue-forecast", user?.id],
    queryFn: async () => {
      if (!user) {
        return null;
      }

      const now = new Date();
      const currentQuarterStart = startOfQuarter(now);
      const nextQuarterStart = startOfQuarter(addQuarters(now, 1));
      const nextQuarterEnd = endOfMonth(addMonths(nextQuarterStart, 2));
      
      // Get last 90 days of data for analysis
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      
      // Parallel queries
      const [offersResult, contractsResult, emailsResult] = await Promise.all([
        // All offers from last 90 days
        supabase
          .from("saved_offers")
          .select("id, created_at, preview")
          .gte("created_at", ninetyDaysAgo)
          .eq("is_draft", false),
        
        // All contracts from last 90 days
        supabase
          .from("customer_contracts")
          .select("id, created_at, monatspreis, provision_erhalten")
          .gte("created_at", ninetyDaysAgo),
        
        // All sent emails (offers in pipeline)
        supabase
          .from("offer_emails")
          .select("id, created_at, offer_data")
          .gte("created_at", ninetyDaysAgo),
      ]);

      const offers = offersResult.data || [];
      const contracts = contractsResult.data || [];
      const emails = emailsResult.data || [];

      // Calculate metrics
      const totalOffers = offers.length;
      const totalContracts = contracts.length;
      
      // Conversion rate (contracts / offers sent as emails)
      const offersEmailed = emails.length;
      const conversionRate = offersEmailed > 0 
        ? Math.min((totalContracts / offersEmailed) * 100, 100) 
        : 30; // Default 30% if no data

      // Average deal value from contracts
      const contractValues = contracts
        .map(c => c.monatspreis || 0)
        .filter(v => v > 0);
      const avgDealValue = contractValues.length > 0
        ? contractValues.reduce((a, b) => a + b, 0) / contractValues.length
        : 0;

      // Average deal value from offers (fallback)
      let avgOfferValue = avgDealValue;
      if (avgOfferValue === 0) {
        const offerValues = offers
          .map(o => {
            const preview = o.preview as { avgMonthly?: number } | null;
            return preview?.avgMonthly || 0;
          })
          .filter(v => v > 0);
        avgOfferValue = offerValues.length > 0
          ? offerValues.reduce((a, b) => a + b, 0) / offerValues.length
          : 50; // Default €50 if no data
      }

      // Current quarter revenue from contracts
      const currentQuarterRevenue = contracts
        .filter(c => new Date(c.created_at) >= currentQuarterStart)
        .reduce((sum, c) => sum + (c.monatspreis || 0) * 3, 0); // 3 months per quarter

      const currentQuarterOffers = offers
        .filter(o => new Date(o.created_at) >= currentQuarterStart)
        .length;

      // Pipeline value (pending offers)
      const pipelineValue = emails
        .map(e => {
          const data = e.offer_data as { items?: Array<{ avgMonthly?: number }> } | null;
          if (!data?.items) return 0;
          return data.items.reduce((sum, item) => sum + (item.avgMonthly || 0), 0);
        })
        .reduce((a, b) => a + b, 0);

      // Forecast calculation
      // Method: Take pipeline value, apply conversion rate, add trend extrapolation
      const pipelineForecast = pipelineValue * (conversionRate / 100) * 3; // 3 months
      
      // Trend: extrapolate from current quarter pace
      const daysIntoQuarter = Math.max(1, Math.floor((now.getTime() - currentQuarterStart.getTime()) / (24 * 60 * 60 * 1000)));
      const daysInQuarter = 90;
      const trendForecast = (currentQuarterRevenue / daysIntoQuarter) * daysInQuarter;
      
      // Weighted average (60% pipeline, 40% trend)
      const nextQuarterForecast = pipelineForecast * 0.6 + trendForecast * 0.4;

      // Confidence based on data quality
      let confidence: "high" | "medium" | "low" = "low";
      if (totalContracts >= 10 && offersEmailed >= 20) {
        confidence = "high";
      } else if (totalContracts >= 5 || offersEmailed >= 10) {
        confidence = "medium";
      }

      return {
        currentQuarterRevenue,
        currentQuarterOffers,
        nextQuarterForecast,
        nextQuarterStart,
        nextQuarterEnd,
        conversionRate,
        avgDealValue: avgOfferValue,
        pipelineValue,
        confidence,
      };
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  return {
    currentQuarterRevenue: data?.currentQuarterRevenue || 0,
    currentQuarterOffers: data?.currentQuarterOffers || 0,
    nextQuarterForecast: data?.nextQuarterForecast || 0,
    nextQuarterStart: data?.nextQuarterStart || addQuarters(new Date(), 1),
    nextQuarterEnd: data?.nextQuarterEnd || addQuarters(new Date(), 1),
    conversionRate: data?.conversionRate || 0,
    avgDealValue: data?.avgDealValue || 0,
    pipelineValue: data?.pipelineValue || 0,
    confidence: data?.confidence || "low",
    isLoading,
    error: error as Error | null,
  };
}
