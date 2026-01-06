import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Database, 
  Check, 
  Trash2, 
  Plus, 
  Loader2, 
  FileText,
  Calendar,
  Power,
  FileUp,
  Send,
} from "lucide-react";
import { useDatasetVersions } from "@/margenkalkulator/hooks/useDatasetVersions";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { parsePdf, validatePdfFile, type PdfDetectionResult } from "@/margenkalkulator/dataManager/importers/pdfImporter";
import { parseProvisionPdf } from "@/margenkalkulator/dataManager/importers/pdfParsers/provisionPdfParser";
import type { ProvisionRow, OMOMatrixRow } from "@/margenkalkulator/dataManager/types";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { showPublishSuccessToast, showVersionActivatedToast } from "@/lib/errorHandling";
import { DatasetStatusBadge, type DatasetStatus, type SourceType } from "./DatasetStatusBadge";

export function DatasetVersionManager() {
  const { 
    versions, 
    isLoading,
    createVersion,
    activateVersion,
    deleteVersion,
    updateVersion,
    seedDefaultVersion,
    isCreating,
    isActivating,
    isDeleting,
    isSeeding,
  } = useDatasetVersions();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newVersion, setNewVersion] = useState({
    versionName: "",
    validFrom: new Date().toISOString().slice(0, 10),
    sourceFile: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // PDF Import state
  const [isDragging, setIsDragging] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [pdfResult, setPdfResult] = useState<{
    detection: PdfDetectionResult;
    provisions: ProvisionRow[];
    omoMatrix: OMOMatrixRow[];
    fileName: string;
  } | null>(null);

  const handleCreate = async () => {
    if (!newVersion.versionName || !newVersion.validFrom) return;
    
    await createVersion({
      versionName: newVersion.versionName,
      validFrom: newVersion.validFrom,
      sourceFile: newVersion.sourceFile || null,
      setActive: false,
    });
    
    setIsCreateOpen(false);
    setNewVersion({
      versionName: "",
      validFrom: new Date().toISOString().slice(0, 10),
      sourceFile: "",
    });
  };

  const handleActivate = async (id: string) => {
    setActivatingId(id);
    try {
      await activateVersion(id);
      const version = versions.find(v => v.id === id);
      if (version) {
        showVersionActivatedToast(version.versionName);
      }
    } finally {
      setActivatingId(null);
    }
  };

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    setIsPublishing(true);
    try {
      await updateVersion({ id, updates: { status: "published" as const } });
      const version = versions.find(v => v.id === id);
      if (version) {
        showPublishSuccessToast(version.versionName);
      }
    } finally {
      setPublishingId(null);
      setIsPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteVersion(id);
    } finally {
      setDeletingId(null);
    }
  };

  // PDF Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processPdfFile = async (file: File) => {
    const validation = validatePdfFile(file);
    if (!validation.valid) {
      toast({
        title: "Ungültige Datei",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setPdfProcessing(true);
    setPdfResult(null);

    try {
      const { detection, pages } = await parsePdf(file);

      if (detection.format === "provision_tkworld") {
        const result = parseProvisionPdf(pages);
        const parsedData = result.data[0];
        
        setPdfResult({
          detection,
          provisions: parsedData?.provisions || [],
          omoMatrix: parsedData?.omoMatrix || [],
          fileName: file.name,
        });
        
        // Auto-fill version name
        const monthMatch = file.name.match(/(\d{2})_?(\d{4})/);
        if (monthMatch) {
          const month = parseInt(monthMatch[1]);
          const year = monthMatch[2];
          const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", 
                            "Juli", "August", "September", "Oktober", "November", "Dezember"];
          setNewVersion(prev => ({
            ...prev,
            versionName: `${monthNames[month - 1]} ${year}`,
            validFrom: `${year}-${monthMatch[1]}-01`,
            sourceFile: file.name,
          }));
        } else {
          setNewVersion(prev => ({
            ...prev,
            sourceFile: file.name,
          }));
        }
        
        setIsCreateOpen(true);
      } else {
        toast({
          title: "Unbekanntes Format",
          description: `Das PDF-Format wurde nicht erkannt. Erkannte Hinweise: ${detection.hints.slice(0, 3).join(", ")}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fehler beim Verarbeiten",
        description: error instanceof Error ? error.message : "PDF konnte nicht gelesen werden",
        variant: "destructive",
      });
    } finally {
      setPdfProcessing(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    
    if (pdfFile) {
      await processPdfFile(pdfFile);
    } else {
      toast({
        title: "Keine PDF-Datei",
        description: "Bitte eine PDF-Datei ziehen",
        variant: "destructive",
      });
    }
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processPdfFile(file);
    }
  };

  const handleCreateWithData = async () => {
    if (!newVersion.versionName || !newVersion.validFrom || !pdfResult) return;
    
    await createVersion({
      versionName: newVersion.versionName,
      validFrom: newVersion.validFrom,
      sourceFile: newVersion.sourceFile || null,
      setActive: false,
      provisions: pdfResult.provisions as unknown as Json,
      omoMatrix: pdfResult.omoMatrix as unknown as Json,
    });
    
    setIsCreateOpen(false);
    setPdfResult(null);
    setNewVersion({
      versionName: "",
      validFrom: new Date().toISOString().slice(0, 10),
      sourceFile: "",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Provisions-Versionen
            </CardTitle>
            <CardDescription>
              Historie aller hochgeladenen Provisionslisten. 
              Die aktive Version wird für alle Berechnungen verwendet.
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neue Version
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Neue Provisions-Version</DialogTitle>
                <DialogDescription>
                  {pdfResult 
                    ? `${pdfResult.provisions.length} Tarife und ${pdfResult.omoMatrix.length} OMO-Einträge aus PDF extrahiert.`
                    : "Erstelle eine neue Version für Provisionsdaten oder importiere eine PDF."}
                </DialogDescription>
              </DialogHeader>
              
              {pdfResult && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{pdfResult.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {pdfResult.provisions.length} Provisionen, {pdfResult.omoMatrix.length} OMO-Einträge
                    </p>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary">
                    {pdfResult.detection.confidence}
                  </Badge>
                </div>
              )}
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="versionName">Versionsname</Label>
                  <Input
                    id="versionName"
                    placeholder="z.B. Oktober 2025"
                    value={newVersion.versionName}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, versionName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Gültig ab</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={newVersion.validFrom}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, validFrom: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceFile">Quelldatei</Label>
                  <Input
                    id="sourceFile"
                    placeholder="z.B. SoHo_Provisionsliste_10_2025.pdf"
                    value={newVersion.sourceFile}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, sourceFile: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsCreateOpen(false); setPdfResult(null); }}>
                  Abbrechen
                </Button>
                <Button 
                  onClick={pdfResult ? handleCreateWithData : handleCreate} 
                  disabled={isCreating || !newVersion.versionName}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {pdfResult ? "Mit Daten speichern" : "Erstellen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* PDF Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
            ${isDragging 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-muted/50"
            }
            ${pdfProcessing ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={pdfProcessing}
          />
          
          {pdfProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">PDF wird verarbeitet...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <FileUp className="h-7 w-7 text-primary" />
              </div>
              <p className="font-medium">PDF hier ablegen</p>
              <p className="text-sm text-muted-foreground">
                Provisions-PDF (TK-World Format) per Drag & Drop importieren
              </p>
            </div>
          )}
        </div>

        {/* Version Table */}
        {versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Versionen erstellt.</p>
            <p className="text-sm mt-1 mb-4">
              Laden Sie die Standard-Provisionen aus v2025_10.
            </p>
            <Button
              onClick={() => seedDefaultVersion()}
              disabled={isSeeding}
              className="gap-2"
            >
              {isSeeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isSeeding ? "Wird geladen..." : "v2025_10 Standard-Daten laden"}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Gültig ab</TableHead>
                <TableHead>Quelldatei</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => {
                const status = (version.status as DatasetStatus) || (version.isActive ? "published" : "draft");
                const sourceType = (version.sourceType as SourceType) || (version.sourceFile ? "pdf" : "manual");
                const sourceDate = version.sourceDate || version.validFrom;
                const provisionsCount = Array.isArray(version.provisions) ? version.provisions.length : 0;
                const omoCount = Array.isArray(version.omoMatrix) ? version.omoMatrix.length : 0;
                
                return (
                <TableRow key={version.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {version.versionName}
                      {version.isActive && (
                        <Badge variant="default" className="bg-green-600">
                          Aktiv
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(version.validFrom), "dd.MM.yyyy", { locale: de })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {version.sourceFile ? (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span className="truncate max-w-[150px]" title={version.sourceFile}>
                          {version.sourceFile}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DatasetStatusBadge
                      status={status}
                      versionName={version.versionName}
                      sourceType={sourceType}
                      sourceDate={sourceDate}
                      compact
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Publish Button - only for draft/review status */}
                      {status !== "published" && status !== "archived" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Send className="h-4 w-4 mr-1" />
                              Veröffentlichen
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Version veröffentlichen?</AlertDialogTitle>
                              <AlertDialogDescription asChild>
                                <div className="space-y-3">
                                  <p>
                                    <strong>"{version.versionName}"</strong> wird zur aktiven Version.
                                    Alle Kalkulationen verwenden ab sofort diese Daten.
                                  </p>
                                  <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm font-medium mb-2">Enthaltene Daten:</p>
                                    <ul className="text-sm space-y-1">
                                      <li>• {provisionsCount} Provisionen</li>
                                      <li>• {omoCount} OMO-Einträge</li>
                                    </ul>
                                  </div>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handlePublish(version.id)}
                                disabled={isPublishing && publishingId === version.id}
                              >
                                {isPublishing && publishingId === version.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Send className="h-4 w-4 mr-2" />
                                )}
                                Jetzt veröffentlichen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      {!version.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleActivate(version.id)}
                          disabled={isActivating && activatingId === version.id}
                        >
                          {isActivating && activatingId === version.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1" />
                              Aktivieren
                            </>
                          )}
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={version.isActive}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Version löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Möchten Sie die Version "{version.versionName}" wirklich löschen? 
                              Diese Aktion kann nicht rückgängig gemacht werden.
                              Angebote, die mit dieser Version erstellt wurden, 
                              behalten ihre berechneten Werte.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(version.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting && deletingId === version.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
