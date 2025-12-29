// ============================================
// Wizard Auto-Save Hook - Phase 5 Offline-Sync
// ============================================

import { useState, useEffect, useCallback, useRef } from "react";
import type { OfferOptionState, WizardStep } from "@/margenkalkulator/engine/types";

const STORAGE_KEY = "marge_wizard_autosave";
const AUTO_SAVE_DEBOUNCE_MS = 1000;
const MAX_AGE_HOURS = 24;

export interface WizardAutoSave {
  option1: OfferOptionState;
  option2: OfferOptionState;
  activeOption: 1 | 2;
  currentStep: WizardStep;
  savedAt: string;
  version: 1;
}

interface UseWizardAutoSaveReturn {
  hasSavedDraft: boolean;
  savedDraft: WizardAutoSave | null;
  savedAt: Date | null;
  restoreDraft: () => WizardAutoSave | null;
  discardDraft: () => void;
  saveDraft: (data: Omit<WizardAutoSave, "savedAt" | "version">) => void;
  clearDraft: () => void;
}

function isValidDraft(data: unknown): data is WizardAutoSave {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  
  return (
    d.version === 1 &&
    typeof d.savedAt === "string" &&
    d.option1 !== undefined &&
    d.option2 !== undefined &&
    (d.activeOption === 1 || d.activeOption === 2) &&
    typeof d.currentStep === "string"
  );
}

function isDraftExpired(savedAt: string): boolean {
  const saved = new Date(savedAt);
  const now = new Date();
  const diffHours = (now.getTime() - saved.getTime()) / (1000 * 60 * 60);
  return diffHours > MAX_AGE_HOURS;
}

export function useWizardAutoSave(): UseWizardAutoSaveReturn {
  const [savedDraft, setSavedDraft] = useState<WizardAutoSave | null>(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      
      if (!isValidDraft(parsed)) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // Check if expired
      if (isDraftExpired(parsed.savedAt)) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      setSavedDraft(parsed);
      setHasSavedDraft(true);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const saveDraft = useCallback(
    (data: Omit<WizardAutoSave, "savedAt" | "version">) => {
      // Debounce saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const autoSave: WizardAutoSave = {
          ...data,
          savedAt: new Date().toISOString(),
          version: 1,
        };

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(autoSave));
        } catch (e) {
          console.warn("Failed to auto-save wizard state:", e);
        }
      }, AUTO_SAVE_DEBOUNCE_MS);
    },
    []
  );

  const restoreDraft = useCallback((): WizardAutoSave | null => {
    if (!savedDraft) return null;
    
    // Clear the stored draft after restore
    localStorage.removeItem(STORAGE_KEY);
    setHasSavedDraft(false);
    
    const draft = savedDraft;
    setSavedDraft(null);
    
    return draft;
  }, [savedDraft]);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedDraft(null);
    setHasSavedDraft(false);
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const savedAt = savedDraft ? new Date(savedDraft.savedAt) : null;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    hasSavedDraft,
    savedDraft,
    savedAt,
    restoreDraft,
    discardDraft,
    saveDraft,
    clearDraft,
  };
}
