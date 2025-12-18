// ============================================
// Business Format Module - Public API
// ============================================

// Types
export type {
  OmoMatrix,
  BusinessSheetType,
  BusinessTariffRow,
  BusinessHardwareRow,
  BusinessDataset,
  DetectedFormat,
  SheetDetection,
  FormatDetectionResult,
} from "./types";

// Detection
export { detectFormat } from "./detector";

// Parser
export { 
  parseBusinessFormat,
  parseBusinessValue,
  generateStableId,
  slugify,
  normalizeHeaderName,
} from "./parser";

// Mapper
export { 
  mapBusinessToCanonical,
  parseDataVolume,
} from "./mapper";
