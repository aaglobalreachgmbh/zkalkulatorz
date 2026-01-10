// ============================================
// Configurable Dashboard with Drag & Drop
// ============================================

import { Suspense, useMemo, useCallback, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Settings2, RotateCcw, Check, Loader2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardConfig } from "@/margenkalkulator/hooks/useDashboardConfig";
import { DASHBOARD_WIDGETS } from "@/margenkalkulator/config/dashboardWidgets";
import { SortableWidget } from "./SortableWidget";
import { AddWidgetPanel } from "./AddWidgetPanel";
import { QuickBrandingEditor } from "./QuickBrandingEditor";

interface ConfigurableDashboardProps {
  className?: string;
}

export function ConfigurableDashboard({ className }: ConfigurableDashboardProps) {
  const { user } = useAuth();
  const {
    layout,
    isLoading,
    isEditMode,
    setEditMode,
    removeWidget,
    addWidget,
    moveWidget,
    resetToDefault,
  } = useDashboardConfig();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get visible widgets in order
  const visibleWidgets = useMemo(() => {
    return layout
      .filter(item => item.visible)
      .sort((a, b) => a.y - b.y);
  }, [layout]);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const fromIndex = visibleWidgets.findIndex(w => w.id === active.id);
    const toIndex = visibleWidgets.findIndex(w => w.id === over.id);

    if (fromIndex !== -1 && toIndex !== -1) {
      moveWidget(fromIndex, toIndex);
    }
  }, [visibleWidgets, moveWidget]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Edit Controls - Only for authenticated users */}
      {user && (
        <div className="flex items-center justify-end gap-2">
          {isEditMode ? (
            <>
              {/* Quick Branding Editor */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Palette className="h-4 w-4 mr-2" />
                    Design anpassen
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Schnell-Design
                    </SheetTitle>
                  </SheetHeader>
                  <QuickBrandingEditor />
                </SheetContent>
              </Sheet>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Zurücksetzen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Dashboard zurücksetzen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ihre Dashboard-Konfiguration wird auf die Standardeinstellungen zurückgesetzt. 
                      Alle Änderungen gehen verloren.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={resetToDefault}>
                      Zurücksetzen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button size="sm" onClick={() => setEditMode(false)}>
                <Check className="h-4 w-4 mr-2" />
                Fertig
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
              <Settings2 className="h-4 w-4 mr-2" />
              Dashboard anpassen
            </Button>
          )}
        </div>
      )}

      {/* Widget Grid with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleWidgets.map(w => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {visibleWidgets.map((widgetLayout) => {
              const widgetDef = DASHBOARD_WIDGETS[widgetLayout.id];
              if (!widgetDef) return null;

              const WidgetComponent = widgetDef.component;

              // Skip auth-required widgets for guests
              if (widgetDef.requiresAuth && !user) {
                return null;
              }

              return (
                <SortableWidget
                  key={widgetLayout.id}
                  id={widgetLayout.id}
                  isEditMode={isEditMode}
                  widgetDef={widgetDef}
                  onRemove={() => removeWidget(widgetLayout.id)}
                >
                  <Suspense fallback={<WidgetSkeleton />}>
                    <WidgetComponent />
                  </Suspense>
                </SortableWidget>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Widget Panel - Only in edit mode */}
      {isEditMode && user && (
        <AddWidgetPanel
          currentLayout={layout}
          onAddWidget={addWidget}
        />
      )}
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="flex items-center justify-center h-32 rounded-lg border bg-muted/30">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
