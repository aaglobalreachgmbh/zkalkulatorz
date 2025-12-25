import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfWeek, startOfMonth, subMonths, format, parseISO, eachDayOfInterval } from "date-fns";
import { de } from "date-fns/locale";

export type TimeRange = "week" | "month" | "quarter";

interface OfferData {
  id: string;
  name: string;
  config: Record<string, unknown>;
  preview: {
    avgMonthlyNet?: number;
    dealerMargin?: number;
    tariffName?: string;
    hardwareName?: string;
  } | null;
  created_at: string;
  customer_id: string | null;
}

export interface ReportingStats {
  totalOffers: number;
  avgMargin: number;
  topTariff: { name: string; count: number; percentage: number } | null;
  offersOverTime: { date: string; count: number }[];
  hardwareDistribution: { name: string; count: number; percentage: number }[];
  marginDistribution: { category: "positive" | "neutral" | "negative"; count: number; percentage: number }[];
  totalRevenue: number;
}

function getDateRange(range: TimeRange): { start: Date; end: Date } {
  const now = new Date();
  switch (range) {
    case "week":
      return { start: startOfWeek(now, { locale: de }), end: now };
    case "month":
      return { start: startOfMonth(now), end: now };
    case "quarter":
      return { start: subMonths(now, 3), end: now };
  }
}

export function useReporting(timeRange: TimeRange = "month") {
  const { user } = useAuth();
  const dateRange = getDateRange(timeRange);

  return useQuery({
    queryKey: ["reporting", user?.id, timeRange],
    queryFn: async (): Promise<ReportingStats> => {
      if (!user) {
        return {
          totalOffers: 0,
          avgMargin: 0,
          topTariff: null,
          offersOverTime: [],
          hardwareDistribution: [],
          marginDistribution: [],
          totalRevenue: 0,
        };
      }

      const { data: offers, error } = await supabase
        .from("saved_offers")
        .select("id, name, config, preview, created_at, customer_id")
        .eq("is_draft", false)
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      const offersData = (offers || []) as unknown as OfferData[];

      // Calculate stats
      const totalOffers = offersData.length;

      // Average margin
      const margins = offersData
        .filter((o) => o.preview?.dealerMargin !== undefined)
        .map((o) => o.preview!.dealerMargin!);
      const avgMargin = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;

      // Total revenue (sum of monthly net * 24 months)
      const totalRevenue = offersData
        .filter((o) => o.preview?.avgMonthlyNet !== undefined)
        .reduce((sum, o) => sum + (o.preview!.avgMonthlyNet! * 24), 0);

      // Top tariff
      const tariffCounts: Record<string, number> = {};
      offersData.forEach((o) => {
        const tariff = o.preview?.tariffName || "Unbekannt";
        tariffCounts[tariff] = (tariffCounts[tariff] || 0) + 1;
      });
      const topTariffEntry = Object.entries(tariffCounts).sort((a, b) => b[1] - a[1])[0];
      const topTariff = topTariffEntry
        ? {
            name: topTariffEntry[0],
            count: topTariffEntry[1],
            percentage: Math.round((topTariffEntry[1] / totalOffers) * 100),
          }
        : null;

      // Offers over time
      const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
      const offersByDay: Record<string, number> = {};
      days.forEach((day) => {
        offersByDay[format(day, "yyyy-MM-dd")] = 0;
      });
      offersData.forEach((o) => {
        const day = format(parseISO(o.created_at), "yyyy-MM-dd");
        if (offersByDay[day] !== undefined) {
          offersByDay[day]++;
        }
      });
      const offersOverTime = Object.entries(offersByDay).map(([date, count]) => ({
        date: format(parseISO(date), "dd.MM.", { locale: de }),
        count,
      }));

      // Hardware distribution
      const hardwareCounts: Record<string, number> = {};
      offersData.forEach((o) => {
        const hardware = o.preview?.hardwareName || "SIM-Only";
        hardwareCounts[hardware] = (hardwareCounts[hardware] || 0) + 1;
      });
      const hardwareDistribution = Object.entries(hardwareCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalOffers) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Margin distribution
      const marginCategories = { positive: 0, neutral: 0, negative: 0 };
      offersData.forEach((o) => {
        const margin = o.preview?.dealerMargin ?? 0;
        if (margin > 50) marginCategories.positive++;
        else if (margin >= 0) marginCategories.neutral++;
        else marginCategories.negative++;
      });
      const marginDistribution = Object.entries(marginCategories).map(([category, count]) => ({
        category: category as "positive" | "neutral" | "negative",
        count,
        percentage: totalOffers > 0 ? Math.round((count / totalOffers) * 100) : 0,
      }));

      return {
        totalOffers,
        avgMargin,
        topTariff,
        offersOverTime,
        hardwareDistribution,
        marginDistribution,
        totalRevenue,
      };
    },
    enabled: !!user,
  });
}
