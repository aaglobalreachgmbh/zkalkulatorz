// ============================================
// CalculatorContext - Centralized State for Kalkulator
// Phase 2: Architecture Implementation
// ============================================

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import type {
  OfferOptionState,
  CalculationResult,
  ViewMode,
  WizardStep,
} from "../engine/types";
import { createDefaultOptionState, calculateOffer } from "../engine";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { useWorkplaceMode } from "@/contexts/WorkplaceModeContext";
import { useFeature } from "@/hooks/useFeature";

// ============================================
// STATE INTERFACE
// ============================================

interface CalculatorState {
  // === NAVIGATION ===
  activeSection: WizardStep;
  activeOption: 1 | 2;

  // === VIEW MODE (SECURITY-CRITICAL) ===
  viewMode: ViewMode;
  /** COMPUTED: Effective view mode after security guards */
  effectiveViewMode: ViewMode;
  /** COMPUTED: Can show sensitive dealer data? */
  canShowDealerData: boolean;

  // === OPTION STATES ===
  option1: OfferOptionState;
  option2: OfferOptionState;

  // === CALCULATED RESULTS (READ-ONLY) ===
  result1: CalculationResult | null;
  result2: CalculationResult | null;

  // === UI STATE ===
  showQuickStart: boolean;
  showRestoreDialog: boolean;

  // === FEATURE FLAGS ===
  option2Enabled: boolean;
  fixedNetModuleEnabled: boolean;
}

// ============================================
// ACTIONS INTERFACE
// ============================================

interface CalculatorActions {
  // === NAVIGATION ===
  goToSection: (section: WizardStep) => void;
  setActiveOption: (option: 1 | 2) => void;

  // === VIEW MODE ===
  setViewMode: (mode: ViewMode) => void;

  // === OPTION MUTATIONS ===
  setOption1: (option: OfferOptionState) => void;
  updateOption1: (updater: (draft: OfferOptionState) => OfferOptionState) => void;
  setOption2: (option: OfferOptionState) => void;
  updateOption2: (updater: (draft: OfferOptionState) => OfferOptionState) => void;

  // === ACTIVE OPTION HELPERS ===
  getActiveOption: () => OfferOptionState;
  updateActiveOption: (updater: (draft: OfferOptionState) => OfferOptionState) => void;
  getActiveResult: () => CalculationResult | null;

  // === LIFECYCLE ===
  resetCalculator: () => void;
  loadConfig: (config: OfferOptionState, targetOption?: 1 | 2) => void;

  // === UI DIALOGS ===
  setShowQuickStart: (show: boolean) => void;
  setShowRestoreDialog: (show: boolean) => void;
}

// ============================================
// COMBINED TYPE
// ============================================

type CalculatorContextType = CalculatorState & CalculatorActions;

// ============================================
// SAFE DEFAULT - Prevents White-Screen Crashes
// ============================================

const SAFE_DEFAULT_CALCULATOR: CalculatorContextType = {
  // State defaults (safe = customer mode, no sensitive data)
  activeSection: "hardware",
  activeOption: 1,
  viewMode: "dealer",
  effectiveViewMode: "customer", // Safe: Customer mode as default
  canShowDealerData: false, // Safe: No sensitive data
  option1: createDefaultOptionState(),
  option2: createDefaultOptionState(),
  result1: null,
  result2: null,
  showQuickStart: false,
  showRestoreDialog: false,
  option2Enabled: false,
  fixedNetModuleEnabled: false,

  // Actions (No-Op with warning)
  goToSection: (section) =>
    console.warn(`[CalculatorContext] Cannot navigate to ${section} - no provider`),
  setActiveOption: () =>
    console.warn("[CalculatorContext] Cannot set option - no provider"),
  setViewMode: () =>
    console.warn("[CalculatorContext] Cannot set view mode - no provider"),
  setOption1: () =>
    console.warn("[CalculatorContext] Cannot set option1 - no provider"),
  updateOption1: () =>
    console.warn("[CalculatorContext] Cannot update option1 - no provider"),
  setOption2: () =>
    console.warn("[CalculatorContext] Cannot set option2 - no provider"),
  updateOption2: () =>
    console.warn("[CalculatorContext] Cannot update option2 - no provider"),
  getActiveOption: () => createDefaultOptionState(),
  updateActiveOption: () =>
    console.warn("[CalculatorContext] Cannot update active option - no provider"),
  getActiveResult: () => null,
  resetCalculator: () =>
    console.warn("[CalculatorContext] Cannot reset - no provider"),
  loadConfig: () =>
    console.warn("[CalculatorContext] Cannot load config - no provider"),
  setShowQuickStart: () => {},
  setShowRestoreDialog: () => {},
};

// ============================================
// CONTEXT
// ============================================

const CalculatorContext = createContext<CalculatorContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

interface CalculatorProviderProps {
  children: ReactNode;
  /** Override default view mode (for testing) */
  defaultViewMode?: ViewMode;
}

export function CalculatorProvider({
  children,
  defaultViewMode = "dealer",
}: CalculatorProviderProps) {
  // === EXTERNAL HOOKS (Security & Features) ===
  const { session: customerSession } = useCustomerSession();
  const { isPOSMode } = useWorkplaceMode();
  const { enabled: option2Enabled } = useFeature("compareOption2");
  const { enabled: fixedNetModuleEnabled } = useFeature("fixedNetModule");

  // === CORE STATE ===
  const [activeSection, setActiveSection] = useState<WizardStep>("hardware");
  const [activeOption, setActiveOption] = useState<1 | 2>(1);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [option1, setOption1] = useState<OfferOptionState>(createDefaultOptionState);
  const [option2, setOption2] = useState<OfferOptionState>(createDefaultOptionState);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  // === SECURITY COMPUTATION ===
  const isCustomerSafeMode = isPOSMode || customerSession.isActive;
  const effectiveViewMode: ViewMode = isCustomerSafeMode ? "customer" : viewMode;
  const canShowDealerData = effectiveViewMode === "dealer" && !isCustomerSafeMode;

  // === CALCULATION (Memoized) ===
  const result1 = useMemo<CalculationResult | null>(() => {
    try {
      return calculateOffer(option1);
    } catch (err) {
      console.warn("[CalculatorContext] result1 calculation failed:", err);
      return null;
    }
  }, [option1]);

  const result2 = useMemo<CalculationResult | null>(() => {
    if (!option2Enabled) return null;
    try {
      return calculateOffer(option2);
    } catch (err) {
      console.warn("[CalculatorContext] result2 calculation failed:", err);
      return null;
    }
  }, [option2, option2Enabled]);

  // === NAVIGATION ACTIONS ===
  const goToSection = useCallback((section: WizardStep) => {
    setActiveSection(section);
  }, []);

  // === OPTION MUTATIONS ===
  const updateOption1 = useCallback(
    (updater: (draft: OfferOptionState) => OfferOptionState) => {
      setOption1((prev) => updater(prev));
    },
    []
  );

  const updateOption2 = useCallback(
    (updater: (draft: OfferOptionState) => OfferOptionState) => {
      setOption2((prev) => updater(prev));
    },
    []
  );

  // === ACTIVE OPTION HELPERS ===
  const getActiveOption = useCallback(() => {
    return activeOption === 1 ? option1 : option2;
  }, [activeOption, option1, option2]);

  const updateActiveOption = useCallback(
    (updater: (draft: OfferOptionState) => OfferOptionState) => {
      if (activeOption === 1) {
        setOption1((prev) => updater(prev));
      } else {
        setOption2((prev) => updater(prev));
      }
    },
    [activeOption]
  );

  const getActiveResult = useCallback(() => {
    return activeOption === 1 ? result1 : result2;
  }, [activeOption, result1, result2]);

  // === LIFECYCLE ===
  const resetCalculator = useCallback(() => {
    setOption1(createDefaultOptionState());
    setOption2(createDefaultOptionState());
    setActiveSection("hardware");
    setActiveOption(1);
  }, []);

  const loadConfig = useCallback(
    (config: OfferOptionState, targetOption: 1 | 2 = 1) => {
      if (targetOption === 1) {
        setOption1(config);
      } else {
        setOption2(config);
      }
    },
    []
  );

  // === CONTEXT VALUE ===
  const value: CalculatorContextType = useMemo(
    () => ({
      // State
      activeSection,
      activeOption,
      viewMode,
      effectiveViewMode,
      canShowDealerData,
      option1,
      option2,
      result1,
      result2,
      showQuickStart,
      showRestoreDialog,
      option2Enabled,
      fixedNetModuleEnabled,

      // Actions
      goToSection,
      setActiveOption,
      setViewMode,
      setOption1,
      updateOption1,
      setOption2,
      updateOption2,
      getActiveOption,
      updateActiveOption,
      getActiveResult,
      resetCalculator,
      loadConfig,
      setShowQuickStart,
      setShowRestoreDialog,
    }),
    [
      activeSection,
      activeOption,
      viewMode,
      effectiveViewMode,
      canShowDealerData,
      option1,
      option2,
      result1,
      result2,
      showQuickStart,
      showRestoreDialog,
      option2Enabled,
      fixedNetModuleEnabled,
      goToSection,
      updateOption1,
      updateOption2,
      getActiveOption,
      updateActiveOption,
      getActiveResult,
      resetCalculator,
      loadConfig,
    ]
  );

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
}

// ============================================
// HOOK WITH SAFE DEFAULT
// ============================================

export function useCalculator(): CalculatorContextType {
  const context = useContext(CalculatorContext);
  if (!context) {
    console.warn(
      "[useCalculator] Used outside CalculatorProvider, returning safe default"
    );
    return SAFE_DEFAULT_CALCULATOR;
  }
  return context;
}

// ============================================
// EXPORTS
// ============================================

export type { CalculatorContextType, CalculatorState, CalculatorActions };
