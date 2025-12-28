import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type ViewMode } from "@/margenkalkulator";
import { ViewModeToggle } from "./ViewModeToggle";
import { DatasetVersionSelector } from "./DatasetVersionSelector";
import { Lock } from "lucide-react";
import { useFeature } from "@/hooks/useFeature";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DatasetVersion } from "@/margenkalkulator/hooks/useDatasetVersions";

interface GlobalControlsProps {
  activeOption: 1 | 2;
  onActiveOptionChange: (option: 1 | 2) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showOptionToggle?: boolean;
  showVersionSelector?: boolean;
  onVersionChange?: (version: DatasetVersion | null) => void;
}

export function GlobalControls({
  activeOption,
  onActiveOptionChange,
  viewMode,
  onViewModeChange,
  showOptionToggle = true,
  showVersionSelector = true,
  onVersionChange,
}: GlobalControlsProps) {
  const { enabled: option2Enabled, reason: option2Reason } = useFeature("compareOption2");
  
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Left: Option Toggle & Version Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        {showOptionToggle && (
          <>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Bearbeite:
            </span>
            <ToggleGroup
              type="single"
              value={String(activeOption)}
              onValueChange={(v) => {
                if (!v) return;
                const opt = Number(v) as 1 | 2;
                if (opt === 2 && !option2Enabled) return;
                onActiveOptionChange(opt);
              }}
              className="bg-muted p-0.5 rounded-md"
            >
              <ToggleGroupItem
                value="1"
                size="sm"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3"
              >
                Option 1
              </ToggleGroupItem>
              
              {option2Enabled ? (
                <ToggleGroupItem
                  value="2"
                  size="sm"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3"
                >
                  Option 2
                </ToggleGroupItem>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-sm text-muted-foreground cursor-not-allowed opacity-50">
                      <Lock className="h-3 w-3" />
                      Option 2
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[200px] text-xs">{option2Reason}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </ToggleGroup>
          </>
        )}
        
        {showVersionSelector && (
          <DatasetVersionSelector compact onVersionChange={onVersionChange} />
        )}
      </div>

      {/* Right: View Mode */}
      <div className="flex items-center gap-2">
        <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
      </div>
    </div>
  );
}