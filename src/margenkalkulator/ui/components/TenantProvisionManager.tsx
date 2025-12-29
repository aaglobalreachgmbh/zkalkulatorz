// ============================================
// Tenant Provision Manager
// CSV Upload für mandantenspezifische Tarif-Provisionen
// ============================================

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, CreditCard, Trash2, Check, AlertTriangle, Download, Loader2 } from "lucide-react";
import { useTenantProvisions, type TenantProvisionInput } from "@/margenkalkulator/hooks/useTenantProvisions";
import Papa from "papaparse";

interface ParsedRow {
  tariff_id: string;
  tariff_name: string;
  tariff_family: string;
  contract_type: "new" | "extension";
  provision_amount: number;
  sub_variant_id: string;
}

interface ValidationResult {
  valid: ParsedRow[];
  errors: string[];
  warnings: string[];
}

export function TenantProvisionManager() {
  const { provisions, isLoading, bulkImport, clearAll, isUploading, hasData } = useTenantProvisions();
  const [parseResult, setParseResult] = useState<ValidationResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateRows = (rows: Record<string, unknown>[]): ValidationResult => {
    const valid: ParsedRow[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const seenCombos = new Set<string>();

    rows.forEach((row, index) => {
      const lineNum = index + 2;

      // Extract values with flexible column names
      const tariffId = String(row.tariff_id || row.tarif_id || row.id || "").trim().toUpperCase();
      const tariffName = String(row.tariff_name || row.tarif_name || row.name || row.bezeichnung || "").trim();
      const tariffFamily = String(row.tariff_family || row.tarif_family || row.familie || "").trim();
      
      // Contract type
      const contractRaw = String(row.contract_type || row.vertragsart || row.type || "new").trim().toLowerCase();
      const contractType = contractRaw === "extension" || contractRaw === "verlängerung" || contractRaw === "vvl" 
        ? "extension" 
        : "new";
      
      // Sub-variant
      const subVariantId = String(row.sub_variant_id || row.sub_variant || row.variante || "").trim().toUpperCase();

      // Parse provision amount with German number format support
      let provisionAmount = 0;
      const provRaw = row.provision_amount || row.provision || row.prov || row.betrag || 0;
      if (typeof provRaw === "string") {
        provisionAmount = parseFloat(provRaw.replace(/\./g, "").replace(",", ".")) || 0;
      } else {
        provisionAmount = Number(provRaw) || 0;
      }

      // Validation
      if (!tariffId) {
        errors.push(`Zeile ${lineNum}: tariff_id fehlt`);
        return;
      }

      if (!tariffName) {
        errors.push(`Zeile ${lineNum}: tariff_name fehlt für ${tariffId}`);
        return;
      }

      // Check for duplicates
      const comboKey = `${tariffId}|${contractType}|${subVariantId}`;
      if (seenCombos.has(comboKey)) {
        warnings.push(`Zeile ${lineNum}: Duplikat für ${tariffId} (${contractType}/${subVariantId || "default"}) übersprungen`);
        return;
      }

      if (provisionAmount < 0) {
        errors.push(`Zeile ${lineNum}: Provision negativ für ${tariffId}`);
        return;
      }

      if (provisionAmount === 0) {
        warnings.push(`Zeile ${lineNum}: Provision ist 0 für ${tariffId}`);
      }

      seenCombos.add(comboKey);
      valid.push({
        tariff_id: tariffId,
        tariff_name: tariffName,
        tariff_family: tariffFamily,
        contract_type: contractType,
        provision_amount: provisionAmount,
        sub_variant_id: subVariantId,
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
    if (file && file.name.endsWith(".csv")) {
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
    
    const items: TenantProvisionInput[] = parseResult.valid.map((row) => ({
      tariff_id: row.tariff_id,
      tariff_name: row.tariff_name,
      tariff_family: row.tariff_family || undefined,
      contract_type: row.contract_type,
      provision_amount: row.provision_amount,
      sub_variant_id: row.sub_variant_id || undefined,
    }));

    bulkImport(items);
    setParseResult(null);
  };

  const downloadTemplate = () => {
    const template = `tariff_id,tariff_name,tariff_family,contract_type,provision_amount,sub_variant_id
PRIME_XS,Business Prime XS,Prime,new,300,
PRIME_XS,Business Prime XS,Prime,extension,150,
PRIME_S,Business Prime S,Prime,new,350,
PRIME_S,Business Prime S,Prime,extension,175,
PRIME_M,Business Prime M,Prime,new,450,SIM_ONLY
PRIME_M,Business Prime M,Prime,new,400,SMARTPHONE
PRIME_L,Business Prime L,Prime,new,550,
SMART_S,Smart Business S,Smart,new,200,
SMART_M,Smart Business M,Smart,new,280,`;
    
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "provisionen_vorlage.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group provisions by tariff for display
  const groupedProvisions = provisions.reduce((acc, prov) => {
    const key = prov.tariff_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(prov);
    return acc;
  }, {} as Record<string, typeof provisions>);

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
                <CreditCard className="h-5 w-5" />
                Provisions-Tabelle
              </CardTitle>
              <CardDescription>
                Provisionen pro Tarif und Vertragsart verwalten
              </CardDescription>
            </div>
            {hasData && (
              <Badge variant="secondary" className="text-sm">
                {provisions.length} Einträge ({Object.keys(groupedProvisions).length} Tarife)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Keine Provisions-Daten</AlertTitle>
              <AlertDescription>
                Bitte laden Sie Ihre Provisions-Tabelle hoch, bevor Sie den Kalkulator verwenden können.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="max-h-80 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarif-ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Vertragsart</TableHead>
                    <TableHead>Variante</TableHead>
                    <TableHead className="text-right">Provision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {provisions.slice(0, 15).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.tariff_id}</TableCell>
                      <TableCell>{item.tariff_name}</TableCell>
                      <TableCell>
                        <Badge variant={item.contract_type === "new" ? "default" : "secondary"}>
                          {item.contract_type === "new" ? "Neuvertrag" : "Verlängerung"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.sub_variant_id || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.provision_amount.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                  {provisions.length > 15 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        ... und {provisions.length - 15} weitere
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
            Laden Sie eine CSV-Datei mit Spalten: tariff_id, tariff_name, contract_type, provision_amount, sub_variant_id (optional)
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
            <Label htmlFor="provision-upload" className="cursor-pointer">
              <Input
                id="provision-upload"
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
                if (confirm("Wirklich alle Provisions-Daten löschen?")) {
                  clearAll();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Alle Provisions-Daten löschen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
