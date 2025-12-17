import { AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { StepValidation } from "../../hooks/useWizardValidation";

interface ValidationWarningProps {
  validation: StepValidation;
  showSuccess?: boolean;
}

export function ValidationWarning({
  validation,
  showSuccess = false,
}: ValidationWarningProps) {
  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;

  if (!hasErrors && !hasWarnings) {
    if (showSuccess) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Alle Eingaben vollständig
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  }

  if (hasErrors) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1">
            {validation.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <ul className="list-disc list-inside space-y-1">
          {validation.warnings.map((warning, i) => (
            <li key={i}>{warning}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
