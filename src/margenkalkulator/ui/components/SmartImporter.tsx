// ============================================
// SmartImporter - KI-gestützter Datenimport
// Erkennt automatisch Dateitypen und Spalten-Mapping
// ============================================

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Sparkles, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  HardDrive,
  Receipt,
  Tags,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenantHardware, type TenantHardwareInput } from "@/margenkalkulator/hooks/useTenantHardware";
import { useTenantProvisions, type TenantProvisionInput } from "@/margenkalkulator/hooks/useTenantProvisions";
import { parseXLSX } from "@/margenkalkulator/dataManager/importers/xlsxImporter";
import { parseCSV } from "@/margenkalkulator/dataManager/importers/csvImporter";
import { toast } from "sonner";

interface SmartImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DetectedType = "hardware" | "provision" | "promo" | "unknown";

interface AIAnalysis {
  dataType: DetectedType;
  confidence: number;
  columnMapping: Record<string, string>;
  warnings: string[];
  suggestions: string[];
  sampleData: Record<string, unknown>[];
  totalRows: number;
}

type ImportStep = "upload" | "analyzing" | "preview" | "importing" | "complete";

const TYPE_INFO: Record<DetectedType, { label: string; icon: typeof HardDrive; color: string }> = {
  hardware: { label: "Hardware-Preise", icon: HardDrive, color: "text-blue-600" },
  provision: { label: "Provisionen", icon: Receipt, color: "text-green-600" },
  promo: { label: "Aktionen", icon: Tags, color: "text-purple-600" },
  unknown: { label: "Unbekannt", icon: FileSpreadsheet, color: "text-gray-600" },
};

export function SmartImporter({ open, onOpenChange }: SmartImporterProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const { bulkImport: importHardware, isUploading: isUploadingHardware } = useTenantHardware();
  const { bulkImport: importProvisions, isUploading: isUploadingProvisions } = useTenantProvisions();
  
  const isImporting = isUploadingHardware || isUploadingProvisions;

  const resetState = useCallback(() => {
    setStep("upload");
    setFileName("");
    setRawData([]);
    setAnalysis(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const parseFile = async (file: File): Promise<Record<string, unknown>[]> => {
    if (file.name.endsWith(".csv")) {
      const rows = await parseCSV(file);
      return rows;
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const sheets = await parseXLSX(file);
      // Get first sheet with data
      const firstSheet = Object.values(sheets).find(sheet => Array.isArray(sheet) && sheet.length > 0);
      return (firstSheet as Record<string, unknown>[]) || [];
    }
    throw new Error("Nicht unterstütztes Dateiformat. Bitte CSV oder Excel-Datei verwenden.");
  };

  const analyzeWithAI = async (data: Record<string, unknown>[]): Promise<AIAnalysis> => {
    // Get column headers and sample data
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const sampleRows = data.slice(0, 5);
    
    setProgress(30);
    
    try {
      const { data: response, error: fnError } = await supabase.functions.invoke("ai-data-import", {
        body: {
          headers,
          sampleRows,
          totalRows: data.length,
        },
      });
      
      setProgress(80);
      
      if (fnError) {
        throw new Error(fnError.message);
      }
      
      return {
        dataType: response.dataType || "unknown",
        confidence: response.confidence || 0,
        columnMapping: response.columnMapping || {},
        warnings: response.warnings || [],
        suggestions: response.suggestions || [],
        sampleData: sampleRows,
        totalRows: data.length,
      };
    } catch (err) {
      console.error("AI analysis error:", err);
      // Fallback to heuristic analysis
      return heuristicAnalysis(headers, sampleRows, data.length);
    }
  };

  const heuristicAnalysis = (
    headers: string[],
    sampleRows: Record<string, unknown>[],
    totalRows: number
  ): AIAnalysis => {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    
    // Detect hardware
    const hardwareIndicators = ["ek", "einkauf", "brand", "marke", "model", "modell", "hardware", "gerät"];
    const isHardware = hardwareIndicators.some(ind => 
      normalizedHeaders.some(h => h.includes(ind))
    );
    
    // Detect provisions
    const provisionIndicators = ["provision", "tarif", "provi", "vergütung", "commission"];
    const isProvision = provisionIndicators.some(ind => 
      normalizedHeaders.some(h => h.includes(ind))
    );
    
    let dataType: DetectedType = "unknown";
    let confidence = 0.5;
    const columnMapping: Record<string, string> = {};
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    if (isHardware) {
      dataType = "hardware";
      confidence = 0.8;
      
      // Map columns
      headers.forEach(h => {
        const lower = h.toLowerCase();
        if (lower.includes("brand") || lower.includes("marke") || lower.includes("hersteller")) {
          columnMapping[h] = "brand";
        } else if (lower.includes("model") || lower.includes("gerät") || lower.includes("name")) {
          columnMapping[h] = "model";
        } else if (lower.includes("ek") || lower.includes("einkauf") || lower.includes("preis")) {
          columnMapping[h] = "ek_net";
        } else if (lower.includes("id") || lower.includes("artikel")) {
          columnMapping[h] = "hardware_id";
        }
      });
      
      if (!columnMapping["ek_net"]) {
        warnings.push("Keine EK-Preis-Spalte erkannt. Bitte prüfe die Zuordnung.");
      }
    } else if (isProvision) {
      dataType = "provision";
      confidence = 0.8;
      
      headers.forEach(h => {
        const lower = h.toLowerCase();
        if (lower.includes("tarif")) {
          columnMapping[h] = "tariff_name";
        } else if (lower.includes("provision") || lower.includes("provi")) {
          columnMapping[h] = "provision_amount";
        } else if (lower.includes("typ") || lower.includes("type") || lower.includes("vertrags")) {
          columnMapping[h] = "contract_type";
        }
      });
    } else {
      warnings.push("Dateityp konnte nicht automatisch erkannt werden.");
      suggestions.push("Bitte lade eine Datei mit erkennbaren Spalten hoch (z.B. 'Marke', 'EK-Preis' für Hardware).");
    }
    
    return {
      dataType,
      confidence,
      columnMapping,
      warnings,
      suggestions,
      sampleData: sampleRows,
      totalRows,
    };
  };

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setError(null);
    setStep("analyzing");
    setProgress(10);
    
    try {
      const data = await parseFile(file);
      setRawData(data);
      setProgress(20);
      
      if (data.length === 0) {
        throw new Error("Die Datei enthält keine Daten.");
      }
      
      const result = await analyzeWithAI(data);
      setAnalysis(result);
      setProgress(100);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler beim Analysieren");
      setStep("upload");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleImport = async () => {
    if (!analysis || !rawData.length) return;
    
    setStep("importing");
    
    try {
      if (analysis.dataType === "hardware") {
        const items: TenantHardwareInput[] = rawData.map((row, index) => {
          const mapping = analysis.columnMapping;
          return {
            hardware_id: String(row[Object.keys(mapping).find(k => mapping[k] === "hardware_id") || ""] || `HW-${index}`),
            brand: String(row[Object.keys(mapping).find(k => mapping[k] === "brand") || ""] || "Unbekannt"),
            model: String(row[Object.keys(mapping).find(k => mapping[k] === "model") || ""] || `Modell ${index}`),
            ek_net: parseFloat(String(row[Object.keys(mapping).find(k => mapping[k] === "ek_net") || ""] || "0").replace(",", ".")),
            category: "smartphone",
            sort_order: index,
          };
        }).filter(item => item.ek_net > 0);
        
        await importHardware(items);
        toast.success(`${items.length} Hardware-Einträge importiert!`);
      } else if (analysis.dataType === "provision") {
        const items: TenantProvisionInput[] = rawData.map((row) => {
          const mapping = analysis.columnMapping;
          return {
            tariff_id: String(row[Object.keys(mapping).find(k => mapping[k] === "tariff_id") || ""] || ""),
            tariff_name: String(row[Object.keys(mapping).find(k => mapping[k] === "tariff_name") || ""] || ""),
            provision_amount: parseFloat(String(row[Object.keys(mapping).find(k => mapping[k] === "provision_amount") || ""] || "0").replace(",", ".")),
            contract_type: "new" as const,
          };
        }).filter(item => item.provision_amount > 0 && item.tariff_name);
        
        await importProvisions(items);
        toast.success(`${items.length} Provisions-Einträge importiert!`);
      }
      
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Import");
      setStep("preview");
    }
  };

  const TypeIcon = analysis?.dataType ? TYPE_INFO[analysis.dataType].icon : FileSpreadsheet;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Import
          </DialogTitle>
          <DialogDescription>
            Lade einfach deine Datei hoch - die KI erkennt automatisch, was importiert werden soll.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step: Upload */}
          {step === "upload" && (
            <div
              className={`
                border-2 border-dashed rounded-xl p-12 text-center transition-all
                ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
              `}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Datei hierher ziehen
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                oder klicken zum Auswählen
              </p>
              <input
                type="file"
                id="smart-import-file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <Button asChild variant="secondary">
                <label htmlFor="smart-import-file" className="cursor-pointer">
                  Datei auswählen
                </label>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Unterstützt: CSV, Excel (.xlsx, .xls)
              </p>
            </div>
          )}

          {/* Step: Analyzing */}
          {step === "analyzing" && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">Analysiere Datei...</p>
              <p className="text-sm text-muted-foreground">{fileName}</p>
              <Progress value={progress} className="max-w-xs mx-auto" />
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && analysis && (
            <div className="space-y-6">
              {/* Detection Result */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-background rounded-xl">
                      <TypeIcon className={`h-8 w-8 ${TYPE_INFO[analysis.dataType].color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {TYPE_INFO[analysis.dataType].label}
                        </h3>
                        <Badge variant="secondary">
                          {Math.round(analysis.confidence * 100)}% sicher
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {analysis.totalRows} Zeilen erkannt aus {fileName}
                      </p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Warnings */}
              {analysis.warnings.length > 0 && (
                <Alert className="border-yellow-500/30 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-600">Hinweise</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm">
                      {analysis.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Column Mapping */}
              {Object.keys(analysis.columnMapping).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Spalten-Zuordnung</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analysis.columnMapping).map(([from, to]) => (
                      <Badge key={from} variant="outline" className="gap-1">
                        {from} <ArrowRight className="h-3 w-3" /> {to}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Data Preview */}
              <div>
                <h4 className="font-medium mb-2">Vorschau (erste 5 Zeilen)</h4>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {analysis.sampleData[0] && Object.keys(analysis.sampleData[0]).slice(0, 5).map((key) => (
                          <TableHead key={key} className="whitespace-nowrap">
                            {key}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.sampleData.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(row).slice(0, 5).map((val, j) => (
                            <TableCell key={j} className="whitespace-nowrap">
                              {String(val ?? "-")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={resetState}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Andere Datei
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={analysis.dataType === "unknown" || isImporting}
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Jetzt importieren ({analysis.totalRows} Zeilen)
                </Button>
              </div>
            </div>
          )}

          {/* Step: Complete */}
          {step === "complete" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Import erfolgreich!</h3>
              <p className="text-muted-foreground">
                Deine Daten wurden importiert und stehen jetzt im Kalkulator zur Verfügung.
              </p>
              <Button onClick={handleClose}>
                Fertig
              </Button>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Fehler</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
