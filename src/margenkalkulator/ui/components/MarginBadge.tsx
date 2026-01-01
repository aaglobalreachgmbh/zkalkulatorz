// ============================================
// MarginBadge Component
// Consistent margin display across entire UI
// ============================================

import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatMargin,
  formatPercent,
  getProfitabilityStatus,
  getStatusColors,
  getStatusLabel,
  type ProfitabilityStatus,
} from "../../lib/formatters";

interface MarginBadgeProps {
  margin: number;
  marginPercentage?: number;
  status?: ProfitabilityStatus;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function MarginBadge({
  margin,
  marginPercentage,
  status: explicitStatus,
  showPercentage = true,
  size = "md",
  showLabel = false,
  className,
}: MarginBadgeProps) {
  // Determine status from margin if not explicitly provided
  const status = explicitStatus ?? getProfitabilityStatus(margin);
  const colors = getStatusColors(status);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-3 py-1 gap-1.5",
    lg: "text-base px-4 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const StatusIcon = status === "positive" ? CheckCircle : status === "warning" ? AlertTriangle : XCircle;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center font-medium",
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        className
      )}
    >
      <StatusIcon className={iconSizes[size]} />
      <span className="font-semibold">{formatMargin(margin)}</span>
      {showPercentage && marginPercentage !== undefined && (
        <span className="opacity-75">({formatPercent(marginPercentage)})</span>
      )}
      {showLabel && (
        <span className="ml-1 opacity-75">{getStatusLabel(status)}</span>
      )}
    </Badge>
  );
}

// Compact version for use in tables/lists
interface MarginIndicatorProps {
  margin: number;
  className?: string;
}

export function MarginIndicator({ margin, className }: MarginIndicatorProps) {
  const status = getProfitabilityStatus(margin);
  const colors = getStatusColors(status);
  const StatusIcon = status === "positive" ? CheckCircle : status === "warning" ? AlertTriangle : XCircle;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <StatusIcon className={cn("w-4 h-4", colors.text)} />
      <span className={cn("font-medium", colors.text)}>{formatMargin(margin)}</span>
    </div>
  );
}
