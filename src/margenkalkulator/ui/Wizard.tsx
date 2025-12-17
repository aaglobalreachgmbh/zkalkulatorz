import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, AlertTriangle } from "lucide-react";
import type { OfferOptionState, ViewMode, WizardStep } from "../engine/types";
import { createDefaultOptionState, calculateOffer } from "../engine";
import { useWizardValidation } from "../hooks/useWizardValidation";
import { HardwareStep } from "./steps/HardwareStep";
import { MobileStep } from "./steps/MobileStep";
import { FixedNetStep } from "./steps/FixedNetStep";
import { CompareStep } from "./steps/CompareStep";
import { GlobalControls } from "./components/GlobalControls";
import { ValidationWarning } from "./components/ValidationWarning";
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      {/* Global Controls */}
      <GlobalControls
        activeOption={activeOption}
        onActiveOptionChange={setActiveOption}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showOptionToggle={currentStep !== "compare"}
      />

      {/* Stepper */}
      <nav className="border-b bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto">
            {STEPS.map((step, idx) => {
              const isActive = step.id === currentStep;
              const isPast = idx < currentStepIndex;
              const stepStatus = validation.getStepStatus(step.id);
              const hasIssue = stepStatus === "error" || stepStatus === "warning";

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
                        : hasIssue && !isActive
                          ? "bg-amber-100 text-amber-600"
                          : "bg-muted text-muted-foreground"
                    }
                  `}>
                    {isPast ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : hasIssue && !isActive ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Validation Warning for current step */}
          {(currentValidation.errors.length > 0 || currentValidation.warnings.length > 0) && (
            <ValidationWarning validation={currentValidation} />
          )}
          
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
          
          {/* Dataset Version Footer (Debug) */}
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground/50">
              Dataset: {activeState.meta.datasetVersion}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
