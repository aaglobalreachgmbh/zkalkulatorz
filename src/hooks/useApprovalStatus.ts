import { useState, useEffect } from "react";
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

  const fetchApprovalStatus = async () => {
    if (!user) {
      setIsApproved(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("is_approved")
        .eq("id", user.id)
        .single();

      if (queryError) {
        throw queryError;
      }

      setIsApproved(data?.is_approved ?? false);
    } catch (err) {
      console.error("[useApprovalStatus] Error:", err);
      setError(err as Error);
      setIsApproved(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalStatus();
  }, [user?.id]);

  return {
    isApproved,
    isLoading,
    error,
    refetch: fetchApprovalStatus,
  };
}
