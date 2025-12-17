import { useCallback, useEffect, useRef, useState } from "react";
import type { OfferOptionState, ViewMode } from "../engine/types";

const STORAGE_KEY = "margenkalkulator_draft";
const DEBOUNCE_MS = 1000;

export type DraftState = {
  option1: OfferOptionState;
  option2: OfferOptionState;
  activeOption: 1 | 2;
  viewMode: ViewMode;
  savedAt: string; // ISO timestamp
};

export type LocalStorageDraftResult = {
  loadDraft: () => DraftState | null;
  saveDraft: (state: Omit<DraftState, "savedAt">) => void;
  resetDraft: () => void;
  hasDraft: boolean;
  lastSaved: Date | null;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
};

export function useLocalStorageDraft(
  currentState: Omit<DraftState, "savedAt"> | null,
  onLoadDraft?: (draft: DraftState) => void
): LocalStorageDraftResult {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraftFromStorage();
    setHasDraft(!!draft);
    if (draft) {
      setLastSaved(new Date(draft.savedAt));
    }
  }, []);

  // Auto-save on change (debounced)
  useEffect(() => {
    if (!autoSaveEnabled || !currentState || !initialLoadDone.current) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      saveDraftToStorage(currentState);
      setLastSaved(new Date());
      setHasDraft(true);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [currentState, autoSaveEnabled]);

  // Mark initial load as done after first render
  useEffect(() => {
    initialLoadDone.current = true;
  }, []);

  const loadDraft = useCallback((): DraftState | null => {
    const draft = loadDraftFromStorage();
    if (draft && onLoadDraft) {
      onLoadDraft(draft);
    }
    return draft;
  }, [onLoadDraft]);

  const saveDraft = useCallback((state: Omit<DraftState, "savedAt">) => {
    saveDraftToStorage(state);
    setLastSaved(new Date());
    setHasDraft(true);
  }, []);

  const resetDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasDraft(false);
      setLastSaved(null);
    } catch (e) {
      console.error("Failed to reset draft:", e);
    }
  }, []);

  return {
    loadDraft,
    saveDraft,
    resetDraft,
    hasDraft,
    lastSaved,
    autoSaveEnabled,
    setAutoSaveEnabled,
  };
}

// Pure functions for storage operations
function loadDraftFromStorage(): DraftState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as DraftState;
    
    // Basic validation
    if (!parsed.option1 || !parsed.option2 || !parsed.savedAt) {
      return null;
    }
    
    return parsed;
  } catch (e) {
    console.error("Failed to load draft:", e);
    return null;
  }
}

function saveDraftToStorage(state: Omit<DraftState, "savedAt">): void {
  try {
    const draft: DraftState = {
      ...state,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (e) {
    console.error("Failed to save draft:", e);
  }
}

// Export for testing
export const storageFunctions = {
  loadDraftFromStorage,
  saveDraftToStorage,
};
