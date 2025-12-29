// ============================================
// Tenant Hardware Manager
// CSV/XLSX Upload für mandantenspezifische Hardware-EK-Preise
// ============================================

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, Trash2, Check, AlertTriangle, Download, Loader2 } from "lucide-react";
import { useTenantHardware, type TenantHardwareInput } from "@/margenkalkulator/hooks/useTenantHardware";
import Papa from "papaparse";

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
  const [parseResult, setParseResult] = useState<ValidationResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateRows = (rows: Record<string, unknown>[]): ValidationResult => {
    const valid: ParsedRow[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const seenIds = new Set<string>();

    rows.forEach((row, index) => {
      const lineNum = index + 2; // +2 for header and 0-indexing

      // Extract values with flexible column names
      const hardwareId = String(row.hardware_id || row.id || row.artikelnummer || row.sku || "").trim();
      const brand = String(row.brand || row.marke || row.hersteller || "").trim();
      const model = String(row.model || row.modell || row.gerät || row.name || "").trim();
      const category = String(row.category || row.kategorie || "smartphone").trim();
      
      // Parse EK price with German number format support
      let ekNet = 0;
      const ekRaw = row.ek_net || row.ek || row.einkaufspreis || row.preis || row.price || 0;
      if (typeof ekRaw === "string") {
        ekNet = parseFloat(ekRaw.replace(/\./g, "").replace(",", ".")) || 0;
      } else {
        ekNet = Number(ekRaw) || 0;
      }

      // Validation
      if (!hardwareId) {
        errors.push(`Zeile ${lineNum}: hardware_id fehlt`);
        return;
      }

      if (seenIds.has(hardwareId)) {
        warnings.push(`Zeile ${lineNum}: Duplikat '${hardwareId}' übersprungen`);
        return;
      }

      if (!brand) {
        errors.push(`Zeile ${lineNum}: Marke (brand) fehlt für ${hardwareId}`);
        return;
      }

      if (!model) {
        errors.push(`Zeile ${lineNum}: Modell (model) fehlt für ${hardwareId}`);
        return;
      }

      if (ekNet < 0) {
        errors.push(`Zeile ${lineNum}: EK-Preis negativ für ${hardwareId}`);
        return;
      }

      if (ekNet === 0) {
        warnings.push(`Zeile ${lineNum}: EK-Preis ist 0 für ${hardwareId}`);
      }

      seenIds.add(hardwareId);
      valid.push({
        hardware_id: hardwareId,
        brand,
        model,
        category,
        ek_net: ekNet,
      });
    });

    return { valid, errors, warnings };
  };

  const handleFile = useCallback(async (file: File) => {
    const text = await file.text();
    
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, "_"),
      complete: (results) => {
        const validation = validateRows(results.data as Record<string, unknown>[]);
        setParseResult(validation);
      },
      error: (error) => {
        setParseResult({
          valid: [],
          errors: [`CSV-Parsing-Fehler: ${error.message}`],
          warnings: [],
        });
      },
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleImport = () => {
    if (!parseResult?.valid.length) return;
    
    const items: TenantHardwareInput[] = parseResult.valid.map((row, index) => ({
      hardware_id: row.hardware_id,
      brand: row.brand,
      model: row.model,
      category: row.category,
      ek_net: row.ek_net,
      sort_order: index,
    }));

    bulkImport(items);
    setParseResult(null);
  };

  const downloadTemplate = () => {
    const template = `hardware_id,brand,model,category,ek_net
IPHONE_16_128,Apple,iPhone 16 128GB,smartphone,779.00
IPHONE_16_256,Apple,iPhone 16 256GB,smartphone,899.00
SAMSUNG_S24_128,Samsung,Galaxy S24 128GB,smartphone,649.00
SIM_ONLY,SIM,SIM-Only,,0.00`;
    
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hardware_vorlage.csv";
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
            <CardTitle>CSV Import</CardTitle>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Vorlage
            </Button>
          </div>
          <CardDescription>
            Laden Sie eine CSV-Datei mit Spalten: hardware_id, brand, model, category, ek_net
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
              CSV-Datei hierher ziehen oder
            </p>
            <Label htmlFor="hardware-upload" className="cursor-pointer">
              <Input
                id="hardware-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
              />
              <Button variant="secondary" asChild>
                <span>Datei auswählen</span>
              </Button>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Parse Result */}
      {parseResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import-Vorschau</CardTitle>
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
                    onClick={() => setParseResult(null)}
                  >
                    Abbrechen
                  </Button>
                </div>
              </>
            )}
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
