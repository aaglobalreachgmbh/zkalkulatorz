import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UseApprovalStatusResult {
  isApproved: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useApprovalStatus(): UseApprovalStatusResult {
  const { user } = useAuth();
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkApproval = useCallback(async () => {
    if (!user) {
      setIsApproved(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("is_approved")
        .eq("id", user.id)
        .maybeSingle();

      if (queryError) {
        console.error("[useApprovalStatus] Error fetching approval status:", queryError);
        setError(queryError);
        // Default to approved on error to prevent lockout of existing users
        setIsApproved(true);
        return;
      }

      // If no profile found, user is new and not approved
      if (!data) {
        console.log("[useApprovalStatus] No profile found for user:", user.id);
        setIsApproved(false);
        return;
      }

      // is_approved can be null (not yet reviewed) or boolean
      const approved = data.is_approved === true;
      console.log("[useApprovalStatus] User approval status:", { userId: user.id, approved });
      setIsApproved(approved);
    } catch (err) {
      console.error("[useApprovalStatus] Unexpected error:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      // Default to approved on error to prevent lockout
      setIsApproved(true);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkApproval();
  }, [checkApproval]);

  // Subscribe to realtime updates for approval status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`approval-status-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[useApprovalStatus] Profile updated:", payload);
          if (payload.new && "is_approved" in payload.new) {
            setIsApproved(payload.new.is_approved === true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    isApproved,
    isLoading,
    error,
    refetch: checkApproval,
  };
}
