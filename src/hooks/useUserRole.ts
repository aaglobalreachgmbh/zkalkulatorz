import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type AppRole = "admin" | "tenant_admin" | "moderator" | "user";

// Role priority: higher number = more permissions
const ROLE_PRIORITY: Record<AppRole, number> = {
  admin: 100,
  tenant_admin: 80,
  moderator: 60,
  user: 10,
};

interface UseUserRoleResult {
  role: AppRole | null;
  allRoles: AppRole[];
  isAdmin: boolean;
  isTenantAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useUserRole(): UseUserRoleResult {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUserRoles() {
      if (!user) {
        setRole(null);
        setAllRoles([]);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch ALL roles for the user (not just one)
        const { data, error: queryError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (queryError) {
          throw queryError;
        }

        // Extract roles from data
        const roles = (data?.map(r => r.role) || []) as AppRole[];
        
        // Determine highest priority role
        const highestRole = roles.length > 0
          ? roles.reduce((highest, current) => 
              ROLE_PRIORITY[current] > ROLE_PRIORITY[highest] ? current : highest
            )
          : "user" as AppRole;

        console.log("[useUserRole] User:", user.id, "Roles:", roles, "Highest:", highestRole);

        setAllRoles(roles);
        setRole(highestRole);
      } catch (err) {
        console.error("[useUserRole] Error fetching roles:", err);
        setError(err as Error);
        setRole(null);
        setAllRoles([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRoles();
  }, [user]);

  // Derive permissions from all roles, not just highest
  const hasRole = (checkRole: AppRole) => allRoles.includes(checkRole);

  return {
    role,
    allRoles,
    isAdmin: hasRole("admin"),
    isTenantAdmin: hasRole("tenant_admin") || hasRole("admin"),
    isModerator: hasRole("moderator") || hasRole("admin"),
    isLoading,
    error,
  };
}
