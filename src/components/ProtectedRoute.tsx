import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isApproved, isLoading: approvalLoading } = useApprovalStatus();

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Authentifizierung wird geprüft...</p>
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
        </div>
      </div>
    );
  }

  // Redirect to pending-approval if not approved
  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}
