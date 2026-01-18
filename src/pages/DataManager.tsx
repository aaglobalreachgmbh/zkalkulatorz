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
  FileText,
  ArrowLeft,
  Info,
  Zap,
  Package,
  Euro,
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
import {
  parsePdf,
  validatePdfFile,
  parseProvisionPdf,
  parseHardwarePdf,
  diffHardware,
  type PdfDetectionResult,
  type PdfFormatType,
} from "@/margenkalkulator/dataManager/importers";
import type { HardwareItemRow, ProvisionRow, OMOMatrixRow } from "@/margenkalkulator/dataManager/types";
import { toast } from "sonner";
import { useIdentity } from "@/contexts/IdentityContext";
import { useFeature } from "@/hooks/useFeature";
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
import { ProductTabs } from "@/margenkalkulator/ui/components/ProductTabs";
import { DatasetVersionManager } from "@/margenkalkulator/ui/components/DatasetVersionManager";

// PDF Import Result Type
type PdfImportResult = {
  format: PdfFormatType;
  hardware?: HardwareItemRow[];
  provisions?: ProvisionRow[];
  omoMatrix?: OMOMatrixRow[];
  warnings: string[];
  errors: string[];
  rowsExtracted: number;
};

export default function DataManager() {
  const { identity } = useIdentity();
  const { enabled: canBypassApproval } = useFeature("adminBypassApproval");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CanonicalDataset | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [detection, setDetection] = useState<FormatDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewDatasetId, setPreviewDatasetId] = useState<string | null>(null);
  
  // PDF Import State
  const [pdfDetection, setPdfDetection] = useState<PdfDetectionResult | null>(null);
  const [pdfResult, setPdfResult] = useState<PdfImportResult | null>(null);
  
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
    setPdfDetection(null);
    setPdfResult(null);
    
    const isPdf = selectedFile.type.includes("pdf") || selectedFile.name.toLowerCase().endsWith(".pdf");
    
    try {
      if (isPdf) {
        // PDF Import Flow
        const pdfValidation = validatePdfFile(selectedFile);
        if (!pdfValidation.valid) {
          toast.error(pdfValidation.error || "Ungültige PDF");
          return;
        }
        
        // Extract text and detect format
        const { detection: pdfDet, pages } = await parsePdf(selectedFile);
        setPdfDetection(pdfDet);
        
        // Parse based on detected format
        if (pdfDet.format === "provision_tkworld") {
          const result = parseProvisionPdf(pages);
          setPdfResult({
            format: "provision_tkworld",
            provisions: result.data[0]?.provisions ?? [],
            omoMatrix: result.data[0]?.omoMatrix ?? [],
            warnings: result.warnings,
            errors: result.errors,
            rowsExtracted: result.meta.rowsExtracted,
          });
        } else if (pdfDet.format === "hardware_distri") {
          const result = parseHardwarePdf(pages);
          setPdfResult({
            format: "hardware_distri",
            hardware: result.data,
            warnings: result.warnings,
            errors: result.errors,
            rowsExtracted: result.meta.rowsExtracted,
          });
        } else {
          toast.error("PDF konnte nicht als Provisionsliste oder Hardware-Preisliste identifiziert werden");
        }
      } else {
        // XLSX Import Flow (existing)
        const result: UnifiedParseResult = await parseXLSXUnified(selectedFile);
        
        setDetection(result.detection);
        
        const datasetValidation = validateDataset(result.canonical);
        setValidation(datasetValidation);
        
        if (!datasetValidation.isValid) {
          return;
        }
        
        setParsedData(result.canonical);
        
        const currentCanonical = activeDataset?.payload ?? convertCatalogToCanonical(businessCatalog2025_09);
        const diffResult = diffDatasets(
          currentCanonical as unknown as Record<string, { id: string }[]>,
          result.canonical as unknown as Record<string, { id: string }[]>
        );
        setDiff(diffResult);
      }
      
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Parsen");
    } finally {
      setIsLoading(false);
    }
  }, [activeDataset]);

  // Create draft instead of direct apply (or bypass if admin feature enabled)
  const handleCreateDraft = useCallback((publishImmediately: boolean = false) => {
    if (!parsedData || !validation?.isValid) return;
    if (!canImport(identity.role)) {
      toast.error("Keine Berechtigung");
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
      
      // If bypass enabled and requested, immediately publish
      if (publishImmediately && canBypassApproval) {
        // Skip draft → review → published, go directly to published
        transitionDatasetStatus(
          identity.tenantId,
          identity.departmentId,
          newDataset.datasetId,
          "published",
          identity.userId,
          identity.displayName
        );
        
        logDatasetStatusChange(
          identity.tenantId,
          identity.departmentId,
          identity.userId,
          identity.displayName,
          identity.role,
          newDataset.datasetId,
          "draft",
          "published"
        );
        
        toast.success(`Version "${newDataset.datasetVersion}" direkt veröffentlicht`);
      } else {
        toast.success(`Version "${newDataset.datasetVersion}" als Entwurf gespeichert`);
      }
      
      refreshDatasets();
      
      // Reset form
      setFile(null);
      setParsedData(null);
      setValidation(null);
      setDiff(null);
      setDetection(null);
      
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    }
  }, [parsedData, validation, identity, refreshDatasets, canBypassApproval]);

  // Create draft from PDF data
  const handlePdfImport = useCallback(() => {
    if (!pdfResult || pdfResult.errors.length > 0) return;
    if (!canImport(identity.role)) {
      toast.error("Keine Berechtigung");
      return;
    }
    
    try {
      // Build partial dataset from PDF results
      const pdfDataset: Partial<CanonicalDataset> = {
        meta: {
          datasetVersion: `pdf-import-${new Date().toISOString().slice(0, 10)}`,
          validFromISO: new Date().toISOString().slice(0, 10),
          verifiedAtISO: new Date().toISOString().slice(0, 10),
          notes: `PDF-Import: ${file?.name || "Unbekannt"}`,
        },
      };
      
      if (pdfResult.hardware && pdfResult.hardware.length > 0) {
        pdfDataset.hardwareCatalog = pdfResult.hardware;
      }
      if (pdfResult.provisions && pdfResult.provisions.length > 0) {
        pdfDataset.provisions = pdfResult.provisions;
      }
      if (pdfResult.omoMatrix && pdfResult.omoMatrix.length > 0) {
        pdfDataset.omoMatrix = pdfResult.omoMatrix;
      }
      
      const newDataset = createDraftDataset(
        identity.tenantId,
        identity.departmentId,
        pdfDataset as CanonicalDataset,
        identity.userId,
        identity.displayName
      );
      
      logDatasetImport(
        identity.tenantId,
        identity.departmentId,
        identity.userId,
        identity.displayName,
        identity.role,
        newDataset.datasetId,
        newDataset.datasetVersion
      );
      
      toast.success(`${pdfResult.rowsExtracted} Einträge als PDF-Entwurf gespeichert`);
      
      refreshDatasets();
      setFile(null);
      setPdfDetection(null);
      setPdfResult(null);
      
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    }
  }, [pdfResult, file, identity, refreshDatasets]);

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
      toast.success(`${result.datasetVersion} → ${newStatus}`);
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

      <Tabs defaultValue="produkte" className="mt-6">
        <TabsList>
          <TabsTrigger value="produkte">Produkte</TabsTrigger>
          <TabsTrigger value="versionen">Provisions-Versionen</TabsTrigger>
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="import">Importieren</TabsTrigger>
        </TabsList>

        {/* Produkte Tab */}
        <TabsContent value="produkte" className="space-y-6">
          <ProductTabs />
        </TabsContent>

        {/* Provisions-Versionen Tab (NEU) */}
        <TabsContent value="versionen" className="space-y-6">
          <DatasetVersionManager />
        </TabsContent>

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
                XLSX oder PDF hochladen → Validieren → Als Entwurf speichern
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                accept=".xlsx,.xls,.pdf"
                onChange={handleFileSelect}
                className="mb-4"
                disabled={isLoading}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Datei: <span className="font-medium">{file.name}</span>{" "}
                  ({(file.size / 1024).toFixed(1)} KB)
                  {file.name.toLowerCase().endsWith(".pdf") && (
                    <Badge variant="outline" className="ml-2">
                      <FileText className="h-3 w-3 mr-1" />
                      PDF
                    </Badge>
                  )}
                </p>
              )}
              {isLoading && (
                <p className="text-sm text-muted-foreground animate-pulse mt-2">
                  Wird verarbeitet...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Format Detection - XLSX */}
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

          {/* Format Detection - PDF */}
          {pdfDetection && (
            <Alert className={pdfDetection.format === "unknown" ? "border-destructive" : ""}>
              <FileText className="h-4 w-4" />
              <AlertTitle>
                PDF erkannt: {pdfDetection.format === "provision_tkworld" ? "TK-World Provisionsliste" : 
                             pdfDetection.format === "hardware_distri" ? "Hardware-Preisliste" : 
                             "Unbekanntes Format"}
              </AlertTitle>
              <AlertDescription>
                {pdfDetection.pageCount} Seiten • Konfidenz: {pdfDetection.confidence}
                {pdfDetection.hints.length > 0 && (
                  <span className="block text-xs mt-1 text-muted-foreground">
                    {pdfDetection.hints.slice(0, 3).join(", ")}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* PDF Parse Results */}
          {pdfResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {pdfResult.errors.length === 0 ? (
                    <><Check className="h-5 w-5 text-green-600" /> PDF erfolgreich geparst</>
                  ) : (
                    <><AlertTriangle className="h-5 w-5 text-destructive" /> Fehler beim Parsen</>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {pdfResult.format === "hardware_distri" && pdfResult.hardware && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <p className="font-semibold text-blue-700 dark:text-blue-400">Hardware</p>
                      </div>
                      <p className="text-2xl font-bold">{pdfResult.hardware.length} Artikel</p>
                    </div>
                  )}
                  {pdfResult.format === "provision_tkworld" && pdfResult.provisions && (
                    <>
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4 text-green-600" />
                          <p className="font-semibold text-green-700 dark:text-green-400">Provisionen</p>
                        </div>
                        <p className="text-2xl font-bold">{pdfResult.provisions.length} Tarife</p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                        <p className="font-semibold text-purple-700 dark:text-purple-400">OMO-Matrix</p>
                        <p className="text-2xl font-bold">{pdfResult.omoMatrix?.length ?? 0} Einträge</p>
                      </div>
                    </>
                  )}
                </div>
                
                {pdfResult.warnings.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {pdfResult.warnings.slice(0, 5).map((w, i) => (
                      <p key={i} className="text-xs text-muted-foreground">⚠️ {w}</p>
                    ))}
                    {pdfResult.warnings.length > 5 && (
                      <p className="text-xs text-muted-foreground">+{pdfResult.warnings.length - 5} weitere Hinweise</p>
                    )}
                  </div>
                )}
                
                {pdfResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {pdfResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* PDF Import Button */}
          {pdfResult && pdfResult.errors.length === 0 && pdfResult.rowsExtracted > 0 && (
            <Button 
              onClick={handlePdfImport} 
              className="w-full" 
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Als Entwurf speichern
              <Badge variant="secondary" className="ml-2">
                {pdfResult.rowsExtracted} Einträge
              </Badge>
            </Button>
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
            <div className="flex gap-3">
              <Button 
                onClick={() => handleCreateDraft(false)} 
                className="flex-1" 
                size="lg"
                variant={canBypassApproval ? "outline" : "default"}
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
              
              {canBypassApproval && (
                <Button 
                  onClick={() => handleCreateDraft(true)} 
                  className="flex-1 bg-amber-600 hover:bg-amber-700" 
                  size="lg"
                  disabled={diff?.breakingRisk && diff.summary.totalRemoved > 0}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Direkt veröffentlichen
                  <Badge variant="secondary" className="ml-2 bg-amber-500/20">
                    Admin
                  </Badge>
                </Button>
              )}
            </div>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Governance-Workflow</AlertTitle>
            <AlertDescription>
              {canBypassApproval ? (
                <>
                  Als Admin können Sie den Approval-Workflow überspringen und Datasets direkt veröffentlichen.
                  <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600">
                    adminBypassApproval aktiv
                  </Badge>
                </>
              ) : (
                <>
                  Importierte Datasets werden als Entwurf gespeichert. Ein Manager muss sie zur Prüfung freigeben, 
                  und ein Admin muss sie veröffentlichen, bevor sie für Berechnungen aktiv werden.
                </>
              )}
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
