import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Smartphone, Signal, Router, LayoutGrid, Printer, Calculator } from "lucide-react";
import {
  type OfferOptionState,
  type ViewMode,
  type WizardStep,
  createDefaultOptionState,
  calculateOffer,
  useWizardValidation,
} from "@/margenkalkulator";
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
import { addToHistory } from "../storage/history";
import { useToast } from "@/hooks/use-toast";

const STEPS: { id: WizardStep; label: string; icon: typeof Smartphone }[] = [
  { id: "hardware", label: "Hardware", icon: Smartphone },
  { id: "mobile", label: "Mobilfunk", icon: Signal },
  { id: "fixedNet", label: "Festnetz", icon: Router },
  { id: "compare", label: "Vergleich", icon: LayoutGrid },
];

export function Wizard() {
  const { toast } = useToast();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<WizardStep>("hardware");
  const [activeOption, setActiveOption] = useState<1 | 2>(1);
  const [viewMode, setViewMode] = useState<ViewMode>("dealer");
  
  const [option1, setOption1] = useState<OfferOptionState>(createDefaultOptionState);
  const [option2, setOption2] = useState<OfferOptionState>(createDefaultOptionState);

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

  // Calculate results (memoized)
  const result1 = useMemo(() => calculateOffer(option1), [option1]);
  const result2 = useMemo(() => calculateOffer(option2), [option2]);

  // Validation
  const validation = useWizardValidation(activeState);

  // Auto-save to history on step change
  useEffect(() => {
    if (activeState.mobile.tariffId) {
      addToHistory(activeState);
    }
  }, [currentStep, activeState]);

  // Load draft/history handler
  const handleLoadConfig = useCallback((config: OfferOptionState) => {
    if (activeOption === 1) {
      setOption1(config);
    } else {
      setOption2(config);
    }
  }, [activeOption]);

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

  // Copy option
  const copyOption = (from: 1 | 2, to: 1 | 2) => {
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
          />
        );
      case "mobile":
        return (
          <MobileStep
            value={activeState.mobile}
            onChange={(mobile) => setActiveState({ ...activeState, mobile })}
            datasetVersion={activeState.meta.datasetVersion}
            fixedNetEnabled={activeState.fixedNet.enabled}
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
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Header - Enhanced with Gradient */}
      <header className="bg-gradient-to-r from-background to-background/95 border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
              <Calculator className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Margen<span className="text-primary">Kalkulator</span>
              </h1>
              <span className="text-xs text-muted-foreground">Vodafone Business Partner</span>
            </div>
          </div>
          
          {/* Draft/History/Cloud/Template Controls */}
          <div className="flex items-center gap-2">
            <HistoryDropdown onLoadHistory={handleLoadConfig} />
            <DraftManager onLoadDraft={handleLoadConfig} />
            <SaveDraftButton config={activeState} avgMonthly={avgMonthlyNet} />
            <SaveTemplateButton config={activeState} />
            <CloudOfferManager 
              config={activeState} 
              avgMonthly={avgMonthlyNet} 
              onLoadOffer={handleLoadConfig}
            />
          </div>
        </div>
      </header>

      {/* Progress Steps Navigation - Enhanced */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-1">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPast = currentStepIndex > idx;
              const stepNumber = idx + 1;
              
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={`
                    relative flex items-center gap-3 px-6 py-4 text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? "text-primary"
                      : isPast
                        ? "text-emerald-600"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {/* Step indicator */}
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all
                    ${isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : isPast
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }
                  `}>
                    {isPast ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNumber
                    )}
                  </div>
                  
                  {/* Label */}
                  <div className="hidden sm:flex flex-col items-start">
                    <span className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}>
                      {step.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Schritt {stepNumber}
                    </span>
                  </div>
                  
                  {/* Active indicator line */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Validation Warning */}
          {currentValidation && !currentValidation.valid && (
            <div className="mb-6 animate-fade-in">
              <ValidationWarning validation={currentValidation} />
            </div>
          )}

          {/* Step Content */}
          <div className="animate-fade-in">
            {renderStep()}
          </div>
        </div>
      </main>

      {/* Enhanced Sticky Footer with Live-KPI */}
      <footer className="bg-gradient-to-r from-card to-card/95 border-t border-border sticky bottom-0 z-40 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={currentStepIndex === 0}
              className="gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurück
            </Button>

            {/* Live KPI - Enhanced Design */}
            <div className="flex items-center gap-4 px-6 py-2 bg-muted/50 rounded-xl border border-border/50">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Mtl. Ø Kunde</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    {avgMonthlyNet.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">€</span>
                </div>
              </div>
              
              {activeState.mobile.quantity > 1 && (
                <>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Verträge</span>
                    <span className="text-xl font-bold text-primary">
                      x{activeState.mobile.quantity}
                    </span>
                  </div>
                </>
              )}
            </div>

            {currentStepIndex === STEPS.length - 1 ? (
              <Button onClick={() => window.print()} className="gap-2 shadow-md">
                <Printer className="w-4 h-4" />
                Drucken
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!canProceed}
                className="gap-2 shadow-md"
              >
                Weiter
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </footer>

      {/* AI Consultant FAB - only show when mobile tariff is selected */}
      {activeState.mobile.tariffId && (
        <AiConsultant config={activeState} result={activeResult} />
      )}
    </div>
  );
}
