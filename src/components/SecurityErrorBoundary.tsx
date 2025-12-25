import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

// ============================================================================
// SECURITY PATTERNS FOR ERROR ANALYSIS
// ============================================================================

const SUSPICIOUS_ERROR_PATTERNS = [
  // XSS-related
  /script/i,
  /javascript:/i,
  /on\w+=/i,
  
  // Injection attempts
  /SQL|SELECT|INSERT|DELETE|DROP/i,
  /UNION\s+ALL/i,
  
  // Path traversal
  /\.\.\//,
  
  // Prototype pollution
  /__proto__/,
  /constructor\s*\[/,
  /prototype\s*\[/,
];

function analyzeError(error: Error): { isSuspicious: boolean; patterns: string[] } {
  const errorString = `${error.name} ${error.message} ${error.stack || ""}`;
  const matchedPatterns: string[] = [];
  
  for (const pattern of SUSPICIOUS_ERROR_PATTERNS) {
    if (pattern.test(errorString)) {
      matchedPatterns.push(pattern.source);
    }
  }
  
  return {
    isSuspicious: matchedPatterns.length > 0,
    patterns: matchedPatterns,
  };
}

function generateErrorId(): string {
  return `ERR_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

export class SecurityErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const analysis = analyzeError(error);
    
    // Log für Entwicklung
    if (import.meta.env.DEV) {
      console.group("🛡️ Security Error Boundary");
      console.error("Error:", error);
      console.error("Component Stack:", errorInfo.componentStack);
      
      if (analysis.isSuspicious) {
        console.warn("⚠️ SUSPICIOUS PATTERNS DETECTED:", analysis.patterns);
      }
      
      console.groupEnd();
    }
    
    // Log für Produktion (ohne sensible Details)
    if (import.meta.env.PROD) {
      console.error(`[Error ${this.state.errorId}] Application error occurred`, {
        isSuspicious: analysis.isSuspicious,
        patternsCount: analysis.patterns.length,
      });
    }
    
    // Callback für Parent
    this.props.onError?.(error, errorInfo);
    
    // Bei verdächtigen Fehlern: Zusätzliche Sicherheitsmaßnahmen
    if (analysis.isSuspicious) {
      // Clear sensitive data from localStorage
      try {
        const sensitiveKeys = ["authToken", "session", "user"];
        sensitiveKeys.forEach((key) => {
          if (localStorage.getItem(key)) {
            // Don't actually remove - just flag for review
            console.warn(`[Security] Sensitive key "${key}" present during suspicious error`);
          }
        });
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  private handleReload = (): void => {
    // Clear error state and reload
    this.setState({ hasError: false, error: null, errorId: null });
    window.location.reload();
  };

  private handleRetry = (): void => {
    // Just clear the error state, don't reload
    this.setState({ hasError: false, error: null, errorId: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Etwas ist schiefgelaufen</CardTitle>
              <CardDescription>
                Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error ID für Support */}
              {this.state.errorId && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Fehler-ID: <code className="bg-muted px-1 py-0.5 rounded">{this.state.errorId}</code>
                  </p>
                </div>
              )}
              
              {/* Error Details nur in DEV */}
              {import.meta.env.DEV && this.state.error && (
                <div className="p-3 bg-muted rounded-md overflow-auto max-h-32">
                  <p className="text-xs font-mono text-muted-foreground">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={this.handleRetry}>
                  Erneut versuchen
                </Button>
                <Button onClick={this.handleReload}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Seite neu laden
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SecurityErrorBoundary;
