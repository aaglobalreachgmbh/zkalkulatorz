import { createContext, useContext } from "react";
import { checkAllThreats, RATE_LIMITS } from "@/lib/securityPatterns";

// ============================================================================
// TYPES
// ============================================================================

export interface SecurityEvent {
    type: "threat_detected" | "rate_limited" | "sanitization_applied" | "anomaly_detected" | "auth_failure";
    timestamp: number;
    details: Record<string, unknown>;
}

export interface SecurityContextType {
    // Input Security
    sanitize: (input: string, maxLength?: number) => string;
    escape: (input: string) => string;
    checkThreats: (input: string) => ReturnType<typeof checkAllThreats>;

    // Rate Limiting (Client-side)
    canMakeRequest: (category: keyof typeof RATE_LIMITS) => boolean;
    getRemainingRequests: (category: keyof typeof RATE_LIMITS) => number;

    // Event Logging
    logEvent: (event: Omit<SecurityEvent, "timestamp">) => void;

    // Status
    isSecurityActive: boolean;
    recentEvents: SecurityEvent[];

    // Phase C additions
    isEncryptionAvailable: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

export const SecurityContext = createContext<SecurityContextType | null>(null);

// ============================================================================
// HOOKS
// ============================================================================

export function useSecurity(): SecurityContextType {
    const context = useContext(SecurityContext);

    if (!context) {
        throw new Error("useSecurity must be used within a SecurityProvider");
    }

    return context;
}

// Optional hook that returns null if not in provider (for HOC usage)
export function useSecurityOptional(): SecurityContextType | null {
    return useContext(SecurityContext);
}
