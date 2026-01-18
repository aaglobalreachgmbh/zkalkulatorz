import { useEffect, useState } from "react";
import { useMFA } from "@/components/mfa";
import { useUserRole } from "./useUserRole";
import { useAuth } from "./useAuth";

interface UseAdminMFAEnforcementResult {
  requiresMFASetup: boolean;
  isCheckingMFA: boolean;
  hasMFA: boolean;
  isAdmin: boolean;
}

/**
 * Hook to enforce MFA for admin users
 * Returns true if admin user needs to set up MFA before accessing admin functions
 */
export function useAdminMFAEnforcement(): UseAdminMFAEnforcementResult {
  const { user } = useAuth();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const { hasMFA, isLoading: isMFALoading } = useMFA();
  const [isCheckingMFA, setIsCheckingMFA] = useState(true);

  useEffect(() => {
    if (!isRoleLoading && !isMFALoading) {
      setIsCheckingMFA(false);
    }
  }, [isRoleLoading, isMFALoading]);

  // If user is not logged in, no enforcement needed
  if (!user) {
    return {
      requiresMFASetup: false,
      isCheckingMFA: false,
      hasMFA: false,
      isAdmin: false,
    };
  }

  // Admin users without MFA must set it up
  const requiresMFASetup = isAdmin && !hasMFA && !isCheckingMFA;

  return {
    requiresMFASetup,
    isCheckingMFA: isCheckingMFA || isRoleLoading || isMFALoading,
    hasMFA,
    isAdmin,
  };
}
