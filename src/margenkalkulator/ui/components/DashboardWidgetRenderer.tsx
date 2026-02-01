// ============================================
// Dashboard Widget Renderer
// Handles lazy loading and edit mode UI
// ============================================

import { Suspense, ComponentType } from "react";
import { X, GripVertical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DashboardWidgetRendererProps {
  widgetId: string;
  component: ComponentType<any>;
  name: string;
  isEditMode: boolean;
  onRemove: () => void;
}

export function DashboardWidgetRenderer({
  widgetId,
  component: Component,
  name,
  isEditMode,
  onRemove,
}: DashboardWidgetRendererProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widgetId });

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
        isDragging && "z-50 opacity-80",
        isEditMode && "ring-1 ring-dashed ring-border rounded-lg"
      )}
    >
      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="absolute -top-2 -right-2 z-10 flex gap-1">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className={cn(
              "p-1.5 rounded-full bg-muted border border-border",
              "hover:bg-accent cursor-grab active:cursor-grabbing",
              "transition-colors shadow-sm"
            )}
            title="Ziehen zum Verschieben"
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          
          {/* Remove Button */}
          <button
            onClick={onRemove}
            className={cn(
              "p-1.5 rounded-full bg-destructive/10 border border-destructive/20",
              "hover:bg-destructive/20 transition-colors shadow-sm"
            )}
            title={`"${name}" entfernen`}
          >
            <X className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      )}

      {/* Widget Content with Suspense */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg min-h-[100px]">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <Component />
      </Suspense>
    </div>
  );
}
