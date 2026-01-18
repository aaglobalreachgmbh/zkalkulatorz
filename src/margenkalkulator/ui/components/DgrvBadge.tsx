// ============================================
// DGRV Badge Component
// Shows a badge when a contract qualifies for DGRV (12M BP-free)
// ============================================

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface DgrvBadgeProps {
  className?: string;
  compact?: boolean;
  freeMonths?: number;
}

export function DgrvBadge({ 
  className, 
  compact = false,
  freeMonths = 12,
}: DgrvBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="secondary" 
          className={cn(
            "bg-purple-100 text-purple-700 border-purple-200",
            "dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
            "gap-1.5 cursor-help",
            className
          )}
        >
          <Award className="w-3.5 h-3.5" />
          {compact ? "DGRV" : "DGRV-Berechtigung"}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-4">
        <div className="space-y-2">
          <p className="font-semibold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-500" />
            DGRV-Vertrag
          </p>
          <p className="text-sm text-muted-foreground">
            Bei diesem Angebot sind die ersten <strong>{freeMonths} Monate</strong> vom 
            Basispreis befreit (DGRV = Dauerrabatt-Gewähr-Vertrag).
          </p>
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Der angezeigte Durchschnittspreis berücksichtigt die kostenfreien Monate 
              und zeigt die effektiven Kosten über die gesamte Laufzeit.
            </p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
