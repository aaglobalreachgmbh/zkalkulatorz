// ============================================
// VVL Export Dialog Component
// ============================================

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAllContracts, getVVLUrgency } from "../../hooks/useCustomerContracts";
import { VVLListPdf } from "../../pdf/VVLListPdf";
import { downloadCSV, formatDate, formatDateForFilename, getRemainingDays, getVVLUrgencyLabel } from "../../lib/exportHelpers";

interface VVLExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VVLExportDialog({ open, onOpenChange }: VVLExportDialogProps) {
  const { data: allContracts = [], isLoading: contractsLoading } = useAllContracts();
  const [filters, setFilters] = useState({
    critical: true,
    warning: true,
    ok: false,
    future: false,
  });
  const [exporting, setExporting] = useState(false);

  // Filter active contracts with VVL dates
  const contractsWithVVL = allContracts.filter(
    (c) => c.status === "aktiv" && c.vvl_datum
  );

  // Apply urgency filters
  const filteredContracts = contractsWithVVL.filter((c) => {
    const urgency = getVVLUrgency(c.vvl_datum);
    return filters[urgency as keyof typeof filters];
  });

  // Count by urgency
  const counts = {
    critical: contractsWithVVL.filter((c) => getVVLUrgency(c.vvl_datum) === "critical").length,
    warning: contractsWithVVL.filter((c) => getVVLUrgency(c.vvl_datum) === "warning").length,
    ok: contractsWithVVL.filter((c) => getVVLUrgency(c.vvl_datum) === "ok").length,
    future: contractsWithVVL.filter((c) => getVVLUrgency(c.vvl_datum) === "future").length,
  };

  const handleExportCSV = () => {
    const headers = [
      "Kunde",
      "Ansprechpartner",
      "Netz",
      "Tarif",
      "Hardware",
      "VVL-Datum",
      "Tage bis VVL",
      "Status",
    ];

    const rows = filteredContracts.map((c) => {
      const days = getRemainingDays(c.vvl_datum);
      const contact = c.customer?.vorname && c.customer?.nachname
        ? `${c.customer.vorname} ${c.customer.nachname}`
        : c.customer?.contact_name || "";

      return [
        c.customer?.company_name || "",
        contact,
        c.netz || "",
        c.tarif_name || "",
        c.hardware_name || "SIM-Only",
        formatDate(c.vvl_datum),
        days !== null ? String(days) : "",
        getVVLUrgencyLabel(days),
      ];
    });

    const filename = `VVL-Liste_${formatDateForFilename()}.csv`;
    downloadCSV(filename, headers, rows);
    toast.success(`${filteredContracts.length} Verträge exportiert`);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const blob = await pdf(
        <VVLListPdf contracts={filteredContracts} generatedAt={new Date()} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `VVL-Liste_${formatDateForFilename()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`PDF mit ${filteredContracts.length} Verträgen erstellt`);
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("PDF-Export fehlgeschlagen");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            VVL-Liste exportieren
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {contractsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Filter nach Dringlichkeit:</p>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={filters.critical}
                      onCheckedChange={(checked) =>
                        setFilters((f) => ({ ...f, critical: !!checked }))
                      }
                    />
                    <span className="text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-destructive" />
                      Kritisch ({"<"} 30 Tage)
                    </span>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {counts.critical}
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={filters.warning}
                      onCheckedChange={(checked) =>
                        setFilters((f) => ({ ...f, warning: !!checked }))
                      }
                    />
                    <span className="text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-yellow-500" />
                      Bald (30-60 Tage)
                    </span>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {counts.warning}
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={filters.ok}
                      onCheckedChange={(checked) =>
                        setFilters((f) => ({ ...f, ok: !!checked }))
                      }
                    />
                    <span className="text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      Vormerken (60-90 Tage)
                    </span>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {counts.ok}
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={filters.future}
                      onCheckedChange={(checked) =>
                        setFilters((f) => ({ ...f, future: !!checked }))
                      }
                    />
                    <span className="text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-muted-foreground" />
                      Später ({">"} 90 Tage)
                    </span>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {counts.future}
                    </span>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium">
                  {filteredContracts.length} Verträge werden exportiert
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={filteredContracts.length === 0 || contractsLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={filteredContracts.length === 0 || exporting || contractsLoading}
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
