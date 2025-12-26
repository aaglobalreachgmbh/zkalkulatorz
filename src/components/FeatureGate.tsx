// ============================================
// FeatureGate Component - Phase 3C.3
// Conditionally render content based on feature flags
// ============================================

import { ReactNode } from "react";
import { useFeature } from "@/hooks/useFeature";
import type { LicenseFeatures } from "@/lib/license";
import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FeatureGateProps {
  /** Feature key to check */
  feature: keyof LicenseFeatures;
  /** Content to render when feature is enabled */
  children: ReactNode;
  /** Optional fallback when feature is disabled (defaults to null) */
  fallback?: ReactNode;
  /** Show a tooltip hint when disabled (defaults to true) */
  showTooltip?: boolean;
  /** Show a disabled placeholder (for buttons etc.) */
  showDisabled?: boolean;
}

/**
 * Wraps content that should only be visible when a feature is enabled.
 * 
 * @example
 * <FeatureGate feature="aiConsultant">
 *   <AiConsultant />
 * </FeatureGate>
 * 
 * @example with disabled placeholder
 * <FeatureGate feature="exportPdf" showDisabled>
 *   <ExportButton />
 * </FeatureGate>
 */
export function FeatureGate({
  feature,
  children,
  fallback = null,
  showTooltip = true,
  showDisabled = false,
}: FeatureGateProps) {
  const { enabled, reason } = useFeature(feature);
  
  if (enabled) {
    return <>{children}</>;
  }
  
  // Show disabled placeholder with tooltip
  if (showDisabled && showTooltip && reason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-muted-foreground cursor-not-allowed opacity-60">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Feature nicht verfügbar</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{reason}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  // Show disabled placeholder without tooltip
  if (showDisabled) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-muted-foreground cursor-not-allowed opacity-60">
        <Lock className="w-4 h-4" />
        <span className="text-sm">Feature nicht verfügbar</span>
      </div>
    );
  }
  
  return <>{fallback}</>;
}

/**
 * FeatureGate for sections - shows a full blocked card
 */
export function FeatureGateSection({
  feature,
  children,
  title,
}: {
  feature: keyof LicenseFeatures;
  children: ReactNode;
  title?: string;
}) {
  const { enabled, reason, requiredPlan } = useFeature(feature);
  
  if (enabled) {
    return <>{children}</>;
  }
  
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <h4 className="font-medium text-foreground">
            {title || "Feature nicht verfügbar"}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            {reason}
          </p>
          {requiredPlan && (
            <p className="text-xs text-primary mt-2">
              Upgrade auf {requiredPlan.toUpperCase()} für diese Funktion
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
