import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Download, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  FileSpreadsheet,
  ArrowLeft,
  Info,
} from "lucide-react";
import { 
  parseXLSX,
  validateParsedSheets,
  transformToCanonical,
  validateDataset,
  diffDatasets,
  formatDiffSummary,
  type ValidationResult,
  type DiffResult,
  type CanonicalDataset,
} from "@/margenkalkulator/dataManager";
import { 
  saveCustomDataset, 
  clearCustomDataset,
  loadCustomDataset,
} from "@/margenkalkulator/dataManager/storage";
import { getActiveDatasetVersion } from "@/margenkalkulator/engine/catalogResolver";
import { businessCatalog2025_09 } from "@/margenkalkulator/data/business/v2025_09";
import { toast } from "@/hooks/use-toast";

export default function DataManager() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CanonicalDataset | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeVersion, setActiveVersion] = useState(getActiveDatasetVersion());

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setIsLoading(true);
    setParsedData(null);
    setValidation(null);
    setDiff(null);
    
    try {
      // Step 1: Parse XLSX
      const sheets = await parseXLSX(selectedFile);
      
      // Step 2: Validate parsed sheets
      const sheetsValidation = validateParsedSheets(sheets);
      
      if (!sheetsValidation.isValid) {
        setValidation(sheetsValidation);
        return;
      }
      
      // Step 3: Transform to canonical format
      const canonical = transformToCanonical(sheets);
      
      // Step 4: Validate canonical dataset
      const datasetValidation = validateDataset(canonical);
      setValidation(datasetValidation);
      
      if (!datasetValidation.isValid) {
        return;
      }
      
      setParsedData(canonical);
      
      // Step 5: Calculate diff against current dataset
      const currentCanonical = loadCustomDataset() ?? convertCatalogToCanonical(businessCatalog2025_09);
      const diffResult = diffDatasets(
        currentCanonical as unknown as Record<string, { id: string }[]>,
        canonical as unknown as Record<string, { id: string }[]>
      );
      setDiff(diffResult);
      
    } catch (err) {
      toast({
        title: "Fehler beim Parsen",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleApply = useCallback(() => {
    if (!parsedData || !validation?.isValid) return;
    
    try {
      saveCustomDataset(parsedData);
      setActiveVersion(`custom: ${parsedData.meta.datasetVersion}`);
      toast({
        title: "Dataset aktiviert",
        description: `Version "${parsedData.meta.datasetVersion}" ist jetzt aktiv.`,
      });
    } catch (err) {
      toast({
        title: "Fehler beim Speichern",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  }, [parsedData, validation]);

  const handleReset = useCallback(() => {
    clearCustomDataset();
    setActiveVersion("business-2025-09");
    setParsedData(null);
    setValidation(null);
    setDiff(null);
    setFile(null);
    toast({
      title: "Zurückgesetzt",
      description: "Standard-Dataset (business-2025-09) ist wieder aktiv.",
    });
  }, []);

  const handleExport = useCallback(() => {
    const customDataset = loadCustomDataset();
    const dataToExport = customDataset ?? convertCatalogToCanonical(businessCatalog2025_09);
    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dataset_${activeVersion.replace(/[^a-zA-Z0-9-_]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeVersion]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Daten verwalten</h1>
          <p className="text-sm text-muted-foreground">
            Tarife, Produkte und Preise per XLSX/CSV aktualisieren
          </p>
        </div>
      </div>

      {/* Active Dataset Info */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Aktives Dataset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
                {activeVersion}
              </p>
              {activeVersion.startsWith("custom:") && (
                <Badge variant="secondary" className="ml-2">
                  Benutzerdefiniert
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              {activeVersion.startsWith("custom:") && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Datei importieren
          </CardTitle>
          <CardDescription>
            XLSX-Datei mit den erforderlichen Sheets hochladen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="mb-4"
            disabled={isLoading}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Datei: <span className="font-medium">{file.name}</span>{" "}
              ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
          {isLoading && (
            <p className="text-sm text-muted-foreground animate-pulse mt-2">
              Wird verarbeitet...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validation && (
        <Card className="mb-6">
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
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {validation.errors.map((err, i) => (
                  <Alert key={i} variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      <span className="font-medium">{err.sheet}</span>
                      {err.row && <span> (Zeile {err.row})</span>}
                      : {err.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium text-muted-foreground">Hinweise:</p>
                {validation.warnings.map((warn, i) => (
                  <Alert key={i} className="py-2">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {warn.sheet}: {warn.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
            {validation.isValid && validation.errors.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Alle Pflichtfelder vorhanden, IDs eindeutig, keine negativen Preise.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diff Preview */}
      {diff && validation?.isValid && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Änderungsvorschau</CardTitle>
            <CardDescription>{formatDiffSummary(diff)}</CardDescription>
          </CardHeader>
          <CardContent>
            {diff.breakingRisk && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Achtung: Breaking Changes</AlertTitle>
                <AlertDescription>
                  IDs werden entfernt – bestehende Angebote könnten ungültig werden!
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <p className="font-semibold text-green-700 dark:text-green-400">
                  Hinzugefügt
                </p>
                <p className="text-2xl font-bold">{diff.summary.totalAdded}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                  Geändert
                </p>
                <p className="text-2xl font-bold">{diff.summary.totalChanged}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <p className="font-semibold text-red-700 dark:text-red-400">
                  Entfernt
                </p>
                <p className="text-2xl font-bold">{diff.summary.totalRemoved}</p>
              </div>
            </div>
            
            {/* Show changed items details */}
            {diff.changed.length > 0 && (
              <div className="mt-4">
                <Separator className="my-4" />
                <p className="text-sm font-medium mb-2">Geänderte Einträge:</p>
                <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                  {diff.changed.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex gap-2 text-muted-foreground">
                      <span className="font-mono">{item.id}</span>
                      <span>({item.entityType})</span>
                      {item.changes && (
                        <span className="text-foreground">
                          → {item.changes.map(c => c.field).join(", ")}
                        </span>
                      )}
                    </div>
                  ))}
                  {diff.changed.length > 10 && (
                    <p className="text-muted-foreground">
                      ... und {diff.changed.length - 10} weitere
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Apply Button */}
      {parsedData && validation?.isValid && (
        <Button 
          onClick={handleApply} 
          className="w-full" 
          size="lg"
          disabled={diff?.breakingRisk && diff.summary.totalRemoved > 0}
        >
          <Upload className="h-4 w-4 mr-2" />
          Dataset aktivieren
          {parsedData.meta.datasetVersion && (
            <Badge variant="secondary" className="ml-2">
              {parsedData.meta.datasetVersion}
            </Badge>
          )}
        </Button>
      )}

      {/* Help Section */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">XLSX-Template</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p className="mb-2">Die XLSX-Datei muss folgende Sheets enthalten:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><code className="text-xs bg-muted px-1 rounded">meta</code> – Dataset-Version und Gültigkeit</li>
            <li><code className="text-xs bg-muted px-1 rounded">mobile_tariffs</code> – Mobilfunk-Tarife</li>
            <li><code className="text-xs bg-muted px-1 rounded">fixednet_products</code> – Festnetz-Produkte</li>
            <li><code className="text-xs bg-muted px-1 rounded">sub_variants</code> – SUB-Varianten</li>
            <li><code className="text-xs bg-muted px-1 rounded">promos_possible</code> – Aktionen/Promos</li>
          </ul>
          <p className="mt-4 text-xs">
            Optionale Sheets: mobile_features, mobile_dependencies, hardware_catalog
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper: Convert existing Catalog to CanonicalDataset format for diff comparison
function convertCatalogToCanonical(catalog: typeof businessCatalog2025_09): Partial<CanonicalDataset> {
  return {
    meta: {
      datasetVersion: catalog.version,
      validFromISO: catalog.validFrom ?? "2025-09-01",
      verifiedAtISO: new Date().toISOString().split("T")[0],
    },
    mobileTariffs: catalog.mobileTariffs.map(t => ({
      id: t.id,
      family: t.family ?? "prime",
      name: t.name,
      minTermMonths: t.minTermMonths ?? 24,
      base_sim_only_net: t.baseNet,
      data_de: t.dataVolumeGB ?? 0,
      eu_rule: t.euRoamingHighspeedGB ? "numeric" as const : "text" as const,
      eu_data_gb: t.euRoamingHighspeedGB,
      active: true,
    })),
    fixedNetProducts: catalog.fixedNetProducts.map(p => ({
      id: p.id,
      access_type: p.accessType ?? "CABLE",
      name: p.name,
      minTermMonths: 24,
      monthly_net: p.monthlyNet,
      router_included: p.includesRouter ?? false,
      one_time_setup_net: p.oneTimeNet,
      one_time_shipping_net: 0,
      fixed_ip_included: p.fixedIpIncluded ?? false,
      active: true,
    })),
    subVariants: catalog.subVariants.map(sv => ({
      id: sv.id as string,
      label: sv.label,
      monthly_add_net: sv.monthlyAddNet,
    })),
    promos: catalog.promos.map(p => ({
      id: p.id,
      applies_to: p.appliesTo ?? "both" as const,
      type: p.type as "PCT_OFF_BASE" | "ABS_OFF_BASE" | "INTRO_PRICE",
      duration_months: p.durationMonths,
      pct: p.type === "PCT_OFF_BASE" ? p.value : undefined,
    })),
    mobileFeatures: [],
    mobileDependencies: [],
    hardwareCatalog: [],
  };
}
