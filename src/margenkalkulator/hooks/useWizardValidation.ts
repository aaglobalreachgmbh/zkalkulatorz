import { useMemo } from "react";
import type { OfferOptionState, WizardStep } from "../engine/types";

export type StepValidation = {
  step: WizardStep;
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type ValidationResult = {
  steps: Record<WizardStep, StepValidation>;
  canProceed: (step: WizardStep) => boolean;
  getStepStatus: (step: WizardStep) => "valid" | "warning" | "error";
  isCompareReady: boolean;
};

export function useWizardValidation(
  activeState: OfferOptionState
): ValidationResult {
  const steps = useMemo(() => {
    const result: Record<WizardStep, StepValidation> = {
      hardware: validateHardwareStep(activeState),
      mobile: validateMobileStep(activeState),
      fixedNet: validateFixedNetStep(activeState),
      compare: validateCompareStep(activeState),
    };
    return result;
  }, [activeState]);

  const canProceed = (step: WizardStep): boolean => {
    return steps[step].valid;
  };

  const getStepStatus = (step: WizardStep): "valid" | "warning" | "error" => {
    const validation = steps[step];
    if (validation.errors.length > 0) return "error";
    if (validation.warnings.length > 0) return "warning";
    return "valid";
  };

  const isCompareReady = steps.mobile.valid;

  return { steps, canProceed, getStepStatus, isCompareReady };
}

function validateHardwareStep(state: OfferOptionState): StepValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Hardware is optional, but if ekNet is set, name should be set
  if (state.hardware.ekNet > 0 && !state.hardware.name.trim()) {
    warnings.push("Name fehlt");
  }

  if (state.hardware.amortize && state.hardware.amortMonths < 1) {
    errors.push("Amortisierung min. 1 Monat");
  }

  return { step: "hardware", valid: errors.length === 0, errors, warnings };
}

function validateMobileStep(state: OfferOptionState): StepValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!state.mobile.tariffId) {
    errors.push("Tarif wählen");
  }

  if (!state.mobile.subVariantId) {
    errors.push("Variante wählen");
  }

  if (state.mobile.quantity < 1) {
    errors.push("Min. 1 Vertrag");
  }

  return { step: "mobile", valid: errors.length === 0, errors, warnings };
}

function validateFixedNetStep(state: OfferOptionState): StepValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (state.fixedNet.enabled && !state.fixedNet.productId) {
    errors.push("Produkt wählen");
  }

  return { step: "fixedNet", valid: errors.length === 0, errors, warnings };
}

function validateCompareStep(state: OfferOptionState): StepValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Compare needs at least mobile to be configured
  if (!state.mobile.tariffId) {
    warnings.push("Mobilfunk fehlt");
  }

  return { step: "compare", valid: true, errors, warnings };
}

// Pure validation functions for testing
export const validationRules = {
  validateHardwareStep,
  validateMobileStep,
  validateFixedNetStep,
  validateCompareStep,
};
