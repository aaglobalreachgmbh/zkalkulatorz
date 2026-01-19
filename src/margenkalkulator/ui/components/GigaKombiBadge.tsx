// ============================================
// GigaKombi Badge - Compact Alternative to Banner
// ============================================

import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { cn } from "@/lib/utils";

interface GigaKombiBadgeProps {
  /** Whether GigaKombi is eligible */
  isEligible: boolean;
  /** Discount amount in Euro */
  discountAmount?: number;
  /** Optional className */
  className?: string;
  /** Show detailed tooltip */
  showTooltip?: boolean;
}

export function GigaKombiBadge({
  isEligible,
  discountAmount = 5,
  className,
  showTooltip = true,
}: GigaKombiBadgeProps) {
  if (!isEligible) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-700 dark:text-emerald-400",
        "gap-1.5 py-1 px-2.5 font-medium",
        className
      )}
    >
      <Zap className="w-3.5 h-3.5 fill-current" />
      <span>GigaKombi −{discountAmount}€</span>
      {showTooltip && <HelpTooltip content="GigaKombi" />}
    </Badge>
  );
}
