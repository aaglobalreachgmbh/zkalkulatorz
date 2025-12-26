// ============================================
// FeatureRoute Component - Phase 3C.3
// Route protection based on feature flags
// ============================================

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useFeature } from "@/hooks/useFeature";
import type { LicenseFeatures } from "@/lib/license";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/MainLayout";

interface FeatureRouteProps {
  /** Feature key to check */
  feature: keyof LicenseFeatures;
  /** Content to render when feature is enabled */
  children: ReactNode;
  /** Redirect to this path when feature is disabled (optional) */
  redirectTo?: string;
  /** Show a "feature disabled" page instead of redirecting */
  showBlockedPage?: boolean;
}

/**
 * Protects a route based on feature availability.
 * 
 * @example
 * <Route path="/data-manager" element={
 *   <FeatureRoute feature="dataGovernance" showBlockedPage>
 *     <DataManager />
 *   </FeatureRoute>
 * } />
 */
export function FeatureRoute({
  feature,
  children,
  redirectTo = "/",
  showBlockedPage = true,
}: FeatureRouteProps) {
  const { enabled, reason, requiredPlan } = useFeature(feature);
  
  if (enabled) {
    return <>{children}</>;
  }
  
  // Redirect if configured
  if (!showBlockedPage) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Show blocked page
  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Zugriff eingeschränkt
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {reason || "Diese Funktion ist in Ihrer aktuellen Lizenz nicht verfügbar."}
          </p>
          
          {requiredPlan && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-primary">
                Upgrade auf <strong>{requiredPlan.toUpperCase()}</strong> um diese Funktion freizuschalten.
              </p>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
