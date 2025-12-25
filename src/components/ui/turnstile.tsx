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
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  className?: string;
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
  ({ onVerify, onError, onExpire, theme = "auto", size = "normal", className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            setError("Turnstile konnte nicht geladen werden");
            console.error("Turnstile load error:", err);
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
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const turnstileRef = useRef<TurnstileRef>(null);

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

  const reset = useCallback(() => {
    setToken(null);
    setIsVerified(false);
    turnstileRef.current?.reset();
  }, []);

  return {
    token,
    isVerified,
    reset,
    turnstileRef,
    turnstileProps: {
      ref: turnstileRef,
      onVerify: handleVerify,
      onExpire: handleExpire,
      onError: handleError,
    },
  };
}
