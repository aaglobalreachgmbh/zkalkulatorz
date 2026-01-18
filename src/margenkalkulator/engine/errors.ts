// ============================================
// Calculation Error Types
// ============================================
//
// Zentrale Fehlertypen für Berechnungen.
// Ermöglicht benutzerfreundliche Fehlermeldungen in der UI.
//
// ============================================

/**
 * Fehlercode für Berechnungsfehler.
 */
export type CalculationErrorCode =
  | "TARIFF_NOT_FOUND"
  | "SUBVARIANT_NOT_FOUND"
  | "PROMO_NOT_FOUND"
  | "PRODUCT_NOT_FOUND"
  | "INVALID_STATE"
  | "CALCULATION_FAILED"
  | "UNKNOWN";

/**
 * Details zu einem Berechnungsfehler.
 */
export type CalculationErrorDetails = {
  code: CalculationErrorCode;
  /** Deutsche Fehlermeldung für UI */
  userMessage: string;
  /** Technische Details für Debugging */
  technicalDetails?: Record<string, unknown>;
};

/**
 * Berechnungsfehler mit benutzerfreundlicher Meldung.
 * 
 * @example
 * throw new CalculationError({
 *   code: "TARIFF_NOT_FOUND",
 *   userMessage: "Der Tarif 'PRIME_M' wurde nicht gefunden.",
 *   technicalDetails: { tariffId: "PRIME_M" }
 * });
 */
export class CalculationError extends Error {
  readonly code: CalculationErrorCode;
  readonly userMessage: string;
  readonly technicalDetails?: Record<string, unknown>;

  constructor(details: CalculationErrorDetails) {
    super(details.userMessage);
    this.name = "CalculationError";
    this.code = details.code;
    this.userMessage = details.userMessage;
    this.technicalDetails = details.technicalDetails;
  }
}

/**
 * Standardfehlermeldungen nach Code.
 */
export const ERROR_MESSAGES: Record<CalculationErrorCode, string> = {
  TARIFF_NOT_FOUND: "Der gewählte Tarif wurde nicht gefunden. Bitte wählen Sie einen gültigen Tarif.",
  SUBVARIANT_NOT_FOUND: "Die gewählte Variante wurde nicht gefunden. Bitte wählen Sie eine gültige Variante.",
  PROMO_NOT_FOUND: "Die gewählte Aktion wurde nicht gefunden.",
  PRODUCT_NOT_FOUND: "Das gewählte Produkt wurde nicht gefunden. Bitte wählen Sie ein gültiges Produkt.",
  INVALID_STATE: "Die Angebotseinstellungen sind ungültig. Bitte überprüfen Sie Ihre Eingaben.",
  CALCULATION_FAILED: "Bei der Berechnung ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
  UNKNOWN: "Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite neu.",
};

/**
 * Hilfsfunktion zum Erstellen eines Berechnungsfehlers.
 */
export function createCalculationError(
  code: CalculationErrorCode,
  customMessage?: string,
  technicalDetails?: Record<string, unknown>
): CalculationError {
  return new CalculationError({
    code,
    userMessage: customMessage ?? ERROR_MESSAGES[code],
    technicalDetails,
  });
}
