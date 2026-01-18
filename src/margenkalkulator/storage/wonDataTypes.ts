// ============================================
// Won Offer Data Types - Backoffice-Übergabe
// Phase 4: Won-Datenaufnahme
// ============================================

/**
 * Legal form types for German companies
 */
export type LegalForm = 
  | "Einzelunternehmen"
  | "GbR"
  | "OHG"
  | "KG"
  | "GmbH"
  | "UG"
  | "AG"
  | "eG"
  | "e.V."
  | "Freiberufler"
  | "Sonstige";

/**
 * Register types
 */
export type RegisterType = "HRA" | "HRB" | "VR" | "PR" | "GnR" | "Keine";

/**
 * SIM type options
 */
export type SimType = "eSIM" | "TripleSIM" | "MultiSIM";

/**
 * Salutation options
 */
export type Salutation = "Herr" | "Frau" | "Divers" | "Firma";

/**
 * Company data for won offer
 */
export interface WonCompanyData {
  /** Company name */
  name: string;
  /** Legal form */
  legalForm: LegalForm;
  /** Register type (HRB, HRA, etc.) */
  registerType?: RegisterType;
  /** Register number */
  registerNumber?: string;
  /** Register place (Amtsgericht) */
  registerPlace?: string;
  /** Tax ID (Steuernummer) */
  taxId?: string;
  /** VAT ID (USt-IdNr.) */
  vatId?: string;
}

/**
 * Contact person data
 */
export interface WonContactData {
  /** Salutation */
  salutation: Salutation;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone?: string;
  /** Mobile number */
  mobile?: string;
  /** Position/Title */
  position?: string;
}

/**
 * Billing address
 */
export interface WonBillingAddress {
  /** Street name */
  street: string;
  /** House number */
  houseNumber: string;
  /** Additional address line */
  addressLine2?: string;
  /** ZIP code */
  zipCode: string;
  /** City */
  city: string;
  /** Country (default: Deutschland) */
  country: string;
}

/**
 * Payment data (SEPA)
 */
export interface WonPaymentData {
  /** IBAN */
  iban: string;
  /** BIC (optional, can be derived from IBAN) */
  bic?: string;
  /** Account holder name */
  accountHolder: string;
  /** Bank name */
  bankName?: string;
  /** SEPA mandate accepted */
  sepaMandateAccepted: boolean;
  /** SEPA mandate date */
  sepaMandateDate?: string;
}

/**
 * SIM and number options
 */
export interface WonSimOptions {
  /** SIM type */
  type: SimType;
  /** Quantity */
  quantity: number;
  /** Wunschrufnummer (desired phone number) */
  wunschrufnummer?: string;
  /** Wunschrufnummer disclaimer accepted */
  wunschrufnummerDisclaimer: boolean;
  /** Port existing number (Rufnummernmitnahme) */
  portNumber?: boolean;
  /** Existing number to port */
  existingNumber?: string;
  /** Current provider */
  currentProvider?: string;
}

/**
 * Complete won offer data
 */
export interface WonOfferData {
  /** Offer ID reference */
  offerId: string;
  /** Tenant ID */
  tenantId: string;
  /** Captured at timestamp */
  capturedAt: string;
  /** Captured by user ID */
  capturedBy: string;
  
  // Company data
  company: WonCompanyData;
  
  // Contact person
  contact: WonContactData;
  
  // Billing address
  billingAddress: WonBillingAddress;
  
  // Payment data (optional - can be added later)
  payment?: WonPaymentData;
  
  // SIM options
  simOptions: WonSimOptions;
  
  // Customer password (for Vodafone portal)
  customerPassword?: string;
  
  // Internal notes
  internalNotes?: string;
  
  // Status
  status: "draft" | "complete" | "submitted";
  
  // Submission tracking
  submittedAt?: string;
  submittedBy?: string;
}

/**
 * Default values for new won offer data
 */
export const DEFAULT_WON_OFFER_DATA: Omit<WonOfferData, "offerId" | "tenantId" | "capturedAt" | "capturedBy"> = {
  company: {
    name: "",
    legalForm: "GmbH",
  },
  contact: {
    salutation: "Herr",
    firstName: "",
    lastName: "",
    email: "",
  },
  billingAddress: {
    street: "",
    houseNumber: "",
    zipCode: "",
    city: "",
    country: "Deutschland",
  },
  simOptions: {
    type: "TripleSIM",
    quantity: 1,
    wunschrufnummerDisclaimer: false,
  },
  status: "draft",
};

/**
 * Form validation result
 */
export interface WonDataValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

/**
 * Validates won offer data
 */
export function validateWonOfferData(data: Partial<WonOfferData>): WonDataValidation {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  
  // Company validation
  if (!data.company?.name?.trim()) {
    errors["company.name"] = "Firmenname ist erforderlich";
  }
  
  // Contact validation
  if (!data.contact?.firstName?.trim()) {
    errors["contact.firstName"] = "Vorname ist erforderlich";
  }
  if (!data.contact?.lastName?.trim()) {
    errors["contact.lastName"] = "Nachname ist erforderlich";
  }
  if (!data.contact?.email?.trim()) {
    errors["contact.email"] = "E-Mail ist erforderlich";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.email)) {
    errors["contact.email"] = "Ungültige E-Mail-Adresse";
  }
  
  // Address validation
  if (!data.billingAddress?.street?.trim()) {
    errors["billingAddress.street"] = "Straße ist erforderlich";
  }
  if (!data.billingAddress?.zipCode?.trim()) {
    errors["billingAddress.zipCode"] = "PLZ ist erforderlich";
  } else if (!/^\d{5}$/.test(data.billingAddress.zipCode)) {
    errors["billingAddress.zipCode"] = "PLZ muss 5 Ziffern haben";
  }
  if (!data.billingAddress?.city?.trim()) {
    errors["billingAddress.city"] = "Ort ist erforderlich";
  }
  
  // Payment validation (optional but if provided must be complete)
  if (data.payment?.iban) {
    // Basic IBAN format check
    const ibanClean = data.payment.iban.replace(/\s/g, "").toUpperCase();
    if (!/^DE\d{20}$/.test(ibanClean)) {
      errors["payment.iban"] = "Ungültige deutsche IBAN";
    }
    if (!data.payment.accountHolder?.trim()) {
      errors["payment.accountHolder"] = "Kontoinhaber ist erforderlich";
    }
  }
  
  // SIM options
  if (data.simOptions?.wunschrufnummer && !data.simOptions.wunschrufnummerDisclaimer) {
    warnings["simOptions.wunschrufnummer"] = "Hinweis: Wunschrufnummer ist nicht garantiert";
  }
  
  // Register warnings
  if (data.company?.legalForm && ["GmbH", "UG", "AG"].includes(data.company.legalForm)) {
    if (!data.company.registerNumber) {
      warnings["company.registerNumber"] = "Handelsregisternummer empfohlen";
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Formats IBAN for display
 */
export function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, "").toUpperCase();
  return clean.match(/.{1,4}/g)?.join(" ") ?? clean;
}

/**
 * Legal form options for dropdown
 */
export const LEGAL_FORM_OPTIONS: Array<{ value: LegalForm; label: string }> = [
  { value: "Einzelunternehmen", label: "Einzelunternehmen" },
  { value: "Freiberufler", label: "Freiberufler" },
  { value: "GbR", label: "GbR (Gesellschaft bürgerlichen Rechts)" },
  { value: "OHG", label: "OHG (Offene Handelsgesellschaft)" },
  { value: "KG", label: "KG (Kommanditgesellschaft)" },
  { value: "GmbH", label: "GmbH (Gesellschaft mit beschränkter Haftung)" },
  { value: "UG", label: "UG (haftungsbeschränkt)" },
  { value: "AG", label: "AG (Aktiengesellschaft)" },
  { value: "eG", label: "eG (eingetragene Genossenschaft)" },
  { value: "e.V.", label: "e.V. (eingetragener Verein)" },
  { value: "Sonstige", label: "Sonstige" },
];

/**
 * Register type options
 */
export const REGISTER_TYPE_OPTIONS: Array<{ value: RegisterType; label: string }> = [
  { value: "Keine", label: "Kein Eintrag" },
  { value: "HRB", label: "HRB (Handelsregister B)" },
  { value: "HRA", label: "HRA (Handelsregister A)" },
  { value: "VR", label: "VR (Vereinsregister)" },
  { value: "PR", label: "PR (Partnerschaftsregister)" },
  { value: "GnR", label: "GnR (Genossenschaftsregister)" },
];

/**
 * SIM type options
 */
export const SIM_TYPE_OPTIONS: Array<{ value: SimType; label: string; description: string }> = [
  { value: "TripleSIM", label: "Triple-SIM", description: "Standard SIM, Micro-SIM und Nano-SIM in einem" },
  { value: "eSIM", label: "eSIM", description: "Digitale SIM, direkt auf dem Gerät aktivierbar" },
  { value: "MultiSIM", label: "MultiSIM", description: "Zusätzliche SIM für weiteres Gerät" },
];
