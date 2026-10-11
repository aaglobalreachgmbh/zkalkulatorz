// ============================================
// Home Page - Widget-based Dashboard
// Configurable layout with drag-and-drop
// ============================================

import { useNavigate } from "react-router-dom";
import { LogIn, LayoutDashboard } from "lucide-react";
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
import { isTestModeActive } from "@/lib/testMode";
import { RoleQuickStart } from "@/components/workspace/RoleQuickStart";
import { useDemoMode } from "@/hooks/useDemoMode";
import { TodayOverview, DemoModeToggleCard, DemoDashboardOverview } from "@/components/workspace/TodayOverview";

const Home = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const {
    layout,
    isEditMode,
    setEditMode,
    addWidget,
    removeWidget,
    resetToDefault,
    moveWidget,
  } = useDashboardConfig();
  const { enabled: demoEnabled } = useDemoMode();
  const canUseWorkspace = !!user || isTestModeActive();
  const showQuickStart = canUseWorkspace;
  const showWidgets = canUseWorkspace;
  const showToday = canUseWorkspace && demoEnabled;
  const showDemoEntry = canUseWorkspace && !demoEnabled;

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
  const duplicatedBySalesOverview = new Set(["welcome-banner", "headline", "quick-actions"]);
  const visibleWidgets = layout.filter(w => w.visible && !duplicatedBySalesOverview.has(w.id));
  const widgetIds = visibleWidgets.map(w => w.id);

  return (
    <MainLayout>
      <div className="bg-background min-h-full flex flex-col">
        {/* Login Banner for unauthenticated users */}
        {!authLoading && !user && !isTestModeActive() && (
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
        <div className="flex-1 px-4 py-6 lg:px-6">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            {showQuickStart && <RoleQuickStart />}
            {showToday && <TodayOverview compact />}
            {showDemoEntry && <DemoModeToggleCard />}
            {showWidgets && (<>
            <section aria-labelledby="dashboard-heading" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h2 id="dashboard-heading" className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    Meine Übersicht
                  </h2>
                  <p className="text-sm text-muted-foreground">Kennzahlen und Arbeitslisten für Ihren Tag.</p>
                </div>
                {!demoEnabled && <DashboardEditHeader
                  isEditMode={isEditMode}
                  onToggleEditMode={() => setEditMode(!isEditMode)}
                  onResetToDefault={resetToDefault}
                  isAuthenticated={!!user || demoEnabled}
                />}
              </div>

            {/* Widget Grid with DnD */}
            {demoEnabled ? <DemoDashboardOverview /> : <DndContext
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
            </DndContext>}
            </section>
            </>)}

            {/* Empty State for Guests */}
            {!canUseWorkspace && visibleWidgets.filter(w => {
              const def = DASHBOARD_WIDGETS[w.id];
              return def && !def.requiresAuth;
            }).length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p>Melden Sie sich an, um Ihr personalisiertes Dashboard zu sehen.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default Home;
