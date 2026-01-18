import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// =============================================================================
// Session Security Hook - Timeout & Activity Tracking
// =============================================================================

const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes inactivity timeout
const WARNING_BEFORE_MS = 1 * 60 * 1000; // Warn 1 minute before
const CHECK_INTERVAL_MS = 15 * 1000; // Check every 15 seconds for faster response
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"];

interface SessionSecurityState {
  lastActivity: number;
  warningShown: boolean;
}

export function useSessionSecurity() {
  const { user, signOut } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const warningShownRef = useRef(false);
  const timeoutIdRef = useRef<number | null>(null);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    warningShownRef.current = false; // Reset warning on activity
  }, []);

  // Handle session timeout
  const handleSessionTimeout = useCallback(() => {
    if (user) {
      toast.warning("Session abgelaufen. Du wirst abgemeldet.", {
        duration: 5000,
      });
      
      // Small delay to show toast
      setTimeout(() => {
        signOut();
      }, 1000);
    }
  }, [user, signOut]);

  // Show warning before timeout
  const showTimeoutWarning = useCallback(() => {
    if (!warningShownRef.current && user) {
      warningShownRef.current = true;
      toast.info("Deine Session läuft in 1 Minute ab. Bleibe aktiv um angemeldet zu bleiben.", {
        duration: 10000,
        action: {
          label: "OK",
          onClick: updateActivity,
        },
      });
    }
  }, [user, updateActivity]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    // Throttled activity update (max once per 10 seconds)
    let lastUpdate = Date.now();
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 10000) {
        lastUpdate = now;
        updateActivity();
      }
    };

    // Add event listeners
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, throttledUpdate, { passive: true });
    });

    // Handle visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateActivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, throttledUpdate);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, updateActivity]);

  // Session timeout check
  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;

      if (inactiveTime > SESSION_TIMEOUT_MS) {
        handleSessionTimeout();
      } else if (inactiveTime > SESSION_TIMEOUT_MS - WARNING_BEFORE_MS) {
        showTimeoutWarning();
      }
    };

    // Initial check
    checkSession();

    // Set up interval
    const intervalId = window.setInterval(checkSession, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user, lastActivity, handleSessionTimeout, showTimeoutWarning]);

  // Extend session (e.g., after important action)
  const extendSession = useCallback(() => {
    updateActivity();
    toast.success("Session verlängert", { duration: 2000 });
  }, [updateActivity]);

  // Get remaining session time
  const getRemainingTime = useCallback((): number => {
    const elapsed = Date.now() - lastActivity;
    return Math.max(0, SESSION_TIMEOUT_MS - elapsed);
  }, [lastActivity]);

  // Format remaining time as string
  const getFormattedRemainingTime = useCallback((): string => {
    const remaining = getRemainingTime();
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [getRemainingTime]);

  return {
    lastActivity,
    extendSession,
    getRemainingTime,
    getFormattedRemainingTime,
    isActive: user !== null,
  };
}

// =============================================================================
// Session Security Provider (Optional - for global state)
// =============================================================================
export function useSessionSecurityCheck(): boolean {
  const { user } = useAuth();
  
  // Only run session security for authenticated users
  useSessionSecurity();
  
  return user !== null;
}
