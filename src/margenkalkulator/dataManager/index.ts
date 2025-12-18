// ============================================
// Data Manager Module - Public API
// ============================================

// Types
export type { 
  CanonicalDataset, 
  DatasetMeta,
  MobileTariffRow,
  FixedNetProductRow,
  HardwareItemRow,
  PromoDefinitionRow,
  SubVariantRow,
  ParsedSheets,
} from "./types";

// Schema
export { TEMPLATE_SCHEMA, SHEET_LABELS } from "./schema";

// Importers
export { parseXLSX, getSheetNames } from "./importers/xlsxImporter";
export { parseCSV } from "./importers/csvImporter";

// Validation
export { 
  validateParsedSheets, 
  validateDataset,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from "./validator";

// Diff
export { 
  diffDatasets, 
  formatDiffSummary,
  type DiffResult,
  type DiffItem,
  type DiffChange,
} from "./diff";

// Adapter
export { transformToCanonical, mapCanonicalToCatalog } from "./adapter";
