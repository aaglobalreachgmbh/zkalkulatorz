// ============================================
// Onboarding Tour Component - Phase 4.2
// Spotlight-based tour overlay
// ============================================

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TourStep } from "@/hooks/useOnboardingTour";

interface OnboardingTourProps {
  isActive: boolean;
  currentStep: TourStep | null;
  currentStepIndex: number;
  totalSteps: number;
  progress: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onEnd: () => void;
}

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingTour({
  isActive,
  currentStep,
  currentStepIndex,
  totalSteps,
  progress,
  onNext,
  onPrev,
  onSkip,
  onEnd,
}: OnboardingTourProps) {
  const [spotlight, setSpotlight] = useState<SpotlightPosition | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // Calculate spotlight position
  const updateSpotlight = useCallback(() => {
    if (!currentStep) {
      setSpotlight(null);
      return;
    }

    const element = document.querySelector(currentStep.targetSelector);
    if (!element) {
      // Fallback: center of screen
      setSpotlight({
        top: window.innerHeight / 2 - 50,
        left: window.innerWidth / 2 - 100,
        width: 200,
        height: 100,
      });
      setTooltipStyle({
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = 8;

    setSpotlight({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position
    const position = currentStep.position || "bottom";
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const gap = 16;

    let top = 0;
    let left = 0;

    switch (position) {
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "top":
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
    }

    // Keep within viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

    setTooltipStyle({
      top: `${top}px`,
      left: `${left}px`,
    });
  }, [currentStep]);

  // Update on step change or resize
  useEffect(() => {
    if (!isActive) return;

    updateSpotlight();

    const handleResize = () => updateSpotlight();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, [isActive, updateSpotlight]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onSkip();
          break;
        case "ArrowRight":
        case "Enter":
          onNext();
          break;
        case "ArrowLeft":
          onPrev();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onNext, onPrev, onSkip]);

  if (!isActive || !currentStep) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return createPortal(
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      {/* Backdrop with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
          className="pointer-events-auto"
          onClick={onSkip}
        />
      </svg>

      {/* Spotlight border glow */}
      {spotlight && (
        <div
          className="absolute rounded-lg ring-4 ring-primary/50 pointer-events-none animate-pulse"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute w-80 max-w-[calc(100vw-32px)] bg-card border border-border rounded-xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden"
        style={tooltipStyle}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Schritt {currentStepIndex + 1} von {totalSteps}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2 -mt-2"
            onClick={onSkip}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-1 mb-4" />

        {/* Content */}
        <h3 className="text-lg font-semibold mb-2">{currentStep.title}</h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          {currentStep.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-muted-foreground shrink-0"
          >
            Überspringen
          </Button>

          <div className="flex items-center gap-2 shrink-0">
            {!isFirstStep && (
              <Button variant="outline" size="sm" onClick={onPrev} className="shrink-0">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Zurück
              </Button>
            )}
            <Button size="sm" onClick={onNext} className="shrink-0">
              {isLastStep ? (
                "Fertig!"
              ) : (
                <>
                  Weiter
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Welcome prompt component
interface OnboardingPromptProps {
  onStart: () => void;
  onDismiss: () => void;
}

export function OnboardingPrompt({ onStart, onDismiss }: OnboardingPromptProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl p-5 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">Erste Schritte</h3>
          <p className="text-sm text-muted-foreground">
            Möchtest du eine kurze Einführung in den MargenKalkulator?
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDismiss} className="flex-1">
          Später
        </Button>
        <Button size="sm" onClick={onStart} className="flex-1">
          Tour starten
        </Button>
      </div>
    </div>
  );
}
