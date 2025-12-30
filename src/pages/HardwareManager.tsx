import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Download, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  ArrowLeft,
  Plus,
  Minus,
  RefreshCw,
  Smartphone,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import { 
  parseHardwareXLSX,
  parseHardwareCSV,
  validateHardwareRows,
  diffHardware,
  generateHardwareTemplate,
  updateHardwareCatalog,
  resetHardwareCatalog,
  getStoredHardwareCatalog,
  hasCustomHardware,
  businessCatalog2025_09,
  type HardwareItemRow,
  type HardwareValidationResult,
  type HardwareDiffResult,
} from "@/margenkalkulator";
import { toast } from "@/hooks/use-toast";
import { HardwareImageUploader } from "@/margenkalkulator/ui/components/HardwareImageUploader";

export default function HardwareManager() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<HardwareItemRow[] | null>(null);
  const [validation, setValidation] = useState<HardwareValidationResult | null>(null);
  const [diff, setDiff] = useState<HardwareDiffResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Current hardware from localStorage or default catalog
  const currentHardware = useMemo(() => {
    const stored = getStoredHardwareCatalog();
    if (stored.length > 0) {
      return stored;
    }
    // Convert default catalog to row format
    return (businessCatalog2025_09.hardwareCatalog ?? []).map(h => ({
      id: h.id,
      brand: h.brand,
      model: h.model,
      category: h.category,
      ek_net: h.ekNet,
      sort_order: h.sortOrder ?? 999,
      active: true,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const isCustomActive = hasCustomHardware();

  // Group hardware by brand
  const hardwareByBrand = useMemo(() => {
    const grouped = new Map<string, HardwareItemRow[]>();
    currentHardware
      .filter(h => h.id !== "no_hardware" && h.active !== false)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
      .forEach(h => {
        const brand = h.brand || "Sonstige";
        if (!grouped.has(brand)) {
          grouped.set(brand, []);
        }
        grouped.get(brand)!.push(h);
      });
    return grouped;
  }, [currentHardware]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Validate file extension
    const validExtensions = /\.(xlsx|xls|csv)$/i;
    if (!selectedFile.name.match(validExtensions)) {
      toast({
        title: "Ungültiges Dateiformat",
        description: "Bitte laden Sie eine XLSX-, XLS- oder CSV-Datei hoch. Andere Formate werden nicht unterstützt.",
        variant: "destructive",
      });
      return;
    }
    
    setFile(selectedFile);
    setIsLoading(true);
    setParsedData(null);
    setValidation(null);
    setDiff(null);
    
    try {
      // Parse file based on extension
      const isCSV = selectedFile.name.toLowerCase().endsWith(".csv");
      const rows = isCSV 
        ? await parseHardwareCSV(selectedFile)
        : await parseHardwareXLSX(selectedFile);
      
      // Validate
      const validationResult = validateHardwareRows(rows);
      setValidation(validationResult);
      
      if (!validationResult.isValid) {
        // Summarize missing columns for better UX
        const missingColumnsErrors = validationResult.errors.filter(e => 
          e.message.includes("Spalte") || e.message.includes("fehlt")
        );
        if (missingColumnsErrors.length > 0) {
          toast({
            title: "Pflichtfelder fehlen",
            description: `Die Spalten "brand", "model" und "ek_net" sind erforderlich. Bitte prüfen Sie Ihre Datei.`,
            variant: "destructive",
          });
        }
        return;
      }
      
      setParsedData(rows);
      
      // Calculate diff
      const diffResult = diffHardware(currentHardware, rows);
      setDiff(diffResult);
      
    } catch (err) {
      toast({
        title: "Fehler beim Parsen",
        description: err instanceof Error ? err.message : "Die Datei konnte nicht gelesen werden. Bitte prüfen Sie das Format.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentHardware]);

  const handleApply = useCallback(() => {
    if (!parsedData || !validation?.isValid) return;
    
    try {
      updateHardwareCatalog(parsedData);
      setRefreshKey(k => k + 1);
      toast({
        title: "Hardware aktualisiert",
        description: `${parsedData.length} Geräte wurden gespeichert.`,
      });
      
      // Reset form
      setFile(null);
      setParsedData(null);
      setValidation(null);
      setDiff(null);
      
    } catch (err) {
      toast({
        title: "Fehler beim Speichern",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  }, [parsedData, validation]);

  const handleReset = useCallback(() => {
    resetHardwareCatalog();
    setRefreshKey(k => k + 1);
    setFile(null);
    setParsedData(null);
    setValidation(null);
    setDiff(null);
    toast({
      title: "Zurückgesetzt",
      description: "Standard-Hardware ist wieder aktiv.",
    });
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    const blob = generateHardwareTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hardware_template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            Hardware verwalten
          </h1>
          <p className="text-sm text-muted-foreground">
            EK-Preise, Geräte und Produktbilder verwalten
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Gerätekatalog
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Produktbilder
          </TabsTrigger>
        </TabsList>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="space-y-6">
          {/* Download Template Button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template herunterladen
            </Button>
          </div>

      {/* Current Hardware Overview */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Aktuelle Geräte ({currentHardware.filter(h => h.id !== "no_hardware").length})
            </span>
            {isCustomActive && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Benutzerdefiniert</Badge>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from(hardwareByBrand.entries()).map(([brand, items]) => (
                <div key={brand} className="space-y-1">
                  <h4 className="font-semibold text-sm text-foreground">{brand}</h4>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {items.slice(0, 5).map(item => (
                      <li key={item.id} className="truncate" title={`${item.model} - ${item.ek_net}€`}>
                        • {item.model.replace(brand, "").trim() || item.model}
                        <span className="ml-1 text-foreground/60">{item.ek_net}€</span>
                      </li>
                    ))}
                    {items.length > 5 && (
                      <li className="text-muted-foreground/60">... +{items.length - 5} weitere</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Hardware importieren
          </CardTitle>
          <CardDescription>
            XLSX oder CSV mit Hardware-Daten hochladen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
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

      {/* Validation Result */}
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
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {validation.errors.map((err, i) => (
                  <Alert key={i} variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {err.row && <span className="font-medium">Zeile {err.row}: </span>}
                      {err.message}
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
                    <AlertDescription className="text-sm">{warn}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
            {validation.isValid && parsedData && (
              <p className="text-sm text-muted-foreground">
                {parsedData.length} Geräte erkannt, alle Felder valide.
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
            <CardDescription>
              {diff.summary.added} hinzugefügt, {diff.summary.changed} geändert, {diff.summary.removed} entfernt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <p className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Hinzugefügt
                </p>
                <p className="text-2xl font-bold">{diff.summary.added}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <p className="font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" /> Geändert
                </p>
                <p className="text-2xl font-bold">{diff.summary.changed}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <p className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
                  <Minus className="h-4 w-4" /> Entfernt
                </p>
                <p className="text-2xl font-bold">{diff.summary.removed}</p>
              </div>
            </div>
            
            {/* Detailed changes */}
            {diff.items.length > 0 && (
              <>
                <Separator className="my-4" />
                <ScrollArea className="h-40">
                  <div className="space-y-1 text-xs">
                    {diff.items.slice(0, 20).map((item, i) => (
                      <div key={i} className={`flex items-center gap-2 py-1 px-2 rounded ${
                        item.type === "added" ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400" :
                        item.type === "removed" ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" :
                        "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400"
                      }`}>
                        <span className="font-mono w-6">
                          {item.type === "added" ? "+" : item.type === "removed" ? "−" : "~"}
                        </span>
                        <span className="font-medium">{item.brand} {item.model}</span>
                        {item.type === "changed" && item.changes && (
                          <span className="text-muted-foreground ml-2">
                            → {item.changes.join(", ")}
                          </span>
                        )}
                        {item.type === "added" && item.newEkNet !== undefined && (
                          <span className="ml-auto">{item.newEkNet}€</span>
                        )}
                      </div>
                    ))}
                    {diff.items.length > 20 && (
                      <p className="text-muted-foreground py-2">
                        ... und {diff.items.length - 20} weitere Änderungen
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </>
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
        >
          <Upload className="h-4 w-4 mr-2" />
          Änderungen übernehmen
          <Badge variant="secondary" className="ml-2">
            {parsedData.length} Geräte
          </Badge>
        </Button>
      )}

          {/* Help Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Spaltenformat</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-semibold">Spalte</th>
                      <th className="text-left py-2 px-2 font-semibold">Pflicht</th>
                      <th className="text-left py-2 px-2 font-semibold">Beispiel</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b"><td className="py-1.5 px-2 font-mono">id</td><td>✅</td><td>iphone_16_128</td></tr>
                    <tr className="border-b"><td className="py-1.5 px-2 font-mono">brand</td><td>✅</td><td>Apple</td></tr>
                    <tr className="border-b"><td className="py-1.5 px-2 font-mono">model</td><td>✅</td><td>iPhone 16 128GB</td></tr>
                    <tr className="border-b"><td className="py-1.5 px-2 font-mono">ek_net</td><td>✅</td><td>779 oder 779,00</td></tr>
                    <tr className="border-b"><td className="py-1.5 px-2 font-mono">category</td><td></td><td>smartphone / tablet</td></tr>
                    <tr className="border-b"><td className="py-1.5 px-2 font-mono">sort_order</td><td></td><td>10</td></tr>
                    <tr><td className="py-1.5 px-2 font-mono">active</td><td></td><td>true / false</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs">
                Deutsche Zahlenformate (z.B. 799,00) werden automatisch erkannt.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <HardwareImageUploader />
        </TabsContent>
      </Tabs>
    </div>
  );
}