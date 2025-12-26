import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Calculator, ShieldCheck } from "lucide-react";
import { type ViewMode } from "@/margenkalkulator";
import { cn } from "@/lib/utils";
import { useSensitiveFieldsVisible } from "@/hooks/useSensitiveFieldsVisible";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  allowCustomerMode?: boolean;
}

export function ViewModeToggle({ value, onChange, allowCustomerMode = true }: ViewModeToggleProps) {
  const { hasAdminFullVisibility } = useSensitiveFieldsVisible(value);
  
  return (
    <div className="flex items-center gap-2">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as ViewMode)}
        className="bg-muted p-1 rounded-lg"
      >
        <ToggleGroupItem
          value="customer"
          disabled={!allowCustomerMode}
          className={cn(
            "data-[state=on]:bg-background data-[state=on]:text-foreground px-3 py-1.5 text-sm",
            !allowCustomerMode && "opacity-50 cursor-not-allowed"
          )}
        >
          <Eye className="w-4 h-4 mr-1.5" />
          Kunde
        </ToggleGroupItem>
        <ToggleGroupItem
          value="dealer"
          className="data-[state=on]:bg-background data-[state=on]:text-foreground px-3 py-1.5 text-sm"
        >
          <Calculator className="w-4 h-4 mr-1.5" />
          Händler
        </ToggleGroupItem>
      </ToggleGroup>
      
      {hasAdminFullVisibility && value === "customer" && (
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