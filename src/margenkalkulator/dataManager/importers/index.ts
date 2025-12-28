// ============================================
// Importers Index
// ============================================

// XLSX/CSV Importers
export { 
  parseXLSX, 
  parseXLSXSecure, 
  parseXLSXUnifiedSecure,
  getSheetNames,
  parseXLSXUnified,
  validateFileBeforeParse,
} from "./xlsxImporter";
export { parseCSV } from "./csvImporter";

// Specific Importers
export * from "./hardwareImporter";
export * from "./mobileImporter";
export * from "./teamDealImporter";
export * from "./fixedNetImporter";
export * from "./promoImporter";
export * from "./omoImporter";

// PDF Importers
export {
  detectPdfFormat,
  extractTextFromPdf,
  parsePdf,
  validatePdfFile,
  parseGermanPrice,
  generateIdFromText,
  type PdfFormatType,
  type PdfDetectionResult,
  type PdfParseResult,
  type ProvisionParseResult,
} from "./pdfImporter";

export {
  parseProvisionPdf,
  validateProvisionData,
  parseHardwarePdf,
  validateHardwareData,
} from "./pdfParsers";
