import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Eye, Calculator } from "lucide-react";
import { type ViewMode } from "@/margenkalkulator";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ViewMode)}
      className="bg-muted p-1 rounded-lg"
    >
      <ToggleGroupItem
        value="customer"
        className="data-[state=on]:bg-background data-[state=on]:text-foreground px-3 py-1.5 text-sm"
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
  );
}