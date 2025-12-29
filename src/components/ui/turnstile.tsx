/**
 * Cloudflare Turnstile Component
 * 
 * CAPTCHA-Alternative für Bot-Schutz ohne Nutzer-Interaktion.
 * Verwendet den Cloudflare Turnstile Widget.
 */
import * as React from "react";
import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  language?: string;
}

export interface TurnstileRef {
  reset: () => void;
  getToken: () => string | undefined;
}

export interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  onLoadError?: () => void; // New: Called when script fails to load
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  className?: string;
  /** If true, allows fallback when Turnstile fails to load */
  allowFallback?: boolean;
}

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

/**
 * Lädt das Turnstile Script asynchron
 */
function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Bereits geladen
    if (window.turnstile) {
      resolve();
      return;
    }

    // Script bereits im DOM
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
    if (existing) {
      // Warte auf Load-Event
      window.onTurnstileLoad = () => resolve();
      return;
    }

    // Script einfügen
    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
    script.async = true;
    script.defer = true;

    window.onTurnstileLoad = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile script"));

    document.head.appendChild(script);
  });
}

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  ({ onVerify, onError, onExpire, onLoadError, theme = "auto", size = "normal", className, allowFallback = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
      getToken: () => {
        if (widgetIdRef.current && window.turnstile) {
          return window.turnstile.getResponse(widgetIdRef.current);
        }
        return undefined;
      },
    }));

    const handleCallback = useCallback(
      (token: string) => {
        onVerify(token);
      },
      [onVerify]
    );

    const handleError = useCallback(() => {
      setError("Verifizierung fehlgeschlagen");
      onError?.();
    }, [onError]);

    const handleExpire = useCallback(() => {
      onExpire?.();
    }, [onExpire]);

    useEffect(() => {
      if (!SITE_KEY) {
        setError("Turnstile Site Key nicht konfiguriert");
        console.error("VITE_TURNSTILE_SITE_KEY is not set");
        return;
      }

      let mounted = true;

      loadTurnstileScript()
        .then(() => {
          if (!mounted || !containerRef.current || !window.turnstile) return;

          // Cleanup vorheriges Widget
          if (widgetIdRef.current) {
            window.turnstile.remove(widgetIdRef.current);
          }

          // Render Widget
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            callback: handleCallback,
            "error-callback": handleError,
            "expired-callback": handleExpire,
            theme,
            size,
            language: "de",
          });

          setIsLoaded(true);
        })
        .catch((err) => {
          if (mounted) {
            setLoadFailed(true);
            if (allowFallback) {
              // Fallback: Call onVerify with empty token to allow form submission
              console.warn("Turnstile load failed, fallback enabled:", err);
              onLoadError?.();
            } else {
              setError("Turnstile konnte nicht geladen werden");
              console.error("Turnstile load error:", err);
            }
          }
        });

      return () => {
        mounted = false;
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }, [handleCallback, handleError, handleExpire, theme, size]);

    if (error) {
      return (
        <div className={cn("text-sm text-destructive p-2 border border-destructive/30 rounded", className)}>
          {error}
        </div>
      );
    }
    
    // Fallback mode - show warning but allow form submission
    if (loadFailed && allowFallback) {
      return (
        <div className={cn("text-sm text-amber-600 dark:text-amber-400 p-2 border border-amber-400/30 bg-amber-50 dark:bg-amber-900/20 rounded flex items-center gap-2", className)}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Sicherheitsprüfung nicht verfügbar (Netzwerk-Einschränkung)</span>
        </div>
      );
    }

    return (
      <div 
        ref={containerRef} 
        className={cn(
          "flex items-center justify-center min-h-[65px]",
          !isLoaded && "animate-pulse bg-muted rounded",
          className
        )}
      />
    );
  }
);

Turnstile.displayName = "Turnstile";

/**
 * Hook für Turnstile-Integration in Formularen
 * @param options.allowFallback - If true, allows form submission when Turnstile fails to load
 */
export function useTurnstile(options?: { allowFallback?: boolean }) {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const turnstileRef = useRef<TurnstileRef>(null);
  const allowFallback = options?.allowFallback ?? false;

  const handleVerify = useCallback((newToken: string) => {
    setToken(newToken);
    setIsVerified(true);
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
    setIsVerified(false);
  }, []);

  const handleError = useCallback(() => {
    setToken(null);
    setIsVerified(false);
  }, []);
  
  const handleLoadError = useCallback(() => {
    setLoadFailed(true);
    if (allowFallback) {
      // When fallback is enabled and load fails, mark as "verified" to allow submission
      setIsVerified(true);
      setToken("FALLBACK_MODE");
    }
  }, [allowFallback]);

  const reset = useCallback(() => {
    setToken(null);
    setIsVerified(loadFailed && allowFallback); // Stay verified in fallback mode
    turnstileRef.current?.reset();
  }, [loadFailed, allowFallback]);

  return {
    token,
    isVerified,
    loadFailed,
    reset,
    turnstileRef,
    turnstileProps: {
      ref: turnstileRef,
      onVerify: handleVerify,
      onExpire: handleExpire,
      onError: handleError,
      onLoadError: handleLoadError,
      allowFallback,
    },
  };
}
