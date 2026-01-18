// ============================================
// Wizard Progress Indicator
// 3-Step visual progress for first-5-seconds clarity
// ============================================

import { Check, Smartphone, Signal, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  /** Current step: 1=Hardware, 2=Tarif, 3=Angebot */
  currentStep: 1 | 2 | 3;
  /** Whether hardware was selected (to highlight step 1) */
  hasHardware?: boolean;
  /** Whether tariff was selected (to highlight step 2) */
  hasTariff?: boolean;
  /** Whether offer basket has items (to highlight step 3) */
  hasOffer?: boolean;
  /** Click handler for step navigation */
  onStepClick?: (step: 1 | 2 | 3) => void;
  className?: string;
}

const STEPS = [
  { step: 1 as const, label: "Hardware", shortLabel: "1", icon: Smartphone },
  { step: 2 as const, label: "Tarif", shortLabel: "2", icon: Signal },
  { step: 3 as const, label: "Angebot", shortLabel: "3", icon: FileText },
];

export function WizardProgress({
  currentStep,
  hasHardware = false,
  hasTariff = false,
  hasOffer = false,
  onStepClick,
  className,
}: WizardProgressProps) {
  const getStepStatus = (step: 1 | 2 | 3) => {
    if (step === 1) return hasHardware ? "complete" : currentStep === 1 ? "current" : "pending";
    if (step === 2) return hasTariff ? "complete" : currentStep === 2 ? "current" : "pending";
    if (step === 3) return hasOffer ? "complete" : currentStep === 3 ? "current" : "pending";
    return "pending";
  };

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 mb-1">
        Schritt {currentStep} von {STEPS.length}
      </div>
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {STEPS.map((s, idx) => {
          const status = getStepStatus(s.step);
          const isClickable = onStepClick && status !== "pending";
          const Icon = s.icon;

          return (
            <div key={s.step} className="flex items-center">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick?.(s.step)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all",
                  status === "complete" && "bg-primary/10 text-primary hover:bg-primary/20",
                  status === "current" && "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/20 ring-offset-2 scale-105",
                  status === "pending" && "bg-muted text-muted-foreground",
                  isClickable && "cursor-pointer hover:scale-105 active:scale-95",
                  !isClickable && status === "pending" && "cursor-default opacity-60"
                )}
              >
                {status === "complete" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.shortLabel}</span>
              </button>

              {/* Connector Line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-4 sm:w-8 h-0.5 mx-1",
                    status === "complete" ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
