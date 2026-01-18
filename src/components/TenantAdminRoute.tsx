// ============================================
// Tenant Admin Route Protection
// Only accessible for tenant_admin or admin roles
// FIXED: Race condition + timeout with retry button
// ============================================

import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTenantAdmin } from "@/hooks/useTenantAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TenantAdminRouteProps {
  children: React.ReactNode;
}

export function TenantAdminRoute({ children }: TenantAdminRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isTenantAdmin, isLoading: adminLoading } = useTenantAdmin();
  const location = useLocation();
  
  // Wait for session to stabilize after auth loading completes
  const [sessionStable, setSessionStable] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  // DEBUG: Log auth state for troubleshooting (v2.1)
  console.log("[TenantAdminRoute] State:", { 
    user: !!user, 
    userId: user?.id,
    authLoading, 
    isTenantAdmin, 
    adminLoading,
    sessionStable
  });

  useEffect(() => {
    if (!authLoading) {
      // Short delay to catch race condition where user is set slightly after isLoading
      const timer = setTimeout(() => {
        setSessionStable(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setSessionStable(false);
    }
  }, [authLoading, user]);

  // Show retry button after 5 seconds of loading
  useEffect(() => {
    if (authLoading || adminLoading || !sessionStable) {
      const timer = setTimeout(() => setShowRetry(true), 5000);
      return () => clearTimeout(timer);
    }
    setShowRetry(false);
  }, [authLoading, adminLoading, sessionStable]);

  // 1. FIRST: Wait until auth is COMPLETELY loaded AND session is stable
  if (authLoading || !sessionStable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Authentifizierung wird geprüft...</span>
        </div>
        {showRetry && (
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Neu laden
          </Button>
        )}
      </div>
    );
  }

  // 2. THEN: Check if user exists (auth is definitely loaded and stable now)
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. THEN: Wait until roles are loaded
  if (adminLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Berechtigungen werden geprüft...</span>
        </div>
        {showRetry && (
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Neu laden
          </Button>
        )}
      </div>
    );
  }

  // 4. FINALLY: Check permission (both auth and roles are loaded)
  if (!isTenantAdmin) {
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

  return <>{children}</>;
}
