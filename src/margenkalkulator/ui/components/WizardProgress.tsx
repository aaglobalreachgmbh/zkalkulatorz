// ============================================
// Enterprise Wizard Progress Indicator
// Atlassian/HubSpot/Salesforce-style horizontal stepper
// ============================================

import { Check, Smartphone, Signal, FileText, ChevronRight } from "lucide-react";
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
  { step: 1 as const, label: "Hardware", shortLabel: "Gerät", icon: Smartphone },
  { step: 2 as const, label: "Tarif", shortLabel: "Tarif", icon: Signal },
  { step: 3 as const, label: "Angebot", shortLabel: "Warenkorb", icon: FileText },
];

export function WizardProgress({
  currentStep,
  hasHardware = false,
  hasTariff = false,
  hasOffer = false,
  onStepClick,
  className,
}: WizardProgressProps) {
  const getStepStatus = (step: 1 | 2 | 3): "complete" | "current" | "pending" => {
    if (step === 1) return hasHardware ? "complete" : currentStep === 1 ? "current" : "pending";
    if (step === 2) return hasTariff ? "complete" : currentStep === 2 ? "current" : "pending";
    if (step === 3) return hasOffer ? "complete" : currentStep === 3 ? "current" : "pending";
    return "pending";
  };

  return (
    <nav aria-label="Progress" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-0">
        {STEPS.map((s, idx) => {
          const status = getStepStatus(s.step);
          const isClickable = onStepClick && (status === "complete" || status === "current");
          const Icon = s.icon;

          return (
            <li key={s.step} className="flex items-center">
              {/* Step Circle + Label */}
              <button
                onClick={() => isClickable && onStepClick?.(s.step)}
                disabled={!isClickable}
                className={cn(
                  "group flex items-center gap-2 py-1 px-2 sm:px-3 rounded-lg transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
                  isClickable && "cursor-pointer hover:bg-muted/80",
                  !isClickable && status === "pending" && "cursor-default"
                )}
              >
                {/* Step Number/Check Circle */}
                <span
                  className={cn(
                    "flex items-center justify-center transition-all duration-200",
                    // Sizes
                    "w-7 h-7 rounded-full text-xs font-semibold",
                    // Complete state: Primary checkmark
                    status === "complete" && "bg-primary text-primary-foreground",
                    // Current state: Primary ring with white/dark bg
                    status === "current" && [
                      "bg-primary text-primary-foreground",
                      "ring-4 ring-primary/20"
                    ],
                    // Pending state: Muted
                    status === "pending" && "bg-muted text-muted-foreground/60"
                  )}
                >
                  {status === "complete" ? (
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </span>

                {/* Label */}
                <span
                  className={cn(
                    "text-sm font-medium transition-colors hidden sm:block",
                    status === "complete" && "text-foreground",
                    status === "current" && "text-foreground",
                    status === "pending" && "text-muted-foreground/60"
                  )}
                >
                  {s.label}
                </span>
              </button>

              {/* Connector Arrow */}
              {idx < STEPS.length - 1 && (
                <ChevronRight
                  className={cn(
                    "w-4 h-4 mx-1 flex-shrink-0 transition-colors",
                    status === "complete" && "text-primary",
                    status !== "complete" && "text-muted-foreground/30"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
