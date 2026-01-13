import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UseApprovalStatusResult {
  isApproved: boolean | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useApprovalStatus(): UseApprovalStatusResult {
  const { user } = useAuth();
  // Start with null to indicate "not yet checked" - prevents premature redirects
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkApproval = useCallback(async () => {
    if (!user) {
      // No user = not approved, but also not loading
      setIsApproved(null);
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
        // CRITICAL: Default to approved on error to prevent lockout of existing users
        console.log("[useApprovalStatus] Defaulting to approved due to error");
        setIsApproved(true);
        return;
      }

      // If no profile found, user is NEW and NOT yet approved
      if (!data) {
        console.log("[useApprovalStatus] No profile found for user:", user.id, "Defaulting to PENDING");
        // STRICT SECURITY: No profile = Not Approved (Pending)
        setIsApproved(false);
        return;
      }

      // is_approved can be null (legacy) or boolean
      // null = legacy user, treat as approved
      // true = explicitly approved
      // false = explicitly pending
      const approved = data.is_approved !== false;
      console.log("[useApprovalStatus] User approval status:", {
        userId: user.id,
        dbValue: data.is_approved,
        approved
      });
      setIsApproved(approved);
    } catch (err) {
      console.error("[useApprovalStatus] Unexpected error:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      // CRITICAL: Default to approved on error to prevent lockout
      console.log("[useApprovalStatus] Defaulting to approved due to exception");
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
