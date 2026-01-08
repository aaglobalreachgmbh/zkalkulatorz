import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Calculator, ShieldCheck, Lock } from "lucide-react";
import { type ViewMode } from "@/margenkalkulator";
import { cn } from "@/lib/utils";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  allowCustomerMode?: boolean;
  /** When true, toggle is disabled (customer-safe mode active) */
  disabled?: boolean;
}

export function ViewModeToggle({ value, onChange, allowCustomerMode = true, disabled = false }: ViewModeToggleProps) {
  const { hasAdminFullVisibility } = useSensitiveFieldsVisible(value);
  
  return (
    <div className="flex items-center gap-2">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && !disabled && onChange(v as ViewMode)}
        className={cn("bg-muted p-1 rounded-lg", disabled && "opacity-60")}
      >
        <ToggleGroupItem
          value="customer"
          disabled={!allowCustomerMode || disabled}
          className={cn(
            "data-[state=on]:bg-background data-[state=on]:text-foreground px-3 py-1.5 text-sm",
            (!allowCustomerMode || disabled) && "opacity-50 cursor-not-allowed"
          )}
        >
          <Eye className="w-4 h-4 mr-1.5" />
          Kunde
        </ToggleGroupItem>
        <ToggleGroupItem
          value="dealer"
          disabled={disabled}
          className={cn(
            "data-[state=on]:bg-background data-[state=on]:text-foreground px-3 py-1.5 text-sm",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Calculator className="w-4 h-4 mr-1.5" />
          Händler
        </ToggleGroupItem>
      </ToggleGroup>
      
      {/* Security lock indicator when customer-safe mode is active */}
      {disabled && (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 gap-1">
              <Lock className="w-3 h-3" />
              Gesperrt
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kundenmodus aktiv – Händler-Ansicht gesperrt</p>
          </TooltipContent>
        </Tooltip>
      )}
      
      {!disabled && hasAdminFullVisibility && value === "customer" && (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="text-amber-600 border-amber-600 gap-1">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Admin-Vollsicht aktiv: Margen sichtbar auch in Kundenansicht</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}