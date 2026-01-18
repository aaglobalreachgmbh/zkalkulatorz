// ============================================
// Offer Follow-up System Hook
// Tracks and reminds about pending offers
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays, parseISO } from "date-fns";

interface FollowupOffer {
  id: string;
  name: string;
  customerId: string | null;
  customerName: string | null;
  createdAt: string;
  daysPending: number;
  lastEmailSent: string | null;
  avgMonthly: number;
}

interface UseOfferFollowupsResult {
  followups: FollowupOffer[];
  urgentCount: number;
  isLoading: boolean;
  error: Error | null;
  dismissFollowup: (offerId: string) => Promise<void>;
}

// Threshold for when an offer needs follow-up (in days)
const FOLLOWUP_THRESHOLD_DAYS = 3;

export function useOfferFollowups(): UseOfferFollowupsResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["offer-followups", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const now = new Date();
      
      // Get all saved offers from last 30 days that are not drafts
      const { data: offers, error: offersError } = await supabase
        .from("saved_offers")
        .select(`
          id,
          name,
          customer_id,
          created_at,
          preview,
          customers (
            company_name,
            contact_name
          )
        `)
        .eq("is_draft", false)
        .gte("created_at", new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false });

      if (offersError) throw offersError;

      // Get recent emails to check if follow-up was sent
      const { data: emails } = await supabase
        .from("offer_emails")
        .select("id, created_at, offer_data")
        .gte("created_at", new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get dismissed follow-ups from localStorage
      const dismissedFollowups = JSON.parse(
        localStorage.getItem("dismissed_followups") || "[]"
      ) as string[];

      // Process offers
      const followups: FollowupOffer[] = [];

      for (const offer of offers || []) {
        // Skip if dismissed
        if (dismissedFollowups.includes(offer.id)) continue;

        const createdAt = parseISO(offer.created_at);
        const daysPending = differenceInDays(now, createdAt);

        // Only include if pending for 3+ days
        if (daysPending < FOLLOWUP_THRESHOLD_DAYS) continue;

        // Check if any email was sent for this offer recently
        const relatedEmail = emails?.find(email => {
          const emailData = email.offer_data as { offerId?: string } | null;
          return emailData?.offerId === offer.id;
        });

        const preview = offer.preview as { avgMonthly?: number } | null;

        followups.push({
          id: offer.id,
          name: offer.name,
          customerId: offer.customer_id,
          customerName: offer.customers?.company_name || offer.customers?.contact_name || null,
          createdAt: offer.created_at,
          daysPending,
          lastEmailSent: relatedEmail?.created_at || null,
          avgMonthly: preview?.avgMonthly || 0,
        });
      }

      // Sort by days pending (most urgent first)
      return followups.sort((a, b) => b.daysPending - a.daysPending);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const dismissMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const dismissed = JSON.parse(
        localStorage.getItem("dismissed_followups") || "[]"
      ) as string[];
      
      if (!dismissed.includes(offerId)) {
        dismissed.push(offerId);
        localStorage.setItem("dismissed_followups", JSON.stringify(dismissed));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer-followups"] });
    },
  });

  const followups = data || [];
  const urgentCount = followups.filter(f => f.daysPending >= 7).length;

  return {
    followups,
    urgentCount,
    isLoading,
    error: error as Error | null,
    dismissFollowup: dismissMutation.mutateAsync,
  };
}
