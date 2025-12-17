import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { OfferOptionState, ViewMode, WizardStep, CalculationResult } from "../engine/types";
import { createDefaultOptionState, calculateOffer } from "../engine";
import { HardwareStep } from "./steps/HardwareStep";
import { MobileStep } from "./steps/MobileStep";
import { FixedNetStep } from "./steps/FixedNetStep";
import { CompareStep } from "./steps/CompareStep";

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "hardware", label: "Hardware" },
  { id: "mobile", label: "Mobilfunk" },
  { id: "fixedNet", label: "Festnetz" },
  { id: "compare", label: "Vergleich" },
];

export function Wizard() {
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
  const validateStep = useCallback((step: WizardStep): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (step === "mobile") {
      if (!activeState.mobile.tariffId) {
        errors.push("Bitte wählen Sie einen Tarif");
      }
    }
    
    return { valid: errors.length === 0, errors };
  }, [activeState]);

  const canProceed = validateStep(currentStep).valid;

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
  };

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
          />
        );
      case "fixedNet":
        return (
          <FixedNetStep
            value={activeState.fixedNet}
            onChange={(fixedNet) => setActiveState({ ...activeState, fixedNet })}
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-foreground">
            MargenKalkulator Vodafone
          </h1>
          <p className="text-sm text-muted-foreground">
            allenetze.de – Angebots- und Margenkalkulation
          </p>
        </div>
      </header>

      {/* Stepper */}
      <nav className="border-b bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto">
            {STEPS.map((step, idx) => {
              const isActive = step.id === currentStep;
              const isPast = idx < currentStepIndex;
              const isFuture = idx > currentStepIndex;

              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-colors whitespace-nowrap
                    ${isActive 
                      ? "bg-primary text-primary-foreground" 
                      : isPast 
                        ? "bg-primary/10 text-primary hover:bg-primary/20" 
                        : "text-muted-foreground hover:bg-muted"
                    }
                  `}
                >
                  <span className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs
                    ${isActive 
                      ? "bg-primary-foreground text-primary" 
                      : isPast 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    }
                  `}>
                    {isPast ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </span>
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Active Option Indicator (for non-compare steps) */}
      {currentStep !== "compare" && (
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Bearbeite:</span>
            <div className="flex gap-2">
              <Button
                variant={activeOption === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveOption(1)}
              >
                Option 1
              </Button>
              <Button
                variant={activeOption === 2 ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveOption(2)}
              >
                Option 2
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {renderStep()}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="border-t bg-card sticky bottom-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>

            <div className="text-sm text-muted-foreground">
              Schritt {currentStepIndex + 1} von {STEPS.length}
            </div>

            <Button
              onClick={goNext}
              disabled={currentStepIndex === STEPS.length - 1 || !canProceed}
            >
              Weiter
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
