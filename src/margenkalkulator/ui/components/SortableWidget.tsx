// ============================================
// Sortable Widget Wrapper for DnD
// ============================================

import { ReactNode, forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WidgetDefinition } from "@/margenkalkulator/config/dashboardWidgets";

interface SortableWidgetProps {
  id: string;
  children: ReactNode;
  isEditMode: boolean;
  widgetDef?: WidgetDefinition;
  onRemove?: () => void;
  className?: string;
}

export function SortableWidget({
  id,
  children,
  isEditMode,
  widgetDef,
  onRemove,
  className,
}: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-90 scale-[1.02]",
        isEditMode && "ring-1 ring-dashed ring-muted-foreground/30 rounded-lg",
        className
      )}
    >
      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className={cn(
              "absolute top-2 left-2 p-1.5 rounded-md",
              "bg-background/90 shadow-sm border cursor-grab",
              "pointer-events-auto opacity-0 group-hover:opacity-100",
              "transition-opacity duration-200",
              isDragging && "cursor-grabbing opacity-100"
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Remove Button */}
          <Button
            variant="destructive"
            size="icon"
            className={cn(
              "absolute top-2 right-2 h-7 w-7",
              "pointer-events-auto opacity-0 group-hover:opacity-100",
              "transition-opacity duration-200"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>

          {/* Widget Name Badge */}
          {widgetDef && (
            <div className={cn(
              "absolute bottom-2 left-2 px-2 py-1 rounded-md",
              "bg-background/90 shadow-sm border text-xs font-medium",
              "pointer-events-none opacity-0 group-hover:opacity-100",
              "transition-opacity duration-200"
            )}>
              {widgetDef.name}
            </div>
          )}
        </div>
      )}

      {/* Widget Content */}
      <div className={cn(
        isEditMode && "pointer-events-none select-none"
      )}>
        {children}
      </div>
    </div>
  );
}
