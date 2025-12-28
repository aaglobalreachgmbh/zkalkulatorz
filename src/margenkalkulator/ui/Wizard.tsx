import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Smartphone, Signal, Router, LayoutGrid, Printer, Calculator, Home, ChevronLeft, ChevronRight, Lock } from "lucide-react";
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
import { HardwareStep } from "./steps/HardwareStep";
import { MobileStep } from "./steps/MobileStep";
import { FixedNetStep } from "./steps/FixedNetStep";
import { CompareStep } from "./steps/CompareStep";
import { GlobalControls } from "./components/GlobalControls";
import { ValidationWarning } from "./components/ValidationWarning";
import { AiConsultant } from "./components/AiConsultant";
import { SaveDraftButton } from "./components/SaveDraftButton";
import { SaveTemplateButton } from "./components/SaveTemplateButton";
import { DraftManager } from "./components/DraftManager";
import { HistoryDropdown } from "./components/HistoryDropdown";
import { CloudOfferManager } from "./components/CloudOfferManager";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { CustomerSessionToggle } from "./components/CustomerSessionToggle";
import { IdentitySelector } from "./components/IdentitySelector";
import { useHistory } from "../hooks/useHistory";
import { useToast } from "@/hooks/use-toast";
import { useIdentity } from "@/contexts/IdentityContext";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { useEffectivePolicy } from "@/hooks/useEffectivePolicy";
import { useFeature } from "@/hooks/useFeature";
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
  
  // Dataset Versions - Auto-seed if none exist (only for authenticated admins)
  const { versions, isLoading: isLoadingVersions, seedDefaultVersion, isSeeding } = useDatasetVersions();
  const hasSeeded = useRef(false);
  const { canAccessAdmin, isSupabaseAuth } = useIdentity();
  
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

  // Calculate results (memoized) with employee options
  const result1 = useMemo(() => {
    const pushBonus = getBonusAmount(option1.mobile.tariffId, option1.mobile.contractType);
    return calculateOffer(option1, { ...employeeOptions, pushBonus });
  }, [option1, employeeOptions, getBonusAmount]);
  
  const result2 = useMemo(() => {
    const pushBonus = getBonusAmount(option2.mobile.tariffId, option2.mobile.contractType);
    return calculateOffer(option2, { ...employeeOptions, pushBonus });
  }, [option2, employeeOptions, getBonusAmount]);

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

  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-background",
      customerSession.isActive && "ring-4 ring-amber-400 ring-inset"
    )}>
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="container mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Margen<span className="text-primary">Kalkulator</span>
              </h1>
              <p className="text-xs text-muted-foreground">Konfigurator Modus</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Identity Selector (Dev) */}
            <IdentitySelector />
            
            <div className="h-6 w-px bg-border" />
            
            {/* Customer Session Toggle - Safety Lock (conditional) */}
            {policy.showCustomerSessionToggle && <CustomerSessionToggle />}
            
            {/* View Mode Toggle with policy */}
            <ViewModeToggle 
              value={viewMode} 
              onChange={handleViewModeChange}
              allowCustomerMode={policy.allowCustomerMode}
            />
            
            {customerSession.isActive && (
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded text-xs font-medium">
                🔒 Gesperrt
              </span>
            )}
            
            <div className="h-6 w-px bg-border" />
            
            <HistoryDropdown onLoadHistory={handleLoadConfig} />
            <DraftManager onLoadDraft={handleLoadConfig} />
            <SaveDraftButton config={activeState} avgMonthly={avgMonthlyNet} />
            <SaveTemplateButton config={activeState} />
            <CloudOfferManager 
              config={activeState} 
              avgMonthly={avgMonthlyNet} 
              onLoadOffer={handleLoadConfig}
            />
            <button 
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Home className="w-4 h-4" />
              Start
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium
                    border-b-2 transition-all
                    ${isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {step.label}
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

      {/* Sticky Footer */}
      <footer className="bg-card border-t border-border sticky bottom-0 z-40 shrink-0">
        <div className="container mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={currentStepIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </Button>

            {/* Live KPI */}
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Ø Monatspreis (Kunde)
              </p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {avgMonthlyNet.toFixed(2)} €
              </p>
            </div>

            {currentStepIndex === STEPS.length - 1 ? (
              <Button onClick={() => window.print()} className="gap-2">
                <Printer className="w-4 h-4" />
                Drucken
              </Button>
            ) : (
              <Button onClick={goNext} disabled={!canProceed} className="gap-2">
                Nächster Schritt
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
