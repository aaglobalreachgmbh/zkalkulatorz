import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type AppRole = "admin" | "tenant_admin" | "moderator" | "user";

interface UseUserRoleResult {
  role: AppRole | null;
  isAdmin: boolean;
  isTenantAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useUserRole(): UseUserRoleResult {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (queryError) {
          throw queryError;
        }

        setRole(data?.role as AppRole || "user");
      } catch (err) {
        setError(err as Error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [user]);

  return {
    role,
    isAdmin: role === "admin",
    isTenantAdmin: role === "tenant_admin" || role === "admin",
    isModerator: role === "moderator" || role === "admin",
    isLoading,
    error,
  };
}
