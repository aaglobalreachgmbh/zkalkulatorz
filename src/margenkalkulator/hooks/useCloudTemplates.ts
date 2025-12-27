// ============================================
// Cloud Templates Hook - Supabase Integration
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useToast } from "@/hooks/use-toast";
import type { OfferOptionState } from "../engine/types";
import type { OfferPreview } from "../storage/types";
import type { Json } from "@/integrations/supabase/types";

const TEMPLATES_KEY = ["cloud-templates"];
const FOLDERS_KEY = ["cloud-template-folders"];

export interface CloudTemplate {
  id: string;
  name: string;
  config: OfferOptionState;
  preview: OfferPreview | null;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CloudFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

function createPreview(config: OfferOptionState, avgMonthly: number = 0): OfferPreview {
  return {
    hardware: config.hardware.name || "SIM-Only",
    tariff: config.mobile.tariffId || "Kein Tarif",
    avgMonthly,
    quantity: 1,
  };
}

function rowToTemplate(row: {
  id: string;
  name: string;
  config: Json;
  preview: Json | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}): CloudTemplate {
  return {
    id: row.id,
    name: row.name,
    config: row.config as unknown as OfferOptionState,
    preview: row.preview as unknown as OfferPreview | null,
    folderId: row.folder_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToFolder(row: {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}): CloudFolder {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Hook for managing templates and folders in Supabase
 */
export function useCloudTemplates() {
  const { user } = useAuth();
  const { identity } = useIdentity();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("offer_drafts")
        .select("*")
        .eq("user_id", user.id)
        .eq("draft_type", "template")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(rowToTemplate);
    },
    enabled: !!user,
  });

  // Fetch folders
  const {
    data: folders = [],
    isLoading: foldersLoading,
    error: foldersError,
  } = useQuery({
    queryKey: FOLDERS_KEY,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("template_folders")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []).map(rowToFolder);
    },
    enabled: !!user,
  });

  // Create template
  const createTemplateMutation = useMutation({
    mutationFn: async ({
      name,
      config,
      folderId,
    }: {
      name: string;
      config: OfferOptionState;
      folderId?: string;
    }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const preview = createPreview(config);
      const { data, error } = await supabase
        .from("offer_drafts")
        .insert({
          user_id: user.id,
          tenant_id: identity.tenantId,
          name,
          config: config as unknown as Json,
          preview: preview as unknown as Json,
          draft_type: "template",
          folder_id: folderId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToTemplate(data);
    },
    onSuccess: () => {
      toast({
        title: "Vorlage gespeichert",
        description: "Die Vorlage wurde erfolgreich erstellt.",
      });
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Update template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({
      id,
      config,
    }: {
      id: string;
      config: OfferOptionState;
    }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const preview = createPreview(config);
      const { error } = await supabase
        .from("offer_drafts")
        .update({
          config: config as unknown as Json,
          preview: preview as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  // Delete template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const { error } = await supabase
        .from("offer_drafts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TEMPLATES_KEY });
      const previous = queryClient.getQueryData<CloudTemplate[]>(TEMPLATES_KEY);
      queryClient.setQueryData<CloudTemplate[]>(TEMPLATES_KEY, (old = []) =>
        old.filter((t) => t.id !== id)
      );
      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(TEMPLATES_KEY, context?.previous);
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({ title: "Vorlage gelöscht" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });

  // Duplicate template
  const duplicateTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const template = templates.find((t) => t.id === id);
      if (!template) throw new Error("Vorlage nicht gefunden");

      const { data, error } = await supabase
        .from("offer_drafts")
        .insert({
          user_id: user.id,
          tenant_id: identity.tenantId,
          name: `${template.name} (Kopie)`,
          config: template.config as unknown as Json,
          preview: template.preview as unknown as Json,
          draft_type: "template",
          folder_id: template.folderId,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToTemplate(data);
    },
    onSuccess: () => {
      toast({ title: "Vorlage dupliziert" });
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Duplizieren fehlgeschlagen.",
        variant: "destructive",
      });
    },
  });

  // Move template to folder
  const moveTemplateMutation = useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string | null }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const { error } = await supabase
        .from("offer_drafts")
        .update({ folder_id: folderId, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });

  // Create folder
  const createFolderMutation = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId?: string }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const { data, error } = await supabase
        .from("template_folders")
        .insert({
          user_id: user.id,
          tenant_id: identity.tenantId,
          name,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToFolder(data);
    },
    onSuccess: () => {
      toast({ title: "Ordner erstellt" });
      queryClient.invalidateQueries({ queryKey: FOLDERS_KEY });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Ordner konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Rename folder
  const renameFolderMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!user) throw new Error("Nicht authentifiziert");

      const { error } = await supabase
        .from("template_folders")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_KEY });
    },
  });

  // Delete folder (move contents to root)
  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Nicht authentifiziert");

      // Move templates to root
      await supabase
        .from("offer_drafts")
        .update({ folder_id: null })
        .eq("folder_id", id)
        .eq("user_id", user.id);

      // Delete folder
      const { error } = await supabase
        .from("template_folders")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Ordner gelöscht" });
      queryClient.invalidateQueries({ queryKey: FOLDERS_KEY });
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Ordner konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Get templates in folder
  const getTemplatesInFolder = (folderId: string | null): CloudTemplate[] => {
    return templates.filter((t) => t.folderId === folderId);
  };

  return {
    // Data
    templates,
    folders,
    isLoading: templatesLoading || foldersLoading,
    error: templatesError || foldersError,

    // Template actions
    createTemplate: (name: string, config: OfferOptionState, folderId?: string) =>
      createTemplateMutation.mutateAsync({ name, config, folderId }),
    updateTemplate: (id: string, config: OfferOptionState) =>
      updateTemplateMutation.mutateAsync({ id, config }),
    deleteTemplate: (id: string) => deleteTemplateMutation.mutateAsync(id),
    duplicateTemplate: (id: string) => duplicateTemplateMutation.mutateAsync(id),
    moveTemplate: (id: string, folderId: string | null) =>
      moveTemplateMutation.mutateAsync({ id, folderId }),

    // Folder actions
    createFolder: (name: string, parentId?: string) =>
      createFolderMutation.mutateAsync({ name, parentId }),
    renameFolder: (id: string, name: string) =>
      renameFolderMutation.mutateAsync({ id, name }),
    deleteFolder: (id: string) => deleteFolderMutation.mutateAsync(id),

    // Helpers
    getTemplatesInFolder,

    // Mutation states
    isCreatingTemplate: createTemplateMutation.isPending,
    isDeletingTemplate: deleteTemplateMutation.isPending,
  };
}
