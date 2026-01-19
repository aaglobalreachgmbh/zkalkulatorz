// ============================================
// Hybrid Templates Hook - Cloud with localStorage Fallback
// ============================================

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCloudTemplates, type CloudTemplate, type CloudFolder } from "./useCloudTemplates";
import { toast } from "sonner";
import {
  loadTemplates,
  saveTemplate as saveLocalTemplate,
  loadFolders,
  type PersonalTemplate,
  type TemplateFolder,
} from "../storage/bundles";
import type { OfferOptionState } from "../engine/types";

/**
 * Hybrid hook that uses Cloud for authenticated users,
 * falls back to localStorage for guests
 */
export function useTemplates() {
  const { user } = useAuth();
  const cloudTemplates = useCloudTemplates();

  // Local state for guest mode
  const [localTemplates, setLocalTemplates] = useState<PersonalTemplate[]>([]);
  const [localFolders, setLocalFolders] = useState<TemplateFolder[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  // Load local templates on mount (for guests)
  useEffect(() => {
    if (!user) {
      setLocalTemplates(loadTemplates());
      setLocalFolders(loadFolders());
      setLocalLoading(false);
    }
  }, [user]);

  // Define callbacks at top level (not conditionally) to comply with Rules of Hooks
  const createLocalTemplate = useCallback(async (
    name: string,
    config: OfferOptionState,
    folderId?: string
  ) => {
    const template: PersonalTemplate = {
      id: crypto.randomUUID(),
      name,
      config,
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalTemplate(template);
    setLocalTemplates(loadTemplates());
    return template as unknown as CloudTemplate;
  }, []);

  const getLocalTemplatesInFolder = useCallback((folderId: string | null) => {
    return localTemplates.filter(t => (t.folderId || null) === folderId) as unknown as CloudTemplate[];
  }, [localTemplates]);

  // If authenticated, use cloud templates
  if (user) {
    // Map CloudFolder to TemplateFolder format for compatibility
    const mappedFolders: TemplateFolder[] = cloudTemplates.folders.map(f => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId || undefined,
      createdAt: f.createdAt,
    }));

    return {
      templates: cloudTemplates.templates,
      folders: mappedFolders,
      isLoading: cloudTemplates.isLoading,
      error: cloudTemplates.error,
      hasTemplates: cloudTemplates.templates.length > 0,
      createTemplate: cloudTemplates.createTemplate,
      updateTemplate: cloudTemplates.updateTemplate,
      deleteTemplate: cloudTemplates.deleteTemplate,
      duplicateTemplate: cloudTemplates.duplicateTemplate,
      moveTemplate: cloudTemplates.moveTemplate,
      createFolder: cloudTemplates.createFolder,
      renameFolder: cloudTemplates.renameFolder,
      deleteFolder: cloudTemplates.deleteFolder,
      getTemplatesInFolder: cloudTemplates.getTemplatesInFolder,
      isCreatingTemplate: cloudTemplates.isCreatingTemplate,
      isDeletingTemplate: cloudTemplates.isDeletingTemplate,
      isCloud: true,
    };
  }

  // Guest mode: localStorage fallback
  return {
    templates: localTemplates.map(t => ({
      id: t.id,
      name: t.name,
      config: t.config,
      preview: null,
      folderId: t.folderId || null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })) as CloudTemplate[],
    folders: localFolders,
    isLoading: localLoading,
    error: null,
    hasTemplates: localTemplates.length > 0,
    createTemplate: createLocalTemplate,
    updateTemplate: async () => {
      toast.error("Funktion im Gastmodus nicht verfügbar");
      return null as unknown as ReturnType<typeof cloudTemplates.updateTemplate>;
    },
    deleteTemplate: async () => {
      toast.error("Funktion im Gastmodus nicht verfügbar");
    },
    duplicateTemplate: async () => {
      toast.error("Funktion im Gastmodus nicht verfügbar");
      return null as unknown as ReturnType<typeof cloudTemplates.duplicateTemplate>;
    },
    moveTemplate: async () => {
      toast.error("Funktion im Gastmodus nicht verfügbar");
    },
    createFolder: async () => {
      toast.error("Funktion im Gastmodus nicht verfügbar");
      return null as unknown as ReturnType<typeof cloudTemplates.createFolder>;
    },
    renameFolder: async () => {
      toast.error("Funktion im Gastmodus nicht verfügbar");
    },
    deleteFolder: async () => {
      toast.error("Funktion im Gastmodus nicht verfügbar");
    },
    getTemplatesInFolder: getLocalTemplatesInFolder,
    isCreatingTemplate: false,
    isDeletingTemplate: false,
    isCloud: false,
  };
}

