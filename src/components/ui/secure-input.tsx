import * as React from "react";
import { cn } from "@/lib/utils";
import { useSecurityOptional } from "@/providers/SecurityProvider";
import { SANITIZE_RULES } from "@/lib/securityPatterns";

// ============================================================================
// TYPES
// ============================================================================

export interface SecureInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** Custom max length (overrides default) */
  secureMaxLength?: number;

  /** Enable real-time threat detection */
  detectThreats?: boolean;

  /** Callback when threat detected */
  onThreatDetected?: (threats: string[]) => void;

  /** Standard onChange with sanitized value */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>, sanitizedValue: string) => void;

  /** Show visual warning on threat */
  showThreatWarning?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const SecureInput = React.forwardRef<HTMLInputElement, SecureInputProps>(
  (
    {
      className,
      type = "text",
      secureMaxLength,
      detectThreats = true,
      onThreatDetected,
      onChange,
      showThreatWarning = true,
      ...props
    },
    ref
  ) => {
    const security = useSecurityOptional();
    const [hasThreat, setHasThreat] = React.useState(false);

    // Determine max length based on input type
    const maxLength = React.useMemo(() => {
      if (secureMaxLength) return secureMaxLength;

      switch (type) {
        case "email":
          return SANITIZE_RULES.maxLengths.email;
        case "password":
          return SANITIZE_RULES.maxLengths.password;
        case "search":
          return SANITIZE_RULES.maxLengths.search;
        case "url":
          return SANITIZE_RULES.maxLengths.url;
        default:
          return SANITIZE_RULES.maxLengths.default;
      }
    }, [type, secureMaxLength]);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const originalValue = e.target.value;

        // Threat detection
        if (detectThreats && security) {
          const threatResult = security.checkThreats(originalValue);

          if (!threatResult.isSafe) {
            setHasThreat(true);
            onThreatDetected?.(threatResult.threats);

            // Log and potentially block
            if (threatResult.riskLevel === "critical" || threatResult.riskLevel === "high") {
              // For high-risk threats, sanitize immediately
              const sanitized = security.sanitize(originalValue, maxLength);
              e.target.value = sanitized;
              onChange?.(e, sanitized);
              return;
            }
          } else {
            setHasThreat(false);
          }
        }

        // Sanitize value
        const sanitizedValue = security
          ? security.sanitize(originalValue, maxLength)
          : originalValue.slice(0, maxLength);

        onChange?.(e, sanitizedValue);
      },
      [detectThreats, security, maxLength, onThreatDetected, onChange]
    );

    // Handle paste events
    const handlePaste = React.useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (!security) return;

        const pastedText = e.clipboardData.getData("text");
        const threatResult = security.checkThreats(pastedText);

        if (!threatResult.isSafe && (threatResult.riskLevel === "critical" || threatResult.riskLevel === "high")) {
          e.preventDefault();

          // Insert sanitized version
          const sanitized = security.sanitize(pastedText, maxLength);
          const input = e.currentTarget;
          const start = input.selectionStart || 0;
          const end = input.selectionEnd || 0;
          const currentValue = input.value;

          const newValue = currentValue.slice(0, start) + sanitized + currentValue.slice(end);
          input.value = newValue.slice(0, maxLength);

          // Trigger onChange
          const syntheticEvent = {
            ...e,
            target: input,
            currentTarget: input,
          } as React.ChangeEvent<HTMLInputElement>;

          onChange?.(syntheticEvent, input.value);
        }
      },
      [security, maxLength, onChange]
    );

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm enterprise-input",
          hasThreat && showThreatWarning && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        maxLength={maxLength}
        onChange={handleChange}
        onPaste={handlePaste}
        autoComplete={props.autoComplete}
        {...props}
      />
    );
  }
);

SecureInput.displayName = "SecureInput";

export { SecureInput };

// ============================================================================
// SECURE TEXTAREA
// ============================================================================

export interface SecureTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  secureMaxLength?: number;
  detectThreats?: boolean;
  onThreatDetected?: (threats: string[]) => void;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>, sanitizedValue: string) => void;
  showThreatWarning?: boolean;
}

const SecureTextarea = React.forwardRef<HTMLTextAreaElement, SecureTextareaProps>(
  (
    {
      className,
      secureMaxLength = SANITIZE_RULES.maxLengths.message,
      detectThreats = true,
      onThreatDetected,
      onChange,
      showThreatWarning = true,
      ...props
    },
    ref
  ) => {
    const security = useSecurityOptional();
    const [hasThreat, setHasThreat] = React.useState(false);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const originalValue = e.target.value;

        if (detectThreats && security) {
          const threatResult = security.checkThreats(originalValue);

          if (!threatResult.isSafe) {
            setHasThreat(true);
            onThreatDetected?.(threatResult.threats);
          } else {
            setHasThreat(false);
          }
        }

        const sanitizedValue = security
          ? security.sanitize(originalValue, secureMaxLength)
          : originalValue.slice(0, secureMaxLength);

        onChange?.(e, sanitizedValue);
      },
      [detectThreats, security, secureMaxLength, onThreatDetected, onChange]
    );

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          hasThreat && showThreatWarning && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        maxLength={secureMaxLength}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

SecureTextarea.displayName = "SecureTextarea";

export { SecureTextarea };
