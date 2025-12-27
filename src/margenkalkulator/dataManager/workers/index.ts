// ============================================
// Worker Manager
// SECURITY: Handles worker lifecycle with timeout protection
// ============================================

import type { WorkerResponse } from "./xlsxParserWorker";

// Timeout constants
const PARSE_TIMEOUT_MS = 30_000; // 30 seconds for full parsing
const SHEET_NAMES_TIMEOUT_MS = 10_000; // 10 seconds for sheet names only

/**
 * Parse XLSX file in a Web Worker with timeout protection
 * SECURITY: Isolates parsing from main thread, allows termination on hang
 */
export async function parseXLSXInWorker(
  buffer: ArrayBuffer,
  schemaKeys?: string[]
): Promise<WorkerResponse> {
  // Check if Web Workers are supported
  if (typeof Worker === "undefined") {
    return {
      success: false,
      error: "Web Workers werden in diesem Browser nicht unterstützt",
    };
  }

  return new Promise((resolve) => {
    // Create worker from module URL (Vite-compatible)
    const worker = new Worker(
      new URL("./xlsxParserWorker.ts", import.meta.url),
      { type: "module" }
    );

    // Timeout handler - terminate worker if it takes too long
    const timeoutId = setTimeout(() => {
      console.warn("[Security] XLSX Worker timeout, terminating...");
      worker.terminate();
      resolve({
        success: false,
        error: `Parsing abgebrochen nach ${PARSE_TIMEOUT_MS / 1000}s (Datei zu groß oder beschädigt)`,
      });
    }, PARSE_TIMEOUT_MS);

    // Success handler
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      clearTimeout(timeoutId);
      worker.terminate();
      resolve(e.data);
    };

    // Error handler
    worker.onerror = (error) => {
      clearTimeout(timeoutId);
      worker.terminate();
      console.error("[Security] Worker error:", error.message);
      resolve({
        success: false,
        error: `Worker-Fehler: ${error.message}`,
      });
    };

    // Start parsing
    worker.postMessage({ type: "parse", data: buffer, schemaKeys });
  });
}

/**
 * Get sheet names from XLSX file in a Web Worker
 */
export async function getSheetNamesInWorker(buffer: ArrayBuffer): Promise<string[]> {
  if (typeof Worker === "undefined") {
    throw new Error("Web Workers werden nicht unterstützt");
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./xlsxParserWorker.ts", import.meta.url),
      { type: "module" }
    );

    const timeoutId = setTimeout(() => {
      worker.terminate();
      reject(new Error("Timeout beim Lesen der Sheet-Namen"));
    }, SHEET_NAMES_TIMEOUT_MS);

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      clearTimeout(timeoutId);
      worker.terminate();
      if (e.data.success && e.data.sheetNames) {
        resolve(e.data.sheetNames);
      } else {
        reject(new Error(e.data.error || "Unbekannter Fehler"));
      }
    };

    worker.onerror = (error) => {
      clearTimeout(timeoutId);
      worker.terminate();
      reject(error);
    };

    worker.postMessage({ type: "getSheetNames", data: buffer });
  });
}

/**
 * Check if Web Workers are available
 */
export function isWorkerAvailable(): boolean {
  return typeof Worker !== "undefined";
}
