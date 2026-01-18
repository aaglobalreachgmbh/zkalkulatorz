/**
 * Hook für das Außendienst-Dashboard
 * 
 * Lädt Daten für heute fällige Kunden, ausstehende Berichte und Sync-Status.
 * Unterstützt Offline-Caching.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { useNetworkStatus } from "./useNetworkStatus";
import { useOfflineMode } from "./useOfflineMode";
import { offlineStorage } from "@/lib/offlineStorage";
import { format, addDays, startOfDay, endOfDay } from "date-fns";

interface TodayCustomer {
  id: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  address: string | null;
  reason: "vvl" | "appointment" | "open_offer" | "overdue_visit";
  reasonDetail: string;
  urgency: "high" | "medium" | "low";
}

interface PendingReport {
  id: string;
  customer_name: string;
  visit_date: string;
  days_overdue: number;
}

interface FieldServiceData {
  todayCustomers: TodayCustomer[];
  pendingReports: PendingReport[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFieldServiceDashboard(): FieldServiceData {
  const { identity } = useIdentity();
  const { isOnline } = useNetworkStatus();
  const { stats: offlineStats } = useOfflineMode();

  const userId = identity?.userId;
  const tenantId = identity?.tenantId;

  // Fetch today's customers
  const todayCustomersQuery = useQuery({
    queryKey: ["field-dashboard-customers", userId, tenantId],
    queryFn: async (): Promise<TodayCustomer[]> => {
      if (!userId || !tenantId) return [];

      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const vvlThreshold = format(addDays(today, 30), "yyyy-MM-dd");

      const customers: TodayCustomer[] = [];

      // 1. Kunden mit VVL in den nächsten 30 Tagen
      const { data: vvlContracts, error: vvlError } = await supabase
        .from("customer_contracts")
        .select(`
          id,
          vvl_datum,
          customer_id,
          customers!inner (
            id, company_name, contact_name, phone, strasse, hausnummer, plz, ort
          )
        `)
        .eq("user_id", userId)
        .gte("vvl_datum", format(today, "yyyy-MM-dd"))
        .lte("vvl_datum", vvlThreshold)
        .order("vvl_datum", { ascending: true })
        .limit(10);

      if (!vvlError && vvlContracts) {
        vvlContracts.forEach((contract: any) => {
          const customer = contract.customers;
          if (customer) {
            const daysUntilVVL = Math.ceil(
              (new Date(contract.vvl_datum).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            customers.push({
              id: customer.id,
              company_name: customer.company_name,
              contact_name: customer.contact_name,
              phone: customer.phone,
              address: customer.strasse ? `${customer.strasse} ${customer.hausnummer || ""}, ${customer.plz || ""} ${customer.ort || ""}` : null,
              reason: "vvl",
              reasonDetail: `VVL in ${daysUntilVVL} Tagen`,
              urgency: daysUntilVVL <= 7 ? "high" : daysUntilVVL <= 14 ? "medium" : "low",
            });
          }
        });
      }

      // 2. Heutige Termine
      const { data: todayEvents, error: eventsError } = await supabase
        .from("calendar_events")
        .select(`
          id, title, start_time, customer_id,
          customers (
            id, company_name, contact_name, phone, strasse, hausnummer, plz, ort
          )
        `)
        .eq("user_id", userId)
        .gte("start_time", todayStart.toISOString())
        .lte("start_time", todayEnd.toISOString())
        .order("start_time", { ascending: true });

      if (!eventsError && todayEvents) {
        todayEvents.forEach((event: any) => {
          if (event.customers) {
            const customer = event.customers;
            customers.push({
              id: customer.id,
              company_name: customer.company_name,
              contact_name: customer.contact_name,
              phone: customer.phone,
              address: customer.strasse ? `${customer.strasse} ${customer.hausnummer || ""}, ${customer.plz || ""} ${customer.ort || ""}` : null,
              reason: "appointment",
              reasonDetail: `Termin ${format(new Date(event.start_time), "HH:mm")}`,
              urgency: "high",
            });
          }
        });
      }

      // 3. Offene Angebote (pending status)
      const { data: openOffers, error: offersError } = await supabase
        .from("saved_offers")
        .select(`
          id, name, created_at, customer_id,
          customers (
            id, company_name, contact_name, phone, strasse, hausnummer, plz, ort
          )
        `)
        .eq("user_id", userId)
        .eq("status", "sent")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!offersError && openOffers) {
        openOffers.forEach((offer: any) => {
          if (offer.customers) {
            const customer = offer.customers;
            // Vermeiden von Duplikaten
            if (!customers.some(c => c.id === customer.id)) {
              customers.push({
                id: customer.id,
                company_name: customer.company_name,
                contact_name: customer.contact_name,
                phone: customer.phone,
                address: customer.strasse ? `${customer.strasse} ${customer.hausnummer || ""}, ${customer.plz || ""} ${customer.ort || ""}` : null,
                reason: "open_offer",
                reasonDetail: `Offenes Angebot: ${offer.name}`,
                urgency: "medium",
              });
            }
          }
        });
      }

      // Cache für offline
      if (customers.length > 0) {
        try {
          await offlineStorage.cacheCustomers(customers.map(c => ({
            id: c.id,
            company_name: c.company_name,
            contact_name: c.contact_name,
            phone: c.phone,
          })));
        } catch (e) {
          console.warn("[useFieldServiceDashboard] Caching failed:", e);
        }
      }

      return customers;
    },
    enabled: !!userId && !!tenantId && isOnline,
    staleTime: 5 * 60 * 1000, // 5 Minuten
    retry: false,
  });

  // Fetch pending visit reports
  const pendingReportsQuery = useQuery({
    queryKey: ["field-dashboard-pending-reports", userId],
    queryFn: async (): Promise<PendingReport[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("visit_reports")
        .select(`
          id, visit_date, status, customer_id,
          customers (company_name)
        `)
        .eq("user_id", userId)
        .eq("status", "draft")
        .order("visit_date", { ascending: false })
        .limit(10);

      if (error) {
        console.warn("[useFieldServiceDashboard] Pending reports error:", error.message);
        return [];
      }

      const today = new Date();
      return (data || []).map((report: any) => {
        const visitDate = new Date(report.visit_date);
        const daysOverdue = Math.floor((today.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: report.id,
          customer_name: report.customers?.company_name || "Unbekannt",
          visit_date: report.visit_date,
          days_overdue: daysOverdue,
        };
      });
    },
    enabled: !!userId && isOnline,
    staleTime: 2 * 60 * 1000, // 2 Minuten
    retry: false,
  });

  // Offline fallback - load from cache if offline
  const offlineCustomersQuery = useQuery({
    queryKey: ["field-dashboard-offline-customers"],
    queryFn: async (): Promise<TodayCustomer[]> => {
      const cached = await offlineStorage.getCachedCustomers();
      return cached.map((c: any) => ({
        id: c.id,
        company_name: c.company_name,
        contact_name: c.contact_name,
        phone: c.phone,
        address: null,
        reason: "open_offer" as const,
        reasonDetail: "Aus Cache geladen",
        urgency: "low" as const,
      }));
    },
    enabled: !isOnline,
    staleTime: Infinity,
  });

  const isLoading = isOnline 
    ? todayCustomersQuery.isLoading || pendingReportsQuery.isLoading
    : offlineCustomersQuery.isLoading;

  const error = isOnline
    ? (todayCustomersQuery.error as Error) || (pendingReportsQuery.error as Error)
    : (offlineCustomersQuery.error as Error);

  const todayCustomers = isOnline
    ? todayCustomersQuery.data || []
    : offlineCustomersQuery.data || [];

  const pendingReports = isOnline
    ? pendingReportsQuery.data || []
    : [];

  const refetch = () => {
    if (isOnline) {
      todayCustomersQuery.refetch();
      pendingReportsQuery.refetch();
    }
  };

  return {
    todayCustomers,
    pendingReports,
    isLoading,
    error: error || null,
    refetch,
  };
}
