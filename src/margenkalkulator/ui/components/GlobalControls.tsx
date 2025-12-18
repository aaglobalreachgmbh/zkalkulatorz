import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ViewMode } from "../../engine/types";
import { ViewModeToggle } from "./ViewModeToggle";

interface GlobalControlsProps {
  activeOption: 1 | 2;
  onActiveOptionChange: (option: 1 | 2) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showOptionToggle?: boolean;
}

export function GlobalControls({
  activeOption,
  onActiveOptionChange,
  viewMode,
  onViewModeChange,
  showOptionToggle = true,
}: GlobalControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Left: Option Toggle */}
      <div className="flex items-center gap-3">
        {showOptionToggle && (
          <>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Bearbeite:
            </span>
            <ToggleGroup
              type="single"
              value={String(activeOption)}
              onValueChange={(v) => v && onActiveOptionChange(Number(v) as 1 | 2)}
              className="bg-muted p-0.5 rounded-md"
            >
              <ToggleGroupItem
                value="1"
                size="sm"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3"
              >
                Option 1
              </ToggleGroupItem>
              <ToggleGroupItem
                value="2"
                size="sm"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3"
              >
                Option 2
              </ToggleGroupItem>
            </ToggleGroup>
          </>
        )}
      </div>

      {/* Right: View Mode */}
      <div className="flex items-center gap-2">
        <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
      </div>
    </div>
  );
}
