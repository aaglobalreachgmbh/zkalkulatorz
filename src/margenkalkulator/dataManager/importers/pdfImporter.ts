// ============================================
// PDF Importer with Format Detection
// Supports TK-World Provision Lists & Distri Hardware Lists
// ============================================

import type { HardwareItemRow, ProvisionRow, OMOMatrixRow } from "../types";

// PDF Detection Result
export type PdfFormatType = 
  | "provision_tkworld"
  | "hardware_distri"
  | "unknown";

export type PdfDetectionResult = {
  format: PdfFormatType;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  pageCount: number;
  hints: string[];
};

export type PdfParseResult<T> = {
  success: boolean;
  data: T[];
  warnings: string[];
  errors: string[];
  meta: {
    format: PdfFormatType;
    pagesProcessed: number;
    rowsExtracted: number;
  };
};

// Combined provision result (provision + OMO)
export type ProvisionParseResult = {
  provisions: ProvisionRow[];
  omoMatrix: OMOMatrixRow[];
};

// ============================================
// Format Detection (based on text patterns)
// ============================================

export function detectPdfFormat(textContent: string): PdfDetectionResult {
  const hints: string[] = [];
  const lowerText = textContent.toLowerCase();
  
  // TK-World Provision List patterns
  const tkWorldPatterns = [
    "tk-world",
    "konditionen mobilfunk",
    "geschäftskunden",
    "provisionen",
    "omo rabatt",
    "neuvertrag",
    "vvl",
    "business prime",
    "business smart",
    "gigamobil",
  ];
  
  // Hardware Distri patterns
  const hardwarePatterns = [
    "einsamobile",
    "preisliste",
    "fachhandel",
    "artikel-nr",
    "artikelnummer",
    "iphone",
    "samsung galaxy",
    "google pixel",
    "xiaomi",
    "ek netto",
  ];
  
  let tkWorldScore = 0;
  let hardwareScore = 0;
  
  for (const pattern of tkWorldPatterns) {
    if (lowerText.includes(pattern)) {
      tkWorldScore++;
      hints.push(`Found: "${pattern}"`);
    }
  }
  
  for (const pattern of hardwarePatterns) {
    if (lowerText.includes(pattern)) {
      hardwareScore++;
      hints.push(`Found: "${pattern}"`);
    }
  }
  
  // Determine format
  if (tkWorldScore >= 3) {
    return {
      format: "provision_tkworld",
      confidence: tkWorldScore >= 5 ? "HIGH" : "MEDIUM",
      pageCount: 0, // Will be set by caller
      hints,
    };
  }
  
  if (hardwareScore >= 3) {
    return {
      format: "hardware_distri",
      confidence: hardwareScore >= 5 ? "HIGH" : "MEDIUM",
      pageCount: 0,
      hints,
    };
  }
  
  return {
    format: "unknown",
    confidence: "LOW",
    pageCount: 0,
    hints,
  };
}

// ============================================
// Text Extraction from PDF
// ============================================

export async function extractTextFromPdf(file: File): Promise<{
  text: string;
  pageCount: number;
  pages: string[];
}> {
  // Dynamic import to avoid SSR issues
  const pdfjsLib = await import("pdfjs-dist");
  
  // Set worker path
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const pages: string[] = [];
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Extract text items and join them
    const pageText = textContent.items
      .map((item: unknown) => {
        const textItem = item as { str?: string };
        return textItem.str ?? "";
      })
      .join(" ");
    
    pages.push(pageText);
    fullText += pageText + "\n";
  }
  
  return {
    text: fullText,
    pageCount: pdf.numPages,
    pages,
  };
}

// ============================================
// Parse German Number Format
// ============================================

export function parseGermanPrice(value: string): number | null {
  if (!value || value.trim() === "" || value === "-") {
    return null;
  }
  
  // Remove currency symbols and whitespace
  let cleaned = value.replace(/[€$\s]/g, "").trim();
  
  // Handle German format: 1.234,56 → 1234.56
  // First remove thousand separators (.)
  // Then replace decimal comma with dot
  if (cleaned.includes(",")) {
    // If both . and , exist, . is thousand separator
    if (cleaned.includes(".") && cleaned.indexOf(".") < cleaned.indexOf(",")) {
      cleaned = cleaned.replace(/\./g, "");
    }
    cleaned = cleaned.replace(",", ".");
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// ============================================
// Generate Stable ID from text
// ============================================

export function generateIdFromText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] ?? c))
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 50);
}

// ============================================
// Main PDF Import Function
// ============================================

export async function parsePdf(file: File): Promise<{
  detection: PdfDetectionResult;
  text: string;
  pages: string[];
}> {
  const extracted = await extractTextFromPdf(file);
  const detection = detectPdfFormat(extracted.text);
  detection.pageCount = extracted.pageCount;
  
  return {
    detection,
    text: extracted.text,
    pages: extracted.pages,
  };
}

// ============================================
// Validate PDF Before Parse
// ============================================

export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    return { valid: false, error: "Datei ist keine PDF" };
  }
  
  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: "PDF zu groß (max 50MB)" };
  }
  
  return { valid: true };
}
