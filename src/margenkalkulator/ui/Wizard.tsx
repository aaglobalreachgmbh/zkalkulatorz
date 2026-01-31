// ============================================
// Wizard - Margenkalkulator Orchestrator
// Phase 3: Migration - Hybrid Architecture
// ============================================
//
// Uses CalculatorProvider for navigation/UI state
// Keeps business logic (bonuses, calculations) in WizardContent
// Adapter Pattern: Maps Context state to Step props
// ============================================

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Signal,
  Router,
  Lock,
  Zap,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePOSMode } from "@/contexts/POSModeContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  type OfferOptionState,
  type OfferOptionMeta,
  type ViewMode,
  type WizardStep,
  createDefaultOptionState,
  calculateOffer,
  useWizardValidation,
  getMobileTariffFromCatalog,
} from "@/margenkalkulator";
import { useEmployeeSettings } from "@/margenkalkulator/hooks/useEmployeeSettings";
import { usePushProvisions } from "@/margenkalkulator/hooks/usePushProvisions";
import { useDatasetVersions } from "@/margenkalkulator/hooks/useDatasetVersions";
import { useTenantDataStatus } from "@/margenkalkulator/hooks/useTenantDataStatus";
import { useQuantityBonus } from "@/margenkalkulator/hooks/useQuantityBonus";
import { useOfferBasket } from "@/margenkalkulator/contexts/OfferBasketContext";
import { HardwareStep } from "./steps/HardwareStep";
import { MobileStep } from "./steps/MobileStep";
import { FixedNetStep } from "./steps/FixedNetStep";
import { ValidationWarning } from "./components/ValidationWarning";
import { AiConsultant } from "./components/AiConsultant";
import { ActionMenu } from "./components/ActionMenu";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { DensityToggle } from "@/components/DensityToggle";
import { CustomerSessionToggle } from "./components/CustomerSessionToggle";
import { getStepSummary } from "./components/LiveCalculationBar";
import { SummarySidebar } from "./components/SummarySidebar";
import { MobileActionFooter } from "./components/MobileActionFooter";
import { OfferBasketPanel } from "./components/OfferBasketPanel";
import { WizardProgress } from "./components/WizardProgress";
import { SavingsBreakdown } from "./components/SavingsBreakdown";
import { PricePeriodBreakdown } from "./components/PricePeriodBreakdown";
import { PriceTimeline } from "./components/PriceTimeline";
import { QuickStartDialog, shouldShowQuickStart } from "./components/QuickStartDialog";
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
import { Badge } from "@/components/ui/badge";
import { CalculatorProvider, useCalculator } from "../context/CalculatorContext";
import { CalculatorShell } from "../layout/CalculatorShell";

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

  // === CALCULATOR CONTEXT (Navigation & UI State) ===
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
  } = useCalculator();

  // === BUSINESS LOGIC HOOKS (Kept in WizardContent) ===
  const { settings: employeeSettings } = useEmployeeSettings();
  const { getBonusAmount } = usePushProvisions();
  const { addToHistory } = useHistory();
  const { getBonusForQuantity, tiers: quantityBonusTiers } = useQuantityBonus();
  const { items: basketItems } = useOfferBasket();

  // Onboarding Tour Hook
  const tour = useOnboardingTour();

  // Auto-Save Hook
  const autoSave = useWizardAutoSave();
  const hasCheckedAutoSave = useRef(false);

  // Dataset Versions - Auto-seed if none exist
  const { versions, isLoading: isLoadingVersions, seedDefaultVersion, isSeeding } = useDatasetVersions();
  const hasSeeded = useRef(false);
  const shownGigaKombiToast = useRef(false);

  // Tenant Data Status Check
  const { status: tenantDataStatus, isLoading: isLoadingTenantData } = useTenantDataStatus();
  const { isAdmin: isSuperAdmin } = useUserRole();

  // Feature flags
  const { enabled: option2Enabled, reason: option2Reason } = useFeature("compareOption2");

  // === DERIVED STATE ===
  const activeState = activeOption === 1 ? option1 : option2;
  const setActiveState = activeOption === 1 ? setOption1 : setOption2;
  const isCustomerSafeMode = isPOSMode || customerSession.isActive;

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
    } else if (!hasCheckedAutoSave.current && shouldShowQuickStart()) {
      hasCheckedAutoSave.current = true;
      setShowQuickStart(true);
    }
  }, [autoSave.hasSavedDraft, setShowRestoreDialog, setShowQuickStart]);

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
    if (shouldShowQuickStart()) {
      setShowQuickStart(true);
    }
  }, [autoSave, setShowRestoreDialog, setShowQuickStart]);

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

  // Demo Mode - Load via URL
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

  // === EMPLOYEE OPTIONS FOR CALCULATION ===
  const employeeOptions = useMemo(
    () => ({
      employeeDeduction: employeeSettings
        ? {
            deductionValue: employeeSettings.provisionDeduction ?? 0,
            deductionType: (employeeSettings.provisionDeductionType ?? "fixed") as "fixed" | "percentage",
          }
        : null,
    }),
    [employeeSettings]
  );

  // Build push provision context
  const buildPushContext = useCallback(
    (option: OfferOptionState) => ({
      hasHardware: option.hardware.ekNet > 0,
      hardwareEkNet: option.hardware.ekNet,
      hasFixedNet: option.fixedNet.enabled,
      hasGigaKombi: option.fixedNet.enabled && option.mobile.tariffId.toLowerCase().includes("prime"),
      subVariantId: option.mobile.subVariantId,
      quantity: option.mobile.quantity,
      contractType: option.mobile.contractType,
    }),
    []
  );

  // Calculate total quantity for quantity bonus
  const totalQuantityInBasket = useMemo(() => {
    return basketItems.reduce((sum, item) => sum + (item.option.mobile.quantity || 1), 0);
  }, [basketItems]);

  const totalQuantityForBonus = totalQuantityInBasket + option1.mobile.quantity;

  // Determine active quantity bonus tier
  const activeQuantityBonusTier = useMemo(() => {
    return getBonusForQuantity(totalQuantityForBonus);
  }, [getBonusForQuantity, totalQuantityForBonus]);

  // Calculate quantity bonus for current configuration
  const quantityBonusForOption1 = useMemo(() => {
    if (!activeQuantityBonusTier) return 0;
    return activeQuantityBonusTier.bonusPerContract * option1.mobile.quantity;
  }, [activeQuantityBonusTier, option1.mobile.quantity]);

  // === FULL CALCULATION WITH BONUSES ===
  const result1 = useMemo(() => {
    const context = buildPushContext(option1);
    const pushBonus = getBonusAmount(option1.mobile.tariffId, option1.mobile.contractType, 0, context);
    return calculateOffer(option1, {
      ...employeeOptions,
      pushBonus,
      quantityBonus: quantityBonusForOption1,
      quantityBonusTierName: activeQuantityBonusTier?.name,
    });
  }, [option1, employeeOptions, getBonusAmount, buildPushContext, quantityBonusForOption1, activeQuantityBonusTier]);

  const result2 = useMemo(() => {
    const context = buildPushContext(option2);
    const pushBonus = getBonusAmount(option2.mobile.tariffId, option2.mobile.contractType, 0, context);
    const quantityBonusForOption2 = activeQuantityBonusTier
      ? activeQuantityBonusTier.bonusPerContract * option2.mobile.quantity
      : 0;
    return calculateOffer(option2, {
      ...employeeOptions,
      pushBonus,
      quantityBonus: quantityBonusForOption2,
      quantityBonusTierName: activeQuantityBonusTier?.name,
    });
  }, [option2, employeeOptions, getBonusAmount, buildPushContext, activeQuantityBonusTier]);

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

  // Reset wizard for new tariff (keeps basket)
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

  // Get active result
  const activeResult = activeOption === 1 ? result1 : result2;
  const avgMonthlyNet = activeResult.totals.avgTermNet;

  // Get selected tariff
  const selectedTariff = useMemo(() => {
    return getMobileTariffFromCatalog(option1.meta.datasetVersion, option1.mobile.tariffId);
  }, [option1.meta.datasetVersion, option1.mobile.tariffId]);

  // GigaKombi eligibility check
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

      {/* QuickStart Dialog */}
      <QuickStartDialog
        open={showQuickStart}
        onOpenChange={setShowQuickStart}
        onSelect={handleQuickStartSelect}
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
        <div className="bg-muted/50 border-b border-border px-4 py-1 flex-none">
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-4 h-4" />
              <span>
                <strong>Demo-Modus:</strong> Es werden Beispieldaten verwendet.
              </span>
            </div>
            <Link
              to="/daten"
              className="text-amber-700 dark:text-amber-300 underline hover:no-underline text-xs"
            >
              Eigene Daten hinterlegen →
            </Link>
          </div>
        </div>
      )}

      {/* Main Shell Layout */}
      <CalculatorShell
        title="Kalkulator"
        headerActions={
          <>
            {/* Progress Indicator */}
            <WizardProgress
              currentStep={activeSection === "hardware" ? 1 : 2}
              hasHardware={option1.hardware.ekNet > 0 || option1.hardware.name === "KEINE HARDWARE"}
              hasTariff={!!option1.mobile.tariffId}
              hasOffer={basketItems.length > 0}
              onStepClick={(step) => {
                if (step === 1) goToSection("hardware");
                else if (step === 2) goToSection("mobile");
              }}
            />

            {/* Session Badge */}
            {customerSession.isActive && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 gap-1"
              >
                <Lock className="w-3 h-3" />
                Kundensitzung
              </Badge>
            )}

            <div className="flex-1" />

            {/* Controls */}
            {policy.showCustomerSessionToggle && <CustomerSessionToggle />}
            <DensityToggle />
            <ViewModeToggle
              value={effectiveViewMode}
              onChange={handleViewModeChange}
              allowCustomerMode={policy.allowCustomerMode}
              disabled={isCustomerSafeMode}
            />
            {!isPOSMode && (
              <ActionMenu config={activeState} avgMonthly={avgMonthlyNet} onLoadConfig={handleLoadConfig} />
            )}
          </>
        }
        sidebar={
          <div className="p-4 space-y-4">
            <SummarySidebar
              option={option1}
              result={result1}
              viewMode={effectiveViewMode}
              quantityBonus={quantityBonusForOption1}
              onResetForNewTariff={resetForNewTariff}
              onGoToCheckout={() => goToSection("compare")}
            />
            <OfferBasketPanel />
          </div>
        }
        mobileFooter={
          <MobileActionFooter
            option={option1}
            result={result1}
            viewMode={effectiveViewMode}
            quantityBonus={quantityBonusForOption1}
            onResetForNewTariff={resetForNewTariff}
          />
        }
      >
        {/* Accordion Sections */}
        <Accordion
          type="single"
          collapsible
          value={activeSection}
          onValueChange={(val) => goToSection(val as WizardStep)}
          className="space-y-2"
        >
          {/* Hardware Section */}
          <AccordionItem
            value="hardware"
            className={cn(
              "bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 shadow-sm",
              activeSection === "hardware" && "ring-1 ring-primary/20 border-primary/40 shadow-md",
              activeSection !== "hardware" && "hover:border-primary/20"
            )}
          >
            <AccordionTrigger className="px-4 py-2.5 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    option1.hardware.ekNet > 0 || option1.hardware.name === "KEINE HARDWARE"
                      ? "bg-primary/10"
                      : "bg-muted/50"
                  )}
                >
                  <Smartphone
                    className={cn(
                      "w-4 h-4",
                      option1.hardware.ekNet > 0 || option1.hardware.name === "KEINE HARDWARE"
                        ? "text-primary"
                        : "text-muted-foreground/50"
                    )}
                  />
                </div>
                <div className="text-left">
                  <p className="font-medium">Hardware</p>
                  <p className="text-xs text-muted-foreground/70">
                    {getStepSummary("hardware", { hardware: option1.hardware })}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
              <HardwareStep
                value={activeState.hardware}
                onChange={(hardware) => setActiveState({ ...activeState, hardware })}
                onHardwareSelected={() => goToSection("mobile")}
                viewMode={effectiveViewMode}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Mobile Section */}
          <AccordionItem
            value="mobile"
            className={cn(
              "bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 shadow-sm",
              activeSection === "mobile" && "ring-1 ring-primary/20 border-primary/40 shadow-md",
              activeSection !== "mobile" && "hover:border-primary/20"
            )}
          >
            <AccordionTrigger className="px-4 py-2.5 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    option1.mobile.tariffId ? "bg-primary/10" : "bg-muted/50"
                  )}
                >
                  <Signal
                    className={cn("w-4 h-4", option1.mobile.tariffId ? "text-primary" : "text-muted-foreground/50")}
                  />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Mobilfunk</p>
                    {option1.mobile.quantity > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        {option1.mobile.quantity}x
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    {getStepSummary("mobile", { mobile: option1.mobile })}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2 max-h-[450px] overflow-y-auto scrollbar-thin">
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
            </AccordionContent>
          </AccordionItem>

          {/* Fixed Net Section */}
          {fixedNetModuleEnabled && (
            <AccordionItem
              value="fixedNet"
              className={cn(
                "bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 shadow-sm",
                activeSection === "fixedNet" && "ring-1 ring-emerald-500/20 border-emerald-500/40 shadow-md",
                activeSection !== "fixedNet" && "hover:border-emerald-500/20"
              )}
            >
              <AccordionTrigger className="px-4 py-2.5 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      option1.fixedNet.enabled ? "bg-emerald-500/10" : "bg-muted/50"
                    )}
                  >
                    <Router
                      className={cn(
                        "w-4 h-4",
                        option1.fixedNet.enabled ? "text-emerald-600" : "text-muted-foreground/50"
                      )}
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Festnetz</p>
                    <p className="text-xs text-muted-foreground/70">
                      {getStepSummary("fixedNet", { fixedNet: option1.fixedNet })}
                    </p>
                  </div>
                  {option1.fixedNet.enabled && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">GigaKombi</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2 max-h-[350px] overflow-y-auto scrollbar-thin">
                <FixedNetStep
                  value={activeState.fixedNet}
                  onChange={(fixedNet) => setActiveState({ ...activeState, fixedNet })}
                  datasetVersion={activeState.meta.datasetVersion}
                />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Price Period Breakdown */}
        {result1.periods.length > 1 && (
          <div className="mt-4 space-y-4">
            <PricePeriodBreakdown result={result1} termMonths={option1.meta.termMonths} />
            <PriceTimeline
              periods={result1.periods}
              termMonths={option1.meta.termMonths}
              avgMonthly={result1.totals.avgTermNet}
            />
          </div>
        )}

        {/* Savings Breakdown */}
        {result1.periods.length > 1 && (
          <div className="mt-4">
            <SavingsBreakdown result={result1} />
          </div>
        )}

        {/* Validation Warnings */}
        {!validation.steps.mobile.valid && (
          <div className="mt-4">
            <ValidationWarning validation={validation.steps.mobile} />
          </div>
        )}
      </CalculatorShell>

      {/* AI Consultant */}
      {!isPOSMode && activeState.mobile.tariffId && <AiConsultant config={activeState} result={activeResult} />}
    </div>
  );
}

// ============================================
// WIZARD ROOT EXPORT
// ============================================

export function Wizard() {
  return (
    <CalculatorProvider>
      <WizardContent />
    </CalculatorProvider>
  );
}
