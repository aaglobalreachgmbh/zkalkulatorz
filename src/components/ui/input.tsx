/**
 * SECURITY: Default Input Export
 * 
 * Dieser Export leitet automatisch auf SecureInput um.
 * Alle zukünftigen `import { Input }` erhalten automatisch Sicherheitsschutz.
 * 
 * Für Dateieingaben oder spezielle Fälle: import { RawInput } from "./input"
 */
import * as React from "react";
import { cn } from "@/lib/utils";

// Re-export SecureInput as default Input for automatic protection
export { SecureInput as Input, type SecureInputProps as InputProps } from "./secure-input";

/**
 * RawInput - Unsichere Input-Komponente für spezielle Anwendungsfälle
 * 
 * WARNUNG: Nur verwenden für:
 * - File-Inputs (type="file")
 * - Spezielle Integrationen die keine Sanitization vertragen
 * 
 * Für alle anderen Fälle: import { Input } from "@/components/ui/input"
 */
export const RawInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
RawInput.displayName = "RawInput";
