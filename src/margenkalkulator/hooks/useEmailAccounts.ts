// ============================================
// Email Accounts Hook - Manage connected email accounts
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

export type EmailProvider = "gmail" | "ionos" | "imap";

export interface EmailAccount {
  id: string;
  tenant_id: string;
  user_id: string;
  provider: EmailProvider;
  email_address: string;
  display_name: string | null;
  sync_enabled: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectGmailInput {
  authCode: string;
  redirectUri: string;
}

export interface ConnectIonosInput {
  email: string;
  password: string;
  displayName?: string;
}

const QUERY_KEY = ["emailAccounts"];

export function useEmailAccounts() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  // Fetch user's email accounts
  const {
    data: accounts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from("email_accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("[useEmailAccounts] Query error:", error.message);
          return [];
        }

        return (data || []) as EmailAccount[];
      } catch (err) {
        console.error("[useEmailAccounts] Unexpected error:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Get Gmail OAuth URL
  const getGmailAuthUrl = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("gmail-oauth", {
        body: { action: "getAuthUrl" },
      });

      if (error) {
        console.error("[useEmailAccounts] Gmail OAuth URL error:", error);
        toast.error("Gmail-Verbindung konnte nicht gestartet werden");
        return null;
      }

      return data?.authUrl || null;
    } catch (err) {
      console.error("[useEmailAccounts] Unexpected error:", err);
      return null;
    }
  };

  // Connect Gmail mutation
  const connectGmailMutation = useMutation({
    mutationFn: async (input: ConnectGmailInput) => {
      const { data, error } = await supabase.functions.invoke("gmail-oauth", {
        body: {
          action: "exchangeToken",
          code: input.authCode,
          redirectUri: input.redirectUri,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Gmail-Konto verbunden");
    },
    onError: (error: Error) => {
      console.error("[useEmailAccounts] Gmail connect error:", error);
      toast.error("Gmail-Verbindung fehlgeschlagen");
    },
  });

  // Connect IONOS mutation
  const connectIonosMutation = useMutation({
    mutationFn: async (input: ConnectIonosInput) => {
      if (!user || !identity?.tenantId) {
        throw new Error("Nicht authentifiziert");
      }

      const { data, error } = await supabase.functions.invoke("ionos-connect", {
        body: {
          email: input.email,
          password: input.password,
          displayName: input.displayName,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("IONOS-Konto verbunden");
    },
    onError: (error: Error) => {
      console.error("[useEmailAccounts] IONOS connect error:", error);
      toast.error(error.message || "IONOS-Verbindung fehlgeschlagen");
    },
  });

  // Disconnect account mutation
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("email_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Konto getrennt");
    },
    onError: (error: Error) => {
      console.error("[useEmailAccounts] Disconnect error:", error);
      toast.error("Konto konnte nicht getrennt werden");
    },
  });

  // Trigger sync mutation
  const syncMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke("sync-emails", {
        body: { accountId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["syncedEmails"] });
      toast.success(`${data?.syncedCount || 0} neue E-Mails synchronisiert`);
    },
    onError: (error: Error) => {
      console.error("[useEmailAccounts] Sync error:", error);
      toast.error("Synchronisierung fehlgeschlagen");
    },
  });

  // Toggle sync enabled
  const toggleSyncMutation = useMutation({
    mutationFn: async ({ accountId, enabled }: { accountId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("email_accounts")
        .update({ sync_enabled: enabled })
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(enabled ? "Synchronisierung aktiviert" : "Synchronisierung deaktiviert");
    },
    onError: (error: Error) => {
      console.error("[useEmailAccounts] Toggle sync error:", error);
      toast.error("Einstellung konnte nicht geändert werden");
    },
  });

  return {
    accounts,
    isLoading,
    error,
    refetch,
    
    // Gmail
    getGmailAuthUrl,
    connectGmail: connectGmailMutation.mutateAsync,
    isConnectingGmail: connectGmailMutation.isPending,
    
    // IONOS
    connectIonos: connectIonosMutation.mutateAsync,
    isConnectingIonos: connectIonosMutation.isPending,
    
    // General
    disconnect: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,
    
    // Sync
    sync: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    toggleSync: toggleSyncMutation.mutateAsync,
  };
}
