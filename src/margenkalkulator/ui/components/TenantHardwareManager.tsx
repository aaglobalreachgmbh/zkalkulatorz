// ============================================
// Tenant Hardware Manager
// CSV/XLSX Upload für mandantenspezifische Hardware-EK-Preise
// ============================================

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Upload, FileSpreadsheet, Trash2, Check, AlertTriangle, Download, Loader2, 
  Plus, Minus, RefreshCw, History, Clock 
} from "lucide-react";
import { useTenantHardware, type TenantHardwareInput } from "@/margenkalkulator/hooks/useTenantHardware";
import { useHardwareImports, type HardwareImportInput } from "@/margenkalkulator/hooks/useHardwareImports";
import { 
  parseHardwareXLSX, 
  parseHardwareCSV, 
  validateHardwareRows, 
  diffHardware,
  generateHardwareTemplate,
  type HardwareItemRow,
  type HardwareDiffResult
} from "@/margenkalkulator/dataManager/importers/hardwareImporter";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface ParsedRow {
  hardware_id: string;
  brand: string;
  model: string;
  category: string;
  ek_net: number;
}

interface ValidationResult {
  valid: ParsedRow[];
  errors: string[];
  warnings: string[];
}

export function TenantHardwareManager() {
  const { hardware, isLoading, bulkImport, clearAll, isUploading, hasData } = useTenantHardware();
  const { history, isLoading: historyLoading, logImport } = useHardwareImports();
  const [parseResult, setParseResult] = useState<ValidationResult | null>(null);
  const [diffResult, setDiffResult] = useState<HardwareDiffResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [fileType, setFileType] = useState<"csv" | "xlsx">("csv");

  // Convert current hardware to HardwareItemRow format for diffing
  const currentHardwareRows = useMemo((): HardwareItemRow[] => {
    return hardware.map(h => ({
      id: h.hardware_id,
      brand: h.brand,
      model: h.model,
      category: (h.category ?? "smartphone") as HardwareItemRow["category"],
      ek_net: h.ek_net,
      active: true,
    }));
  }, [hardware]);

  const validateAndConvert = (rows: HardwareItemRow[]): ValidationResult => {
    const validation = validateHardwareRows(rows);
    
    // Convert error objects to strings
    const errorStrings = validation.errors.map(e => 
      e.row ? `Zeile ${e.row}: ${e.message}` : e.message
    );

    const valid: ParsedRow[] = validation.isValid
      ? rows.map(row => ({
          hardware_id: row.id,
          brand: row.brand,
          model: row.model,
          category: row.category ?? "smartphone",
          ek_net: row.ek_net,
        }))
      : [];

    return {
      valid,
      errors: errorStrings,
      warnings: validation.warnings,
    };
  };

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    
    try {
      let rows: HardwareItemRow[];
      
      // Detect file type and parse accordingly
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        setFileType("xlsx");
        rows = await parseHardwareXLSX(file);
      } else {
        setFileType("csv");
        rows = await parseHardwareCSV(file);
      }

      // Validate rows
      const validation = validateAndConvert(rows);
      setParseResult(validation);

      // Calculate diff if we have existing data
      if (currentHardwareRows.length > 0 && validation.valid.length > 0) {
        const parsedAsHardwareRows: HardwareItemRow[] = validation.valid.map(v => ({
          id: v.hardware_id,
          brand: v.brand,
          model: v.model,
          category: v.category as HardwareItemRow["category"],
          ek_net: v.ek_net,
          active: true,
        }));
        const diff = diffHardware(currentHardwareRows, parsedAsHardwareRows);
        setDiffResult(diff);
      } else {
        setDiffResult(null);
      }
    } catch (error) {
      setParseResult({
        valid: [],
        errors: [`Datei-Parsing-Fehler: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`],
        warnings: [],
      });
      setDiffResult(null);
    }
  }, [currentHardwareRows]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleImport = async () => {
    if (!parseResult?.valid.length) return;
    
    const items: TenantHardwareInput[] = parseResult.valid.map((row, index) => ({
      hardware_id: row.hardware_id,
      brand: row.brand,
      model: row.model,
      category: row.category,
      ek_net: row.ek_net,
      sort_order: index,
    }));

    try {
      await bulkImport(items);
      
      // Log the import
      const importLog: HardwareImportInput = {
        file_name: fileName,
        file_type: fileType,
        status: "completed",
        total_rows: parseResult.valid.length,
        added_count: diffResult?.summary.added ?? parseResult.valid.length,
        changed_count: diffResult?.summary.changed ?? 0,
        removed_count: diffResult?.summary.removed ?? 0,
        error_count: parseResult.errors.length,
        warnings: parseResult.warnings,
      };
      
      await logImport(importLog);
      
      setParseResult(null);
      setDiffResult(null);
      setFileName("");
    } catch (error) {
      // Log failed import
      await logImport({
        file_name: fileName,
        file_type: fileType,
        status: "failed",
        total_rows: 0,
        added_count: 0,
        changed_count: 0,
        removed_count: 0,
        error_count: 1,
        warnings: [error instanceof Error ? error.message : "Import failed"],
      });
    }
  };

  const downloadTemplate = () => {
    const blob = generateHardwareTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hardware_vorlage.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Data Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Hardware-Katalog
              </CardTitle>
              <CardDescription>
                EK-Preise für Hardware-Geräte verwalten
              </CardDescription>
            </div>
            {hasData && (
              <Badge variant="secondary" className="text-sm">
                {hardware.length} Geräte
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Keine Hardware-Daten</AlertTitle>
              <AlertDescription>
                Bitte laden Sie Ihre Hardware-EK-Preise hoch, bevor Sie den Kalkulator verwenden können.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="max-h-64 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Marke</TableHead>
                    <TableHead>Modell</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead className="text-right">EK (netto)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hardware.slice(0, 10).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.hardware_id}</TableCell>
                      <TableCell>{item.brand}</TableCell>
                      <TableCell>{item.model}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">{item.ek_net.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                  {hardware.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        ... und {hardware.length - 10} weitere
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>CSV / Excel Import</CardTitle>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              XLSX-Vorlage
            </Button>
          </div>
          <CardDescription>
            Laden Sie eine CSV- oder Excel-Datei mit Spalten: hardware_id, brand, model, category, ek_net
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              CSV- oder Excel-Datei hierher ziehen oder
            </p>
            <Label htmlFor="hardware-upload" className="cursor-pointer">
              <Input
                id="hardware-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileInput}
              />
              <Button variant="secondary" asChild>
                <span>Datei auswählen</span>
              </Button>
            </Label>
            <p className="text-xs text-muted-foreground mt-2">
              Unterstützte Formate: .csv, .xlsx, .xls
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Diff Preview */}
      {diffResult && diffResult.items.length > 0 && (
        <Card className="border-blue-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Änderungsvorschau
            </CardTitle>
            <CardDescription>
              Vergleich mit aktuellen Daten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Badges */}
            <div className="flex flex-wrap gap-2">
              {diffResult.summary.added > 0 && (
                <Badge className="bg-green-500 hover:bg-green-600">
                  <Plus className="h-3 w-3 mr-1" />
                  {diffResult.summary.added} neu
                </Badge>
              )}
              {diffResult.summary.changed > 0 && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {diffResult.summary.changed} geändert
                </Badge>
              )}
              {diffResult.summary.removed > 0 && (
                <Badge className="bg-red-500 hover:bg-red-600">
                  <Minus className="h-3 w-3 mr-1" />
                  {diffResult.summary.removed} entfernt
                </Badge>
              )}
            </div>

            {/* Diff Table */}
            <div className="max-h-64 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Status</TableHead>
                    <TableHead>Marke</TableHead>
                    <TableHead>Modell</TableHead>
                    <TableHead className="text-right">Änderung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diffResult.items.slice(0, 15).map((item) => (
                    <TableRow 
                      key={item.id}
                      className={
                        item.type === "added" ? "bg-green-500/10" :
                        item.type === "removed" ? "bg-red-500/10" :
                        "bg-yellow-500/10"
                      }
                    >
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={
                            item.type === "added" ? "border-green-500 text-green-600" :
                            item.type === "removed" ? "border-red-500 text-red-600" :
                            "border-yellow-500 text-yellow-600"
                          }
                        >
                          {item.type === "added" ? <Plus className="h-3 w-3" /> :
                           item.type === "removed" ? <Minus className="h-3 w-3" /> :
                           <RefreshCw className="h-3 w-3" />}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.brand}</TableCell>
                      <TableCell>{item.model}</TableCell>
                      <TableCell className="text-right text-sm">
                        {item.type === "added" && (
                          <span className="text-green-600">+{item.newEkNet?.toFixed(2)} €</span>
                        )}
                        {item.type === "removed" && (
                          <span className="text-red-600 line-through">{item.oldEkNet?.toFixed(2)} €</span>
                        )}
                        {item.type === "changed" && item.changes && (
                          <span className="text-yellow-600">
                            {item.oldEkNet?.toFixed(2)} € → {item.newEkNet?.toFixed(2)} €
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {diffResult.items.length > 15 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        ... und {diffResult.items.length - 15} weitere Änderungen
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parse Result */}
      {parseResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import-Vorschau</CardTitle>
            {fileName && (
              <CardDescription>
                Datei: {fileName}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Fehler ({parseResult.errors.length})</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    {parseResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>... und {parseResult.errors.length - 5} weitere Fehler</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {parseResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warnungen ({parseResult.warnings.length})</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    {parseResult.warnings.slice(0, 5).map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Valid rows */}
            {parseResult.valid.length > 0 && (
              <>
                <Alert variant="default" className="border-green-500/50 bg-green-500/10">
                  <Check className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-600">{parseResult.valid.length} gültige Einträge</AlertTitle>
                  <AlertDescription>
                    Diese Einträge werden beim Import übernommen.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleImport} 
                    disabled={isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {parseResult.valid.length} Einträge importieren
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setParseResult(null);
                      setDiffResult(null);
                      setFileName("");
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Import-Historie
            </CardTitle>
            <CardDescription>
              Letzte 10 Importe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Datei</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Änderungen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(log.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {log.file_type.toUpperCase()}
                          </Badge>
                          <span className="text-sm truncate max-w-32">{log.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={log.status === "completed" ? "default" : 
                                   log.status === "partial" ? "secondary" : "destructive"}
                        >
                          {log.status === "completed" ? "Erfolgreich" :
                           log.status === "partial" ? "Teilweise" : "Fehlgeschlagen"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          {log.added_count > 0 && (
                            <span className="text-green-600">+{log.added_count}</span>
                          )}
                          {log.changed_count > 0 && (
                            <span className="text-yellow-600">~{log.changed_count}</span>
                          )}
                          {log.removed_count > 0 && (
                            <span className="text-red-600">-{log.removed_count}</span>
                          )}
                          {log.added_count === 0 && log.changed_count === 0 && log.removed_count === 0 && (
                            <span className="text-muted-foreground">Keine Änderungen</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      {hasData && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Gefahrenbereich</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (confirm("Wirklich alle Hardware-Daten löschen?")) {
                  clearAll();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Alle Hardware-Daten löschen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
