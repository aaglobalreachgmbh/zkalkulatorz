// ============================================
// SecurityGuard Component
// Phase C4: Protected Area Wrapper
// ============================================

import React, { useEffect, useState } from "react";
import { useIdentity, type AppRole } from "@/contexts/IdentityContext";
import { useSecurity } from "@/providers/SecurityProvider";
import { useServerRateLimit, type RateLimitCategory } from "@/hooks/useServerRateLimit";
import { useAuth } from "@/hooks/useAuth";
import { Shield, AlertTriangle, Clock, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// ============================================================================
// TYPES
// ============================================================================

interface SecurityGuardProps {
  children: React.ReactNode;
  
  /** Require user to be authenticated */
  requireAuth?: boolean;
  
  /** Require specific role(s) */
  requiredRole?: AppRole | AppRole[];
  
  /** Require tenant match (uses JWT claims) */
  requireTenant?: string;
  
  /** Check rate limit before rendering */
  requireRateLimit?: RateLimitCategory;
  
  /** Custom access denied component */
  accessDeniedComponent?: React.ReactNode;
  
  /** Custom rate limited component */
  rateLimitedComponent?: React.ReactNode;
  
  /** Callback when access is denied */
  onAccessDenied?: (reason: "auth" | "role" | "tenant" | "rateLimit") => void;
  
  /** Show loading state while checking */
  showLoading?: boolean;
  
  /** Silent mode - don't show any UI, just don't render children */
  silent?: boolean;
}

// ============================================================================
// ACCESS DENIED COMPONENTS
// ============================================================================

function DefaultAccessDenied({ 
  reason, 
  onNavigate 
}: { 
  reason: "auth" | "role" | "tenant"; 
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  
  const messages = {
    auth: {
      title: "Anmeldung erforderlich",
      description: "Bitte melden Sie sich an, um auf diesen Bereich zuzugreifen.",
      icon: Lock,
      action: "Zur Anmeldung",
      actionPath: "/auth",
    },
    role: {
      title: "Zugriff verweigert",
      description: "Sie haben nicht die erforderlichen Berechtigungen für diesen Bereich.",
      icon: Shield,
      action: "Zur Startseite",
      actionPath: "/",
    },
    tenant: {
      title: "Mandant nicht berechtigt",
      description: "Ihr Mandant hat keinen Zugriff auf diese Ressource.",
      icon: AlertTriangle,
      action: "Zur Startseite",
      actionPath: "/",
    },
  };
  
  const config = messages[reason];
  const Icon = config.icon;
  
  const handleAction = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      navigate(config.actionPath);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
            <Icon className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleAction}>{config.action}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DefaultRateLimited({ 
  resetAt,
  category,
}: { 
  resetAt: Date;
  category: string;
}) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const diff = resetAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft("Jetzt");
        return;
      }
      
      const seconds = Math.ceil(diff / 1000);
      if (seconds < 60) {
        setTimeLeft(`${seconds} Sekunden`);
      } else {
        const minutes = Math.ceil(seconds / 60);
        setTimeLeft(`${minutes} Minuten`);
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, [resetAt]);
  
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-warning/10 rounded-full w-fit">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <CardTitle>Zu viele Anfragen</CardTitle>
          <CardDescription>
            Sie haben das Limit für {category} erreicht. 
            Bitte warten Sie {timeLeft}.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Verfügbar ab: {resetAt.toLocaleTimeString("de-DE")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// LOADING COMPONENT
// ============================================================================

function SecurityLoading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-2">
        <Shield className="h-8 w-8 animate-pulse text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Sicherheitsprüfung...</p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SecurityGuard({
  children,
  requireAuth = false,
  requiredRole,
  requireTenant,
  requireRateLimit,
  accessDeniedComponent,
  rateLimitedComponent,
  onAccessDenied,
  showLoading = true,
  silent = false,
}: SecurityGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { identity } = useIdentity();
  const { logEvent } = useSecurity();
  const { getStatus } = useServerRateLimit();
  
  const [isChecking, setIsChecking] = useState(true);
  const [accessState, setAccessState] = useState<{
    granted: boolean;
    reason?: "auth" | "role" | "tenant" | "rateLimit";
    rateLimitResetAt?: Date;
  }>({ granted: false });
  
  useEffect(() => {
    async function checkAccess() {
      setIsChecking(true);
      
      // 1. Check authentication
      if (requireAuth && !user && !authLoading) {
        setAccessState({ granted: false, reason: "auth" });
        onAccessDenied?.("auth");
        logEvent({ type: "access_denied", details: { reason: "auth" } });
        setIsChecking(false);
        return;
      }
      
      // 2. Check role
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(identity.role)) {
          setAccessState({ granted: false, reason: "role" });
          onAccessDenied?.("role");
          logEvent({ 
            type: "access_denied", 
            details: { reason: "role", required: roles, actual: identity.role } 
          });
          setIsChecking(false);
          return;
        }
      }
      
      // 3. Check tenant
      if (requireTenant && identity.tenantId !== requireTenant) {
        setAccessState({ granted: false, reason: "tenant" });
        onAccessDenied?.("tenant");
        logEvent({ 
          type: "access_denied", 
          details: { reason: "tenant", required: requireTenant, actual: identity.tenantId } 
        });
        setIsChecking(false);
        return;
      }
      
      // 4. Check rate limit
      if (requireRateLimit) {
        try {
          const status = await getStatus(requireRateLimit);
          if (!status.allowed) {
            setAccessState({ 
              granted: false, 
              reason: "rateLimit",
              rateLimitResetAt: status.resetAt,
            });
            onAccessDenied?.("rateLimit");
            logEvent({ 
              type: "rate_limited", 
              details: { category: requireRateLimit, resetAt: status.resetAt.toISOString() } 
            });
            setIsChecking(false);
            return;
          }
        } catch (err) {
          // On error, allow access (fail open)
          console.warn("[SecurityGuard] Rate limit check failed, allowing access");
        }
      }
      
      // All checks passed
      setAccessState({ granted: true });
      setIsChecking(false);
    }
    
    // Wait for auth to load before checking
    if (!authLoading || !requireAuth) {
      checkAccess();
    }
  }, [
    requireAuth, 
    requiredRole, 
    requireTenant, 
    requireRateLimit, 
    user, 
    authLoading, 
    identity, 
    getStatus, 
    logEvent, 
    onAccessDenied
  ]);
  
  // Show loading state
  if ((isChecking || authLoading) && showLoading && !silent) {
    return <SecurityLoading />;
  }
  
  // Access denied
  if (!accessState.granted) {
    // Silent mode: render nothing
    if (silent) {
      return null;
    }
    
    // Rate limited
    if (accessState.reason === "rateLimit" && accessState.rateLimitResetAt) {
      return rateLimitedComponent ? (
        <>{rateLimitedComponent}</>
      ) : (
        <DefaultRateLimited 
          resetAt={accessState.rateLimitResetAt} 
          category={requireRateLimit || "api"} 
        />
      );
    }
    
    // Other access denied reasons
    const reason = accessState.reason || "auth";
    return accessDeniedComponent ? (
      <>{accessDeniedComponent}</>
    ) : (
      <DefaultAccessDenied reason={reason === "rateLimit" ? "auth" : reason} />
    );
  }
  
  // Access granted
  return <>{children}</>;
}

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

/**
 * Require authentication to view content
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  return <SecurityGuard requireAuth>{children}</SecurityGuard>;
}

/**
 * Require admin role to view content
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <SecurityGuard requireAuth requiredRole="admin">
      {children}
    </SecurityGuard>
  );
}

/**
 * Require manager or admin role to view content
 */
export function ManagerGuard({ children }: { children: React.ReactNode }) {
  return (
    <SecurityGuard requireAuth requiredRole={["admin", "manager"]}>
      {children}
    </SecurityGuard>
  );
}

/**
 * Rate limit a component's rendering
 */
export function RateLimitGuard({ 
  children, 
  category 
}: { 
  children: React.ReactNode; 
  category: RateLimitCategory;
}) {
  return (
    <SecurityGuard requireRateLimit={category}>
      {children}
    </SecurityGuard>
  );
}
