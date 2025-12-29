import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Smartphone, Signal, Router, LayoutGrid, Printer, Calculator, Home, ChevronLeft, ChevronRight, Lock, AlertTriangle, XCircle, Settings } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import {
  type OfferOptionState,
  type ViewMode,
  type WizardStep,
  createDefaultOptionState,
  calculateOffer,
  useWizardValidation,
} from "@/margenkalkulator";
import { useEmployeeSettings } from "@/margenkalkulator/hooks/useEmployeeSettings";
import { usePushProvisions } from "@/margenkalkulator/hooks/usePushProvisions";
import { useDatasetVersions } from "@/margenkalkulator/hooks/useDatasetVersions";
import { useTenantDataStatus } from "@/margenkalkulator/hooks/useTenantDataStatus";
import { HardwareStep } from "./steps/HardwareStep";
import { MobileStep } from "./steps/MobileStep";
import { FixedNetStep } from "./steps/FixedNetStep";
import { CompareStep } from "./steps/CompareStep";
import { GlobalControls } from "./components/GlobalControls";
import { ValidationWarning } from "./components/ValidationWarning";
import { AiConsultant } from "./components/AiConsultant";
import { SaveDraftButton } from "./components/SaveDraftButton";
import { SaveTemplateButton } from "./components/SaveTemplateButton";
import { SaveBundleButton } from "./components/SaveBundleButton";
import { DraftManager } from "./components/DraftManager";
import { HistoryDropdown } from "./components/HistoryDropdown";
import { CloudOfferManager } from "./components/CloudOfferManager";
import { ActionMenu } from "./components/ActionMenu";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { CustomerSessionToggle } from "./components/CustomerSessionToggle";
import { IdentitySelector } from "./components/IdentitySelector";
import { useHistory } from "../hooks/useHistory";
import { useToast } from "@/hooks/use-toast";
import { useIdentity } from "@/contexts/IdentityContext";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { useEffectivePolicy } from "@/hooks/useEffectivePolicy";
import { useFeature } from "@/hooks/useFeature";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import { useWizardAutoSave } from "@/hooks/useWizardAutoSave";
import { OnboardingTour, OnboardingPrompt } from "@/components/OnboardingTour";
import { WizardRestoreDialog } from "@/components/WizardRestoreDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STEPS: { id: WizardStep; label: string; icon: typeof Smartphone }[] = [
  { id: "hardware", label: "Hardware", icon: Smartphone },
  { id: "mobile", label: "Mobilfunk", icon: Signal },
  { id: "fixedNet", label: "Festnetz", icon: Router },
  { id: "compare", label: "Kalkulation", icon: LayoutGrid },
];

export function Wizard() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { identity } = useIdentity();
  const { session: customerSession, toggleSession } = useCustomerSession();
  const policy = useEffectivePolicy();
  
  // Employee Settings & Push Provisions Hooks
  const { settings: employeeSettings } = useEmployeeSettings();
  const { getBonusAmount } = usePushProvisions();
  const { addToHistory } = useHistory();
  
  // Onboarding Tour Hook
  const tour = useOnboardingTour();
  
  // Auto-Save Hook (Phase 5: Offline-Sync)
  const autoSave = useWizardAutoSave();
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const hasCheckedAutoSave = useRef(false);
  
  // Dataset Versions - Auto-seed if none exist (only for authenticated admins)
  const { versions, isLoading: isLoadingVersions, seedDefaultVersion, isSeeding } = useDatasetVersions();
  const hasSeeded = useRef(false);
  const { canAccessAdmin, isSupabaseAuth } = useIdentity();
  
  // Phase 7: Tenant Data Status Check
  const { status: tenantDataStatus, isLoading: isLoadingTenantData } = useTenantDataStatus();
  
  useEffect(() => {
    // Auto-seed v2025_10 if:
    // - No versions exist for this tenant
    // - User is authenticated via Supabase AND has admin access
    // - Not already seeding
    const shouldSeed = !isLoadingVersions 
      && versions.length === 0 
      && !hasSeeded.current 
      && !isSeeding
      && isSupabaseAuth 
      && canAccessAdmin;
      
    if (shouldSeed) {
      hasSeeded.current = true;
      seedDefaultVersion().catch(() => {
        // Reset flag on error so user can retry
        hasSeeded.current = false;
      });
    }
  }, [isLoadingVersions, versions.length, seedDefaultVersion, isSeeding, isSupabaseAuth, canAccessAdmin]);
  
  const [currentStep, setCurrentStep] = useState<WizardStep>("hardware");
  const [activeOption, setActiveOption] = useState<1 | 2>(1);
  const [viewMode, setViewMode] = useState<ViewMode>(policy.defaultViewMode);
  
  // Feature-Gating: Check if Option 2 is enabled
  const { enabled: option2Enabled, reason: option2Reason } = useFeature("compareOption2");
  
  const [option1, setOption1] = useState<OfferOptionState>(createDefaultOptionState);
  const [option2, setOption2] = useState<OfferOptionState>(createDefaultOptionState);
  
  // Check for auto-saved draft on mount
  useEffect(() => {
    if (!hasCheckedAutoSave.current && autoSave.hasSavedDraft) {
      hasCheckedAutoSave.current = true;
      setShowRestoreDialog(true);
    }
  }, [autoSave.hasSavedDraft]);
  
  // Handle draft restore
  const handleRestoreDraft = useCallback(() => {
    const draft = autoSave.restoreDraft();
    if (draft) {
      setOption1(draft.option1);
      setOption2(draft.option2);
      setActiveOption(draft.activeOption);
      setCurrentStep(draft.currentStep);
      toast({
        title: "Entwurf wiederhergestellt",
        description: "Deine letzte Konfiguration wurde geladen.",
      });
    }
    setShowRestoreDialog(false);
  }, [autoSave, toast]);
  
  // Handle draft discard
  const handleDiscardDraft = useCallback(() => {
    autoSave.discardDraft();
    setShowRestoreDialog(false);
  }, [autoSave]);
  
  // Auto-save on state changes (debounced in hook)
  useEffect(() => {
    // Only auto-save if user has made some configuration
    if (option1.mobile.tariffId || option2.mobile.tariffId) {
      autoSave.saveDraft({
        option1,
        option2,
        activeOption,
        currentStep,
      });
    }
  }, [option1, option2, activeOption, currentStep, autoSave]);
  
  // Force back to Option 1 if Option 2 is disabled
  useEffect(() => {
    if (!option2Enabled && activeOption === 2) {
      setActiveOption(1);
    }
  }, [option2Enabled, activeOption]);

  // Sync happens automatically via Cloud hooks - no manual scope setting needed

  // Load bundle or template config from route state
  useEffect(() => {
    const state = location.state as { 
      bundleConfig?: Partial<OfferOptionState>; 
      templateConfig?: OfferOptionState;
    } | null;
    
    if (state?.bundleConfig) {
      const merged = { ...createDefaultOptionState(), ...state.bundleConfig };
      setOption1(merged);
      toast({
        title: "Bundle geladen",
        description: "Die Bundle-Konfiguration wurde übernommen.",
      });
    } else if (state?.templateConfig) {
      setOption1(state.templateConfig);
      toast({
        title: "Template geladen",
        description: "Die Template-Konfiguration wurde übernommen.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const activeState = activeOption === 1 ? option1 : option2;
  const setActiveState = activeOption === 1 ? setOption1 : setOption2;

  // Prepare employee options for calculation
  const employeeOptions = useMemo(() => ({
    employeeDeduction: employeeSettings ? {
      deductionValue: employeeSettings.provisionDeduction ?? 0,
      deductionType: (employeeSettings.provisionDeductionType ?? "fixed") as "fixed" | "percentage",
    } : null,
  }), [employeeSettings]);

  // Build push provision context from option state
  const buildPushContext = useCallback((option: OfferOptionState) => ({
    hasHardware: option.hardware.ekNet > 0,
    hardwareEkNet: option.hardware.ekNet,
    hasFixedNet: option.fixedNet.enabled,
    hasGigaKombi: option.fixedNet.enabled && option.mobile.tariffId.toLowerCase().includes("prime"),
    subVariantId: option.mobile.subVariantId,
    quantity: option.mobile.quantity,
    contractType: option.mobile.contractType,
  }), []);

  // Calculate results (memoized) with employee options and push context
  const result1 = useMemo(() => {
    const context = buildPushContext(option1);
    const pushBonus = getBonusAmount(option1.mobile.tariffId, option1.mobile.contractType, 0, context);
    return calculateOffer(option1, { ...employeeOptions, pushBonus });
  }, [option1, employeeOptions, getBonusAmount, buildPushContext]);
  
  const result2 = useMemo(() => {
    const context = buildPushContext(option2);
    const pushBonus = getBonusAmount(option2.mobile.tariffId, option2.mobile.contractType, 0, context);
    return calculateOffer(option2, { ...employeeOptions, pushBonus });
  }, [option2, employeeOptions, getBonusAmount, buildPushContext]);

  // Validation
  const validation = useWizardValidation(activeState);

  // Auto-save to history on step change (only if we have a tariff selected)
  useEffect(() => {
    if (activeState.mobile.tariffId) {
      const result = activeOption === 1 ? result1 : result2;
      addToHistory(activeState, result.totals.avgTermNet, result.dealer.margin);
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load draft/history handler
  const handleLoadConfig = useCallback((config: OfferOptionState) => {
    if (activeOption === 1) {
      setOption1(config);
    } else {
      setOption2(config);
    }
  }, [activeOption]);

  // Handle view mode change with policy checks
  const handleViewModeChange = useCallback((newMode: ViewMode) => {
    // requireConfirmOnDealerSwitch: confirm when switching from customer to dealer
    if (newMode === "dealer" && viewMode === "customer" && policy.requireConfirmOnDealerSwitch) {
      if (!window.confirm("Wechsel in den Händler-Modus?")) {
        return;
      }
    }
    
    // requireCustomerSessionWhenCustomerMode: auto-activate session when switching to customer
    if (newMode === "customer" && policy.requireCustomerSessionWhenCustomerMode && !customerSession.isActive) {
      toggleSession();
      toast({ title: "Kundensitzung aktiviert", description: "Sensible Daten werden ausgeblendet." });
    }
    
    setViewMode(newMode);
  }, [viewMode, policy, customerSession.isActive, toggleSession, toast]);

  // Navigation
  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  // Copy option (blocked if Option 2 disabled)
  const copyOption = (from: 1 | 2, to: 1 | 2) => {
    if (!option2Enabled && to === 2) {
      toast({
        title: "Option 2 nicht verfügbar",
        description: option2Reason,
        variant: "destructive",
      });
      return;
    }
    const source = from === 1 ? option1 : option2;
    const setter = to === 1 ? setOption1 : setOption2;
    setter(JSON.parse(JSON.stringify(source)));
    toast({
      title: "Option kopiert",
      description: `Option ${from} → Option ${to}`,
    });
  };

  const canProceed = validation.canProceed(currentStep);
  const currentValidation = validation.steps[currentStep];

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case "hardware":
        return (
          <HardwareStep
            value={activeState.hardware}
            onChange={(hardware) => setActiveState({ ...activeState, hardware })}
            viewMode={viewMode}
          />
        );
      case "mobile":
        return (
          <MobileStep
            value={activeState.mobile}
            onChange={(mobile) => setActiveState({ ...activeState, mobile })}
            datasetVersion={activeState.meta.datasetVersion}
            fixedNetEnabled={activeState.fixedNet.enabled}
            viewMode={viewMode}
          />
        );
      case "fixedNet":
        return (
          <FixedNetStep
            value={activeState.fixedNet}
            onChange={(fixedNet) => setActiveState({ ...activeState, fixedNet })}
            datasetVersion={activeState.meta.datasetVersion}
          />
        );
      case "compare":
        return (
          <CompareStep
            option1={option1}
            option2={option2}
            result1={result1}
            result2={result2}
            activeOption={activeOption}
            viewMode={viewMode}
            onActiveOptionChange={setActiveOption}
            onViewModeChange={setViewMode}
            onCopyOption={copyOption}
          />
        );
      default:
        return null;
    }
  };

  // Get active result for footer KPI
  const activeResult = activeOption === 1 ? result1 : result2;
  const avgMonthlyNet = activeResult.totals.avgTermNet;

  // Phase 7: Block wizard if tenant data incomplete (only for Supabase auth)
  // Super-Admin (Plattform-Admin) kann die Blockierung umgehen
  const { isAdmin: isSuperAdmin } = useUserRole();
  
  if (isSupabaseAuth && !isSuperAdmin && !isLoadingTenantData && tenantDataStatus && !tenantDataStatus.isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Stammdaten fehlen</CardTitle>
            <CardDescription>
              Um den Kalkulator nutzen zu können, müssen zunächst die Stammdaten gepflegt werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {tenantDataStatus.hasHardware ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>
                  </div>
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <span className={tenantDataStatus.hasHardware ? "text-muted-foreground" : "font-medium"}>
                  Hardware-Katalog ({tenantDataStatus.hardwareCount} Geräte)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {tenantDataStatus.hasProvisions ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>
                  </div>
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <span className={tenantDataStatus.hasProvisions ? "text-muted-foreground" : "font-medium"}>
                  Provisionstabelle ({tenantDataStatus.provisionCount} Einträge)
                </span>
              </div>
            </div>
            <Button asChild className="w-full gap-2">
              <Link to="/tenant-admin">
                <Settings className="w-4 h-4" />
                Zu den Stammdaten
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-background",
      customerSession.isActive && "ring-4 ring-amber-400 ring-inset"
    )}>
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
      
      {/* Onboarding Prompt (first visit) */}
      {tour.shouldShowTour && !tour.isActive && (
        <OnboardingPrompt
          onStart={tour.startTour}
          onDismiss={tour.skipTour}
        />
      )}
      
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0" data-tour="header">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
                Margen<span className="text-primary">Kalkulator</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Konfigurator Modus</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Identity Selector (Dev) - hidden on mobile */}
            <div className="hidden lg:block">
              <IdentitySelector />
            </div>
            
            <div className="hidden lg:block h-6 w-px bg-border" />
            
            {/* Customer Session Toggle - Safety Lock (conditional) */}
            {policy.showCustomerSessionToggle && <CustomerSessionToggle />}
            
            {/* View Mode Toggle with policy */}
            <ViewModeToggle 
              value={viewMode} 
              onChange={handleViewModeChange}
              allowCustomerMode={policy.allowCustomerMode}
            />
            
            {customerSession.isActive && (
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium">
                🔒 <span className="hidden sm:inline">Gesperrt</span>
              </span>
            )}
            
            <div className="h-6 w-px bg-border hidden sm:block" />
            
            {/* Grouped Actions Menu */}
            <ActionMenu 
              config={activeState} 
              avgMonthly={avgMonthlyNet} 
              onLoadConfig={handleLoadConfig} 
            />
            
            <button 
              onClick={() => navigate("/")}
              className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Home className="w-4 h-4" />
              Start
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation - Mobile-optimized */}
      <nav className="bg-card border-b border-border overflow-x-auto">
        <div className="container mx-auto px-2 sm:px-6">
          <div className="flex items-center justify-start sm:justify-center gap-0 sm:gap-2 min-w-max sm:min-w-0">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActiveStep = currentStep === step.id;
              
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  data-tour={`step-${step.id}`}
                  className={`
                    flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium
                    border-b-2 transition-all whitespace-nowrap touch-manipulation
                    min-h-[44px] min-w-[44px]
                    ${isActiveStep
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground active:text-foreground"
                    }
                  `}
                >
                  <Icon className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 lg:px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {currentValidation && !currentValidation.valid && (
            <div className="mb-6 animate-fade-in">
              <ValidationWarning validation={currentValidation} />
            </div>
          )}
          <div className="animate-fade-in">
            {renderStep()}
          </div>
        </div>
      </main>

      {/* Sticky Footer - Mobile-optimized */}
      <footer className="bg-card border-t border-border sticky bottom-0 z-40 shrink-0 safe-area-inset-bottom">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={currentStepIndex === 0}
              className="gap-1 sm:gap-2 min-h-[44px] min-w-[44px] px-2 sm:px-4 touch-manipulation"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Zurück</span>
            </Button>

            {/* Live KPI */}
            <div className="text-center flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                Ø Monatspreis
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {avgMonthlyNet.toFixed(2)} €
              </p>
            </div>

            {currentStepIndex === STEPS.length - 1 ? (
              <Button 
                size="sm"
                onClick={() => window.print()} 
                className="gap-1 sm:gap-2 min-h-[44px] min-w-[44px] px-2 sm:px-4 touch-manipulation"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Drucken</span>
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={goNext} 
                disabled={!canProceed} 
                className="gap-1 sm:gap-2 min-h-[44px] min-w-[44px] px-2 sm:px-4 touch-manipulation"
              >
                <span className="hidden sm:inline">Weiter</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </footer>

      {activeState.mobile.tariffId && (
        <AiConsultant config={activeState} result={activeResult} />
      )}
    </div>
  );
}
