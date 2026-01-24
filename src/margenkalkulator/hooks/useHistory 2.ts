// ============================================
// Hybrid History Hook - Cloud with localStorage Fallback
// ============================================

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCloudHistory } from "./useCloudHistory";
import { 
  loadHistory, 
  addToHistory as addToLocalHistory, 
  clearHistory as clearLocalHistory,
} from "../storage/history";
import type { HistoryEntry } from "../storage/types";
import type { OfferOptionState } from "../engine/types";

/**
 * Hybrid hook that uses Cloud for authenticated users,
 * falls back to localStorage for guests
 */
export function useHistory() {
  const { user } = useAuth();
  const cloudHistory = useCloudHistory();
  
  // Local state for guest mode
  const [localHistory, setLocalHistory] = useState<HistoryEntry[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  
  // Load local history on mount (for guests)
  useEffect(() => {
    if (!user) {
      setLocalHistory(loadHistory());
      setLocalLoading(false);
    }
  }, [user]);
  
  // If authenticated, use cloud history
  if (user) {
    return {
      history: cloudHistory.history,
      isLoading: cloudHistory.isLoading,
      error: cloudHistory.error,
      hasHistory: cloudHistory.hasHistory,
      addToHistory: cloudHistory.addToHistory,
      clearHistory: cloudHistory.clearHistory,
      getLastEntry: cloudHistory.getLastEntry,
      isAdding: cloudHistory.isAdding,
      isClearing: cloudHistory.isClearing,
      isCloud: true,
    };
  }
  
  // Guest mode: localStorage fallback
  const addToHistory = useCallback((
    config: OfferOptionState,
    avgMonthly: number,
    margin?: number
  ) => {
    addToLocalHistory(config);
    setLocalHistory(loadHistory());
  }, []);
  
  const clearHistory = useCallback(async () => {
    clearLocalHistory();
    setLocalHistory([]);
  }, []);
  
  const getLastEntry = useCallback(() => {
    return localHistory.length > 0 ? localHistory[0] : null;
  }, [localHistory]);
  
  return {
    history: localHistory,
    isLoading: localLoading,
    error: null,
    hasHistory: localHistory.length > 0,
    addToHistory,
    clearHistory,
    getLastEntry,
    isAdding: false,
    isClearing: false,
    isCloud: false,
  };
}
