// ============================================
// Onboarding Tour Hook - Phase 4.2
// ============================================

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "marge_onboarding_completed";
const STORAGE_KEY_DISMISSED = "marge_onboarding_dismissed";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Willkommen im MargenKalkulator!",
    description: "Dieser Assistent hilft dir, Angebote schnell und präzise zu kalkulieren. Lass mich dir zeigen, wie es funktioniert.",
    targetSelector: "[data-tour='header']",
    position: "bottom",
  },
  {
    id: "hardware",
    title: "1. Hardware wählen",
    description: "Wähle hier das Gerät für deinen Kunden oder wähle 'SIM-Only' wenn kein Gerät benötigt wird.",
    targetSelector: "[data-tour='step-hardware']",
    position: "bottom",
  },
  {
    id: "mobile",
    title: "2. Mobilfunk konfigurieren",
    description: "Wähle den passenden Tarif, die Variante und Anzahl der Verträge. TeamDeal-Rabatte werden automatisch berechnet.",
    targetSelector: "[data-tour='step-mobile']",
    position: "bottom",
  },
  {
    id: "fixednet",
    title: "3. Festnetz hinzufügen",
    description: "Optional: Füge ein Festnetz-Produkt hinzu und profitiere vom GigaKombi-Vorteil (5€ Rabatt).",
    targetSelector: "[data-tour='step-fixedNet']",
    position: "bottom",
  },
  {
    id: "compare",
    title: "4. Ergebnis prüfen",
    description: "Hier siehst du die Kalkulation aus Kunden- und Händler-Perspektive. Nutze den Toggle um zwischen den Ansichten zu wechseln.",
    targetSelector: "[data-tour='step-compare']",
    position: "bottom",
  },
];

export interface OnboardingTourState {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep | null;
  totalSteps: number;
  progress: number;
}

export interface OnboardingTourActions {
  startTour: () => void;
  endTour: (markComplete?: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  goToStep: (index: number) => void;
}

export interface UseOnboardingTourReturn extends OnboardingTourState, OnboardingTourActions {
  shouldShowTour: boolean;
}

export function useOnboardingTour(): UseOnboardingTourReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Check if tour should be shown (first visit)
  const [shouldShowTour, setShouldShowTour] = useState(false);
  
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    const dismissed = localStorage.getItem(STORAGE_KEY_DISMISSED);
    
    // Show tour if never completed AND not dismissed
    if (!completed && !dismissed) {
      setShouldShowTour(true);
    }
  }, []);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback((markComplete = true) => {
    setIsActive(false);
    setCurrentStepIndex(0);
    if (markComplete) {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      setShouldShowTour(false);
    }
  }, []);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
    localStorage.setItem(STORAGE_KEY_DISMISSED, new Date().toISOString());
    setShouldShowTour(false);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      endTour(true);
    }
  }, [currentStepIndex, endTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < TOUR_STEPS.length) {
      setCurrentStepIndex(index);
    }
  }, []);

  const currentStep = isActive ? TOUR_STEPS[currentStepIndex] : null;
  const totalSteps = TOUR_STEPS.length;
  const progress = isActive ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return {
    isActive,
    currentStepIndex,
    currentStep,
    totalSteps,
    progress,
    shouldShowTour,
    startTour,
    endTour,
    nextStep,
    prevStep,
    skipTour,
    goToStep,
  };
}

// Export steps for testing
export { TOUR_STEPS };
