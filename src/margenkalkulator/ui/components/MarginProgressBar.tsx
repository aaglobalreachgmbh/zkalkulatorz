// ============================================
// MarginProgressBar - Visual margin indicator
// Shows margin with semantic color and progress
// ============================================

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getProfitabilityStatus, formatMargin } from "../../lib/formatters";

interface MarginProgressBarProps {
  margin: number;
  maxMargin?: number;
  showLabel?: boolean;
  className?: string;
}

export function MarginProgressBar({
  margin,
  maxMargin = 300,
  showLabel = true,
  className,
}: MarginProgressBarProps) {
  const status = getProfitabilityStatus(margin);
  
  // Calculate progress percentage (0-100)
  const progress = Math.min(Math.max((margin / maxMargin) * 100, 0), 100);

  // Get semantic colors based on status
  const colorClasses = {
    positive: {
      text: "text-[hsl(var(--status-success))]",
      bar: "[&>div]:bg-[hsl(var(--status-success))]",
      bg: "bg-[hsl(var(--status-success)/0.2)]",
    },
    warning: {
      text: "text-[hsl(var(--status-warning))]",
      bar: "[&>div]:bg-[hsl(var(--status-warning))]",
      bg: "bg-[hsl(var(--status-warning)/0.2)]",
    },
    critical: {
      text: "text-[hsl(var(--status-error))]",
      bar: "[&>div]:bg-[hsl(var(--status-error))]",
      bg: "bg-[hsl(var(--status-error)/0.2)]",
    },
  };

  const colors = colorClasses[status];

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">Marge</span>
          <span className={cn("font-semibold tabular-nums", colors.text)}>
            {formatMargin(margin)}
          </span>
        </div>
      )}
      <Progress
        value={progress}
        className={cn("h-2", colors.bg, colors.bar)}
      />
    </div>
  );
}

export default MarginProgressBar;
