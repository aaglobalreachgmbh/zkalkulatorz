// ============================================
// SeatLimitGate Component - Phase 3C.2
// Enforce seat limits for non-admin users
// PHASE 4: Safe fallback - always render children on error
// ============================================

import { ReactNode } from "react";
import { AlertCircle, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useIdentity } from "@/contexts/IdentityContext";
import { useLicense } from "@/hooks/useLicense";

interface SeatLimitGateProps {
  /** Content to render when user has access */
  children: ReactNode;
}

/**
 * Blocks access for non-admin users when seat limit is exceeded.
 * Admins can always access (to resolve the issue).
 * PHASE 4: On any error, always render children to prevent blocking
 */
export function SeatLimitGate({ children }: SeatLimitGateProps) {
  try {
    const { canAccessAdmin } = useIdentity();
    const { seatLimitExceeded, currentUserHasSeat, seatUsage, license } = useLicense();

    // Admins always have access (to resolve issues)
    if (canAccessAdmin) {
      return <>{children}</>;
    }

    // User has a seat assigned - allow access
    if (currentUserHasSeat) {
      return <>{children}</>;
    }

    // Seat limit exceeded and user doesn't have a seat - block access
    if (seatLimitExceeded || seatUsage.available === 0) {
      return <SeatLimitBlockedScreen seatUsage={seatUsage} plan={license.plan} />;
    }

    // Seats available but user doesn't have one - this is a warning state
    return <>{children}</>;
  } catch (error) {
    // PHASE 4: On any error, render children to prevent blocking
    console.warn("[SeatLimitGate] Error checking seat access, allowing access:", error);
    return <>{children}</>;
  }
}

/**
 * Strict seat enforcement - requires user to have an assigned seat
 */
export function StrictSeatLimitGate({ children }: SeatLimitGateProps) {
  const { identity, canAccessAdmin } = useIdentity();
  const { currentUserHasSeat, seatUsage, license } = useLicense();

  // Admins always have access
  if (canAccessAdmin) {
    return <>{children}</>;
  }

  // User must have a seat
  if (!currentUserHasSeat) {
    return <SeatLimitBlockedScreen seatUsage={seatUsage} plan={license.plan} />;
  }

  return <>{children}</>;
}

/**
 * Blocked screen shown when seat limit prevents access
 */
function SeatLimitBlockedScreen({
  seatUsage,
  plan
}: {
  seatUsage: { used: number; limit: number; available: number };
  plan: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Keine freie Lizenz verfügbar
        </h1>

        <p className="text-muted-foreground mb-4">
          Alle Lizenzen sind derzeit in Verwendung. Bitte wenden Sie sich an Ihren Administrator.
        </p>

        <div className="bg-muted rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{seatUsage.used}</p>
              <p className="text-muted-foreground">Belegt</p>
            </div>
            <div className="text-muted-foreground">/</div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{seatUsage.limit}</p>
              <p className="text-muted-foreground">Verfügbar</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Plan: {plan.toUpperCase()}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span>Administrator kontaktieren für Seat-Zuweisung</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook-based check for conditional rendering
 */
export function useSeatAccess(): {
  hasAccess: boolean;
  isAdmin: boolean;
  hasSeat: boolean;
  seatUsage: { used: number; limit: number; available: number };
} {
  const { canAccessAdmin } = useIdentity();
  const { currentUserHasSeat, seatUsage, seatLimitExceeded } = useLicense();

  return {
    hasAccess: canAccessAdmin || currentUserHasSeat || (!seatLimitExceeded && seatUsage.available > 0),
    isAdmin: canAccessAdmin,
    hasSeat: currentUserHasSeat,
    seatUsage,
  };
}
