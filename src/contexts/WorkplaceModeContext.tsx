// ============================================
// Workplace Mode Context
// POS = Point of Sale (im Laden/Shop)
// Field = Außendienst (unterwegs, mobil)
// ============================================

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type WorkplaceMode = "pos" | "field";

interface WorkplaceModeContextType {
  /** Current workplace mode */
  workplaceMode: WorkplaceMode;
  /** Convenience: is POS mode active */
  isPOS: boolean;
  /** Convenience: is Field mode active */
  isField: boolean;
  /** Set specific mode */
  setWorkplaceMode: (mode: WorkplaceMode) => void;
  /** Toggle between modes */
  toggleWorkplaceMode: () => void;
  /** 
   * @deprecated Use workplaceMode instead
   * Legacy alias for backwards compatibility
   */
  isPOSMode: boolean;
  /** @deprecated Use toggleWorkplaceMode instead */
  togglePOSMode: () => void;
  /** @deprecated Use setWorkplaceMode("pos") instead */
  enablePOSMode: () => void;
  /** @deprecated Use setWorkplaceMode("field") instead */
  disablePOSMode: () => void;
}

const WorkplaceModeContext = createContext<WorkplaceModeContextType | undefined>(undefined);

const STORAGE_KEY = "workplace-mode";

/**
 * Detect initial mode based on device characteristics
 */
function detectInitialMode(): WorkplaceMode {
  // Check localStorage first
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "pos" || stored === "field") {
      return stored;
    }
  }
  
  // Auto-detect based on screen size and touch capability
  if (typeof window !== "undefined") {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    
    // Mobile/Tablet with touch → likely field service
    if ((isMobile || isTablet) && hasTouch) {
      return "field";
    }
  }
  
  // Default to POS for desktop
  return "pos";
}

interface WorkplaceModeProviderProps {
  children: ReactNode;
}

export function WorkplaceModeProvider({ children }: WorkplaceModeProviderProps) {
  const [workplaceMode, setWorkplaceModeState] = useState<WorkplaceMode>(detectInitialMode);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, workplaceMode);
  }, [workplaceMode]);

  const setWorkplaceMode = useCallback((mode: WorkplaceMode) => {
    setWorkplaceModeState(mode);
  }, []);

  const toggleWorkplaceMode = useCallback(() => {
    setWorkplaceModeState((prev) => (prev === "pos" ? "field" : "pos"));
  }, []);

  // Computed values
  const isPOS = workplaceMode === "pos";
  const isField = workplaceMode === "field";

  // Legacy aliases for backwards compatibility
  const isPOSMode = isPOS;
  const togglePOSMode = toggleWorkplaceMode;
  const enablePOSMode = useCallback(() => setWorkplaceModeState("pos"), []);
  const disablePOSMode = useCallback(() => setWorkplaceModeState("field"), []);

  return (
    <WorkplaceModeContext.Provider
      value={{
        workplaceMode,
        isPOS,
        isField,
        setWorkplaceMode,
        toggleWorkplaceMode,
        // Legacy aliases
        isPOSMode,
        togglePOSMode,
        enablePOSMode,
        disablePOSMode,
      }}
    >
      {children}
    </WorkplaceModeContext.Provider>
  );
}

export function useWorkplaceMode() {
  const context = useContext(WorkplaceModeContext);
  if (context === undefined) {
    // Return safe defaults if used outside provider
    return {
      workplaceMode: "field" as WorkplaceMode,
      isPOS: false,
      isField: true,
      setWorkplaceMode: () => {},
      toggleWorkplaceMode: () => {},
      // Legacy aliases
      isPOSMode: false,
      togglePOSMode: () => {},
      enablePOSMode: () => {},
      disablePOSMode: () => {},
    };
  }
  return context;
}

/**
 * @deprecated Use useWorkplaceMode instead
 * Legacy hook for backwards compatibility
 */
export function usePOSMode() {
  return useWorkplaceMode();
}

// Re-export the provider under old name for compatibility
export { WorkplaceModeProvider as POSModeProvider };
