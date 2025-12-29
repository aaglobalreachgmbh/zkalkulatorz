import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

export interface Customer {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  notes: string | null;
  // Neue Mocca-Felder
  anrede: string | null;
  vorname: string | null;
  nachname: string | null;
  strasse: string | null;
  hausnummer: string | null;
  plz: string | null;
  ort: string | null;
  festnetz: string | null;
  handy_nr: string | null;
  geburtstag: string | null;
  customer_status: string | null;
  vip_kunde: boolean | null;
  marketing_sms: boolean | null;
  marketing_email: boolean | null;
  marketing_brief: boolean | null;
  // Meta
  external_id: string | null;
  external_refs: Record<string, unknown> | null;
  mocca_customer_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  industry?: string;
  notes?: string;
  // Neue Mocca-Felder
  anrede?: string;
  vorname?: string;
  nachname?: string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  festnetz?: string;
  handy_nr?: string;
  geburtstag?: string;
  customer_status?: string;
  vip_kunde?: boolean;
  marketing_sms?: boolean;
  marketing_email?: boolean;
  marketing_brief?: boolean;
}

export function useCustomers() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();
  const { trackCustomerCreated, trackCustomerUpdated, trackCustomerDeleted } = useActivityTracker();

  const customersQuery = useQuery({
    queryKey: ["customers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("company_name", { ascending: true });

      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!user,
  });

  const createCustomer = useMutation({
    mutationFn: async (input: CustomerInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("customers")
        .insert({
          user_id: user.id,
          tenant_id: identity.tenantId,
          company_name: input.company_name,
          contact_name: input.contact_name || null,
          email: input.email || null,
          phone: input.phone || null,
          industry: input.industry || null,
          notes: input.notes || null,
          // Neue Felder
          anrede: input.anrede || null,
          vorname: input.vorname || null,
          nachname: input.nachname || null,
          strasse: input.strasse || null,
          hausnummer: input.hausnummer || null,
          plz: input.plz || null,
          ort: input.ort || null,
          festnetz: input.festnetz || null,
          handy_nr: input.handy_nr || null,
          geburtstag: input.geburtstag || null,
          customer_status: input.customer_status || "aktiv",
          vip_kunde: input.vip_kunde ?? false,
          marketing_sms: input.marketing_sms ?? false,
          marketing_email: input.marketing_email ?? false,
          marketing_brief: input.marketing_brief ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Kunde erstellt");
      trackCustomerCreated(data.id, data.company_name);
    },
    onError: (error) => {
      toast.error("Fehler beim Erstellen: " + error.message);
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...input }: CustomerInput & { id: string }) => {
      const { data, error } = await supabase
        .from("customers")
        .update({
          company_name: input.company_name,
          contact_name: input.contact_name || null,
          email: input.email || null,
          phone: input.phone || null,
          industry: input.industry || null,
          notes: input.notes || null,
          // Neue Felder
          anrede: input.anrede || null,
          vorname: input.vorname || null,
          nachname: input.nachname || null,
          strasse: input.strasse || null,
          hausnummer: input.hausnummer || null,
          plz: input.plz || null,
          ort: input.ort || null,
          festnetz: input.festnetz || null,
          handy_nr: input.handy_nr || null,
          geburtstag: input.geburtstag || null,
          customer_status: input.customer_status || "aktiv",
          vip_kunde: input.vip_kunde ?? false,
          marketing_sms: input.marketing_sms ?? false,
          marketing_email: input.marketing_email ?? false,
          marketing_brief: input.marketing_brief ?? false,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Kunde aktualisiert");
      trackCustomerUpdated(data.id, data.company_name);
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (customer: { id: string; company_name: string }) => {
      const { error } = await supabase.from("customers").delete().eq("id", customer.id);
      if (error) throw error;
      return customer;
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Kunde gelöscht");
      trackCustomerDeleted(customer.id, customer.company_name);
    },
    onError: (error) => {
      toast.error("Fehler beim Löschen: " + error.message);
    },
  });

  return {
    customers: customersQuery.data ?? [],
    isLoading: customersQuery.isLoading,
    error: customersQuery.error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
