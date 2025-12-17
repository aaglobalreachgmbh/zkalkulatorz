import { useCallback } from "react";
import type { OfferOptionState } from "../engine/types";

export type ExportData = {
  version: "1.0";
  exportedAt: string;
  datasetVersion: string;
  option1: OfferOptionState;
  option2: OfferOptionState;
};

export type ImportResult = {
  success: boolean;
  data?: ExportData;
  warnings: string[];
  error?: string;
};

export type OfferExportResult = {
  exportToJson: (option1: OfferOptionState, option2: OfferOptionState) => void;
  importFromJson: (file: File) => Promise<ImportResult>;
  validateExportData: (data: unknown, currentVersion: string) => ImportResult;
};

export function useOfferExport(): OfferExportResult {
  const exportToJson = useCallback(
    (option1: OfferOptionState, option2: OfferOptionState) => {
      const exportData: ExportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        datasetVersion: option1.meta.datasetVersion,
        option1,
        option2,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `angebot_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    []
  );

  const importFromJson = useCallback(
    async (file: File): Promise<ImportResult> => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        return validateExportData(data, "dummy-v0");
      } catch (e) {
        return {
          success: false,
          warnings: [],
          error: `Datei konnte nicht gelesen werden: ${e instanceof Error ? e.message : "Unbekannter Fehler"}`,
        };
      }
    },
    []
  );

  return { exportToJson, importFromJson, validateExportData };
}

export function validateExportData(
  data: unknown,
  currentVersion: string
): ImportResult {
  const warnings: string[] = [];

  if (!data || typeof data !== "object") {
    return {
      success: false,
      warnings: [],
      error: "Ungültiges Datenformat",
    };
  }

  const typed = data as Partial<ExportData>;

  if (typed.version !== "1.0") {
    return {
      success: false,
      warnings: [],
      error: `Nicht unterstützte Version: ${typed.version}`,
    };
  }

  if (!typed.option1 || !typed.option2) {
    return {
      success: false,
      warnings: [],
      error: "Fehlende Optionsdaten",
    };
  }

  // Check dataset version compatibility
  if (typed.datasetVersion && typed.datasetVersion !== currentVersion) {
    warnings.push(
      `Daten wurden mit Version "${typed.datasetVersion}" erstellt, aktuell ist "${currentVersion}". Einige Tarife könnten nicht mehr verfügbar sein.`
    );
  }

  return {
    success: true,
    data: typed as ExportData,
    warnings,
  };
}
