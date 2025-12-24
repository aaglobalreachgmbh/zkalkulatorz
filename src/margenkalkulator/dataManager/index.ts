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
export { parseXLSX, getSheetNames, parseXLSXUnified, type UnifiedParseResult } from "./importers/xlsxImporter";
export { parseCSV } from "./importers/csvImporter";

// Hardware Importer
export {
  parseHardwareXLSX,
  parseHardwareCSV,
  validateHardwareRows,
  diffHardware,
  generateHardwareTemplate,
  type HardwareValidationResult,
  type HardwareDiffResult,
  type HardwareDiffItem,
} from "./importers/hardwareImporter";

// Business Format
export { 
  detectFormat,
  parseBusinessFormat,
  mapBusinessToCanonical,
  parseBusinessValue,
  generateStableId,
  type OmoMatrix,
  type BusinessDataset,
  type BusinessTariffRow,
  type BusinessHardwareRow,
  type FormatDetectionResult,
} from "./businessFormat";

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

// Storage
export {
  loadCustomDataset,
  saveCustomDataset,
  clearCustomDataset,
  hasCustomDataset,
  getStoredDatasetVersion,
  updateHardwareCatalog,
  resetHardwareCatalog,
  getStoredHardwareCatalog,
  hasCustomHardware,
} from "./storage";
