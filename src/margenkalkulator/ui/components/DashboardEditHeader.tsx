// ============================================
// Dashboard Edit Header
// Controls for edit mode, add widgets, reset
// ============================================

import { Edit3, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddWidgetPanel } from "./AddWidgetPanel";
import { WidgetLayout } from "@/margenkalkulator/config/dashboardWidgets";
import { cn } from "@/lib/utils";

interface DashboardEditHeaderProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onResetToDefault: () => void;
  onAddWidget: (widgetId: string) => void;
  currentLayout: WidgetLayout[];
  isAuthenticated: boolean;
}

export function DashboardEditHeader({
  isEditMode,
  onToggleEditMode,
  onResetToDefault,
  onAddWidget,
  currentLayout,
  isAuthenticated,
}: DashboardEditHeaderProps) {
  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center justify-between gap-4 mb-4 px-1",
      "transition-colors duration-200",
      isEditMode && "bg-accent/30 -mx-4 px-5 py-3 rounded-lg"
    )}>
      <div className="flex items-center gap-2">
        {isEditMode && (
          <span className="text-sm font-medium text-foreground">
            Dashboard bearbeiten
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isEditMode && (
          <>
            {/* Add Widget */}
            <AddWidgetPanel 
              currentLayout={currentLayout} 
              onAddWidget={onAddWidget} 
            />
            
            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onResetToDefault}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Zurücksetzen
            </Button>
          </>
        )}

        {/* Toggle Edit Mode */}
        <Button
          variant={isEditMode ? "default" : "outline"}
          size="sm"
          onClick={onToggleEditMode}
          className="gap-1.5"
        >
          {isEditMode ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Fertig
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5" />
              Bearbeiten
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
