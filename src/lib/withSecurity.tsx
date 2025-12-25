import React, { ComponentType, useEffect, useRef } from "react";
import { useSecurity, useSecurityOptional } from "@/providers/SecurityProvider";
import { SecurityErrorBoundary } from "@/components/SecurityErrorBoundary";
import { useAuth } from "@/hooks/useAuth";

// ============================================================================
// TYPES
// ============================================================================

interface SecurityOptions {
  /** Require user to be authenticated */
  requireAuth?: boolean;
  
  /** Track all events in this component */
  trackEvents?: boolean;
  
  /** Sanitize all string props automatically */
  sanitizeProps?: boolean;
  
  /** Component name for logging */
  displayName?: string;
  
  /** Custom error fallback */
  errorFallback?: React.ReactNode;
}

// ============================================================================
// HOC IMPLEMENTATION
// ============================================================================

/**
 * Higher-Order Component that adds automatic security features to any component.
 * 
 * Features:
 * - Error boundary wrapper
 * - Optional authentication requirement
 * - Optional event tracking
 * - Optional prop sanitization
 * 
 * Usage:
 * ```tsx
 * const SecureComponent = withSecurity(MyComponent, {
 *   requireAuth: true,
 *   trackEvents: true,
 * });
 * ```
 */
export function withSecurity<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: SecurityOptions = {}
): React.FC<P> {
  const {
    requireAuth = false,
    trackEvents = false,
    sanitizeProps = false,
    displayName,
    errorFallback,
  } = options;
  
  const componentName = displayName || WrappedComponent.displayName || WrappedComponent.name || "Component";
  
  function SecuredComponent(props: P): React.ReactElement | null {
    const security = useSecurityOptional();
    const auth = requireAuth ? useAuth() : null;
    const mountTime = useRef(Date.now());
    
    // Track mount/unmount
    useEffect(() => {
      if (trackEvents && security) {
        security.logEvent({
          type: "validation_failed", // Using existing type for component lifecycle
          details: {
            action: "component_mount",
            component: componentName,
          },
        });
        
        return () => {
          const duration = Date.now() - mountTime.current;
          security.logEvent({
            type: "validation_failed",
            details: {
              action: "component_unmount",
              component: componentName,
              durationMs: duration,
            },
          });
        };
      }
    }, [security]);
    
    // Auth check
    if (requireAuth && auth) {
      if (auth.isLoading) {
        return (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        );
      }
      
      if (!auth.user) {
        return (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            Nicht autorisiert
          </div>
        );
      }
    }
    
    // Sanitize string props if enabled
    let processedProps = props;
    if (sanitizeProps && security) {
      processedProps = {} as P;
      
      for (const [key, value] of Object.entries(props)) {
        if (typeof value === "string") {
          (processedProps as Record<string, unknown>)[key] = security.sanitize(value);
        } else {
          (processedProps as Record<string, unknown>)[key] = value;
        }
      }
    }
    
    return <WrappedComponent {...processedProps} />;
  }
  
  // Wrap with error boundary
  function SecuredComponentWithBoundary(props: P): React.ReactElement {
    return (
      <SecurityErrorBoundary fallback={errorFallback}>
        <SecuredComponent {...props} />
      </SecurityErrorBoundary>
    );
  }
  
  SecuredComponentWithBoundary.displayName = `withSecurity(${componentName})`;
  
  return SecuredComponentWithBoundary;
}

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

/**
 * HOC that requires authentication
 */
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>
): React.FC<P> {
  return withSecurity(WrappedComponent, { requireAuth: true });
}

/**
 * HOC that adds event tracking
 */
export function withTracking<P extends object>(
  WrappedComponent: ComponentType<P>
): React.FC<P> {
  return withSecurity(WrappedComponent, { trackEvents: true });
}

/**
 * HOC that sanitizes all string props
 */
export function withSanitization<P extends object>(
  WrappedComponent: ComponentType<P>
): React.FC<P> {
  return withSecurity(WrappedComponent, { sanitizeProps: true });
}

export default withSecurity;
