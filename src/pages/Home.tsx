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
import { isTestModeActive } from "@/lib/testMode";
import { RoleQuickStart } from "@/components/workspace/RoleQuickStart";
import { useWorkspaceProfile } from "@/hooks/useWorkspaceProfile";
import { useDemoMode } from "@/hooks/useDemoMode";
import { TodayOverview, DemoModeToggleCard } from "@/components/workspace/TodayOverview";

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
  const { profile } = useWorkspaceProfile();
  const { enabled: demoEnabled } = useDemoMode();
  const canUseWorkspace = !!user || isTestModeActive();
  const showQuickStart = canUseWorkspace && profile.homeLayout !== "classic";
  const showWidgets = profile.homeLayout === "classic" || !profile.userType;
  const showToday = canUseWorkspace && profile.homeLayout === "cockpit" && demoEnabled;
  const showDemoEntry = canUseWorkspace && profile.homeLayout !== "classic" && !demoEnabled;

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
        <main className="flex-1 px-4 py-6 lg:px-6">
          <div className="mx-auto w-full max-w-5xl space-y-6">
            {showQuickStart && <RoleQuickStart />}
            {showToday && <TodayOverview compact />}
            {showDemoEntry && <DemoModeToggleCard />}
            {showWidgets && (<>
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
            </>)}

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

      </div>
    </MainLayout>
  );
};

export default Home;
