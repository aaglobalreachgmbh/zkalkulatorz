import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type AppRole = "superadmin" | "admin" | "tenant_admin" | "moderator" | "user";

// Role priority: higher number = more permissions
const ROLE_PRIORITY: Record<AppRole, number> = {
  superadmin: 200,
  admin: 100,
  tenant_admin: 80,
  moderator: 60,
  user: 10,
};

interface UseUserRoleResult {
  role: AppRole | null;
  allRoles: AppRole[];
  isSuperAdmin: boolean;
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
          console.error("[useUserRole] Query error:", queryError);
          // CRITICAL: Don't throw, just default to "user" role to prevent crashes
          setError(queryError);
          setAllRoles(["user"]);
          setRole("user");
          setIsLoading(false);
          return;
        }

        // Extract roles from data
        const roles = (data?.map(r => r.role) || []) as AppRole[];
        
        // Determine highest priority role - default to "user" if no roles
        const highestRole = roles.length > 0
          ? roles.reduce((highest, current) => 
              ROLE_PRIORITY[current] > ROLE_PRIORITY[highest] ? current : highest
            )
          : "user" as AppRole;

        const calculatedIsTenantAdmin = roles.includes("tenant_admin") || roles.includes("admin");
        console.log("[useUserRole] User:", user.id, 
                    "Roles:", roles, 
                    "Highest:", highestRole,
                    "isTenantAdmin:", calculatedIsTenantAdmin);

        setAllRoles(roles.length > 0 ? roles : ["user"]);
        setRole(highestRole);
      } catch (err) {
        console.error("[useUserRole] Unexpected error:", err);
        setError(err as Error);
        // CRITICAL: Default to "user" role to prevent app crashes
        setAllRoles(["user"]);
        setRole("user");
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
    isSuperAdmin: hasRole("superadmin"),
    isAdmin: hasRole("admin") || hasRole("superadmin"),
    isTenantAdmin: hasRole("tenant_admin") || hasRole("admin") || hasRole("superadmin"),
    isModerator: hasRole("moderator") || hasRole("admin") || hasRole("superadmin"),
    isLoading,
    error,
  };
}
