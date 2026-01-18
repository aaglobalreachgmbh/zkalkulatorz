// ============================================
// Tenant Invitations Hook
// Manages email invitations for team members
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

export interface TenantInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: "admin" | "tenant_admin" | "manager" | "sales" | "user";
  invited_by: string;
  invite_token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface InvitationInput {
  email: string;
  role: "tenant_admin" | "user";
}

const QUERY_KEY = ["tenantInvitations"];

export function useTenantInvitations() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  // Fetch all invitations for current tenant
  const invitationsQuery = useQuery({
    queryKey: [...QUERY_KEY, identity.tenantId],
    queryFn: async (): Promise<TenantInvitation[]> => {
      const { data, error } = await supabase
        .from("tenant_invitations")
        .select("*")
        .eq("tenant_id", identity.tenantId)
        .order("created_at", { ascending: false });

      if (error) throw new Error("Laden fehlgeschlagen: " + error.message);
      return (data || []) as TenantInvitation[];
    },
    enabled: !!user && identity.role === "tenant_admin",
  });

  // Send invitation mutation (calls Edge Function)
  const sendInvitation = useMutation({
    mutationFn: async (input: InvitationInput): Promise<TenantInvitation> => {
      if (!user) throw new Error("Nicht eingeloggt");

      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: input.email,
          role: input.role,
          tenant_id: identity.tenantId,
        },
      });

      if (error) throw new Error("Einladung fehlgeschlagen: " + error.message);
      if (data?.error) throw new Error(data.error);
      
      return data.invitation as TenantInvitation;
    },
    onSuccess: (newInvitation) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(`Einladung an ${newInvitation.email} gesendet`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Revoke invitation mutation
  const revokeInvitation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("tenant_invitations")
        .delete()
        .eq("id", id);

      if (error) throw new Error("Löschen fehlgeschlagen: " + error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Einladung widerrufen");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Resend invitation (creates new token)
  const resendInvitation = useMutation({
    mutationFn: async (invitation: TenantInvitation): Promise<void> => {
      // Delete old invitation
      await supabase.from("tenant_invitations").delete().eq("id", invitation.id);
      
      // Create new one with same email/role
      const { error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: invitation.email,
          role: invitation.role,
          tenant_id: identity.tenantId,
        },
      });

      if (error) throw new Error("Erneutes Senden fehlgeschlagen: " + error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Einladung erneut gesendet");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Filter helpers
  const pendingInvitations = (invitationsQuery.data || []).filter(
    (inv) => !inv.accepted_at && new Date(inv.expires_at) > new Date()
  );
  
  const expiredInvitations = (invitationsQuery.data || []).filter(
    (inv) => !inv.accepted_at && new Date(inv.expires_at) <= new Date()
  );

  return {
    invitations: invitationsQuery.data || [],
    pendingInvitations,
    expiredInvitations,
    isLoading: invitationsQuery.isLoading,
    error: invitationsQuery.error,
    sendInvitation,
    revokeInvitation,
    resendInvitation,
  };
}
