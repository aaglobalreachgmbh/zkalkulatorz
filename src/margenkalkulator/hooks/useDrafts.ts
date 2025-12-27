// ============================================
// Hybrid Drafts Hook - Cloud with localStorage Fallback
// ============================================

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCloudDrafts } from "./useCloudDrafts";
import { loadDrafts, createDraft as createLocalDraft, deleteDraft as deleteLocalDraft } from "../storage/drafts";
import type { OfferDraft } from "../storage/types";
import type { OfferOptionState } from "../engine/types";

/**
 * Hybrid hook that uses Cloud for authenticated users,
 * falls back to localStorage for guests
 */
export function useDrafts() {
  const { user } = useAuth();
  const cloudDrafts = useCloudDrafts();
  
  // Local state for guest mode
  const [localDrafts, setLocalDrafts] = useState<OfferDraft[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  
  // Load local drafts on mount (for guests)
  useEffect(() => {
    if (!user) {
      setLocalDrafts(loadDrafts());
      setLocalLoading(false);
    }
  }, [user]);
  
  // If authenticated, use cloud drafts
  if (user) {
    return {
      drafts: cloudDrafts.drafts,
      isLoading: cloudDrafts.isLoading,
      error: cloudDrafts.error,
      hasDrafts: cloudDrafts.hasDrafts,
      createDraft: cloudDrafts.createDraft,
      updateDraft: cloudDrafts.updateDraft,
      deleteDraft: cloudDrafts.deleteDraft,
      renameDraft: cloudDrafts.renameDraft,
      isCreating: cloudDrafts.isCreating,
      isUpdating: cloudDrafts.isUpdating,
      isDeleting: cloudDrafts.isDeleting,
      isCloud: true,
    };
  }
  
  // Guest mode: localStorage fallback
  const createDraft = useCallback(async (
    name: string,
    config: OfferOptionState,
    avgMonthly: number
  ) => {
    const draft = createLocalDraft(name, config, avgMonthly);
    setLocalDrafts(loadDrafts());
    return draft;
  }, []);
  
  const deleteDraft = useCallback(async (id: string) => {
    deleteLocalDraft(id);
    setLocalDrafts(loadDrafts());
  }, []);
  
  return {
    drafts: localDrafts,
    isLoading: localLoading,
    error: null,
    hasDrafts: localDrafts.length > 0,
    createDraft,
    updateDraft: async () => { throw new Error("Update not supported in guest mode"); },
    deleteDraft,
    renameDraft: async () => { throw new Error("Rename not supported in guest mode"); },
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isCloud: false,
  };
}
