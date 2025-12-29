// ============================================
// Tenant Admin Route Protection
// Only accessible for tenant_admin or admin roles
// ============================================

import { Navigate, useLocation } from "react-router-dom";
import { useTenantAdmin } from "@/hooks/useTenantAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface TenantAdminRouteProps {
  children: React.ReactNode;
}

export function TenantAdminRoute({ children }: TenantAdminRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isTenantAdmin, isLoading: adminLoading } = useTenantAdmin();
  const location = useLocation();

  // Show loading while checking auth
  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If not tenant admin, show access denied
  if (!isTenantAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Zugriff verweigert
          </h1>
          <p className="text-muted-foreground">
            Sie benötigen Tenant-Admin-Rechte, um auf diesen Bereich zuzugreifen.
          </p>
        </div>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <>{children}</>;
}
