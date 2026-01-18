/**
 * Hook für Beratungs-Checklisten
 * 
 * Verwaltet Checklisten-Templates für Besuchsberichte.
 * User können eigene Checklisten erstellen, Admins können
 * tenant-weite Templates verwalten.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

// Checklisten-Item-Typen
export type ChecklistItemType = "checkbox" | "text" | "upload" | "rating" | "select";

export interface ChecklistItem {
  id: string;
  type: ChecklistItemType;
  label: string;
  required?: boolean;
  options?: string[]; // Für select-Typ
  placeholder?: string; // Für text-Typ
}

export interface VisitChecklist {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  name: string;
  description: string | null;
  items: ChecklistItem[];
  is_template: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChecklistInput {
  name: string;
  description?: string;
  items: ChecklistItem[];
  is_template?: boolean;
}

export interface ChecklistResponse {
  [itemId: string]: boolean | string | number | string[];
}

export function useVisitChecklists() {
  const queryClient = useQueryClient();
  const { identity } = useIdentity();
  const { userId, tenantId } = identity;
  const { isAdmin, isTenantAdmin } = useUserRole();

  // Alle verfügbaren Checklisten laden
  const checklistsQuery = useQuery({
    queryKey: ["visit-checklists", userId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_checklists")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.warn("[useVisitChecklists] Query error:", error.message);
        return [];
      }

      // Parse items JSONB zu ChecklistItem[]
      return (data || []).map((cl) => ({
        ...cl,
        items: (cl.items as unknown as ChecklistItem[]) || [],
      })) as VisitChecklist[];
    },
    enabled: !!userId,
  });

  // Einzelne Checkliste laden
  const useChecklist = (checklistId: string | undefined) => {
    return useQuery({
      queryKey: ["visit-checklist", checklistId],
      queryFn: async () => {
        if (!checklistId) return null;

        const { data, error } = await supabase
          .from("visit_checklists")
          .select("*")
          .eq("id", checklistId)
          .maybeSingle();

        if (error) {
          console.warn("[useVisitChecklists] Single checklist error:", error.message);
          return null;
        }

        if (!data) return null;

        return {
          ...data,
          items: (data.items as unknown as ChecklistItem[]) || [],
        } as VisitChecklist;
      },
      enabled: !!checklistId,
    });
  };

  // Eigene Checkliste erstellen
  const createChecklist = useMutation({
    mutationFn: async (input: CreateChecklistInput) => {
      if (!userId || !tenantId) {
        console.warn("[useVisitChecklists] Not authenticated");
        toast.error("Bitte zuerst einloggen");
        return null;
      }

      const { data, error } = await supabase
        .from("visit_checklists")
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          name: input.name,
          description: input.description || null,
          items: input.items as unknown as Json,
          is_template: input.is_template || false,
          is_active: true,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visit-checklists"] });
      toast.success("Checkliste erstellt");
    },
    onError: (error) => {
      console.error("[useVisitChecklists] Create error:", error);
      toast.error("Fehler beim Erstellen der Checkliste");
    },
  });

  // Admin: Template erstellen (tenant-weit)
  const createTemplate = useMutation({
    mutationFn: async (input: CreateChecklistInput) => {
      if (!tenantId) {
        console.warn("[useVisitChecklists] No tenant available");
        toast.error("Kein Tenant verfügbar");
        return null;
      }

      if (!isAdmin && !isTenantAdmin) {
        console.warn("[useVisitChecklists] No permission");
        toast.error("Keine Berechtigung");
        return null;
      }

      const { data, error } = await supabase
        .from("visit_checklists")
        .insert({
          user_id: null, // NULL = Admin-Template
          tenant_id: tenantId,
          name: input.name,
          description: input.description || null,
          items: input.items as unknown as Json,
          is_template: true,
          is_active: true,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visit-checklists"] });
      toast.success("Template erstellt");
    },
    onError: (error) => {
      console.error("[useVisitChecklists] Create template error:", error);
      toast.error("Fehler beim Erstellen des Templates");
    },
  });

  // Checkliste aktualisieren
  const updateChecklist = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<CreateChecklistInput> & { id: string }) => {
      const { error } = await supabase
        .from("visit_checklists")
        .update({
          ...updates,
          items: updates.items ? (updates.items as unknown as Json) : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visit-checklists"] });
      queryClient.invalidateQueries({ queryKey: ["visit-checklist", variables.id] });
      toast.success("Checkliste aktualisiert");
    },
    onError: (error) => {
      console.error("[useVisitChecklists] Update error:", error);
      toast.error("Fehler beim Aktualisieren");
    },
  });

  // Checkliste löschen (deaktivieren)
  const deleteChecklist = useMutation({
    mutationFn: async (checklistId: string) => {
      const { error } = await supabase
        .from("visit_checklists")
        .update({ is_active: false })
        .eq("id", checklistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visit-checklists"] });
      toast.success("Checkliste gelöscht");
    },
  });

  // Verfügbare Item-Typen
  const itemTypes: { type: ChecklistItemType; label: string; icon: string }[] = [
    { type: "checkbox", label: "Checkbox", icon: "☑" },
    { type: "text", label: "Textfeld", icon: "📝" },
    { type: "upload", label: "Datei-Upload", icon: "📎" },
    { type: "rating", label: "Bewertung (1-5)", icon: "⭐" },
    { type: "select", label: "Auswahl", icon: "▼" },
  ];

  // Helper: Neues Item erstellen
  const createNewItem = (type: ChecklistItemType): ChecklistItem => ({
    id: crypto.randomUUID(),
    type,
    label: "",
    required: false,
    ...(type === "select" ? { options: ["Option 1", "Option 2"] } : {}),
    ...(type === "text" ? { placeholder: "" } : {}),
  });

  // Helper: Response validieren
  const validateResponses = (
    checklist: VisitChecklist,
    responses: ChecklistResponse
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    for (const item of checklist.items) {
      if (item.required) {
        const value = responses[item.id];
        
        if (value === undefined || value === null || value === "") {
          errors.push(`"${item.label}" ist erforderlich`);
        }
        
        if (item.type === "checkbox" && value !== true) {
          errors.push(`"${item.label}" muss bestätigt werden`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  };

  // Gefilterte Listen
  const myChecklists = (checklistsQuery.data || []).filter(
    (cl) => cl.user_id === userId
  );

  const templates = (checklistsQuery.data || []).filter(
    (cl) => cl.is_template
  );

  const tenantTemplates = templates.filter(
    (cl) => cl.tenant_id === tenantId
  );

  const globalTemplates = templates.filter(
    (cl) => cl.tenant_id === null
  );

  return {
    // Queries
    checklists: checklistsQuery.data || [],
    myChecklists,
    templates,
    tenantTemplates,
    globalTemplates,
    isLoading: checklistsQuery.isLoading,
    isError: checklistsQuery.isError,
    useChecklist,

    // Mutations
    createChecklist,
    createTemplate,
    updateChecklist,
    deleteChecklist,

    // Utilities
    itemTypes,
    createNewItem,
    validateResponses,
    canCreateTemplates: isAdmin || isTenantAdmin,
  };
}
