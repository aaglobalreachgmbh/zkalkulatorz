// ============================================
// Admin Setup Wizard
// Pflicht-Ersteinrichtung für neue Admins
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Settings, Package, TrendingUp, Users, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SetupStepProvisions } from "./SetupStepProvisions";
import { SetupStepHardware } from "./SetupStepHardware";
import { SetupStepOnTopRules } from "./SetupStepOnTopRules";
import { SetupStepTeam } from "./SetupStepTeam";
import { SetupComplete } from "./SetupComplete";
import { useUpdateSetupStep, useCompleteSetup } from "@/hooks/useAdminSetupStatus";
import { cn } from "@/lib/utils";

interface AdminSetupWizardProps {
  onComplete: () => void;
}

type SetupStep = "provisions" | "hardware" | "on_top_rules" | "team" | "complete";

interface StepConfig {
  id: SetupStep;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
}

const STEPS: StepConfig[] = [
  {
    id: "provisions",
    title: "Provisionen",
    description: "Konfigurieren Sie die Provisionsstruktur für Ihre Mitarbeiter",
    icon: <TrendingUp className="w-5 h-5" />,
    required: true,
  },
  {
    id: "hardware",
    title: "Hardware-Liste",
    description: "Importieren Sie Ihre aktuelle Hardware-Preisliste",
    icon: <Package className="w-5 h-5" />,
    required: true,
  },
  {
    id: "on_top_rules",
    title: "On-Top-Regeln",
    description: "Definieren Sie zusätzliche Bonus- und Push-Regeln",
    icon: <Settings className="w-5 h-5" />,
    required: true,
  },
  {
    id: "team",
    title: "Team einladen",
    description: "Laden Sie Ihre Mitarbeiter ein (optional)",
    icon: <Users className="w-5 h-5" />,
    required: false,
  },
];

export function AdminSetupWizard({ onComplete }: AdminSetupWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<SetupStep>>(new Set());
  const updateStep = useUpdateSetupStep();
  const completeSetup = useCompleteSetup();

  const currentStep = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / (STEPS.length + 1)) * 100;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleStepComplete = async (stepId: SetupStep) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]));
    
    // Speichere in DB
    await updateStep.mutateAsync({
      step: stepId === "on_top_rules" ? "on_top_rules" : stepId as "provisions" | "hardware" | "team",
      completed: true,
    });
  };

  const handleNext = async () => {
    if (isLastStep) {
      // Setup abschließen
      await completeSetup.mutateAsync();
      setCurrentStepIndex(STEPS.length); // Zeige Complete-Screen
    } else {
      setCurrentStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = async () => {
    // Für optionale Schritte
    if (!currentStep.required) {
      handleNext();
    }
  };

  const handleFinish = () => {
    onComplete();
  };

  // Complete Screen
  if (currentStepIndex >= STEPS.length) {
    return <SetupComplete onFinish={handleFinish} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Ersteinrichtung</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Willkommen im MargenKalkulator
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Bevor Sie starten können, richten wir gemeinsam die wichtigsten Einstellungen für Ihren Shop ein.
          </p>
        </motion.div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Schritt {currentStepIndex + 1} von {STEPS.length}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(progress)}% abgeschlossen
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps Navigation */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = index === currentStepIndex;
            const isPast = index < currentStepIndex;

            return (
              <button
                key={step.id}
                onClick={() => isPast && setCurrentStepIndex(index)}
                disabled={!isPast && !isCurrent}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  isCurrent && "bg-primary text-primary-foreground",
                  isPast && "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer",
                  !isPast && !isCurrent && "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && !isCompleted && "bg-primary-foreground/20",
                  !isCurrent && !isCompleted && "bg-muted-foreground/20"
                )}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Current Step Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {currentStep.icon}
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {currentStep.title}
                      {!currentStep.required && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-normal">
                          Optional
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>{currentStep.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentStep.id === "provisions" && (
                  <SetupStepProvisions 
                    onComplete={() => handleStepComplete("provisions")} 
                    isCompleted={completedSteps.has("provisions")}
                  />
                )}
                {currentStep.id === "hardware" && (
                  <SetupStepHardware 
                    onComplete={() => handleStepComplete("hardware")} 
                    isCompleted={completedSteps.has("hardware")}
                  />
                )}
                {currentStep.id === "on_top_rules" && (
                  <SetupStepOnTopRules 
                    onComplete={() => handleStepComplete("on_top_rules")} 
                    isCompleted={completedSteps.has("on_top_rules")}
                  />
                )}
                {currentStep.id === "team" && (
                  <SetupStepTeam 
                    onComplete={() => handleStepComplete("team")} 
                    isCompleted={completedSteps.has("team")}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Button>

          <div className="flex items-center gap-3">
            {!currentStep.required && (
              <Button variant="ghost" onClick={handleSkip}>
                Überspringen
              </Button>
            )}
            <Button 
              onClick={handleNext} 
              className="gap-2"
              disabled={currentStep.required && !completedSteps.has(currentStep.id)}
            >
              {isLastStep ? "Einrichtung abschließen" : "Weiter"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
