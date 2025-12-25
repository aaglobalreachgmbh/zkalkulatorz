// =============================================================================
// VAULT SECURITY: Honeypot Field Component for Bot Detection
// =============================================================================

import React, { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// =============================================================================
// Types
// =============================================================================

interface HoneypotFieldProps {
  /** Unique identifier for the form */
  formId?: string;
  /** Field name (used for logging) */
  fieldName?: string;
  /** Callback when honeypot is triggered */
  onBotDetected?: (value: string) => void;
  /** Additional class names for the wrapper */
  className?: string;
}

interface HoneypotState {
  isTriggered: boolean;
  value: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).slice(0, 12);
}

function getClientFingerprint(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ];
  return hashString(parts.join("|"));
}

// =============================================================================
// Honeypot Field Component
// =============================================================================

/**
 * HoneypotField - An invisible field that bots will fill out, humans won't.
 * 
 * Usage:
 * ```tsx
 * <form onSubmit={handleSubmit}>
 *   <HoneypotField 
 *     formId="contact-form" 
 *     onBotDetected={(val) => console.log("Bot detected:", val)} 
 *   />
 *   <input name="email" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 * 
 * In your form handler, check if honeypot was triggered:
 * ```tsx
 * const honeypotRef = useRef<HoneypotFieldHandle>(null);
 * if (honeypotRef.current?.isTriggered()) {
 *   // Block submission
 *   return;
 * }
 * ```
 */
export const HoneypotField = React.forwardRef<
  { isTriggered: () => boolean; getValue: () => string },
  HoneypotFieldProps
>(({ formId = "default", fieldName = "website", onBotDetected, className }, ref) => {
  const [state, setState] = useState<HoneypotState>({
    isTriggered: false,
    value: "",
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLogged = useRef(false);

  // Log honeypot trigger to database
  const logHoneypotTrigger = useCallback(async (value: string) => {
    if (hasLogged.current) return;
    hasLogged.current = true;

    try {
      const ipHash = getClientFingerprint();
      const userAgentHash = hashString(navigator.userAgent);

      await supabase.from("honeypot_submissions").insert({
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
        form_id: formId,
        field_name: fieldName,
        field_value: value.slice(0, 500), // Limit stored value
      });

      console.warn("[Honeypot] Bot detected and logged");
    } catch (err) {
      console.error("[Honeypot] Failed to log:", err);
    }
  }, [formId, fieldName]);

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      if (value) {
        setState({ isTriggered: true, value });
        logHoneypotTrigger(value);
        onBotDetected?.(value);
      }
    },
    [logHoneypotTrigger, onBotDetected]
  );

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    isTriggered: () => state.isTriggered,
    getValue: () => state.value,
  }));

  return (
    <div
      className={className}
      // Multiple hiding techniques to catch different bots
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        opacity: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      {/* Primary honeypot - looks like a website field */}
      <label htmlFor={`hp_${formId}_${fieldName}`}>
        Leave this field empty
      </label>
      <input
        ref={inputRef}
        id={`hp_${formId}_${fieldName}`}
        name={fieldName}
        type="text"
        autoComplete="off"
        tabIndex={-1}
        onChange={handleChange}
        value={state.value}
      />
      
      {/* Secondary honeypot - common bot target names */}
      <input
        name="email_confirm"
        type="text"
        autoComplete="off"
        tabIndex={-1}
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </div>
  );
});

HoneypotField.displayName = "HoneypotField";

// =============================================================================
// Hook for Form Integration
// =============================================================================

export interface UseHoneypotResult {
  honeypotProps: HoneypotFieldProps & {
    ref: React.RefObject<{ isTriggered: () => boolean; getValue: () => string } | null>;
  };
  isBot: boolean;
  checkBot: () => boolean;
}

/**
 * Hook for easy honeypot integration
 * 
 * Usage:
 * ```tsx
 * function MyForm() {
 *   const { honeypotProps, checkBot } = useHoneypot("contact-form");
 *   
 *   const handleSubmit = (e: FormEvent) => {
 *     e.preventDefault();
 *     if (checkBot()) {
 *       toast.error("Suspicious activity detected");
 *       return;
 *     }
 *     // Process form...
 *   };
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <HoneypotField {...honeypotProps} />
 *       ...
 *     </form>
 *   );
 * }
 * ```
 */
export function useHoneypot(formId: string): UseHoneypotResult {
  const ref = useRef<{ isTriggered: () => boolean; getValue: () => string } | null>(null);
  const [isBot, setIsBot] = useState(false);

  const handleBotDetected = useCallback(() => {
    setIsBot(true);
  }, []);

  const checkBot = useCallback(() => {
    const triggered = ref.current?.isTriggered() ?? false;
    if (triggered) setIsBot(true);
    return triggered;
  }, []);

  return {
    honeypotProps: {
      ref,
      formId,
      onBotDetected: handleBotDetected,
    },
    isBot,
    checkBot,
  };
}

export default HoneypotField;
