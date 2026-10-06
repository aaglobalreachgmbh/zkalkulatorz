import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap } from "lucide-react";
import { useWorkplaceMode } from "@/contexts/WorkplaceModeContext";
import { cn } from "@/lib/utils";

interface POSModeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function POSModeToggle({ className, showLabel = true }: POSModeToggleProps) {
  const { isPOS: isPOSMode, toggleWorkplaceMode } = useWorkplaceMode();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex items-center gap-2", className)}>
          <Switch
            id="pos-mode"
            checked={isPOSMode}
            onCheckedChange={toggleWorkplaceMode}
            className="data-[state=checked]:bg-amber-500"
          />
          {showLabel && (
            <label
              htmlFor="pos-mode"
              className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
            >
              <Zap className={cn(
                "w-4 h-4 transition-colors",
                isPOSMode ? "text-amber-500" : "text-muted-foreground"
              )} />
              <span className="hidden sm:inline">POS</span>
            </label>
          )}
          {isPOSMode && (
            <Badge 
              variant="outline" 
              className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs"
            >
              Aktiv
            </Badge>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="text-sm">
          <p className="font-medium">Arbeitsplatz: Shop / POS</p>
          <p className="text-muted-foreground text-xs mt-1">
            Vereinfachte Ansicht für schnellen Verkauf am Tresen
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
