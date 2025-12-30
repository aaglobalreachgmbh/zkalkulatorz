// ============================================
// Offer Emails History Hook
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

// Type for offer email record
export interface OfferEmail {
  id: string;
  tenant_id: string;
  user_id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  message: string | null;
  customer_id: string | null;
  offer_data: Json | null;
  status: string;
  resend_message_id: string | null;
  created_at: string;
  updated_at: string;
}

// Type for inserting a new email record
export interface InsertOfferEmail {
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  message?: string;
  customer_id?: string;
  offer_data?: Json;
  resend_message_id?: string;
}

export function useOfferEmails() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch email history
  const { data: emails = [], isLoading, error, refetch } = useQuery({
    queryKey: ["offer-emails", user?.id],
    queryFn: async (): Promise<OfferEmail[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("offer_emails")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("[useOfferEmails] Error fetching emails:", error);
        throw error;
      }

      return (data || []) as OfferEmail[];
    },
    enabled: !!user,
  });

  // Mutation to log a sent email
  const logEmailMutation = useMutation({
    mutationFn: async (emailData: InsertOfferEmail) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("offer_emails")
        .insert({
          ...emailData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("[useOfferEmails] Error logging email:", error);
        throw error;
      }

      return data as OfferEmail;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer-emails"] });
    },
    onError: (err: Error) => {
      console.error("[useOfferEmails] Mutation error:", err);
    },
  });

  // Function to log email (called after successful send)
  const logSentEmail = async (data: InsertOfferEmail): Promise<OfferEmail | null> => {
    try {
      return await logEmailMutation.mutateAsync(data);
    } catch {
      return null;
    }
  };

  return {
    emails,
    isLoading,
    error,
    refetch,
    logSentEmail,
    isLogging: logEmailMutation.isPending,
  };
}
