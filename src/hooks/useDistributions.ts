/**
 * Hook für Distribution-Management
 * 
 * Verwaltet Distributionen und Partner-Zuordnungen für das Multi-Tenant SaaS-Modell.
 * 
 * Note: Uses explicit type assertions as DB types are dynamically generated.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ============================================
// Types
// ============================================

export interface DistributionBranding {
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  badge_hidden?: boolean;
  [key: string]: string | boolean | undefined; // Index signature for Json compatibility
}

export interface Distribution {
  id: string;
  name: string;
  slug: string;
  branding: DistributionBranding;
  features: Record<string, boolean>;
  max_partners: number;
  default_provision_split: number;
  contact_email: string | null;
  contact_phone: string | null;
  address: Record<string, string>;
  status: "active" | "suspended" | "trial";
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface DistributionPartner {
  id: string;
  distribution_id: string;
  tenant_id: string;
  provision_split_pct: number | null;
  branding_override: DistributionBranding | null;
  status: "pending" | "active" | "suspended" | "revoked";
  invited_by: string | null;
  invited_email: string | null;
  invite_token: string | null;
  invite_expires_at: string | null;
  onboarded_at: string | null;
  onboarded_by: string | null;
  max_seats: number;
  max_users: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDistributionInput {
  name: string;
  slug: string;
  branding?: DistributionBranding;
  default_provision_split?: number;
  contact_email?: string;
  max_partners?: number;
}

export interface InvitePartnerInput {
  distribution_id: string;
  email: string;
  tenant_id?: string;
  provision_split_pct?: number;
  max_seats?: number;
}

// ============================================
// Separate Hook for Distribution Partners
// ============================================

export function useDistributionPartners(distributionId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["distribution-partners", distributionId],
    queryFn: async () => {
      if (!distributionId) return [];

      const { data, error } = await supabase
        .from("distribution_partners" as never)
        .select("*")
        .eq("distribution_id", distributionId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[useDistributionPartners] Query error:", error);
        return [];
      }
      return (data ?? []) as DistributionPartner[];
    },
    enabled: !!user && !!distributionId,
  });
}

// ============================================
// Main Hook
// ============================================

export function useDistributions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all distributions (admin only)
  const distributionsQuery = useQuery({
    queryKey: ["distributions"],
    queryFn: async () => {
      // Using raw SQL via RPC to avoid type generation issues
      const { data, error } = await supabase
        .from("distributions" as never)
        .select("*")
        .order("name");

      if (error) {
        console.warn("[useDistributions] Query error:", error);
        return [];
      }
      return (data ?? []) as Distribution[];
    },
    enabled: !!user,
  });

  // Fetch my distribution (current tenant's distribution)
  const myDistributionQuery = useQuery({
    queryKey: ["my-distribution"],
    queryFn: async () => {
      try {
        const { data: distributionId, error: rpcError } = await supabase
          .rpc("get_my_distribution_id");

        if (rpcError) {
          console.warn("Distribution lookup failed:", rpcError.message);
          return null;
        }
        if (!distributionId) return null;

        const { data: distribution, error: distError } = await supabase
          .from("distributions" as never)
          .select("*")
          .eq("id", distributionId)
          .maybeSingle();

        if (distError) {
          console.warn("Distribution fetch failed:", distError.message);
          return null;
        }
        return distribution as Distribution | null;
      } catch (e) {
        console.warn("Unexpected error in distribution query:", e);
        return null;
      }
    },
    enabled: !!user,
  });

  // Create distribution (admin only)
  const createDistribution = useMutation({
    mutationFn: async (input: CreateDistributionInput) => {
      const insertData = {
        name: input.name,
        slug: input.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        branding: input.branding || {},
        default_provision_split: input.default_provision_split || 0,
        contact_email: input.contact_email,
        max_partners: input.max_partners || 100,
        created_by: user?.id,
      };

      const { data, error } = await supabase
        .from("distributions" as never)
        .insert(insertData as never)
        .select()
        .single();

      if (error) {
        console.warn("[useDistributions] Create distribution error:", error);
        throw error;
      }
      return data as Distribution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributions"] });
      toast.success("Distribution erstellt");
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Update distribution
  const updateDistribution = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Distribution> & { id: string }) => {
      const { data, error } = await supabase
        .from("distributions" as never)
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.warn("[useDistributions] Update distribution error:", error);
        throw error;
      }
      return data as Distribution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributions"] });
      queryClient.invalidateQueries({ queryKey: ["my-distribution"] });
      toast.success("Distribution aktualisiert");
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Invite partner
  const invitePartner = useMutation({
    mutationFn: async (input: InvitePartnerInput) => {
      // Generate invite token
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

      const insertData = {
        distribution_id: input.distribution_id,
        tenant_id: input.tenant_id || `tenant_${crypto.randomUUID().slice(0, 8)}`,
        invited_by: user?.id,
        invited_email: input.email,
        invite_token: inviteToken,
        invite_expires_at: expiresAt.toISOString(),
        provision_split_pct: input.provision_split_pct,
        max_seats: input.max_seats || 10,
        status: "pending",
      };

      const { data, error } = await supabase
        .from("distribution_partners" as never)
        .insert(insertData as never)
        .select()
        .single();

      if (error) {
        console.warn("[useDistributions] Invite partner error:", error);
        throw error;
      }
      return data as DistributionPartner;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["distribution-partners", variables.distribution_id] });
      toast.success("Partner eingeladen");
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Activate partner
  const activatePartner = useMutation({
    mutationFn: async ({ partnerId, distributionId }: { partnerId: string; distributionId: string }) => {
      const { data, error } = await supabase
        .from("distribution_partners" as never)
        .update({
          status: "active",
          onboarded_at: new Date().toISOString(),
          onboarded_by: user?.id,
        } as never)
        .eq("id", partnerId)
        .select()
        .single();

      if (error) {
        console.warn("[useDistributions] Activate partner error:", error);
        throw error;
      }
      const result = data as DistributionPartner;
      result.distribution_id = distributionId;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["distribution-partners", data.distribution_id] });
      toast.success("Partner aktiviert");
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Update partner
  const updatePartner = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DistributionPartner> & { id: string }) => {
      const { data, error } = await supabase
        .from("distribution_partners" as never)
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.warn("[useDistributions] Update partner error:", error);
        throw error;
      }
      return data as DistributionPartner;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["distribution-partners", data.distribution_id] });
      toast.success("Partner aktualisiert");
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Suspend partner
  const suspendPartner = useMutation({
    mutationFn: async ({ partnerId, distributionId }: { partnerId: string; distributionId: string }) => {
      const { data, error } = await supabase
        .from("distribution_partners" as never)
        .update({ status: "suspended" } as never)
        .eq("id", partnerId)
        .select()
        .single();

      if (error) {
        console.warn("[useDistributions] Suspend partner error:", error);
        throw error;
      }
      const result = data as DistributionPartner;
      result.distribution_id = distributionId;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["distribution-partners", data.distribution_id] });
      toast.success("Partner suspendiert");
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  return {
    // Queries
    distributions: distributionsQuery.data ?? [],
    isLoading: distributionsQuery.isLoading,
    myDistribution: myDistributionQuery.data,
    isLoadingMyDistribution: myDistributionQuery.isLoading,

    // Mutations
    createDistribution,
    updateDistribution,
    invitePartner,
    activatePartner,
    updatePartner,
    suspendPartner,
  };
}
