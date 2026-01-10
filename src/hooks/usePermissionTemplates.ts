// ============================================
// Permission Templates Hook
// CRUD for permission presets
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";

export interface PermissionTemplateData {
  can_view_margins: boolean;
  can_export_pdf: boolean;
  can_view_reporting: boolean;
  can_view_team: boolean;
  can_use_inbox: boolean;
  can_use_bundles: boolean;
  can_create_offers: boolean;
  can_manage_customers: boolean;
  can_use_calculator: boolean;
  allowed_menu_items: string[];
  provision_deduction: number;
  provision_deduction_type: "percent" | "fixed";
}

export interface PermissionTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  is_system: boolean;
  sort_order: number;
  permissions: PermissionTemplateData;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const QUERY_KEY = ["permission-templates"];

export function usePermissionTemplates() {
  const { identity } = useIdentity();
  const queryClient = useQueryClient();

  // Fetch all templates
  const {
    data: templates = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("permission_templates")
          .select("*")
          .order("sort_order", { ascending: true });

        if (error) {
          console.warn("[usePermissionTemplates] Query error:", error.message);
          return [];
        }

        return (data || []).map(t => ({
          ...t,
          permissions: t.permissions as unknown as PermissionTemplateData
        })) as PermissionTemplate[];
      } catch (err) {
        console.error("[usePermissionTemplates] Unexpected error:", err);
        return [];
      }
    },
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      permissions: PermissionTemplateData;
    }) => {
      const { data, error } = await supabase
        .from("permission_templates")
        .insert([{
          tenant_id: identity.tenantId || "",
          name: input.name,
          description: input.description || null,
          icon: input.icon || "Shield",
          color: input.color || "#3b82f6",
          permissions: input.permissions as unknown as Record<string, unknown>,
          is_system: false,
          sort_order: templates.length + 1,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Vorlage erstellt");
    },
    onError: (error) => {
      console.error("[usePermissionTemplates] Create error:", error);
      toast.error("Fehler beim Erstellen der Vorlage");
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      permissions?: PermissionTemplateData;
    }) => {
      const { id, ...updates } = input;
      
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.permissions) {
        updateData.permissions = updates.permissions as unknown as Record<string, unknown>;
      }

      const { data, error } = await supabase
        .from("permission_templates")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Vorlage aktualisiert");
    },
    onError: (error) => {
      console.error("[usePermissionTemplates] Update error:", error);
      toast.error("Fehler beim Aktualisieren der Vorlage");
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const template = templates.find(t => t.id === templateId);
      if (template?.is_system) {
        throw new Error("System-Vorlagen können nicht gelöscht werden");
      }

      const { error } = await supabase
        .from("permission_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Vorlage gelöscht");
    },
    onError: (error: Error) => {
      console.error("[usePermissionTemplates] Delete error:", error);
      toast.error(error.message || "Fehler beim Löschen der Vorlage");
    },
  });

  // Apply template to user
  const applyTemplate = async (templateId: string, userId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      toast.error("Vorlage nicht gefunden");
      return false;
    }

    try {
      const { error } = await supabase
        .from("employee_settings")
        .upsert({
          user_id: userId,
          tenant_id: identity.tenantId || "",
          ...template.permissions,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Create in-app notification
      await supabase.from("notifications").insert({
        user_id: userId,
        tenant_id: identity.tenantId || "",
        type: "permission_change",
        title: "Berechtigungen aktualisiert",
        message: `Die Vorlage "${template.name}" wurde auf Ihr Konto angewendet.`,
        link: "/team",
      });

      queryClient.invalidateQueries({ queryKey: ["employee-settings"] });
      toast.success(`Vorlage "${template.name}" angewendet`);
      return true;
    } catch (err) {
      console.error("[usePermissionTemplates] Apply error:", err);
      toast.error("Fehler beim Anwenden der Vorlage");
      return false;
    }
  };

  return {
    templates,
    isLoading,
    error,
    refetch,
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    applyTemplate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
