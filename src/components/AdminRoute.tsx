// ============================================
// Admin Route Protection
// Phase 3A: Uses unified AppIdentity
// ============================================

import { Navigate } from "react-router-dom";
import { useIdentity } from "@/contexts/IdentityContext";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protects admin routes using the unified AppIdentity system.
 * 
 * Access rules:
 * - admin role: full access
 * - manager role: full access
 * - sales role: access denied
 * 
 * Works with both Supabase auth and mock identity.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { isLoading: authLoading } = useAuth();
  const { identity, canAccessAdmin, isSupabaseAuth, isAuthenticated } = useIdentity();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Berechtigungen werden geprüft...</p>
        </div>
      </div>
    );
  }

  // If using Supabase auth but not authenticated, redirect to login
  // (Only enforce if Supabase is being used)
  if (!isAuthenticated && !isSupabaseAuth) {
    // Guest user - check if they can access
    if (!canAccessAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-6 text-center p-8">
            <div className="p-4 rounded-full bg-destructive/10">
              <ShieldX className="w-12 h-12 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Zugriff verweigert</h1>
              <p className="text-muted-foreground max-w-md">
                Du benötigst Admin- oder Manager-Berechtigungen, um auf diese Seite zuzugreifen.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Aktuell angemeldet als: {identity.displayName} ({identity.role})
              </p>
            </div>
            <Button variant="outline" onClick={() => window.history.back()}>
              Zurück
            </Button>
          </div>
        </div>
      );
    }
  }

  // Check role-based access
  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 text-center p-8">
          <div className="p-4 rounded-full bg-destructive/10">
            <ShieldX className="w-12 h-12 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Zugriff verweigert</h1>
            <p className="text-muted-foreground max-w-md">
              Du benötigst Admin- oder Manager-Berechtigungen, um auf diese Seite zuzugreifen.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Aktuell angemeldet als: {identity.displayName} ({identity.role})
            </p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
