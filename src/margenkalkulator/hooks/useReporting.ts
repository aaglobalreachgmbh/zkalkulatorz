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
  monatspreis: number | null;
  vertragsbeginn: string | null;
  tarif_name: string | null;
  hardware_name: string | null;
  user_id: string;
  customer_id: string;
  created_at: string;
}

interface CustomerData {
  id: string;
  company_name: string;
  user_id: string;
  customer_status: string | null;
  won_at: string | null;
}

interface TeamMemberData {
  user_id: string;
  team_id: string;
  teams: {
    id: string;
    name: string;
  } | null;
}

interface ProfileData {
  id: string;
  display_name: string | null;
  email: string | null;
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

// NEU: Akquirierter Umsatz
export interface AcquiredSale {
  date: string;
  customerId: string;
  customerName: string;
  monthlyRevenue: number;
  contractCount: number;
}

export interface SalesLeaderboardEntry {
  userId: string;
  userName: string;
  monthlyRevenue: number;
  yearlyRevenue: number;
  customerCount: number;
  contractCount: number;
  sales: AcquiredSale[];
}

export interface AcquiredRevenue {
  monthly: number;
  yearly: number;
  customerCount: number;
  contractCount: number;
}

export interface ReportingStats {
  totalOffers: number;
  avgMargin: number;
  topTariff: { name: string; count: number; percentage: number } | null;
  offersOverTime: { date: string; count: number }[];
  hardwareDistribution: { name: string; count: number; percentage: number }[];
  marginDistribution: { category: "positive" | "neutral" | "negative"; count: number; percentage: number }[];
  totalRevenue: number;
  // VVL Felder
  vvlStats: VVLStats;
  vvlsByTeam: VVLByTeam[];
  provisionByMonth: MonthlyAmount[];
  totalProvision: number;
  ekVsProvision: EkVsProvision;
  totalContracts: number;
  // NEU: Akquirierter Umsatz & Sales Leaderboard
  acquiredRevenue: AcquiredRevenue;
  salesLeaderboard: SalesLeaderboardEntry[];
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
          acquiredRevenue: { monthly: 0, yearly: 0, customerCount: 0, contractCount: 0 },
          salesLeaderboard: [],
        };
      }

      // Parallel Queries
      const [offersResult, contractsResult, teamMembersResult, customersResult, profilesResult] = await Promise.all([
        // Angebote
        supabase
          .from("saved_offers")
          .select("id, name, config, preview, created_at, customer_id")
          .eq("is_draft", false)
          .gte("created_at", dateRange.start.toISOString())
          .lte("created_at", dateRange.end.toISOString())
          .order("created_at", { ascending: true }),
        
        // Verträge (alle für VVL-Analyse + inkl. monatspreis und customer_id)
        supabase
          .from("customer_contracts")
          .select("id, vvl_datum, provision_erhalten, ek_preis, monatspreis, vertragsbeginn, tarif_name, hardware_name, user_id, customer_id, created_at")
          .eq("status", "aktiv"),
        
        // Team-Zuordnungen
        supabase
          .from("team_members")
          .select("user_id, team_id, teams(id, name)"),
        
        // Kunden (für akquirierten Umsatz)
        supabase
          .from("customers")
          .select("id, company_name, user_id, customer_status, won_at"),
        
        // Profile (für Verkäufer-Namen)
        supabase
          .from("profiles")
          .select("id, display_name, email")
      ]);

      if (offersResult.error) throw offersResult.error;
      if (contractsResult.error) throw contractsResult.error;
      
      const offersData = (offersResult.data || []) as unknown as OfferData[];
      const contractsData = (contractsResult.data || []) as unknown as ContractData[];
      const teamMembers = (teamMembersResult.data || []) as unknown as TeamMemberData[];
      const customersData = (customersResult.data || []) as unknown as CustomerData[];
      const profilesData = (profilesResult.data || []) as unknown as ProfileData[];

      // Team-Map erstellen
      const userToTeam = new Map<string, string>();
      teamMembers.forEach((tm) => {
        if (tm.teams?.name) {
          userToTeam.set(tm.user_id, tm.teams.name);
        }
      });

      // Profile-Map erstellen
      const userToProfile = new Map<string, ProfileData>();
      profilesData.forEach((p) => {
        userToProfile.set(p.id, p);
      });

      // Kunden-Map erstellen
      const customerMap = new Map<string, CustomerData>();
      customersData.forEach((c) => {
        customerMap.set(c.id, c);
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

      // === AKQUIRIERTER UMSATZ (Kunden mit Status "gewonnen") ===
      const wonCustomers = customersData.filter(c => c.customer_status === "gewonnen");
      const wonCustomerIds = new Set(wonCustomers.map(c => c.id));
      
      // Verträge der gewonnenen Kunden
      const wonContracts = contractsData.filter(c => wonCustomerIds.has(c.customer_id));
      
      // Akquirierter Umsatz berechnen
      const acquiredMonthly = wonContracts.reduce((sum, c) => sum + (c.monatspreis || 0), 0);
      const acquiredRevenue: AcquiredRevenue = {
        monthly: acquiredMonthly,
        yearly: acquiredMonthly * 12,
        customerCount: wonCustomers.length,
        contractCount: wonContracts.length,
      };

      // === SALES LEADERBOARD ===
      const salesByUserMap = new Map<string, {
        monthlyRevenue: number;
        customerIds: Set<string>;
        contractCount: number;
        sales: AcquiredSale[];
      }>();

      // Gruppiere Verträge nach User und Kunde
      wonContracts.forEach(contract => {
        const customer = customerMap.get(contract.customer_id);
        if (!customer) return;

        const userId = customer.user_id;
        const existing = salesByUserMap.get(userId) || {
          monthlyRevenue: 0,
          customerIds: new Set<string>(),
          contractCount: 0,
          sales: [],
        };

        existing.monthlyRevenue += contract.monatspreis || 0;
        existing.contractCount++;
        
        if (!existing.customerIds.has(customer.id)) {
          existing.customerIds.add(customer.id);
          
          // Berechne Gesamtumsatz für diesen Kunden
          const customerContracts = wonContracts.filter(c => c.customer_id === customer.id);
          const customerMonthly = customerContracts.reduce((sum, c) => sum + (c.monatspreis || 0), 0);
          
          existing.sales.push({
            date: customer.won_at || customer.id, // Fallback falls kein won_at
            customerId: customer.id,
            customerName: customer.company_name,
            monthlyRevenue: customerMonthly,
            contractCount: customerContracts.length,
          });
        }

        salesByUserMap.set(userId, existing);
      });

      // Konvertiere zu Array und sortiere
      const salesLeaderboard: SalesLeaderboardEntry[] = Array.from(salesByUserMap.entries())
        .map(([userId, data]) => {
          const profile = userToProfile.get(userId);
          return {
            userId,
            userName: profile?.display_name || profile?.email || "Unbekannt",
            monthlyRevenue: data.monthlyRevenue,
            yearlyRevenue: data.monthlyRevenue * 12,
            customerCount: data.customerIds.size,
            contractCount: data.contractCount,
            sales: data.sales.sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
          };
        })
        .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);

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
        acquiredRevenue,
        salesLeaderboard,
      };
    },
    enabled: !!user,
  });
}
