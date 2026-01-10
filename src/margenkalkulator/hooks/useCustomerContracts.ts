import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface CustomerContract {
  id: string;
  customer_id: string;
  user_id: string;
  netz: string;
  tarif_name: string | null;
  handy_nr: string | null;
  vertragsbeginn: string | null;
  vertragsende: string | null;
  vvl_datum: string | null;
  status: string;
  hardware_name: string | null;
  ek_preis: number | null;
  monatspreis: number | null;
  provision_erhalten: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractInput {
  customer_id: string;
  netz?: string;
  tarif_name?: string;
  handy_nr?: string;
  vertragsbeginn?: string;
  vertragsende?: string;
  vvl_datum?: string;
  status?: string;
  hardware_name?: string;
  ek_preis?: number;
  monatspreis?: number;
  provision_erhalten?: number;
  notes?: string;
}

export type VVLUrgency = 'critical' | 'warning' | 'ok' | 'future' | 'none';

// VVL Helper Functions
export function getRemainingDays(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getRemainingTime(dateStr: string | null): { days: number; months: number } | null {
  const days = getRemainingDays(dateStr);
  if (days === null) return null;
  return {
    days,
    months: Math.round(days / 30),
  };
}

export function isVVLReady(vvl_datum: string | null): boolean {
  const days = getRemainingDays(vvl_datum);
  if (days === null) return false;
  return days <= 0;
}

// NEW: Color coding per user request:
// 🔴 Rot (critical): < 30 Tage (inkl. überfällig)
// 🟡 Gelb (warning): 30-60 Tage
// 🟢 Grün (ok): 60-90 Tage
// ⚪ Grau (future): > 90 Tage
export function getVVLUrgency(vvl_datum: string | null): VVLUrgency {
  const days = getRemainingDays(vvl_datum);
  if (days === null) return 'none';
  if (days < 30) return 'critical';    // Rot: < 30 Tage (inkl. überfällig)
  if (days < 60) return 'warning';     // Gelb: 30-60 Tage
  if (days <= 90) return 'ok';         // Grün: 60-90 Tage
  return 'future';                     // Grau: > 90 Tage
}

export function getVVLUrgencyConfig(urgency: VVLUrgency) {
  const configs = {
    critical: { 
      label: 'Dringend', 
      color: 'bg-red-500/20 text-red-600 border-red-500/30',
      dotColor: 'bg-red-500',
      priority: 0,
      description: '< 30 Tage – Sofort kontaktieren'
    },
    warning: { 
      label: 'Bald', 
      color: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
      dotColor: 'bg-amber-500',
      priority: 1,
      description: '30-60 Tage – In Planung nehmen'
    },
    ok: { 
      label: 'Vormerken', 
      color: 'bg-green-500/20 text-green-600 border-green-500/30',
      dotColor: 'bg-green-500',
      priority: 2,
      description: '60-90 Tage – Vormerken'
    },
    future: { 
      label: 'Später', 
      color: 'bg-muted text-muted-foreground border-border',
      dotColor: 'bg-muted-foreground',
      priority: 3,
      description: '> 90 Tage'
    },
    none: { 
      label: 'Kein VVL', 
      color: 'bg-muted text-muted-foreground border-border',
      dotColor: 'bg-muted-foreground',
      priority: 4,
      description: 'Kein Datum hinterlegt'
    },
  };
  return configs[urgency];
}

export const NETZ_CONFIG = {
  vodafone: { label: 'Vodafone', color: 'bg-red-500', textColor: 'text-red-600' },
  o2: { label: 'O2', color: 'bg-blue-600', textColor: 'text-blue-600' },
  telekom: { label: 'Telekom', color: 'bg-pink-500', textColor: 'text-pink-600' },
  freenet: { label: 'Freenet', color: 'bg-green-600', textColor: 'text-green-600' },
} as const;

// Extended contract with customer info
export interface ContractWithCustomer extends CustomerContract {
  customer?: {
    id: string;
    company_name: string;
    contact_name: string | null;
    vorname: string | null;
    nachname: string | null;
  };
}

// Hook
export function useCustomerContracts(customerId?: string) {
  const queryClient = useQueryClient();

  // Fetch contracts for a specific customer
  const contractsQuery = useQuery({
    queryKey: ["customer-contracts", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from("customer_contracts")
        .select("*")
        .eq("customer_id", customerId)
        .order("vvl_datum", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as CustomerContract[];
    },
    enabled: !!customerId,
  });

  // Create contract
  const createContract = useMutation({
    mutationFn: async (input: ContractInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("customer_contracts")
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["all-contracts"] });
      toast.success("Vertrag erstellt");
    },
    onError: (error) => {
      toast.error("Fehler beim Erstellen", { description: error.message });
    },
  });

  // Update contract
  const updateContract = useMutation({
    mutationFn: async ({ id, ...input }: Partial<ContractInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("customer_contracts")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["all-contracts"] });
      toast.success("Vertrag aktualisiert");
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren", { description: error.message });
    },
  });

  // Delete contract
  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customer_contracts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["all-contracts"] });
      toast.success("Vertrag gelöscht");
    },
    onError: (error) => {
      toast.error("Fehler beim Löschen", { description: error.message });
    },
  });

  return {
    contracts: contractsQuery.data ?? [],
    isLoading: contractsQuery.isLoading,
    error: contractsQuery.error,
    createContract,
    updateContract,
    deleteContract,
  };
}

// Hook for all contracts (VVL overview)
export function useAllContracts() {
  return useQuery({
    queryKey: ["all-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_contracts")
        .select(`
          *,
          customer:customers!customer_contracts_customer_id_fkey (
            id,
            company_name,
            contact_name,
            vorname,
            nachname
          )
        `)
        .order("vvl_datum", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as ContractWithCustomer[];
    },
  });
}

// Hook to get counts by urgency
export function useVVLCounts() {
  const { data: contracts, isLoading, isError } = useAllContracts();
  
  // Return safe defaults if loading, error, or no data
  const safeContracts = contracts ?? [];
  
  const counts = {
    critical: 0,
    warning: 0,
    ok: 0,
    future: 0,
    none: 0,
    total: safeContracts.length,
  };

  // Skip counting if loading or error
  if (isLoading || isError || !contracts) {
    return counts;
  }

  safeContracts.forEach((contract) => {
    if (contract.status !== 'aktiv') return;
    const urgency = getVVLUrgency(contract.vvl_datum);
    counts[urgency]++;
  });

  return counts;
}
