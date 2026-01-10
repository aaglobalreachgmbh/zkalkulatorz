// ============================================
// Synced Emails Hook - Fetch and manage synced emails
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface SyncedEmail {
  id: string;
  tenant_id: string;
  user_id: string;
  account_id: string;
  message_id: string;
  thread_id: string | null;
  subject: string | null;
  sender_email: string | null;
  sender_name: string | null;
  recipients: Array<{ email: string; name?: string; type: "to" | "cc" | "bcc" }>;
  body_preview: string | null;
  body_html: string | null;
  received_at: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  labels: string[];
  folder: string;
  attachments: Array<{ name: string; size: number; mimeType: string }>;
  customer_id: string | null;
  linked_at: string | null;
  visibility: "private" | "team" | "tenant";
  created_at: string;
  // Joined data
  customer?: { id: string; company_name: string } | null;
  account?: { id: string; email_address: string; provider: string } | null;
}

export interface EmailFilters {
  accountId?: string;
  isRead?: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  folder?: string;
  customerId?: string;
  search?: string;
  userId?: string; // For supervisors to filter by employee
}

const QUERY_KEY = ["syncedEmails"];

export function useSyncedEmails(filters?: EmailFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = [...QUERY_KEY, filters];

  // Fetch emails
  const {
    data: emails = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];

      try {
        let query = supabase
          .from("synced_emails")
          .select(`
            *,
            customer:customers(id, company_name),
            account:email_accounts(id, email_address, provider)
          `)
          .order("received_at", { ascending: false })
          .limit(100);

        // Apply filters
        if (filters?.accountId) {
          query = query.eq("account_id", filters.accountId);
        }
        if (filters?.isRead !== undefined) {
          query = query.eq("is_read", filters.isRead);
        }
        if (filters?.isStarred) {
          query = query.eq("is_starred", true);
        }
        if (filters?.isArchived !== undefined) {
          query = query.eq("is_archived", filters.isArchived);
        } else {
          // Default: don't show archived
          query = query.eq("is_archived", false);
        }
        if (filters?.folder) {
          query = query.eq("folder", filters.folder);
        }
        if (filters?.customerId) {
          query = query.eq("customer_id", filters.customerId);
        }
        if (filters?.userId) {
          query = query.eq("user_id", filters.userId);
        }
        if (filters?.search) {
          query = query.or(`subject.ilike.%${filters.search}%,sender_email.ilike.%${filters.search}%,body_preview.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.warn("[useSyncedEmails] Query error:", error.message);
          return [];
        }

        return (data || []) as SyncedEmail[];
      } catch (err) {
        console.error("[useSyncedEmails] Unexpected error:", err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async ({ emailId, isRead }: { emailId: string; isRead: boolean }) => {
      const { error } = await supabase
        .from("synced_emails")
        .update({ is_read: isRead })
        .eq("id", emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      console.error("[useSyncedEmails] Mark read error:", error);
    },
  });

  // Toggle starred mutation
  const toggleStarredMutation = useMutation({
    mutationFn: async ({ emailId, isStarred }: { emailId: string; isStarred: boolean }) => {
      const { error } = await supabase
        .from("synced_emails")
        .update({ is_starred: isStarred })
        .eq("id", emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      console.error("[useSyncedEmails] Toggle starred error:", error);
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from("synced_emails")
        .update({ is_archived: true })
        .eq("id", emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("E-Mail archiviert");
    },
    onError: (error: Error) => {
      console.error("[useSyncedEmails] Archive error:", error);
      toast.error("Archivieren fehlgeschlagen");
    },
  });

  // Link to customer mutation
  const linkToCustomerMutation = useMutation({
    mutationFn: async ({ emailId, customerId }: { emailId: string; customerId: string }) => {
      const { error } = await supabase
        .from("synced_emails")
        .update({ 
          customer_id: customerId,
          linked_at: new Date().toISOString(),
        })
        .eq("id", emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("E-Mail mit Kunde verknüpft");
    },
    onError: (error: Error) => {
      console.error("[useSyncedEmails] Link error:", error);
      toast.error("Verknüpfung fehlgeschlagen");
    },
  });

  // Get unread count
  const unreadCount = emails.filter((e) => !e.is_read).length;

  return {
    emails,
    isLoading,
    error,
    refetch,
    unreadCount,
    
    // Mutations
    markAsRead: markAsReadMutation.mutate,
    toggleStarred: toggleStarredMutation.mutate,
    archive: archiveMutation.mutateAsync,
    linkToCustomer: linkToCustomerMutation.mutateAsync,
    
    // States
    isArchiving: archiveMutation.isPending,
    isLinking: linkToCustomerMutation.isPending,
  };
}
