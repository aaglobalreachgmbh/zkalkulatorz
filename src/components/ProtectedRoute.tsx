import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isApproved, isLoading: approvalLoading } = useApprovalStatus();
  const [showRetry, setShowRetry] = useState(false);
  
  // DEBUG: Log auth state for troubleshooting (v2.1)
  console.log("[ProtectedRoute] State:", { 
    authLoading, 
    user: !!user, 
    userId: user?.id,
    approvalLoading, 
    isApproved 
  });
  
  // Show retry button after 5 seconds of loading
  useEffect(() => {
    if (authLoading || approvalLoading) {
      const timer = setTimeout(() => setShowRetry(true), 5000);
      return () => clearTimeout(timer);
    }
    setShowRetry(false);
  }, [authLoading, approvalLoading]);

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Authentifizierung wird geprüft...</p>
          {showRetry && (
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Neu laden
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking approval status
  if (approvalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Berechtigungen werden geprüft...</p>
          {showRetry && (
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Neu laden
            </Button>
          )}
        </div>
      </div>
    );
  }

  // CRITICAL: Only redirect if approval status is definitively FALSE
  // null = still loading or not yet checked, don't redirect
  // true = approved, continue
  // false = explicitly pending approval
  if (isApproved === false) {
    console.log("[ProtectedRoute] User explicitly not approved, redirecting to pending-approval");
    return <Navigate to="/pending-approval" replace />;
  }

  // If isApproved is null but approvalLoading is false, default to showing content
  // This handles edge cases where approval check didn't return a definitive result
  if (isApproved === null && !approvalLoading) {
    console.log("[ProtectedRoute] Approval status null but not loading - allowing access");
  }

  return <>{children}</>;
}
