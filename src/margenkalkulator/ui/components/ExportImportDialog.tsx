import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, FileJson, AlertTriangle, CheckCircle } from "lucide-react";
import type { OfferOptionState } from "../../engine/types";
import type { ImportResult } from "../../hooks/useOfferExport";

interface ExportImportDialogProps {
  option1: OfferOptionState;
  option2: OfferOptionState;
  onExport: (option1: OfferOptionState, option2: OfferOptionState) => void;
  onImport: (file: File) => Promise<ImportResult>;
  onImportSuccess: (option1: OfferOptionState, option2: OfferOptionState) => void;
}

export function ExportImportDialog({
  option1,
  option2,
  onExport,
  onImport,
  onImportSuccess,
}: ExportImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    onExport(option1, option2);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const result = await onImport(file);
    setImportResult(result);
    setImporting(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = () => {
    if (importResult?.success && importResult.data) {
      onImportSuccess(importResult.data.option1, importResult.data.option2);
      setOpen(false);
      setImportResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileJson className="w-4 h-4" />
          <span className="hidden sm:inline">Export/Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Angebot exportieren / importieren</DialogTitle>
          <DialogDescription>
            Speichern Sie Ihr Angebot als JSON-Datei oder laden Sie ein
            bestehendes Angebot.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Laden Sie beide Optionen als JSON-Datei herunter. Diese kann
              später wieder importiert werden.
            </p>
            <Button onClick={handleExport} className="w-full gap-2">
              <Download className="w-4 h-4" />
              Als JSON herunterladen
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Laden Sie eine zuvor exportierte JSON-Datei, um das Angebot
              wiederherzustellen.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="import-file"
            />

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload className="w-4 h-4" />
              {importing ? "Wird geladen..." : "JSON-Datei auswählen"}
            </Button>

            {importResult && (
              <div className="space-y-3">
                {importResult.success ? (
                  <>
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Datei erfolgreich gelesen
                      </AlertDescription>
                    </Alert>

                    {importResult.warnings.length > 0 && (
                      <Alert className="border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <ul className="list-disc list-inside">
                            {importResult.warnings.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button onClick={handleConfirmImport} className="w-full">
                      Angebot übernehmen
                    </Button>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{importResult.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
