// ============================================
// Tenants Hook für Super-Admin Dashboard
// Verwaltet Kunden (Tenants) mit Lizenzen
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface Tenant {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone: string | null;
  address: Record<string, string> | null;
  status: "active" | "suspended" | "cancelled" | "trial";
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TenantWithLicense extends Tenant {
  license?: {
    id: string;
    plan: string;
    seat_limit: number;
    seats_used: number;
    valid_until: string | null;
    features: Record<string, boolean>;
  };
  allowed_domains?: string[];
  allowed_emails_count?: number;
  active_users_count?: number;
}

export interface CreateTenantInput {
  company_name: string;
  contact_email: string;
  contact_phone?: string;
  address?: Record<string, string>;
  admin_email: string;
  admin_name?: string;
  plan: string;
  seat_limit: number;
  valid_until?: string;
  allowed_domains?: string[];
}

// Hook
export function useTenants() {
  const queryClient = useQueryClient();

  // Fetch all tenants with license info
  const { data: tenants = [], isLoading, error } = useQuery({
    queryKey: ["tenants-admin"],
    queryFn: async () => {
      // Fetch tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (tenantsError) {
        console.warn("[useTenants] Error fetching tenants:", tenantsError);
        return [];
      }

      // Fetch licenses for all tenants
      const { data: licensesData } = await supabase
        .from("licenses")
        .select("*");

      // Fetch allowed domains count per tenant
      const { data: domainsData } = await supabase
        .from("tenant_allowed_domains")
        .select("tenant_id, domain");

      // Fetch allowed emails count per tenant
      const { data: emailsData } = await supabase
        .from("tenant_allowed_emails")
        .select("tenant_id, registered_at");

      // Map data together
      const result: TenantWithLicense[] = (tenantsData || []).map((tenant) => {
        const license = licensesData?.find((l) => l.tenant_id === tenant.id);
        const domains = domainsData?.filter((d) => d.tenant_id === tenant.id).map(d => d.domain) || [];
        const emailsForTenant = emailsData?.filter((e) => e.tenant_id === tenant.id) || [];
        const activeUsers = emailsForTenant.filter(e => e.registered_at).length;

        return {
          ...tenant,
          address: tenant.address as Record<string, string> | null,
          status: tenant.status as Tenant["status"],
          license: license ? {
            id: license.id,
            plan: license.plan,
            seat_limit: license.seat_limit,
            seats_used: license.seats_used,
            valid_until: license.valid_until,
            features: license.features as Record<string, boolean>,
          } : undefined,
          allowed_domains: domains,
          allowed_emails_count: emailsForTenant.length,
          active_users_count: activeUsers,
        };
      });

      return result;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (input: CreateTenantInput) => {
      // Generate tenant ID from company name
      const tenantId = `tenant_${input.company_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .substring(0, 30)}_${Date.now().toString(36)}`;

      // 1. Create tenant
      const { error: tenantError } = await supabase
        .from("tenants")
        .insert({
          id: tenantId,
          company_name: input.company_name,
          contact_email: input.contact_email,
          contact_phone: input.contact_phone || null,
          address: input.address || {},
          status: "active",
        });

      if (tenantError) throw tenantError;

      // 2. Create license
      const { error: licenseError } = await supabase
        .from("licenses")
        .insert({
          tenant_id: tenantId,
          plan: input.plan,
          seat_limit: input.seat_limit,
          seats_used: 0,
          valid_until: input.valid_until || null,
          features: {
            cloudSync: true,
            pdfExport: true,
            dataImport: true,
            aiConsultant: input.plan === "enterprise",
            pushProvisions: true,
            teamManagement: true,
            employeeManagement: true,
          },
        });

      if (licenseError) throw licenseError;

      // 3. Add allowed domains
      if (input.allowed_domains && input.allowed_domains.length > 0) {
        const domainsToInsert = input.allowed_domains.map(domain => ({
          tenant_id: tenantId,
          domain: domain.toLowerCase(),
        }));

        const { error: domainsError } = await supabase
          .from("tenant_allowed_domains")
          .insert(domainsToInsert);

        if (domainsError) console.warn("Failed to add domains:", domainsError);
      }

      // 4. Add admin email to allowlist with tenant_admin role
      const inviteToken = crypto.randomUUID();
      const { error: emailError } = await supabase
        .from("tenant_allowed_emails")
        .insert({
          tenant_id: tenantId,
          email: input.admin_email.toLowerCase(),
          role: "tenant_admin",
          invite_token: inviteToken,
          invited_at: new Date().toISOString(),
        });

      if (emailError) throw emailError;

      // 5. Send invitation email via edge function
      try {
        const { error: inviteError } = await supabase.functions.invoke("invite-user", {
          body: {
            email: input.admin_email,
            inviteToken,
            tenantName: input.company_name,
            role: "tenant_admin",
            senderName: "allenetze.de Team",
          },
        });

        if (inviteError) console.warn("Failed to send invite email:", inviteError);
      } catch (e) {
        console.warn("Failed to invoke invite function:", e);
      }

      return { tenantId, inviteToken };
    },
    onSuccess: () => {
      toast.success("Kunde erfolgreich angelegt und Einladung verschickt");
      queryClient.invalidateQueries({ queryKey: ["tenants-admin"] });
    },
    onError: (error) => {
      console.error("[useTenants] Create tenant error:", error);
      toast.error("Fehler beim Anlegen des Kunden");
    },
  });

  // Update tenant status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ tenantId, status }: { tenantId: string; status: Tenant["status"] }) => {
      const { error } = await supabase
        .from("tenants")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status aktualisiert");
      queryClient.invalidateQueries({ queryKey: ["tenants-admin"] });
    },
    onError: () => {
      toast.error("Fehler beim Aktualisieren");
    },
  });

  // Update license
  const updateLicenseMutation = useMutation({
    mutationFn: async ({
      tenantId,
      plan,
      seatLimit,
      validUntil,
    }: {
      tenantId: string;
      plan?: string;
      seatLimit?: number;
      validUntil?: string | null;
    }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (plan !== undefined) updates.plan = plan;
      if (seatLimit !== undefined) updates.seat_limit = seatLimit;
      if (validUntil !== undefined) updates.valid_until = validUntil;

      const { error } = await supabase
        .from("licenses")
        .update(updates)
        .eq("tenant_id", tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lizenz aktualisiert");
      queryClient.invalidateQueries({ queryKey: ["tenants-admin"] });
    },
    onError: () => {
      toast.error("Fehler beim Aktualisieren der Lizenz");
    },
  });

  // Add allowed domain
  const addDomainMutation = useMutation({
    mutationFn: async ({ tenantId, domain }: { tenantId: string; domain: string }) => {
      const { error } = await supabase
        .from("tenant_allowed_domains")
        .insert({
          tenant_id: tenantId,
          domain: domain.toLowerCase(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Domain hinzugefügt");
      queryClient.invalidateQueries({ queryKey: ["tenants-admin"] });
    },
    onError: () => {
      toast.error("Fehler beim Hinzufügen der Domain");
    },
  });

  // Remove allowed domain
  const removeDomainMutation = useMutation({
    mutationFn: async ({ tenantId, domain }: { tenantId: string; domain: string }) => {
      const { error } = await supabase
        .from("tenant_allowed_domains")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("domain", domain.toLowerCase());

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Domain entfernt");
      queryClient.invalidateQueries({ queryKey: ["tenants-admin"] });
    },
    onError: () => {
      toast.error("Fehler beim Entfernen der Domain");
    },
  });

  return {
    tenants,
    isLoading,
    error,
    createTenant: createTenantMutation.mutateAsync,
    isCreating: createTenantMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    updateLicense: updateLicenseMutation.mutate,
    addDomain: addDomainMutation.mutate,
    removeDomain: removeDomainMutation.mutate,
  };
}
