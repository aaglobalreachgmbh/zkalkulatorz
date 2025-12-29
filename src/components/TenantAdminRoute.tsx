// ============================================
// Tenant Admin Route Protection
// Only accessible for tenant_admin or admin roles
// ============================================

import { Navigate, useLocation } from "react-router-dom";
import { useTenantAdmin } from "@/hooks/useTenantAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TenantAdminRouteProps {
  children: React.ReactNode;
}

export function TenantAdminRoute({ children }: TenantAdminRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isTenantAdmin, isLoading: adminLoading } = useTenantAdmin();
  const location = useLocation();

  // DEBUG: Log all state for diagnosis
  console.log("[TenantAdminRoute] State:", {
    authLoading,
    adminLoading,
    hasUser: !!user,
    userId: user?.id,
    isTenantAdmin,
    pathname: location.pathname
  });

  // 1. FIRST: Wait until auth is COMPLETELY loaded
  if (authLoading) {
    console.log("[TenantAdminRoute] Auth still loading - showing loader");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Authentifizierung wird geprüft...</span>
      </div>
    );
  }

  // 2. THEN: Check if user exists (auth is definitely loaded now)
  if (!user) {
    console.log("[TenantAdminRoute] No user after auth loaded - redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. THEN: Wait until roles are loaded
  if (adminLoading) {
    console.log("[TenantAdminRoute] Roles still loading - showing loader");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Berechtigungen werden geprüft...</span>
      </div>
    );
  }

  // 4. FINALLY: Check permission (both auth and roles are loaded)
  if (!isTenantAdmin) {
    console.log("[TenantAdminRoute] User is not tenant admin - access denied");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Zugriff verweigert
          </h1>
          <p className="text-muted-foreground mb-4">
            Sie benötigen Tenant-Admin-Rechte, um auf diesen Bereich zuzugreifen.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  console.log("[TenantAdminRoute] Access granted - rendering children");
  return <>{children}</>;
}
