import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Download, 
  Check, 
  AlertTriangle, 
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface ImportValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string; row?: number }>;
  warnings: Array<{ field: string; message: string; row?: number }>;
}

export interface DiffItem {
  id: string;
  type: "added" | "changed" | "removed";
  changes?: Record<string, { old: unknown; new: unknown }>;
}

export interface DiffResult {
  items: DiffItem[];
  summary: {
    added: number;
    changed: number;
    removed: number;
  };
}

interface ImportTabProps<T> {
  title: string;
  description: string;
  parseFile: (file: File) => Promise<T[]>;
  validateRows: (rows: T[]) => ImportValidationResult;
  calculateDiff: (current: T[], next: T[]) => DiffResult;
  getCurrentData: () => T[];
  onImport: (rows: T[]) => void;
  renderRow: (row: T) => React.ReactNode;
  getRowId: (row: T) => string;
  templateHeaders: string[];
  templateSheetName: string;
}

export function ImportTab<T>({
  title,
  description,
  parseFile,
  validateRows,
  calculateDiff,
  getCurrentData,
  onImport,
  renderRow,
  getRowId,
  templateHeaders,
  templateSheetName,
}: ImportTabProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<T[] | null>(null);
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);
    setParsedRows(null);
    setValidation(null);
    setDiff(null);

    try {
      const rows = await parseFile(selectedFile);
      const validationResult = validateRows(rows);
      setValidation(validationResult);

      if (validationResult.isValid) {
        setParsedRows(rows);
        const currentData = getCurrentData();
        const diffResult = calculateDiff(currentData, rows);
        setDiff(diffResult);
      }
    } catch (err) {
      toast({
        title: "Fehler beim Parsen",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [parseFile, validateRows, calculateDiff, getCurrentData]);

  const handleImport = useCallback(() => {
    if (!parsedRows || !validation?.isValid) return;

    try {
      onImport(parsedRows);
      toast({
        title: "Import erfolgreich",
        description: `${parsedRows.length} Einträge importiert`,
      });
      
      // Reset
      setFile(null);
      setParsedRows(null);
      setValidation(null);
      setDiff(null);
    } catch (err) {
      toast({
        title: "Import fehlgeschlagen",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  }, [parsedRows, validation, onImport]);

  const handleDownloadTemplate = useCallback(() => {
    // Create CSV template
    const csvContent = templateHeaders.join(";") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateSheetName}_vorlage.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [templateHeaders, templateSheetName]);

  const currentData = getCurrentData();

  return (
    <div className="space-y-6">
      {/* Current Data Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Aktuelle {title}
          </CardTitle>
          <CardDescription>
            {currentData.length} Einträge geladen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentData.length > 0 ? (
            <div className="max-h-60 overflow-y-auto space-y-1">
              {currentData.slice(0, 10).map((row) => (
                <div key={getRowId(row)} className="text-sm p-2 bg-muted/50 rounded">
                  {renderRow(row)}
                </div>
              ))}
              {currentData.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  +{currentData.length - 10} weitere...
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Keine Daten vorhanden. Importieren Sie eine XLSX/CSV-Datei.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title} importieren
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="flex-1"
              disabled={isLoading}
            />
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Vorlage
            </Button>
          </div>

          {file && (
            <p className="text-sm text-muted-foreground">
              Datei: <span className="font-medium">{file.name}</span>{" "}
              ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Wird verarbeitet...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {validation.isValid ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  Validierung erfolgreich
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Validierungsfehler
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validation.errors.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {validation.errors.map((err, i) => (
                  <Alert key={i} variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      <span className="font-medium">{err.field}</span>
                      {err.row && <span> (Zeile {err.row})</span>}: {err.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="space-y-2 mt-3 max-h-40 overflow-y-auto">
                {validation.warnings.map((warn, i) => (
                  <Alert key={i} className="py-2 border-yellow-500/50">
                    <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-400">
                      <span className="font-medium">{warn.field}</span>
                      {warn.row && <span> (Zeile {warn.row})</span>}: {warn.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diff Preview */}
      {diff && validation?.isValid && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Änderungsvorschau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <p className="font-semibold text-green-700 dark:text-green-400">Hinzugefügt</p>
                <p className="text-2xl font-bold">{diff.summary.added}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <p className="font-semibold text-yellow-700 dark:text-yellow-400">Geändert</p>
                <p className="text-2xl font-bold">{diff.summary.changed}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <p className="font-semibold text-red-700 dark:text-red-400">Entfernt</p>
                <p className="text-2xl font-bold">{diff.summary.removed}</p>
              </div>
            </div>

            {diff.items.length > 0 && (
              <div className="mt-4 space-y-1 max-h-40 overflow-y-auto">
                {diff.items.slice(0, 10).map((item) => (
                  <div 
                    key={item.id} 
                    className={`text-sm p-2 rounded ${
                      item.type === "added" ? "bg-green-50 dark:bg-green-950/20" :
                      item.type === "changed" ? "bg-yellow-50 dark:bg-yellow-950/20" :
                      "bg-red-50 dark:bg-red-950/20"
                    }`}
                  >
                    <Badge variant="outline" className="mr-2">
                      {item.type === "added" ? "+" : item.type === "changed" ? "~" : "-"}
                    </Badge>
                    {item.id}
                  </div>
                ))}
                {diff.items.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    +{diff.items.length - 10} weitere Änderungen
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {parsedRows && validation?.isValid && (
        <Button onClick={handleImport} className="w-full" size="lg">
          <Upload className="h-4 w-4 mr-2" />
          {parsedRows.length} Einträge importieren
        </Button>
      )}
    </div>
  );
}
