// ============================================
// HardwareCard - Family card with Popover selector
// Phase 6: Extracted from HardwareStep
// ============================================

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HardwareFamily, HardwareSubModel, HardwareConfig } from "../../../lib/hardwareGrouping";

interface HardwareCardProps {
  family: HardwareFamily;
  isSelected: boolean;
  selectedSubModel: HardwareSubModel | null;
  selectedConfig: HardwareConfig | null;
  showHardwareEk: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSelect: (config: HardwareConfig, brand: string) => void;
  getImage: (id: string, familyId?: string) => string;
}

export function HardwareCard({
  family,
  isSelected,
  selectedSubModel,
  selectedConfig,
  showHardwareEk,
  isOpen,
  onOpenChange,
  onConfigSelect,
  getImage,
}: HardwareCardProps) {
  const hasMultipleOptions = family.totalConfigs > 1;

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "group relative flex flex-col h-full w-full bg-card rounded-lg border text-left transition-all duration-200",
            "hover:border-primary/50 hover:shadow-sm",
            isSelected ? "border-primary ring-1 ring-primary/20 bg-accent/5" : "border-border"
          )}
        >
          {/* Selection Indicator */}
          {isSelected && (
            <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}

          {/* Image Container */}
          <div className="aspect-[4/5] w-full p-4 bg-muted/20 border-b border-border/50 flex items-center justify-center rounded-t-lg group-hover:bg-muted/30 transition-colors">
            <img
              src={getImage(family.familyId, family.familyId)}
              alt={family.familyName}
              className="w-full h-full object-contain mix-blend-multiply"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "";
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-3 flex flex-col">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-sm text-foreground leading-tight">
                {family.familyName}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              {family.brand}
            </p>

            {/* Selected Spec Badge */}
            {selectedSubModel && selectedConfig && (
              <div className="mt-auto pt-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 truncate max-w-full">
                  {selectedSubModel.subModelName ? `${selectedSubModel.subModelName} · ` : ""}
                  {selectedConfig.storage}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 pt-0 mt-auto border-t border-border/50 bg-muted/10 rounded-b-lg">
            <div className="flex items-center justify-between pt-2">
              {hasMultipleOptions ? (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <LayoutGrid className="w-3 h-3" />
                  {family.subModels.length} Varianten
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">Standard</span>
              )}

              {showHardwareEk && (
                <span className="font-mono text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                  {hasMultipleOptions ? "ab " : ""}
                  {family.lowestPrice} €
                </span>
              )}
            </div>
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 bg-popover" align="start">
        <div className="p-4 border-b border-border">
          <h4 className="font-semibold">{family.brand} {family.familyName}</h4>
          <p className="text-sm text-muted-foreground">
            {family.subModels.length} Modell{family.subModels.length > 1 ? "e" : ""} · {family.totalConfigs} Variante{family.totalConfigs > 1 ? "n" : ""}
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto">
          <Accordion
            type="single"
            collapsible
            defaultValue={selectedSubModel?.subModelId || family.subModels[0]?.subModelId}
            className="w-full"
          >
            {family.subModels.map((subModel) => {
              const isSubModelSelected = selectedSubModel?.subModelId === subModel.subModelId;

              return (
                <AccordionItem key={subModel.subModelId} value={subModel.subModelId} className="border-b border-border last:border-0">
                  <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      {isSubModelSelected && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <span className={`font-medium ${isSubModelSelected ? "text-primary" : ""}`}>
                        {subModel.subModelName || family.familyName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({subModel.configs.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <div className="px-2 pb-2 space-y-1">
                      {subModel.configs.map((config) => {
                        const isConfigSelected = selectedConfig?.id === config.id;
                        return (
                          <button
                            key={config.id}
                            onClick={() => onConfigSelect(config, family.brand)}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-lg transition-colors",
                              isConfigSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {isConfigSelected && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                              <div className={isConfigSelected ? "" : "ml-7"}>
                                <span className="font-medium">{config.storage}</span>
                                {config.connectivity && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {config.connectivity}
                                  </span>
                                )}
                              </div>
                            </div>
                            {showHardwareEk && (
                              <span className="text-sm font-mono text-muted-foreground">
                                {config.ekNet} € EK
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </PopoverContent>
    </Popover>
  );
}
