// ============================================
// Home Page - Widget-based Dashboard
// Configurable layout with drag-and-drop
// ============================================

import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useDashboardConfig } from "@/margenkalkulator/hooks/useDashboardConfig";
import { DASHBOARD_WIDGETS } from "@/margenkalkulator/config/dashboardWidgets";
import { DashboardWidgetRenderer } from "@/margenkalkulator/ui/components/DashboardWidgetRenderer";
import { DashboardEditHeader } from "@/margenkalkulator/ui/components/DashboardEditHeader";
import { AddWidgetPanel } from "@/margenkalkulator/ui/components/AddWidgetPanel";
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
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

const Home = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const {
    layout,
    isLoading: layoutLoading,
    isEditMode,
    setEditMode,
    addWidget,
    removeWidget,
    resetToDefault,
    moveWidget,
  } = useDashboardConfig();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const visibleWidgets = layout.filter(w => w.visible);
      const oldIndex = visibleWidgets.findIndex(w => w.id === active.id);
      const newIndex = visibleWidgets.findIndex(w => w.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveWidget(oldIndex, newIndex);
      }
    }
  };

  // Filter visible widgets
  const visibleWidgets = layout.filter(w => w.visible);
  const widgetIds = visibleWidgets.map(w => w.id);

  return (
    <MainLayout>
      <div className="bg-background min-h-full flex flex-col">
        {/* Login Banner for unauthenticated users */}
        {!authLoading && !user && (
          <div className="bg-primary/10 border-b border-primary/20 py-3 px-4">
            <div className="container mx-auto flex items-center justify-between">
              <p className="text-sm text-foreground">
                <span className="font-medium">Willkommen!</span> Melden Sie sich an, um alle Funktionen zu nutzen.
              </p>
              <Button
                onClick={() => navigate("/auth")}
                size="sm"
                className="gap-2"
              >
                <LogIn className="w-4 h-4" />
                Anmelden
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 px-4 lg:px-6 py-6">
          <div className="max-w-5xl mx-auto w-full">
            {/* Edit Header */}
            <DashboardEditHeader
              isEditMode={isEditMode}
              onToggleEditMode={() => setEditMode(!isEditMode)}
              onResetToDefault={resetToDefault}
              isAuthenticated={!!user}
            />

            {/* Widget Grid with DnD */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={widgetIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {visibleWidgets.map((widgetLayout) => {
                    const widgetDef = DASHBOARD_WIDGETS[widgetLayout.id];
                    if (!widgetDef) return null;

                    // Skip auth-required widgets for guests
                    if (widgetDef.requiresAuth && !user) return null;

                    return (
                      <DashboardWidgetRenderer
                        key={widgetLayout.id}
                        widgetId={widgetLayout.id}
                        component={widgetDef.component}
                        name={widgetDef.name}
                        isEditMode={isEditMode}
                        onRemove={() => removeWidget(widgetLayout.id)}
                      />
                    );
                  })}

                  {/* Add Widget Panel (Edit Mode) */}
                  {isEditMode && (
                    <AddWidgetPanel
                      currentLayout={layout}
                      onAddWidget={addWidget}
                    />
                  )}
                </div>
              </SortableContext>
            </DndContext>

            {/* Empty State for Guests */}
            {!user && visibleWidgets.filter(w => {
              const def = DASHBOARD_WIDGETS[w.id];
              return def && !def.requiresAuth;
            }).length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p>Melden Sie sich an, um Ihr personalisiertes Dashboard zu sehen.</p>
              </div>
            )}
          </div>
        </main>

        {/* System Status Footer */}
        <footer className="border-t border-border py-5 shrink-0 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Aktueller Systemstatus
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse-dot" />
                  <span className="text-muted-foreground">API Verbunden</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse-dot" />
                  <span className="text-muted-foreground">Katalog: v24.10.1</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse-dot" />
                  <span className="text-muted-foreground">AI Engine: Ready</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
};

export default Home;
