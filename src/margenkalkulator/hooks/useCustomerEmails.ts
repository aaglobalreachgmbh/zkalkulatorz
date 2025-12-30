// ============================================
// Hook: Customer Emails
// Lädt alle gesendeten E-Mails für einen spezifischen Kunden
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CustomerEmail {
  id: string;
  customer_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  message: string | null;
  status: "sent" | "delivered" | "opened" | "failed";
  offer_data: {
    hardware?: string;
    tariff?: string;
    avgMonthly?: number;
  } | null;
  resend_message_id: string | null;
  created_at: string;
  user_id: string;
}

export function useCustomerEmails(customerId: string | undefined) {
  const { user } = useAuth();

  const { data: emails, isLoading, error } = useQuery({
    queryKey: ["customer-emails", customerId],
    queryFn: async () => {
      if (!customerId) return [];

      const { data, error } = await supabase
        .from("offer_emails")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data ?? []).map(email => ({
        ...email,
        status: email.status as CustomerEmail["status"],
        offer_data: email.offer_data as CustomerEmail["offer_data"],
      })) as CustomerEmail[];
    },
    enabled: !!customerId && !!user?.id,
  });

  return {
    emails: emails ?? [],
    isLoading,
    error,
    hasEmails: (emails ?? []).length > 0,
  };
}
