// ============================================
// Wizard - Margenkalkulator Orchestrator
// Redesign: Step-based pages (no accordion)
// Business logic untouched - only UI rewrite
// ============================================

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Signal,
  Router,
  Zap,
  ChevronRight,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePOSMode } from "@/contexts/POSModeContext";
import {
  type OfferOptionState,
  type OfferOptionMeta,
  type ViewMode,
  type WizardStep,
  createDefaultOptionState,
  useWizardValidation,
  getMobileTariffFromCatalog,
} from "@/margenkalkulator";
import { useDatasetVersions } from "@/margenkalkulator/hooks/useDatasetVersions";
import { useTenantDataStatus } from "@/margenkalkulator/hooks/useTenantDataStatus";
import { useOfferBasket } from "@/margenkalkulator/contexts/OfferBasketContext";
import { HardwareStep } from "./steps/HardwareStep";
import { MobileStep } from "./steps/MobileStep";
import { FixedNetStep } from "./steps/FixedNetStep";
import { ValidationWarning } from "./components/ValidationWarning";
import { ActionMenu } from "./components/ActionMenu";
import { ModeSelector } from "./components/ModeSelector";
import { SummarySidebar } from "./components/SummarySidebar";
import { MobileActionFooter } from "./components/MobileActionFooter";
import { OfferBasketPanel } from "./components/OfferBasketPanel";
import { PricePeriodBreakdown } from "./components/PricePeriodBreakdown";
import { useHistory } from "../hooks/useHistory";
import { toast } from "sonner";
import { useIdentity } from "@/contexts/IdentityContext";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { useEffectivePolicy } from "@/hooks/useEffectivePolicy";
import { useFeature } from "@/hooks/useFeature";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import { useWizardAutoSave } from "@/hooks/useWizardAutoSave";
import { OnboardingTour, OnboardingPrompt } from "@/components/OnboardingTour";
import { WizardRestoreDialog } from "@/components/WizardRestoreDialog";
import { cn } from "@/lib/utils";
import { CalculatorProvider, useCalculator } from "../context/CalculatorContext";
import { CalculatorShell } from "../layout/CalculatorShell";

// ============================================
// STEP CONFIGURATION
// ============================================

const STEPS: { id: WizardStep; label: string; icon: typeof Smartphone }[] = [
  { id: "hardware", label: "Hardware", icon: Smartphone },
  { id: "mobile", label: "Mobilfunk", icon: Signal },
  { id: "fixedNet", label: "Festnetz", icon: Router },
];

// ============================================
// STEP INDICATOR COMPONENT
// ============================================

function StepIndicator({
  activeStep,
  onStepClick,
  fixedNetEnabled,
}: {
  activeStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  fixedNetEnabled: boolean;
}) {
  const visibleSteps = fixedNetEnabled ? STEPS : STEPS.filter(s => s.id !== "fixedNet");
  const activeIndex = visibleSteps.findIndex(s => s.id === activeStep);

  return (
    <div className="flex items-center gap-1">
      {visibleSteps.map((step, idx) => {
        const isActive = step.id === activeStep;
        const isPast = idx < activeIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => onStepClick(step.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                isActive && "bg-red-50 text-red-700 border border-red-200",
                isPast && "text-green-700 hover:bg-green-50",
                !isActive && !isPast && "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">
                Step {idx + 1}: {step.label}
              </span>
              <span className="sm:hidden">{idx + 1}</span>
            </button>
            {idx < visibleSteps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// WIZARD CONTENT (Inside Provider)
// ============================================

function WizardContent() {
  const location = useLocation();
  const { identity, canAccessAdmin, isSupabaseAuth } = useIdentity();
  const { session: customerSession, toggleSession } = useCustomerSession();
  const policy = useEffectivePolicy();
  const isMobile = useIsMobile();
  const { isPOSMode } = usePOSMode();

  // === CALCULATOR CONTEXT ===
  const {
    activeSection,
    goToSection,
    option1,
    setOption1,
    updateOption1,
    option2,
    setOption2,
    updateOption2,
    activeOption,
    setActiveOption,
    viewMode,
    setViewMode,
    effectiveViewMode,
    fixedNetModuleEnabled,
    showQuickStart,
    setShowQuickStart,
    showRestoreDialog,
    setShowRestoreDialog,
    result1,
    result2,
    quantityBonusForOption1,
  } = useCalculator();

  // === BASKET ===
  const { items: basketItems } = useOfferBasket();

  // === UI-ONLY HOOKS ===
  const { addToHistory } = useHistory();
  const tour = useOnboardingTour();
  const autoSave = useWizardAutoSave();
  const hasCheckedAutoSave = useRef(false);
  const { versions, isLoading: isLoadingVersions, seedDefaultVersion, isSeeding } = useDatasetVersions();
  const hasSeeded = useRef(false);
  const shownGigaKombiToast = useRef(false);
  const { status: tenantDataStatus, isLoading: isLoadingTenantData } = useTenantDataStatus();
  const { isAdmin: isSuperAdmin } = useUserRole();
  const { enabled: option2Enabled, reason: option2Reason } = useFeature("compareOption2");

  // === DERIVED STATE ===
  const activeState = activeOption === 1 ? option1 : option2;
  const setActiveState = activeOption === 1 ? setOption1 : setOption2;
  const isCustomerSafeMode = isPOSMode || customerSession.isActive;
  const activeResult = activeOption === 1 ? result1 : result2;
  const avgMonthlyNet = activeResult?.totals.avgTermNet ?? 0;

  // Auto-seed dataset versions
  useEffect(() => {
    const shouldSeed =
      !isLoadingVersions &&
      versions.length === 0 &&
      !hasSeeded.current &&
      !isSeeding &&
      isSupabaseAuth &&
      canAccessAdmin;

    if (shouldSeed) {
      hasSeeded.current = true;
      seedDefaultVersion().catch(() => {
        hasSeeded.current = false;
      });
    }
  }, [isLoadingVersions, versions.length, seedDefaultVersion, isSeeding, isSupabaseAuth, canAccessAdmin]);

  // Check for auto-saved draft on mount
  useEffect(() => {
    if (!hasCheckedAutoSave.current && autoSave.hasSavedDraft) {
      hasCheckedAutoSave.current = true;
      setShowRestoreDialog(true);
    }
  }, [autoSave.hasSavedDraft, setShowRestoreDialog]);

  // Handle draft restore
  const handleRestoreDraft = useCallback(() => {
    const draft = autoSave.restoreDraft();
    if (draft) {
      setOption1(draft.option1);
      setOption2(draft.option2);
      setActiveOption(draft.activeOption);
      if (draft.option1.hardware.ekNet > 0) {
        goToSection("hardware");
      } else {
        goToSection("mobile");
      }
      toast.success("Entwurf wiederhergestellt", {
        description: "Deine letzte Konfiguration wurde geladen.",
      });
    }
    setShowRestoreDialog(false);
  }, [autoSave, setOption1, setOption2, setActiveOption, goToSection, setShowRestoreDialog]);

  // Handle draft discard
  const handleDiscardDraft = useCallback(() => {
    autoSave.discardDraft();
    setShowRestoreDialog(false);
  }, [autoSave, setShowRestoreDialog]);

  // Handle QuickStart selection
  const handleQuickStartSelect = useCallback(
    (option: string) => {
      switch (option) {
        case "sim_only":
          goToSection("mobile");
          break;
        case "with_hardware":
          goToSection("hardware");
          break;
        case "with_fixednet":
          goToSection("hardware");
          updateOption1((prev) => ({
            ...prev,
            fixedNet: { ...prev.fixedNet, enabled: true },
          }));
          break;
        case "team_deal":
          goToSection("mobile");
          updateOption1((prev) => ({
            ...prev,
            mobile: { ...prev.mobile, quantity: 3 },
          }));
          break;
      }
    },
    [goToSection, updateOption1]
  );

  // Auto-save on state changes
  useEffect(() => {
    if (option1.mobile.tariffId || option2.mobile.tariffId) {
      autoSave.saveDraft({
        option1,
        option2,
        activeOption,
        currentStep: activeSection,
      });
    }
  }, [option1, option2, activeOption, activeSection, autoSave]);

  // Force back to Option 1 if Option 2 is disabled
  useEffect(() => {
    if (!option2Enabled && activeOption === 2) {
      setActiveOption(1);
    }
  }, [option2Enabled, activeOption, setActiveOption]);

  // Load bundle or template config from route state
  useEffect(() => {
    const state = location.state as {
      bundleConfig?: Partial<OfferOptionState>;
      templateConfig?: OfferOptionState;
    } | null;

    if (state?.bundleConfig) {
      const merged = { ...createDefaultOptionState(), ...state.bundleConfig };
      setOption1(merged);
      toast.success("Bundle geladen", {
        description: "Die Bundle-Konfiguration wurde übernommen.",
      });
    } else if (state?.templateConfig) {
      setOption1(state.templateConfig);
      toast.success("Template geladen", {
        description: "Die Template-Konfiguration wurde übernommen.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Demo Mode
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("demo") === "true") {
      setTimeout(() => {
        handleQuickStartSelect("team_deal");
        toast.success("Demo-Modus geladen", {
          description: "Beispiel-Konfiguration (TeamDeal) wurde aktiviert.",
        });
      }, 500);
    }
  }, [location.search, handleQuickStartSelect]);

  // Validation
  const validation = useWizardValidation(activeState);

  // Load config handler
  const handleLoadConfig = useCallback(
    (config: OfferOptionState) => {
      if (activeOption === 1) {
        setOption1(config);
      } else {
        setOption2(config);
      }
    },
    [activeOption, setOption1, setOption2]
  );

  // Handle Meta Update
  const handleMetaUpdate = useCallback(
    (update: Partial<OfferOptionMeta>) => {
      if (activeOption === 1) {
        updateOption1((prev) => ({
          ...prev,
          meta: { ...prev.meta, ...update },
        }));
      } else {
        updateOption2((prev) => ({
          ...prev,
          meta: { ...prev.meta, ...update },
        }));
      }
    },
    [activeOption, updateOption1, updateOption2]
  );

  // Handle view mode change with policy checks
  const handleViewModeChange = useCallback(
    (newMode: ViewMode) => {
      if (newMode === "dealer" && viewMode === "customer" && policy.requireConfirmOnDealerSwitch) {
        if (!window.confirm("Wechsel in den Händler-Modus?")) {
          return;
        }
      }

      if (newMode === "customer" && policy.requireCustomerSessionWhenCustomerMode && !customerSession.isActive) {
        toggleSession();
        toast.success("Kundensitzung aktiviert", {
          description: "Sensible Daten werden ausgeblendet.",
        });
      }

      setViewMode(newMode);
    },
    [viewMode, policy, customerSession.isActive, toggleSession, setViewMode]
  );

  // Reset wizard for new tariff
  const resetForNewTariff = useCallback(() => {
    const freshState = createDefaultOptionState();
    setOption1(freshState);
    setOption2(createDefaultOptionState());
    setActiveOption(1);
    goToSection("hardware");
    toast.success("Bereit für nächsten Tarif", {
      description: "Konfiguriere jetzt den nächsten Tarif für dieses Angebot.",
    });
  }, [setOption1, setOption2, setActiveOption, goToSection]);

  // GigaKombi eligibility
  const isGigaKombiEligible = option1.fixedNet.enabled && option1.mobile.tariffId.toLowerCase().includes("prime");

  // GigaKombi Toast
  useEffect(() => {
    if (isGigaKombiEligible && !shownGigaKombiToast.current) {
      shownGigaKombiToast.current = true;
      toast.success("GigaKombi aktiv!", {
        description: "−5€/mtl. Rabatt auf Ihren Tarif angewendet",
        duration: 5000,
      });
    }
    if (!isGigaKombiEligible) {
      shownGigaKombiToast.current = false;
    }
  }, [isGigaKombiEligible]);

  // Fallback catalog detection
  const usingFallbackCatalog =
    isSupabaseAuth && !isSuperAdmin && !isLoadingTenantData && (!tenantDataStatus || !tenantDataStatus.isComplete);

  // Navigate to next step
  const goToNextStep = useCallback(() => {
    const stepOrder: WizardStep[] = fixedNetModuleEnabled
      ? ["hardware", "mobile", "fixedNet"]
      : ["hardware", "mobile"];
    const currentIdx = stepOrder.indexOf(activeSection);
    if (currentIdx < stepOrder.length - 1) {
      goToSection(stepOrder[currentIdx + 1]);
    }
  }, [activeSection, fixedNetModuleEnabled, goToSection]);

  // Get next step label
  const nextStepLabel = useMemo(() => {
    const stepOrder: WizardStep[] = fixedNetModuleEnabled
      ? ["hardware", "mobile", "fixedNet"]
      : ["hardware", "mobile"];
    const currentIdx = stepOrder.indexOf(activeSection);
    if (currentIdx < stepOrder.length - 1) {
      const next = STEPS.find(s => s.id === stepOrder[currentIdx + 1]);
      return next ? `Weiter zu ${next.label}` : null;
    }
    return null;
  }, [activeSection, fixedNetModuleEnabled]);

  // === RENDER ===
  return (
    <div
      className={cn(
        "h-full flex flex-col",
        customerSession.isActive && "ring-4 ring-amber-400 ring-inset"
      )}
    >
      {/* Restore Draft Dialog */}
      <WizardRestoreDialog
        open={showRestoreDialog}
        savedAt={autoSave.savedAt}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        isActive={tour.isActive}
        currentStep={tour.currentStep}
        currentStepIndex={tour.currentStepIndex}
        totalSteps={tour.totalSteps}
        progress={tour.progress}
        onNext={tour.nextStep}
        onPrev={tour.prevStep}
        onSkip={tour.skipTour}
        onEnd={() => tour.endTour(true)}
      />

      {tour.shouldShowTour && !tour.isActive && (
        <OnboardingPrompt onStart={tour.startTour} onDismiss={tour.skipTour} />
      )}

      {/* Demo Mode Banner */}
      {usingFallbackCatalog && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex-none">
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 text-amber-800">
              <Zap className="w-4 h-4" />
              <span>
                <strong>Demo-Modus:</strong> Es werden Beispieldaten verwendet.
              </span>
            </div>
            <Link
              to="/daten"
              className="text-amber-700 underline hover:no-underline text-xs font-medium"
            >
              Eigene Daten hinterlegen →
            </Link>
          </div>
        </div>
      )}

      {/* Main Shell Layout */}
      <CalculatorShell
        title="Kalkulator"
        stepIndicator={
          <StepIndicator
            activeStep={activeSection}
            onStepClick={goToSection}
            fixedNetEnabled={fixedNetModuleEnabled}
          />
        }
        headerActions={
          <>
            <ModeSelector
              value={effectiveViewMode}
              onChange={handleViewModeChange}
              allowCustomerMode={policy.allowCustomerMode}
              showSessionToggle={policy.showCustomerSessionToggle}
            />
            {!isPOSMode && (
              <ActionMenu config={activeState} avgMonthly={avgMonthlyNet} onLoadConfig={handleLoadConfig} />
            )}
          </>
        }
        sidebar={
          <>
            <SummarySidebar onResetForNewTariff={resetForNewTariff} />
            <OfferBasketPanel />
          </>
        }
        mobileFooter={
          <MobileActionFooter onResetForNewTariff={resetForNewTariff} />
        }
      >
        {/* Step Content - Full Page Render */}
        <div className="space-y-6">
          {/* Hardware Step */}
          {activeSection === "hardware" && (
            <div>
              <HardwareStep
                value={activeState.hardware}
                onChange={(hardware) => setActiveState({ ...activeState, hardware })}
                onHardwareSelected={() => goToSection("mobile")}
                viewMode={effectiveViewMode}
              />
            </div>
          )}

          {/* Mobile Step */}
          {activeSection === "mobile" && (
            <div>
              <MobileStep
                value={activeState.mobile}
                onChange={(mobile) => setActiveState({ ...activeState, mobile })}
                datasetVersion={activeState.meta.datasetVersion}
                fixedNetEnabled={activeState.fixedNet.enabled}
                hardwareName={activeState.hardware.name}
                viewMode={effectiveViewMode}
                fullOption={option1}
                result={result1}
                quantityBonus={quantityBonusForOption1}
                onConfigComplete={resetForNewTariff}
                onMetaUpdate={handleMetaUpdate}
              />
            </div>
          )}

          {/* FixedNet Step */}
          {activeSection === "fixedNet" && fixedNetModuleEnabled && (
            <div>
              <FixedNetStep
                value={activeState.fixedNet}
                onChange={(fixedNet) => setActiveState({ ...activeState, fixedNet })}
                datasetVersion={activeState.meta.datasetVersion}
              />
            </div>
          )}

          {/* Price Period Breakdown */}
          {result1 && result1.periods.length > 1 && (
            <PricePeriodBreakdown result={result1} termMonths={option1.meta.termMonths} />
          )}

          {/* Validation Warnings */}
          {!validation.steps.mobile.valid && (
            <ValidationWarning validation={validation.steps.mobile} />
          )}

          {/* Proceed to Next Step Button */}
          {nextStepLabel && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={goToNextStep}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white gap-2 font-semibold shadow-md px-8"
              >
                {nextStepLabel}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </CalculatorShell>
    </div>
  );
}

// ============================================
// WIZARD ROOT EXPORT
// ============================================

export function Wizard() {
  const { items: basketItems } = useOfferBasket();

  const basketQuantity = useMemo(() => {
    return basketItems.reduce((sum, item) => sum + (item.option.mobile.quantity || 1), 0);
  }, [basketItems]);

  return (
    <CalculatorProvider basketQuantity={basketQuantity}>
      <WizardContent />
    </CalculatorProvider>
  );
}
