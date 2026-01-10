import { useState } from "react";
import { format, startOfMonth, subMonths, addMonths } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Wallet, TrendingUp, TrendingDown, Minus, Download, Calculator, Loader2 } from "lucide-react";
import { useProvisionCalculator, formatCurrency } from "@/hooks/useProvisionCalculator";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  draft: "Entwurf",
  calculated: "Berechnet",
  approved: "Genehmigt",
  paid: "Ausgezahlt",
};

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  calculated: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  paid: "bg-purple-100 text-purple-800",
};

export function ProvisionDashboard() {
  const [monthOffset, setMonthOffset] = useState(0);
  const selectedMonth = addMonths(new Date(), monthOffset);

  const {
    monthlySummary,
    offers,
    isLoading,
    saveCalculation,
    isSaving,
  } = useProvisionCalculator({ month: selectedMonth });

  const goToPrevMonth = () => setMonthOffset(monthOffset - 1);
  const goToNextMonth = () => setMonthOffset(monthOffset + 1);
  const goToCurrentMonth = () => setMonthOffset(0);

  const handleCalculate = async () => {
    try {
      await saveCalculation();
    } catch (error) {
      console.error("Calculation failed:", error);
    }
  };

  const exportToCSV = () => {
    const headers = ["Angebot", "Kunde", "Tarif", "Typ", "Provision"];
    const rows = monthlySummary.details.map((d) => [
      d.offerName,
      d.customerName || "",
      d.tariffName || "",
      d.contractType,
      d.totalProvision.toFixed(2),
    ]);

    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `provisionen_${format(selectedMonth, "yyyy-MM")}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Meine Provisionen
          </h2>
          <p className="text-muted-foreground">
            Übersicht Ihrer erwarteten und ausgezahlten Provisionen
          </p>
        </div>
        <div className="flex items-center gap-2">
          {monthOffset !== 0 && (
            <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
              Aktueller Monat
            </Button>
          )}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center">
              {format(selectedMonth, "MMMM yyyy", { locale: de })}
            </span>
            <Button variant="ghost" size="icon" onClick={goToNextMonth} disabled={monthOffset >= 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Basis-Provision</p>
              <p className="text-2xl font-bold">{formatCurrency(monthlySummary.baseProvision)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Bonus</p>
              <p className="text-2xl font-bold text-emerald-600">
                +{formatCurrency(monthlySummary.bonusAmount + monthlySummary.goalBonus)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Abzüge</p>
              <p className="text-2xl font-bold text-rose-600">
                -{formatCurrency(monthlySummary.deductions)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Netto-Provision</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(monthlySummary.netProvision)}
              </p>
              <Badge className={cn("mt-2", statusColors[monthlySummary.status])}>
                {statusLabels[monthlySummary.status]}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Aufschlüsselung nach Verträgen</CardTitle>
              <CardDescription>
                {monthlySummary.contractCount} Verträge in diesem Monat
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              {monthlySummary.status === "draft" && (
                <Button size="sm" onClick={handleCalculate} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4 mr-1" />
                  )}
                  Berechnen
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : monthlySummary.details.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Keine Verträge in diesem Monat</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Angebot</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="text-right">Basis</TableHead>
                  <TableHead className="text-right">Bonus</TableHead>
                  <TableHead className="text-right">Gesamt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlySummary.details.map((detail) => (
                  <TableRow key={detail.offerId}>
                    <TableCell className="font-medium">{detail.offerName}</TableCell>
                    <TableCell>{detail.customerName || "—"}</TableCell>
                    <TableCell>{detail.tariffName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {detail.contractType === "neu" ? "Neuvertrag" : 
                         detail.contractType === "vvl" ? "VVL" : detail.contractType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(detail.baseProvision)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {detail.bonusProvision > 0 ? `+${formatCurrency(detail.bonusProvision)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(detail.totalProvision)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
