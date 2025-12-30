// ============================================
// useRecentActivities Hook
// Kombinierte letzte Aktivitäten für Dashboard
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";

export interface RecentActivity {
  id: string;
  type: "offer" | "email" | "contract" | "customer";
  title: string;
  subtitle?: string;
  customerId?: string;
  customerName?: string;
  createdAt: Date;
  status?: string;
}

interface UseRecentActivitiesResult {
  activities: RecentActivity[];
  isLoading: boolean;
  error: Error | null;
}

export function useRecentActivities(limit: number = 10): UseRecentActivitiesResult {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const tenantId = identity.tenantId;

  const { data, isLoading, error } = useQuery({
    queryKey: ["recent-activities", tenantId, limit],
    queryFn: async (): Promise<RecentActivity[]> => {
      const activities: RecentActivity[] = [];

      // Fetch recent offers with customer info
      const { data: offers } = await supabase
        .from("saved_offers")
        .select(`
          id,
          name,
          created_at,
          is_draft,
          preview,
          customer_id,
          customers (company_name)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (offers) {
        offers.forEach((offer) => {
          const preview = offer.preview as { tariff?: string; hardware?: string } | null;
          activities.push({
            id: `offer-${offer.id}`,
            type: "offer",
            title: offer.name,
            subtitle: preview 
              ? `${preview.hardware || "SIM Only"} • ${preview.tariff || "Kein Tarif"}`
              : undefined,
            customerId: offer.customer_id || undefined,
            customerName: offer.customers?.company_name || undefined,
            createdAt: new Date(offer.created_at),
            status: offer.is_draft ? "draft" : "saved",
          });
        });
      }

      // Fetch recent emails with customer info
      const { data: emails } = await supabase
        .from("offer_emails")
        .select(`
          id,
          subject,
          created_at,
          status,
          recipient_name,
          customer_id,
          customers (company_name)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (emails) {
        emails.forEach((email) => {
          activities.push({
            id: `email-${email.id}`,
            type: "email",
            title: email.subject,
            subtitle: `An: ${email.recipient_name || "Kunde"}`,
            customerId: email.customer_id || undefined,
            customerName: email.customers?.company_name || undefined,
            createdAt: new Date(email.created_at),
            status: email.status,
          });
        });
      }

      // Fetch recent contracts with customer info
      const { data: contracts } = await supabase
        .from("customer_contracts")
        .select(`
          id,
          tarif_name,
          hardware_name,
          created_at,
          status,
          customer_id,
          customers (company_name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (contracts) {
        contracts.forEach((contract) => {
          activities.push({
            id: `contract-${contract.id}`,
            type: "contract",
            title: contract.tarif_name || "Vertrag",
            subtitle: contract.hardware_name || undefined,
            customerId: contract.customer_id,
            customerName: contract.customers?.company_name || undefined,
            createdAt: new Date(contract.created_at),
            status: contract.status,
          });
        });
      }

      // Fetch recent customers
      const { data: customers } = await supabase
        .from("customers")
        .select("id, company_name, contact_name, created_at, customer_status")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (customers) {
        customers.forEach((customer) => {
          activities.push({
            id: `customer-${customer.id}`,
            type: "customer",
            title: customer.company_name,
            subtitle: customer.contact_name || undefined,
            customerId: customer.id,
            customerName: customer.company_name,
            createdAt: new Date(customer.created_at),
            status: customer.customer_status || "aktiv",
          });
        });
      }

      // Sort by date and take top N
      return activities
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    },
    enabled: !!user && !!tenantId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  return {
    activities: data || [],
    isLoading,
    error: error as Error | null,
  };
}
