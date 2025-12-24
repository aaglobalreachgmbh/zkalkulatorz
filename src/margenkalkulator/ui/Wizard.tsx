import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, AlertTriangle, Database, Calculator } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "hardware", label: "Hardware" },
  { id: "mobile", label: "Mobilfunk" },
  { id: "fixedNet", label: "Festnetz" },
  { id: "compare", label: "Vergleich" },
];

export function Wizard() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<WizardStep>("hardware");
  const [activeOption, setActiveOption] = useState<1 | 2>(1);
  const [viewMode, setViewMode] = useState<ViewMode>("dealer");
  
  const [option1, setOption1] = useState<OfferOptionState>(createDefaultOptionState);
  const [option2, setOption2] = useState<OfferOptionState>(createDefaultOptionState);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const activeState = activeOption === 1 ? option1 : option2;
  const setActiveState = activeOption === 1 ? setOption1 : setOption2;

  // Calculate results (memoized)
  const result1 = useMemo(() => calculateOffer(option1), [option1]);
  const result2 = useMemo(() => calculateOffer(option2), [option2]);

  // Validation
  const validation = useWizardValidation(activeState);

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
    <div className="min-h-screen flex flex-col">
      {/* Header with glassmorphism */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Margen<span className="text-primary">Kalkulator</span>
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Vodafone Business Partner</p>
            </div>
          </div>
          <a href="/data-manager" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Data Manager →
          </a>
        </div>
      </header>

      {/* Global Controls */}
      <div className="border-b border-border/30 bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <GlobalControls
            activeOption={activeOption}
            onActiveOptionChange={setActiveOption}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      {/* Stepper Navigation with pill-style buttons */}
      <nav className="border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2 md:gap-3">
            {STEPS.map((step, idx) => {
              const stepValidation = validation.steps[step.id];
              const isActive = currentStep === step.id;
              const isPast = idx < currentStepIndex;
              const hasError = stepValidation && !stepValidation.valid && isPast;

              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={`
                    relative px-4 py-2.5 rounded-full text-sm font-medium
                    transition-all duration-200 ease-out cursor-pointer
                    ${isActive
                      ? "bg-primary text-primary-foreground shadow-card scale-105"
                      : isPast
                        ? hasError
                          ? "bg-destructive/15 text-destructive hover:bg-destructive/20"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span className={`
                      w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold
                      ${isActive 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : isPast 
                          ? hasError 
                            ? "bg-destructive/20 text-destructive" 
                            : "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }
                    `}>
                      {idx + 1}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </span>
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

          {/* Step Content in glass card */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-card border border-border/50 p-6 md:p-8 animate-fade-in-up">
            {renderStep()}
          </div>
        </div>
      </main>

      {/* Footer with glassmorphism and Live-KPI */}
      <footer className="border-t border-border/50 bg-card/80 backdrop-blur-md sticky bottom-0 z-40 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStepIndex === 0}
            className="rounded-xl"
          >
            ← Zurück
          </Button>

          {/* Live KPI - Customer Average Monthly */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Mtl. Ø (Kunde)</span>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-foreground">
                {avgMonthlyNet.toFixed(2)} €
              </span>
              {activeState.mobile.quantity > 1 && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  x{activeState.mobile.quantity}
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={goNext}
            disabled={currentStepIndex === STEPS.length - 1 || !canProceed}
            className="rounded-xl shadow-soft"
          >
            Weiter →
          </Button>
        </div>
      </footer>

      {/* AI Consultant FAB - only show when mobile tariff is selected */}
      {activeState.mobile.tariffId && (
        <AiConsultant config={activeState} result={activeResult} />
      )}
    </div>
  );
}