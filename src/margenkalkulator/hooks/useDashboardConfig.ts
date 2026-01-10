// ============================================
// Dashboard Configuration Hook
// ============================================

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  WidgetLayout, 
  DEFAULT_DASHBOARD_LAYOUT,
  DASHBOARD_WIDGETS 
} from "@/margenkalkulator/config/dashboardWidgets";

interface DashboardConfig {
  layout: WidgetLayout[];
  hidden_widgets: string[];
  settings: Record<string, any>;
}

interface UseDashboardConfigReturn {
  layout: WidgetLayout[];
  hiddenWidgets: string[];
  isLoading: boolean;
  error: Error | null;
  isEditMode: boolean;
  setEditMode: (enabled: boolean) => void;
  updateLayout: (newLayout: WidgetLayout[]) => void;
  toggleWidget: (widgetId: string) => void;
  addWidget: (widgetId: string) => void;
  removeWidget: (widgetId: string) => void;
  resetToDefault: () => void;
  moveWidget: (fromIndex: number, toIndex: number) => void;
}

export function useDashboardConfig(): UseDashboardConfigReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditMode, setEditMode] = useState(false);

  // Fetch config from database
  const { data: config, isLoading, error } = useQuery({
    queryKey: ["dashboard-config", user?.id],
    queryFn: async (): Promise<DashboardConfig> => {
      if (!user) {
        return {
          layout: DEFAULT_DASHBOARD_LAYOUT,
          hidden_widgets: [],
          settings: {},
        };
      }

      const { data, error } = await supabase
        .from("user_dashboard_config")
        .select("layout, hidden_widgets, settings")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("[useDashboardConfig] Query error:", error.message);
        return {
          layout: DEFAULT_DASHBOARD_LAYOUT,
          hidden_widgets: [],
          settings: {},
        };
      }

      if (!data) {
        // No config exists yet, use defaults
        return {
          layout: DEFAULT_DASHBOARD_LAYOUT,
          hidden_widgets: [],
          settings: {},
        };
      }

      // Parse layout from JSON
      let parsedLayout: WidgetLayout[] = DEFAULT_DASHBOARD_LAYOUT;
      if (data.layout && Array.isArray(data.layout)) {
        parsedLayout = data.layout as unknown as WidgetLayout[];
      }

      return {
        layout: parsedLayout,
        hidden_widgets: data.hidden_widgets || [],
        settings: (data.settings as Record<string, any>) || {},
      };
    },
    enabled: true, // Always enabled, returns defaults for guests
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Save config mutation
  const saveMutation = useMutation({
    mutationFn: async (newConfig: Partial<DashboardConfig>) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      // First check if config exists
      const { data: existing } = await supabase
        .from("user_dashboard_config")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const layoutData = newConfig.layout || config?.layout || DEFAULT_DASHBOARD_LAYOUT;
      const hiddenData = newConfig.hidden_widgets || config?.hidden_widgets || [];
      const settingsData = newConfig.settings || config?.settings || {};

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("user_dashboard_config")
          .update({
            layout: layoutData as unknown as any,
            hidden_widgets: hiddenData,
            settings: settingsData,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("user_dashboard_config")
          .insert({
            user_id: user.id,
            tenant_id: "",
            layout: layoutData as unknown as any,
            hidden_widgets: hiddenData,
            settings: settingsData,
          });
        
        if (error) throw error;
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-config", user?.id] });
    },
    onError: (error) => {
      console.error("[useDashboardConfig] Save error:", error);
      toast.error("Dashboard-Konfiguration konnte nicht gespeichert werden");
    },
  });

  // Current layout (from config or default)
  const layout = useMemo(() => {
    return config?.layout || DEFAULT_DASHBOARD_LAYOUT;
  }, [config?.layout]);

  const hiddenWidgets = useMemo(() => {
    return config?.hidden_widgets || [];
  }, [config?.hidden_widgets]);

  // Update layout
  const updateLayout = useCallback((newLayout: WidgetLayout[]) => {
    if (!user) {
      toast.error("Bitte melden Sie sich an, um das Dashboard anzupassen");
      return;
    }
    saveMutation.mutate({ layout: newLayout });
  }, [user, saveMutation]);

  // Toggle widget visibility
  const toggleWidget = useCallback((widgetId: string) => {
    const newLayout = layout.map(item =>
      item.id === widgetId ? { ...item, visible: !item.visible } : item
    );
    updateLayout(newLayout);
  }, [layout, updateLayout]);

  // Add widget
  const addWidget = useCallback((widgetId: string) => {
    const widgetDef = DASHBOARD_WIDGETS[widgetId];
    if (!widgetDef) return;

    // Check if widget already exists
    const existingIndex = layout.findIndex(item => item.id === widgetId);
    
    if (existingIndex >= 0) {
      // Make visible if hidden
      const newLayout = layout.map(item =>
        item.id === widgetId ? { ...item, visible: true } : item
      );
      updateLayout(newLayout);
      return;
    }

    // Add new widget at the end
    const maxY = Math.max(...layout.map(item => item.y + item.h), 0);
    const newWidget: WidgetLayout = {
      id: widgetId,
      x: 0,
      y: maxY,
      w: widgetDef.defaultSize.w,
      h: widgetDef.defaultSize.h,
      visible: true,
    };

    updateLayout([...layout, newWidget]);
    toast.success(`"${widgetDef.name}" wurde hinzugefügt`);
  }, [layout, updateLayout]);

  // Remove widget
  const removeWidget = useCallback((widgetId: string) => {
    const widgetDef = DASHBOARD_WIDGETS[widgetId];
    const newLayout = layout.map(item =>
      item.id === widgetId ? { ...item, visible: false } : item
    );
    updateLayout(newLayout);
    
    if (widgetDef) {
      toast.success(`"${widgetDef.name}" wurde entfernt`);
    }
  }, [layout, updateLayout]);

  // Move widget (for drag and drop)
  const moveWidget = useCallback((fromIndex: number, toIndex: number) => {
    const visibleWidgets = layout.filter(w => w.visible);
    const movedWidget = visibleWidgets[fromIndex];
    
    if (!movedWidget) return;

    // Reorder visible widgets
    const newVisibleOrder = [...visibleWidgets];
    newVisibleOrder.splice(fromIndex, 1);
    newVisibleOrder.splice(toIndex, 0, movedWidget);

    // Recalculate y positions
    let currentY = 0;
    const updatedLayout: WidgetLayout[] = [];
    
    newVisibleOrder.forEach(widget => {
      updatedLayout.push({
        ...widget,
        y: currentY,
      });
      currentY += widget.h;
    });

    // Add hidden widgets
    layout.filter(w => !w.visible).forEach(widget => {
      updatedLayout.push(widget);
    });

    updateLayout(updatedLayout);
  }, [layout, updateLayout]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    updateLayout(DEFAULT_DASHBOARD_LAYOUT);
    toast.success("Dashboard wurde zurückgesetzt");
  }, [updateLayout]);

  return {
    layout,
    hiddenWidgets,
    isLoading,
    error: error as Error | null,
    isEditMode,
    setEditMode,
    updateLayout,
    toggleWidget,
    addWidget,
    removeWidget,
    resetToDefault,
    moveWidget,
  };
}
