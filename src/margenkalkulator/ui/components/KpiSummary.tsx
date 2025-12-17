import { Card, CardContent } from "@/components/ui/card";
import type { CalculationResult, ViewMode } from "../../engine/types";
import { TrendingUp, TrendingDown, Euro, Calendar } from "lucide-react";

interface KpiSummaryProps {
  result: CalculationResult;
  viewMode: ViewMode;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function KpiSummary({ result, viewMode }: KpiSummaryProps) {
  const { totals, dealer, oneTime } = result;
  const oneTimeTotal = oneTime.reduce((sum, m) => sum + m.gross, 0);

  return (
    <div className="space-y-4">
      {/* Customer KPIs - Always visible */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" />
              Ø Monat (netto)
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(totals.avgTermNet)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Euro className="w-3.5 h-3.5" />
              Summe 24M (brutto)
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(totals.sumTermGross)}
            </div>
          </CardContent>
        </Card>
      </div>

      {oneTimeTotal > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="text-muted-foreground text-xs mb-1">
              Einmalige Kosten
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(oneTimeTotal)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dealer KPIs - Only in dealer view */}
      {viewMode === "dealer" && (
        <div className="border-t pt-4 mt-4">
          <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Händler-Kalkulation
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="text-muted-foreground text-xs mb-1">
                  Provision (nach Abzügen)
                </div>
                <div className="text-lg font-semibold text-primary">
                  {formatCurrency(dealer.provisionAfter)}
                </div>
              </CardContent>
            </Card>

            <Card className={`${dealer.margin >= 0 ? "bg-green-50 border-green-200" : "bg-destructive/10 border-destructive/20"}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  {dealer.margin >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                  )}
                  Marge
                </div>
                <div className={`text-lg font-semibold ${dealer.margin >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {formatCurrency(dealer.margin)}
                </div>
              </CardContent>
            </Card>
          </div>

          {dealer.hardwareEkNet > 0 && (
            <div className="mt-3 text-xs text-muted-foreground">
              Hardware EK: {formatCurrency(dealer.hardwareEkNet)} • 
              Abzüge: {formatCurrency(dealer.deductions)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
