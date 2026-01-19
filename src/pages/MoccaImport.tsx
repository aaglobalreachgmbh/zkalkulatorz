import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { parseCSV } from "@/margenkalkulator/dataManager/importers/csvImporter";
import { parseXLSXSecure } from "@/margenkalkulator/dataManager/importers/xlsxImporter";
import { useMoccaImport } from "@/margenkalkulator/hooks/useMoccaImport";
import {
  autoDetectColumnMapping,
  getTargetFields,
  ValidationResult,
} from "@/margenkalkulator/dataManager/schemas/moccaSchema";

type Step = "upload" | "mapping" | "validation" | "preview" | "import";

const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Datei hochladen" },
  { id: "mapping", label: "Spalten zuordnen" },
  { id: "validation", label: "Validierung" },
  { id: "preview", label: "Vorschau" },
  { id: "import", label: "Import" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export default function MoccaImport() {
  const navigate = useNavigate();
  const {
    progress,
    isImporting,
    savedMappings,
    validateImport,
    importCustomers,
    saveMapping,
  } = useMoccaImport();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [saveMappingName, setSaveMappingName] = useState("");
  const [importComplete, setImportComplete] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    failed: number;
  } | null>(null);

  const targetFields = getTargetFields();
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  // ============================================
  // File Upload Handler
  // ============================================
  const handleFileUpload = useCallback(async (file: File) => {
    // Validate file
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error("Ungültiger Dateityp. Bitte CSV oder Excel-Datei verwenden.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Datei zu groß. Maximum: 10 MB");
      return;
    }

    try {
      let rows: Record<string, unknown>[] = [];

      if (file.name.endsWith(".csv")) {
        rows = await parseCSV(file);
      } else {
        const sheets = await parseXLSXSecure(file);
        // Use first sheet
        const firstSheetName = Object.keys(sheets)[0];
        if (firstSheetName) {
          rows = (sheets as Record<string, unknown[]>)[firstSheetName] as Record<string, unknown>[];
        }
      }

      if (rows.length === 0) {
        toast.error("Keine Daten in der Datei gefunden");
        return;
      }

      // Extract column names from first row
      const columns = Object.keys(rows[0]);

      setFileName(file.name);
      setRawRows(rows);
      setSourceColumns(columns);

      // Auto-detect mapping
      const autoMapping = autoDetectColumnMapping(columns);

      // Check for saved default mapping
      const defaultMapping = savedMappings.find((m) => m.is_default);
      if (defaultMapping) {
        setColumnMapping(defaultMapping.column_mapping as Record<string, string>);
        toast.info("Gespeichertes Mapping geladen");
      } else {
        setColumnMapping(autoMapping);
      }

      setCurrentStep("mapping");
      toast.success(`${rows.length} Zeilen geladen`);
    } catch (error) {
      console.error("File parse error:", error);
      toast.error("Fehler beim Lesen der Datei");
    }
  }, [savedMappings]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  // ============================================
  // Mapping Change Handler
  // ============================================
  const handleMappingChange = (sourceCol: string, targetField: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [sourceCol]: targetField === "_none_" ? "" : targetField,
    }));
  };

  // ============================================
  // Validation
  // ============================================
  const runValidation = useCallback(() => {
    const result = validateImport(rawRows, columnMapping);
    setValidationResult(result);
    setCurrentStep("validation");
  }, [rawRows, columnMapping, validateImport]);

  // ============================================
  // Import
  // ============================================
  const runImport = useCallback(async () => {
    if (!validationResult) return;

    setCurrentStep("import");

    // Optionally save mapping
    if (saveMappingName.trim()) {
      saveMapping({
        mapping_name: saveMappingName.trim(),
        source_type: "mocca",
        column_mapping: columnMapping,
        is_default: true,
      });
    }

    const result = await importCustomers(validationResult.validRows, {
      skipDuplicates,
    });

    setImportResult({
      imported: result.imported,
      skipped: result.skipped,
      failed: result.failed,
    });
    setImportComplete(true);

    if (result.success) {
      toast.success(`${result.imported} Kunden importiert`);
    } else {
      toast.warning(`Import abgeschlossen mit ${result.failed} Fehlern`);
    }
  }, [validationResult, skipDuplicates, columnMapping, saveMappingName, saveMapping, importCustomers]);

  // ============================================
  // Step Navigation
  // ============================================
  const canGoNext = () => {
    switch (currentStep) {
      case "upload":
        return rawRows.length > 0;
      case "mapping":
        // At least required fields must be mapped
        const mappedFields = Object.values(columnMapping).filter(Boolean);
        return mappedFields.includes("kundennummer") && mappedFields.includes("firmenname");
      case "validation":
        return validationResult?.isValid;
      case "preview":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    switch (currentStep) {
      case "mapping":
        runValidation();
        break;
      case "validation":
        setCurrentStep("preview");
        break;
      case "preview":
        runImport();
        break;
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  // ============================================
  // Render
  // ============================================
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kunden-Import</h1>
            <p className="text-muted-foreground">
              Importieren Sie Kundendaten aus Mocca/MoCare
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/customers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Liste
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${index < currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : index === currentStepIndex
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                {index < currentStepIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`ml-2 text-sm ${index === currentStepIndex ? "font-medium" : "text-muted-foreground"
                  }`}
              >
                {step.label}
              </span>
              {index < STEPS.length - 1 && (
                <div className="w-8 h-px bg-border mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {/* Step 1: Upload */}
            {currentStep === "upload" && (
              <div
                className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  CSV oder Excel-Datei hierher ziehen
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  oder klicken zum Auswählen
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Unterstützt: CSV, XLSX, XLS (max. 10 MB)</span>
                </div>
              </div>
            )}

            {/* Step 2: Mapping */}
            {currentStep === "mapping" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Spalten-Zuordnung</h3>
                    <p className="text-sm text-muted-foreground">
                      Ordnen Sie die Spalten aus "{fileName}" den Zielfeldern zu
                    </p>
                  </div>
                  <Badge variant="secondary">{rawRows.length} Zeilen</Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quell-Spalte</TableHead>
                      <TableHead>Beispielwert</TableHead>
                      <TableHead>Zielfeld</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sourceColumns.map((col) => (
                      <TableRow key={col}>
                        <TableCell className="font-mono text-sm">{col}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {String(rawRows[0]?.[col] ?? "-")}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={columnMapping[col] || "_none_"}
                            onValueChange={(v) => handleMappingChange(col, v)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Nicht zuordnen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none_">— Nicht zuordnen —</SelectItem>
                              {targetFields.map((field) => (
                                <SelectItem key={field.field} value={field.field}>
                                  {field.label}
                                  {field.required && " *"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Pflichtfelder</AlertTitle>
                  <AlertDescription>
                    Kundennummer und Firmenname müssen zugeordnet sein.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 3: Validation */}
            {currentStep === "validation" && validationResult && (
              <div className="space-y-6">
                {validationResult.isValid ? (
                  <Alert className="border-green-500 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle>Validierung erfolgreich</AlertTitle>
                    <AlertDescription>
                      {validationResult.validRows.length} Zeilen bereit zum Import
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Validierungsfehler</AlertTitle>
                    <AlertDescription>
                      {validationResult.errors.length} Fehler gefunden
                    </AlertDescription>
                  </Alert>
                )}

                {validationResult.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warnungen</AlertTitle>
                    <AlertDescription>
                      {validationResult.warnings.length} Warnungen
                    </AlertDescription>
                  </Alert>
                )}

                {validationResult.errors.length > 0 && (
                  <div className="max-h-[300px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Zeile</TableHead>
                          <TableHead>Feld</TableHead>
                          <TableHead>Fehler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.errors.slice(0, 50).map((err, i) => (
                          <TableRow key={i}>
                            <TableCell>{err.row}</TableCell>
                            <TableCell className="font-mono text-sm">{err.field}</TableCell>
                            <TableCell className="text-destructive">{err.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {validationResult.errors.length > 50 && (
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        ... und {validationResult.errors.length - 50} weitere Fehler
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Preview */}
            {currentStep === "preview" && validationResult && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl">{validationResult.validRows.length}</CardTitle>
                      <CardDescription>Kunden zum Import</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl">{validationResult.warnings.length}</CardTitle>
                      <CardDescription>Warnungen</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl">{validationResult.errors.length}</CardTitle>
                      <CardDescription>Übersprungen</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skip-duplicates"
                      checked={skipDuplicates}
                      onCheckedChange={(checked) => setSkipDuplicates(!!checked)}
                    />
                    <Label htmlFor="skip-duplicates">
                      Duplikate überspringen (existierende Kundennummern)
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="save-mapping">Mapping für später speichern (optional)</Label>
                    <Input
                      id="save-mapping"
                      placeholder="z.B. Mocca Standard Export"
                      value={saveMappingName}
                      onChange={(e) => setSaveMappingName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="max-h-[300px] overflow-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kundennr.</TableHead>
                        <TableHead>Firmenname</TableHead>
                        <TableHead>Ansprechpartner</TableHead>
                        <TableHead>E-Mail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationResult.validRows.slice(0, 10).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{row.kundennummer}</TableCell>
                          <TableCell>{row.firmenname}</TableCell>
                          <TableCell>{row.ansprechpartner || "-"}</TableCell>
                          <TableCell>{row.email || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {validationResult.validRows.length > 10 && (
                    <p className="text-sm text-muted-foreground p-4 text-center border-t">
                      ... und {validationResult.validRows.length - 10} weitere
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Import */}
            {currentStep === "import" && (
              <div className="space-y-6 py-8">
                {!importComplete ? (
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <h3 className="text-lg font-medium">Importiere Kunden...</h3>
                    {progress && (
                      <div className="space-y-2 max-w-md mx-auto">
                        <Progress
                          value={(progress.processed / progress.total) * 100}
                        />
                        <p className="text-sm text-muted-foreground">
                          Batch {progress.currentBatch} von {progress.totalBatches} •{" "}
                          {progress.processed} von {progress.total} verarbeitet
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                    <div>
                      <h3 className="text-xl font-medium mb-2">Import abgeschlossen</h3>
                      {importResult && (
                        <div className="flex items-center justify-center gap-6 text-sm">
                          <div>
                            <span className="font-bold text-green-600">{importResult.imported}</span>{" "}
                            importiert
                          </div>
                          <div>
                            <span className="font-bold text-yellow-600">{importResult.skipped}</span>{" "}
                            übersprungen
                          </div>
                          <div>
                            <span className="font-bold text-red-600">{importResult.failed}</span>{" "}
                            fehlgeschlagen
                          </div>
                        </div>
                      )}
                    </div>
                    <Button onClick={() => navigate("/customers")}>
                      Zur Kundenliste
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep !== "import" && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <Button onClick={goNext} disabled={!canGoNext()}>
              {currentStep === "preview" ? "Import starten" : "Weiter"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
