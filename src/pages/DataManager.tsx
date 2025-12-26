import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  validateDataset,
  diffDatasets,
  formatDiffSummary,
  parseXLSXUnified,
  businessCatalog2025_09,
  type ValidationResult,
  type DiffResult,
  type CanonicalDataset,
  type UnifiedParseResult,
  type FormatDetectionResult,
} from "@/margenkalkulator";
import { toast } from "@/hooks/use-toast";
import { useIdentity } from "@/contexts/IdentityContext";
import { 
  StatusBadge, 
  DatasetCard, 
  WorkflowLegend 
} from "@/components/DatasetWorkflow";
import {
  loadDatasetRegistry,
  loadDatasetPayload,
  createDraftDataset,
  transitionDatasetStatus,
  getActiveDatasetId,
  getActiveDataset,
  canImport,
  type ManagedDataset,
  type DatasetStatus,
} from "@/lib/datasetGovernance";
import { logDatasetImport, logDatasetStatusChange } from "@/lib/auditLog";

export default function DataManager() {
  const { identity } = useIdentity();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CanonicalDataset | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [detection, setDetection] = useState<FormatDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewDatasetId, setPreviewDatasetId] = useState<string | null>(null);
  
  // Load datasets from governance storage
  const [datasets, setDatasets] = useState<ManagedDataset[]>(() => 
    loadDatasetRegistry(identity.tenantId, identity.departmentId)
  );
  const activeDatasetId = getActiveDatasetId(identity.tenantId, identity.departmentId);
  const activeDataset = getActiveDataset(identity.tenantId, identity.departmentId);

  const refreshDatasets = useCallback(() => {
    setDatasets(loadDatasetRegistry(identity.tenantId, identity.departmentId));
  }, [identity.tenantId, identity.departmentId]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setIsLoading(true);
    setParsedData(null);
    setValidation(null);
    setDiff(null);
    setDetection(null);
    
    try {
      // Step 1: Parse XLSX with unified parser
      const result: UnifiedParseResult = await parseXLSXUnified(selectedFile);
      
      setDetection(result.detection);
      
      // Step 2: Validate
      const datasetValidation = validateDataset(result.canonical);
      setValidation(datasetValidation);
      
      if (!datasetValidation.isValid) {
        return;
      }
      
      setParsedData(result.canonical);
      
      // Step 3: Calculate diff against active dataset or default
      const currentCanonical = activeDataset?.payload ?? convertCatalogToCanonical(businessCatalog2025_09);
      const diffResult = diffDatasets(
        currentCanonical as unknown as Record<string, { id: string }[]>,
        result.canonical as unknown as Record<string, { id: string }[]>
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
  }, [activeDataset]);

  // Create draft instead of direct apply
  const handleCreateDraft = useCallback(() => {
    if (!parsedData || !validation?.isValid) return;
    if (!canImport(identity.role)) {
      toast({ title: "Keine Berechtigung", variant: "destructive" });
      return;
    }
    
    try {
      const newDataset = createDraftDataset(
        identity.tenantId,
        identity.departmentId,
        parsedData,
        identity.userId,
        identity.displayName
      );
      
      // Audit log
      logDatasetImport(
        identity.tenantId,
        identity.departmentId,
        identity.userId,
        identity.displayName,
        identity.role,
        newDataset.datasetId,
        newDataset.datasetVersion
      );
      
      refreshDatasets();
      
      // Reset form
      setFile(null);
      setParsedData(null);
      setValidation(null);
      setDiff(null);
      setDetection(null);
      
      toast({
        title: "Entwurf erstellt",
        description: `Version "${newDataset.datasetVersion}" als Entwurf gespeichert.`,
      });
    } catch (err) {
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  }, [parsedData, validation, identity, refreshDatasets]);

  const handleTransition = useCallback((datasetId: string, newStatus: DatasetStatus) => {
    const dataset = datasets.find(d => d.datasetId === datasetId);
    if (!dataset) return;
    
    const oldStatus = dataset.status;
    
    const result = transitionDatasetStatus(
      identity.tenantId,
      identity.departmentId,
      datasetId,
      newStatus,
      identity.userId,
      identity.displayName
    );
    
    if (result) {
      // Audit log
      logDatasetStatusChange(
        identity.tenantId,
        identity.departmentId,
        identity.userId,
        identity.displayName,
        identity.role,
        datasetId,
        oldStatus,
        newStatus
      );
      
      refreshDatasets();
      toast({
        title: "Status geändert",
        description: `${result.datasetVersion} → ${newStatus}`,
      });
    }
  }, [datasets, identity, refreshDatasets]);

  const handlePreview = useCallback((datasetId: string) => {
    setPreviewDatasetId(datasetId === previewDatasetId ? null : datasetId);
  }, [previewDatasetId]);

  const handleExport = useCallback(() => {
    const dataToExport = activeDataset?.payload ?? convertCatalogToCanonical(businessCatalog2025_09);
    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dataset_${activeDataset?.meta.datasetVersion ?? "default"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeDataset]);

  // Group datasets by status
  const draftDatasets = datasets.filter(d => d.status === "draft");
  const reviewDatasets = datasets.filter(d => d.status === "review");
  const publishedDatasets = datasets.filter(d => d.status === "published");
  const archivedDatasets = datasets.filter(d => d.status === "archived");

  return (
    <div className="container mx-auto p-6 max-w-5xl">
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
            Governance-gesteuerte Dataset-Verwaltung für {identity.departmentId}
          </p>
        </div>
      </div>

      {/* Workflow Legend */}
      <WorkflowLegend />

      <Tabs defaultValue="datasets" className="mt-6">
        <TabsList>
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="import">Importieren</TabsTrigger>
        </TabsList>

        {/* Datasets Tab */}
        <TabsContent value="datasets" className="space-y-6">
          {/* Active Dataset */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Aktives Dataset
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeDataset ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
                      {activeDataset.meta.datasetVersion}
                    </p>
                    <Badge variant="default" className="ml-2 bg-green-600">Aktiv</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Erstellt von {activeDataset.meta.createdByName}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Kein aktives Dataset. Standard-Katalog wird verwendet (business-2025-09).
                </p>
              )}
            </CardContent>
          </Card>

          {/* Datasets by Status */}
          {reviewDatasets.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">In Prüfung ({reviewDatasets.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reviewDatasets.map(ds => (
                  <DatasetCard 
                    key={ds.datasetId} 
                    dataset={ds}
                    onTransition={handleTransition}
                    onPreview={handlePreview}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {draftDatasets.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Entwürfe ({draftDatasets.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {draftDatasets.map(ds => (
                  <DatasetCard 
                    key={ds.datasetId} 
                    dataset={ds}
                    onTransition={handleTransition}
                    onPreview={handlePreview}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {archivedDatasets.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-muted-foreground">
                  Archiv ({archivedDatasets.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {archivedDatasets.slice(0, 5).map(ds => (
                  <DatasetCard 
                    key={ds.datasetId} 
                    dataset={ds}
                    onTransition={handleTransition}
                    onPreview={handlePreview}
                  />
                ))}
                {archivedDatasets.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{archivedDatasets.length - 5} weitere archiviert
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {datasets.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Datasets vorhanden.</p>
                <p className="text-sm">Importieren Sie ein neues Dataset über den "Importieren" Tab.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Datei importieren
              </CardTitle>
              <CardDescription>
                XLSX-Datei hochladen → Validieren → Als Entwurf speichern
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

          {/* Format Detection */}
          {detection && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>
                Erkanntes Format: {detection.format === "BUSINESS" ? "Business (SoHo/PK)" : detection.format}
              </AlertTitle>
              <AlertDescription>
                {detection.format === "BUSINESS" && detection.sheets.length > 0 && (
                  <span>
                    {detection.sheets.length} Sheet(s):{" "}
                    {detection.sheets.map((s, i) => (
                      <Badge key={i} variant="outline" className="mr-1">{s.name}</Badge>
                    ))}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Validation */}
          {validation && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {validation.isValid ? (
                    <><Check className="h-5 w-5 text-green-600" /> Validierung erfolgreich</>
                  ) : (
                    <><AlertTriangle className="h-5 w-5 text-destructive" /> Validierungsfehler</>
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
                          {err.row && <span> (Zeile {err.row})</span>}: {err.message}
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
                    <p className="font-semibold text-green-700 dark:text-green-400">Hinzugefügt</p>
                    <p className="text-2xl font-bold">{diff.summary.totalAdded}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                    <p className="font-semibold text-yellow-700 dark:text-yellow-400">Geändert</p>
                    <p className="text-2xl font-bold">{diff.summary.totalChanged}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <p className="font-semibold text-red-700 dark:text-red-400">Entfernt</p>
                    <p className="text-2xl font-bold">{diff.summary.totalRemoved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create Draft Button */}
          {parsedData && validation?.isValid && (
            <Button 
              onClick={handleCreateDraft} 
              className="w-full" 
              size="lg"
              disabled={diff?.breakingRisk && diff.summary.totalRemoved > 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              Als Entwurf speichern
              {parsedData.meta.datasetVersion && (
                <Badge variant="secondary" className="ml-2">
                  {parsedData.meta.datasetVersion}
                </Badge>
              )}
            </Button>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Governance-Workflow</AlertTitle>
            <AlertDescription>
              Importierte Datasets werden als Entwurf gespeichert. Ein Manager muss sie zur Prüfung freigeben, 
              und ein Admin muss sie veröffentlichen, bevor sie für Berechnungen aktiv werden.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper: Convert existing Catalog to CanonicalDataset format
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
      speed_mbit: p.speed,
      router_included: p.includesRouter ?? true,
      one_time_setup_net: p.setupWaived ? 0 : 19.90,
      one_time_shipping_net: 8.40,
      fixed_ip_included: p.fixedIpIncluded ?? false,
      active: true,
    })),
  };
}
