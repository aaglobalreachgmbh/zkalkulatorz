// ============================================
// Mocca/MoCare Import Schema with German Formats
// ============================================

import { z } from "zod";

// ============================================
// German Format Parsers
// ============================================

/**
 * Parse German number format: "1.234,56" → 1234.56
 */
export function parseGermanNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  if (typeof value === "number") {
    return isNaN(value) ? null : value;
  }
  
  const str = String(value).trim();
  if (!str) return null;
  
  // Remove thousand separators (.) and replace decimal comma with point
  const normalized = str
    .replace(/\./g, "")  // Remove thousand separators
    .replace(",", ".");   // Replace decimal comma
  
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

/**
 * Parse German date format: "31.12.2025" → "2025-12-31"
 */
export function parseGermanDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  const str = String(value).trim();
  if (!str) return null;
  
  // Match DD.MM.YYYY format
  const match = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const paddedDay = day.padStart(2, "0");
    const paddedMonth = month.padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
  
  // Already ISO format?
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  
  return null;
}

/**
 * Sanitize text input - remove control characters, trim
 */
export function sanitizeText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  
  return String(value)
    .trim()
    // Remove control characters except newlines
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Normalize whitespace
    .replace(/\s+/g, " ");
}

/**
 * Validate Mocca customer number: 9-10 digits
 */
function isValidMoccaNumber(value: string): boolean {
  return /^\d{9,10}$/.test(value);
}

// ============================================
// Zod Schemas
// ============================================

/**
 * Schema for a single Mocca customer row
 */
export const MoccaCustomerRowSchema = z.object({
  // Required fields
  kundennummer: z.string()
    .transform(sanitizeText)
    .refine(isValidMoccaNumber, {
      message: "Kundennummer muss 9-10 Ziffern haben",
    }),
  
  firmenname: z.string()
    .transform(sanitizeText)
    .refine((v) => v.length >= 2, {
      message: "Firmenname muss mindestens 2 Zeichen haben",
    }),
  
  // Optional fields
  ansprechpartner: z.string().optional().transform((v) => v ? sanitizeText(v) : undefined),
  email: z.string().email().optional().or(z.literal("")),
  telefon: z.string().optional().transform((v) => v ? sanitizeText(v) : undefined),
  branche: z.string().optional().transform((v) => v ? sanitizeText(v) : undefined),
  notizen: z.string().optional().transform((v) => v ? sanitizeText(v) : undefined),
  
  // External refs (optional, from Mocca/MoCare)
  vertragsnummer: z.string().optional().transform((v) => v ? sanitizeText(v) : undefined),
  kundenstatus: z.string().optional().transform((v) => v ? sanitizeText(v) : undefined),
  letzte_bestellung: z.string().optional().transform((v) => v ? parseGermanDate(v) : undefined),
  umsatz: z.unknown().optional().transform((v) => parseGermanNumber(v)),
});

export type MoccaCustomerRow = z.infer<typeof MoccaCustomerRowSchema>;

/**
 * Schema for the complete import
 */
export const MoccaImportSchema = z.object({
  rows: z.array(MoccaCustomerRowSchema).min(1, {
    message: "Mindestens eine Zeile erforderlich",
  }),
  sourceType: z.enum(["mocca", "mocare", "custom"]).default("mocca"),
});

export type MoccaImport = z.infer<typeof MoccaImportSchema>;

// ============================================
// Validation Functions
// ============================================

export interface ValidationResult {
  isValid: boolean;
  validRows: MoccaCustomerRow[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
}

/**
 * Validate a batch of Mocca import rows
 */
export function validateMoccaImport(
  rows: Record<string, unknown>[],
  columnMapping: Record<string, string>
): ValidationResult {
  const validRows: MoccaCustomerRow[] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const seenCustomerNumbers = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 1;
    const rawRow = rows[i];
    
    // Apply column mapping
    const mappedRow: Record<string, unknown> = {};
    for (const [sourceCol, targetField] of Object.entries(columnMapping)) {
      if (targetField && rawRow[sourceCol] !== undefined) {
        mappedRow[targetField] = rawRow[sourceCol];
      }
    }
    
    // Validate with Zod
    const result = MoccaCustomerRowSchema.safeParse(mappedRow);
    
    if (result.success) {
      // Check for duplicates
      if (seenCustomerNumbers.has(result.data.kundennummer)) {
        warnings.push({
          row: rowNum,
          field: "kundennummer",
          message: `Duplikat: Kundennummer ${result.data.kundennummer} bereits in dieser Import-Datei`,
        });
      } else {
        seenCustomerNumbers.add(result.data.kundennummer);
        validRows.push(result.data);
      }
    } else {
      // Collect errors
      for (const issue of result.error.issues) {
        errors.push({
          row: rowNum,
          field: issue.path.join("."),
          message: issue.message,
          value: mappedRow[issue.path[0] as string],
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    validRows,
    errors,
    warnings,
  };
}

// ============================================
// Auto-Detection for Column Mapping
// ============================================

const KNOWN_COLUMN_MAPPINGS: Record<string, string[]> = {
  kundennummer: [
    "kundennummer", "kunden-nr", "kunden_nr", "kundennr", "customer_number",
    "customer_id", "mocca_nr", "mocca_nummer", "kd-nr", "kdnr",
  ],
  firmenname: [
    "firmenname", "firma", "company", "company_name", "name", "unternehmensname",
    "kundenname", "geschäftsname", "business_name",
  ],
  ansprechpartner: [
    "ansprechpartner", "kontakt", "contact", "contact_name", "kontaktperson",
    "ap", "verantwortlicher",
  ],
  email: [
    "email", "e-mail", "mail", "e_mail", "email_address", "emailadresse",
  ],
  telefon: [
    "telefon", "telefonnummer", "phone", "tel", "phone_number", "rufnummer",
    "festnetz", "mobil", "handy",
  ],
  branche: [
    "branche", "industry", "sektor", "geschäftsbereich", "bereich",
  ],
  notizen: [
    "notizen", "notes", "bemerkung", "kommentar", "comment", "anmerkung",
  ],
  vertragsnummer: [
    "vertragsnummer", "vertrag", "contract", "contract_number", "vt-nr",
  ],
  kundenstatus: [
    "status", "kundenstatus", "customer_status", "zustand",
  ],
  umsatz: [
    "umsatz", "revenue", "jahresumsatz", "annual_revenue", "sales",
  ],
};

/**
 * Auto-detect column mapping based on column names
 */
export function autoDetectColumnMapping(
  sourceColumns: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  for (const sourceCol of sourceColumns) {
    const normalizedSource = sourceCol.toLowerCase().trim().replace(/[\s-]/g, "_");
    
    for (const [targetField, aliases] of Object.entries(KNOWN_COLUMN_MAPPINGS)) {
      if (aliases.some((alias) => normalizedSource.includes(alias) || alias.includes(normalizedSource))) {
        // Don't overwrite existing mapping
        if (!Object.values(mapping).includes(targetField)) {
          mapping[sourceCol] = targetField;
          break;
        }
      }
    }
  }
  
  return mapping;
}

/**
 * Get list of required fields for display
 */
export function getRequiredFields(): { field: string; label: string }[] {
  return [
    { field: "kundennummer", label: "Kundennummer (9-10 Ziffern)" },
    { field: "firmenname", label: "Firmenname" },
  ];
}

/**
 * Get list of all target fields with labels
 */
export function getTargetFields(): { field: string; label: string; required: boolean }[] {
  return [
    { field: "kundennummer", label: "Kundennummer", required: true },
    { field: "firmenname", label: "Firmenname", required: true },
    { field: "ansprechpartner", label: "Ansprechpartner", required: false },
    { field: "email", label: "E-Mail", required: false },
    { field: "telefon", label: "Telefon", required: false },
    { field: "branche", label: "Branche", required: false },
    { field: "notizen", label: "Notizen", required: false },
    { field: "vertragsnummer", label: "Vertragsnummer", required: false },
    { field: "kundenstatus", label: "Kundenstatus", required: false },
    { field: "umsatz", label: "Umsatz", required: false },
  ];
}

/**
 * Transform validated MoccaCustomerRow to database format
 */
export function toCustomerInput(row: MoccaCustomerRow): {
  company_name: string;
  contact_name: string | undefined;
  email: string | undefined;
  phone: string | undefined;
  industry: string | undefined;
  notes: string | undefined;
  mocca_customer_number: string;
  external_refs: { [key: string]: string | number | null };
} {
  return {
    company_name: row.firmenname,
    contact_name: row.ansprechpartner || undefined,
    email: row.email || undefined,
    phone: row.telefon || undefined,
    industry: row.branche || undefined,
    notes: row.notizen || undefined,
    mocca_customer_number: row.kundennummer,
    external_refs: {
      vertragsnummer: row.vertragsnummer ?? null,
      kundenstatus: row.kundenstatus ?? null,
      letzte_bestellung: row.letzte_bestellung ?? null,
      umsatz: row.umsatz ?? null,
    } as { [key: string]: string | number | null },
  };
}
