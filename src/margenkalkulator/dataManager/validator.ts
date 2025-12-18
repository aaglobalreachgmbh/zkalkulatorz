// ============================================
// Dataset Validator
// Validates imported data against schema rules
// ============================================

import { TEMPLATE_SCHEMA } from "./schema";
import type { CanonicalDataset, ParsedSheets } from "./types";

export type ValidationError = {
  sheet: string;
  row?: number;
  field: string;
  message: string;
};

export type ValidationWarning = {
  sheet: string;
  row?: number;
  field: string;
  message: string;
};

export type ValidationResult = {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;
};

export function validateParsedSheets(sheets: ParsedSheets): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // 1. Check meta sheet exists
  if (!sheets.meta || sheets.meta.length === 0) {
    errors.push({
      sheet: "meta",
      field: "datasetVersion",
      message: "Meta-Sheet fehlt oder ist leer",
    });
  }
  
  // 2. Validate each sheet according to schema
  const idSets: Record<string, Set<string>> = {};
  
  for (const [sheetName, schema] of Object.entries(TEMPLATE_SCHEMA)) {
    const rows = sheets[sheetName as keyof ParsedSheets] as Record<string, unknown>[] | undefined;
    
    if (!rows || rows.length === 0) {
      // Skip empty sheets with a warning (except meta which is required)
      if (sheetName !== "meta") {
        warnings.push({
          sheet: sheetName,
          field: "-",
          message: `Sheet "${sheetName}" ist leer`,
        });
      }
      continue;
    }
    
    // Initialize ID set for unique key validation
    if (schema.uniqueKey) {
      idSets[sheetName] = new Set();
    }
    
    // Validate each row
    rows.forEach((row, idx) => {
      const excelRow = idx + 2; // Excel row number (header = 1)
      
      // 2a. Required fields
      for (const field of schema.required) {
        const value = row[field];
        if (value === null || value === undefined || value === "") {
          errors.push({
            sheet: sheetName,
            row: excelRow,
            field,
            message: `Pflichtfeld "${field}" fehlt`,
          });
        }
      }
      
      // 2b. Unique ID check
      if (schema.uniqueKey) {
        const id = row[schema.uniqueKey] as string;
        if (id) {
          if (idSets[sheetName].has(id)) {
            errors.push({
              sheet: sheetName,
              row: excelRow,
              field: schema.uniqueKey,
              message: `Doppelte ID "${id}"`,
            });
          }
          idSets[sheetName].add(id);
        }
      }
      
      // 2c. Numeric fields >= 0
      for (const [key, value] of Object.entries(row)) {
        if (key.includes("_net") && typeof value === "number" && value < 0) {
          errors.push({
            sheet: sheetName,
            row: excelRow,
            field: key,
            message: `Negativer Preis nicht erlaubt: ${value}`,
          });
        }
      }
    });
  }
  
  // 3. Referential integrity (foreign keys)
  for (const [sheetName, schema] of Object.entries(TEMPLATE_SCHEMA)) {
    if (!schema.foreignKey) continue;
    
    const rows = sheets[sheetName as keyof ParsedSheets] as Record<string, unknown>[] | undefined;
    if (!rows) continue;
    
    for (const [field, ref] of Object.entries(schema.foreignKey)) {
      const [refSheet] = ref.split(".");
      const validIds = idSets[refSheet] ?? new Set();
      
      rows.forEach((row, idx) => {
        const value = row[field] as string;
        if (value && !validIds.has(value)) {
          errors.push({
            sheet: sheetName,
            row: idx + 2,
            field,
            message: `Ungültige Referenz "${value}" → ${ref}`,
          });
        }
      });
    }
  }
  
  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}

// Validate a fully transformed CanonicalDataset
export function validateDataset(dataset: Partial<CanonicalDataset>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check meta
  if (!dataset.meta?.datasetVersion) {
    errors.push({
      sheet: "meta",
      field: "datasetVersion",
      message: "datasetVersion fehlt",
    });
  }
  if (!dataset.meta?.validFromISO) {
    errors.push({
      sheet: "meta",
      field: "validFromISO",
      message: "validFromISO fehlt",
    });
  }
  
  // Check tariffs have unique IDs
  const tariffIds = new Set<string>();
  (dataset.mobileTariffs ?? []).forEach((t, idx) => {
    if (!t.id) {
      errors.push({ sheet: "mobile_tariffs", row: idx + 2, field: "id", message: "ID fehlt" });
    } else if (tariffIds.has(t.id)) {
      errors.push({ sheet: "mobile_tariffs", row: idx + 2, field: "id", message: `Doppelte ID "${t.id}"` });
    } else {
      tariffIds.add(t.id);
    }
    
    if (t.base_sim_only_net < 0) {
      errors.push({
        sheet: "mobile_tariffs",
        row: idx + 2,
        field: "base_sim_only_net",
        message: `Negativer Preis: ${t.base_sim_only_net}`,
      });
    }
  });
  
  // Check fixed net products
  const fixedNetIds = new Set<string>();
  (dataset.fixedNetProducts ?? []).forEach((p, idx) => {
    if (!p.id) {
      errors.push({ sheet: "fixednet_products", row: idx + 2, field: "id", message: "ID fehlt" });
    } else if (fixedNetIds.has(p.id)) {
      errors.push({ sheet: "fixednet_products", row: idx + 2, field: "id", message: `Doppelte ID "${p.id}"` });
    } else {
      fixedNetIds.add(p.id);
    }
  });
  
  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}
