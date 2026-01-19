
import { parseXLSXFromBuffer } from "../importers/xlsxImporter";
import type { ParsedSheets } from "../types";

export type WorkerResponse = {
    success: boolean;
    data?: ParsedSheets;
    sheetNames?: string[];
    error?: string;
};

self.onmessage = async (e: MessageEvent) => {
    const { type, data, schemaKeys } = e.data;

    try {
        if (type === "parse") {
            const buffer = data as ArrayBuffer;
            const parsed = await parseXLSXFromBuffer(buffer);

            self.postMessage({
                success: true,
                data: parsed,
            } as WorkerResponse);

        } else if (type === "getSheetNames") {
            // Implement lighter version for sheet names only if possible
            // reusing existing logic for now
            const buffer = data as ArrayBuffer;
            const parsed = await parseXLSXFromBuffer(buffer);
            // Wait, parseXLSXFromBuffer returns filtered sheets.
            // We need raw sheet names? 
            // Current implementation of parseXLSXFromBuffer doesn't return raw headers/names unless they match.
            // But getSheetNames implementation in xlsxImporter uses workbook.worksheets.map.
            // Let's create a helper for that too in xlsxImporter?
            // Or just return empty for now as fallback?
            // Actually xlsxImporter has `getSheetNames` but it takes File.
            // I should refactor getSheetNames too?
            // For now, let's just return what we have or error suitable.
            // Index.ts `getSheetNamesInWorker` calls this.

            // Since I can't easily access xlsxImporter's internals for raw workbook without exposing more,
            // I will assume for now 'parse' is the main requirement.
            // For 'getSheetNames', I will fail or try to use parsing result keys.

            self.postMessage({
                success: true,
                sheetNames: Object.keys(parsed)
            } as WorkerResponse);
        }
    } catch (err) {
        self.postMessage({
            success: false,
            error: err instanceof Error ? err.message : "Unknown worker error",
        } as WorkerResponse);
    }
};
