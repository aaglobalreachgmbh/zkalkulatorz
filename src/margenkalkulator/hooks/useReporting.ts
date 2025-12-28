import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfWeek, startOfMonth, subMonths, format, parseISO, eachDayOfInterval, differenceInDays, eachMonthOfInterval, startOfDay } from "date-fns";
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

interface ContractData {
  id: string;
  vvl_datum: string | null;
  provision_erhalten: number | null;
  ek_preis: number | null;
  vertragsbeginn: string | null;
  tarif_name: string | null;
  hardware_name: string | null;
  user_id: string;
  created_at: string;
}

interface TeamMemberData {
  user_id: string;
  team_id: string;
  teams: {
    id: string;
    name: string;
  } | null;
}

export interface VVLStats {
  total: number;
  critical: number;   // < 30 Tage
  warning: number;    // 30-60 Tage
  ok: number;         // 60-90 Tage
  upcoming: number;   // > 90 Tage
}

export interface VVLByTeam {
  teamName: string;
  count: number;
  critical: number;
}

export interface MonthlyAmount {
  month: string;
  amount: number;
}

export interface EkVsProvision {
  totalEk: number;
  totalProvision: number;
  difference: number;
  byMonth: { month: string; ek: number; provision: number; diff: number }[];
}

export interface ReportingStats {
  totalOffers: number;
  avgMargin: number;
  topTariff: { name: string; count: number; percentage: number } | null;
  offersOverTime: { date: string; count: number }[];
  hardwareDistribution: { name: string; count: number; percentage: number }[];
  marginDistribution: { category: "positive" | "neutral" | "negative"; count: number; percentage: number }[];
  totalRevenue: number;
  // Neue Felder
  vvlStats: VVLStats;
  vvlsByTeam: VVLByTeam[];
  provisionByMonth: MonthlyAmount[];
  totalProvision: number;
  ekVsProvision: EkVsProvision;
  totalContracts: number;
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

function calculateVVLUrgency(vvlDate: string | null): "critical" | "warning" | "ok" | "upcoming" | null {
  if (!vvlDate) return null;
  const today = startOfDay(new Date());
  const vvl = startOfDay(parseISO(vvlDate));
  const daysUntilVVL = differenceInDays(vvl, today);
  
  if (daysUntilVVL < 0) return null; // Bereits vergangen
  if (daysUntilVVL <= 30) return "critical";
  if (daysUntilVVL <= 60) return "warning";
  if (daysUntilVVL <= 90) return "ok";
  return "upcoming";
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
          vvlStats: { total: 0, critical: 0, warning: 0, ok: 0, upcoming: 0 },
          vvlsByTeam: [],
          provisionByMonth: [],
          totalProvision: 0,
          ekVsProvision: { totalEk: 0, totalProvision: 0, difference: 0, byMonth: [] },
          totalContracts: 0,
        };
      }

      // Parallel Queries
      const [offersResult, contractsResult, teamMembersResult] = await Promise.all([
        // Angebote
        supabase
          .from("saved_offers")
          .select("id, name, config, preview, created_at, customer_id")
          .eq("is_draft", false)
          .gte("created_at", dateRange.start.toISOString())
          .lte("created_at", dateRange.end.toISOString())
          .order("created_at", { ascending: true }),
        
        // Verträge (alle für VVL-Analyse, nicht nur im Zeitraum)
        supabase
          .from("customer_contracts")
          .select("id, vvl_datum, provision_erhalten, ek_preis, vertragsbeginn, tarif_name, hardware_name, user_id, created_at")
          .eq("status", "aktiv"),
        
        // Team-Zuordnungen
        supabase
          .from("team_members")
          .select("user_id, team_id, teams(id, name)")
      ]);

      if (offersResult.error) throw offersResult.error;
      if (contractsResult.error) throw contractsResult.error;
      
      const offersData = (offersResult.data || []) as unknown as OfferData[];
      const contractsData = (contractsResult.data || []) as unknown as ContractData[];
      const teamMembers = (teamMembersResult.data || []) as unknown as TeamMemberData[];

      // Team-Map erstellen
      const userToTeam = new Map<string, string>();
      teamMembers.forEach((tm) => {
        if (tm.teams?.name) {
          userToTeam.set(tm.user_id, tm.teams.name);
        }
      });

      // === ANGEBOTE-STATISTIKEN ===
      const totalOffers = offersData.length;

      // Average margin
      const margins = offersData
        .filter((o) => o.preview?.dealerMargin !== undefined)
        .map((o) => o.preview!.dealerMargin!);
      const avgMargin = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;

      // Total revenue
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

      // === VERTRAGS-STATISTIKEN ===
      const totalContracts = contractsData.length;

      // VVL-Statistiken
      const vvlStats: VVLStats = { total: 0, critical: 0, warning: 0, ok: 0, upcoming: 0 };
      const vvlByTeamMap = new Map<string, { count: number; critical: number }>();

      contractsData.forEach((contract) => {
        const urgency = calculateVVLUrgency(contract.vvl_datum);
        if (urgency) {
          vvlStats.total++;
          vvlStats[urgency]++;

          // Team-Zuordnung
          const teamName = userToTeam.get(contract.user_id) || "Ohne Team";
          const existing = vvlByTeamMap.get(teamName) || { count: 0, critical: 0 };
          existing.count++;
          if (urgency === "critical") existing.critical++;
          vvlByTeamMap.set(teamName, existing);
        }
      });

      const vvlsByTeam: VVLByTeam[] = Array.from(vvlByTeamMap.entries())
        .map(([teamName, data]) => ({ teamName, ...data }))
        .sort((a, b) => b.count - a.count);

      // Provisions-Statistiken (Verträge im Zeitraum)
      const contractsInRange = contractsData.filter((c) => {
        if (!c.vertragsbeginn) return false;
        const start = parseISO(c.vertragsbeginn);
        return start >= dateRange.start && start <= dateRange.end;
      });

      // Monate im Zeitraum
      const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
      const provisionByMonthMap = new Map<string, number>();
      const ekByMonthMap = new Map<string, number>();

      months.forEach((month) => {
        const key = format(month, "yyyy-MM");
        provisionByMonthMap.set(key, 0);
        ekByMonthMap.set(key, 0);
      });

      contractsInRange.forEach((contract) => {
        if (!contract.vertragsbeginn) return;
        const monthKey = format(parseISO(contract.vertragsbeginn), "yyyy-MM");
        
        if (provisionByMonthMap.has(monthKey)) {
          const currentProv = provisionByMonthMap.get(monthKey) || 0;
          provisionByMonthMap.set(monthKey, currentProv + (contract.provision_erhalten || 0));
          
          const currentEk = ekByMonthMap.get(monthKey) || 0;
          ekByMonthMap.set(monthKey, currentEk + (contract.ek_preis || 0));
        }
      });

      const provisionByMonth: MonthlyAmount[] = Array.from(provisionByMonthMap.entries())
        .map(([month, amount]) => ({
          month: format(parseISO(month + "-01"), "MMM yy", { locale: de }),
          amount,
        }));

      const totalProvision = Array.from(provisionByMonthMap.values()).reduce((a, b) => a + b, 0);
      const totalEk = Array.from(ekByMonthMap.values()).reduce((a, b) => a + b, 0);

      // EK vs Provision
      const ekVsProvision: EkVsProvision = {
        totalEk,
        totalProvision,
        difference: totalProvision - totalEk,
        byMonth: Array.from(provisionByMonthMap.entries()).map(([month, provision]) => {
          const ek = ekByMonthMap.get(month) || 0;
          return {
            month: format(parseISO(month + "-01"), "MMM yy", { locale: de }),
            ek,
            provision,
            diff: provision - ek,
          };
        }),
      };

      return {
        totalOffers,
        avgMargin,
        topTariff,
        offersOverTime,
        hardwareDistribution,
        marginDistribution,
        totalRevenue,
        vvlStats,
        vvlsByTeam,
        provisionByMonth,
        totalProvision,
        ekVsProvision,
        totalContracts,
      };
    },
    enabled: !!user,
  });
}
