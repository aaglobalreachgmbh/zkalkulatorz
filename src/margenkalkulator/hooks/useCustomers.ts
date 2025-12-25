import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
}

export function useCustomers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
          company_name: input.company_name,
          contact_name: input.contact_name || null,
          email: input.email || null,
          phone: input.phone || null,
          industry: input.industry || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Kunde erstellt");
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
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Kunde aktualisiert");
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Kunde gelöscht");
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
