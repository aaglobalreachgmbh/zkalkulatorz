// ============================================
// Business Format Types (SoHo/PK XLSX Format)
// German headers: mtl. Grundpreis, FH-Partner, OMO Rabatt, etc.
// ============================================

// OMO-Matrix: Key = Percent (0, 5, 10, 15, 17.5, 20, 25), Value = Amount or null
export type OmoMatrix = {
  [percent: number]: number | null;
};

// Detected sheet type based on headers
export type BusinessSheetType = 
  | "TARIFF_WITH_OMO" 
  | "TARIFF_WITHOUT_OMO" 
  | "HARDWARE" 
  | "OMO_MAPPING" 
  | "UNKNOWN";

// Business-Format Tariff Row (SoHo/PK Format)
export type BusinessTariffRow = {
  id: string;                    // Generated stable ID
  rawName: string;               // Original text from column A
  rvCodes: string[];             // Extracted RV codes
  tarifName: string;             // Cleaned tariff name
  category: "mobile" | "data";   // Derived from sheet name
  contractType: "NEU" | "VVL";   // Derived from sheet name
  baseMonthlyNet: number;        // mtl. Grundpreis
  fhPartnerNet: number | null;   // FH-Partner
  pushNet: number | null;        // Push
  dataVolumeText: string | null; // Datenvolumen as text ("20 GB", "unlimited", "-")
  laufzeitMonths: number | null; // Laufzeit (only Type B)
  omo: OmoMatrix | null;         // OMO values (only Type A)
  sourceSheet: string;           // Original sheet name
  sourceRow: number;             // Original row number (1-based)
};

// Business-Format Hardware Row
export type BusinessHardwareRow = {
  id: string;
  displayName: string;           // "Apple iPhone 16 128 GB"
  ekNet: number;                 // EK netto
  sourceRow: number;
};

// Parsed Business Dataset (before transformation)
export type BusinessDataset = {
  meta: {
    sourceFileName: string;
    parsedAt: string;
    sheets: string[];
  };
  tariffs: BusinessTariffRow[];
  hardware: BusinessHardwareRow[];
  omoMapping: OmoMatrix;         // From "OMO Rabatt" sheet
};

// Format detection result
export type DetectedFormat = "CANONICAL" | "BUSINESS" | "UNKNOWN";

export type SheetDetection = {
  name: string;
  type: BusinessSheetType;
  headerRow: number;
};

export type FormatDetectionResult = {
  format: DetectedFormat;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  sheets: SheetDetection[];
};
