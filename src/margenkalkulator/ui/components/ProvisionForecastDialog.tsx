// ============================================
// Provision Forecast Export Dialog
// ============================================

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Loader2, TrendingUp, Package, Euro } from "lucide-react";
import { toast } from "sonner";
import { useProvisionForecast } from "../../hooks/useProvisionForecast";
import { ProvisionForecastPdf } from "../../pdf/ProvisionForecastPdf";
import { downloadCSV, formatDateForFilename, formatCurrencyForCSV } from "../../lib/exportHelpers";
import type { TimeRange } from "../../hooks/useReporting";

interface ProvisionForecastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  week: "Diese Woche",
  month: "Dieser Monat",
  quarter: "Letztes Quartal",
};

export function ProvisionForecastDialog({ open, onOpenChange }: ProvisionForecastDialogProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [exporting, setExporting] = useState(false);
  
  const { rows, totals, isLoading } = useProvisionForecast(timeRange);

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2).replace(".", ",")} €`;
  };

  const handleExportCSV = () => {
    const headers = [
      "Kunde",
      "Angebot",
      "Tarif",
      "Hardware",
      "Erwartete Provision",
      "Hardware-EK",
      "Erwartete Marge",
      "Erstellt am",
    ];

    const csvRows = rows.map((row) => [
      row.customerName,
      row.offerName,
      row.tariff,
      row.hardware,
      formatCurrencyForCSV(row.expectedProvision),
      formatCurrencyForCSV(row.ekPrice),
      formatCurrencyForCSV(row.expectedMargin),
      row.createdAt.split("T")[0],
    ]);

    // Add totals row
    csvRows.push([
      "GESAMT",
      "",
      "",
      "",
      formatCurrencyForCSV(totals.totalProvision),
      formatCurrencyForCSV(totals.totalEk),
      formatCurrencyForCSV(totals.netMargin),
      "",
    ]);

    const filename = `Provisions-Prognose_${formatDateForFilename()}.csv`;
    downloadCSV(filename, headers, csvRows);
    toast.success(`${rows.length} Angebote exportiert`);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const blob = await pdf(
        <ProvisionForecastPdf
          rows={rows}
          totals={totals}
          generatedAt={new Date()}
          timeRange={TIME_RANGE_LABELS[timeRange]}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Provisions-Prognose_${formatDateForFilename()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`PDF mit ${rows.length} Angeboten erstellt`);
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("PDF-Export fehlgeschlagen");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Provisions-Prognose
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Time Range Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Zeitraum:</span>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Diese Woche</SelectItem>
                <SelectItem value="month">Dieser Monat</SelectItem>
                <SelectItem value="quarter">Letztes Quartal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <TrendingUp className="h-3 w-3" />
                      Erwartete Provision
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(totals.totalProvision)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Package className="h-3 w-3" />
                      Hardware-EK
                    </div>
                    <div className="text-lg font-bold text-destructive">
                      {formatCurrency(totals.totalEk)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Euro className="h-3 w-3" />
                      Netto-Marge
                    </div>
                    <div className={`text-lg font-bold ${totals.netMargin >= 0 ? "text-green-600" : "text-destructive"}`}>
                      {totals.netMargin >= 0 ? "+" : ""}{formatCurrency(totals.netMargin)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Info */}
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  ⚠️ <strong>Prognose:</strong> Basiert auf {rows.length} Angeboten mit Kundenstatus "abgeschlossen".
                  Tatsächliche Provisionen können abweichen.
                </p>
              </div>

              {/* Preview List */}
              {rows.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  <div className="divide-y">
                    {rows.slice(0, 5).map((row, idx) => (
                      <div key={idx} className="px-3 py-2 text-sm flex justify-between">
                        <div className="truncate flex-1">
                          <span className="font-medium">{row.customerName}</span>
                          <span className="text-muted-foreground"> – {row.tariff}</span>
                        </div>
                        <span className={row.expectedMargin >= 0 ? "text-green-600" : "text-destructive"}>
                          {row.expectedMargin >= 0 ? "+" : ""}{formatCurrency(row.expectedMargin)}
                        </span>
                      </div>
                    ))}
                    {rows.length > 5 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                        ... und {rows.length - 5} weitere
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={rows.length === 0 || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={rows.length === 0 || exporting || isLoading}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
