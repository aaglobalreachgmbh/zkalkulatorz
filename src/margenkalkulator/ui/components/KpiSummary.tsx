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
  const oneTimeTotal = oneTime.reduce((sum, item) => sum + item.net, 0);

  return (
    <div className="space-y-4">
      {/* Customer KPIs */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          Kundenübersicht
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Ø Monatlich (netto)</div>
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(totals.avgTermNet)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Gesamt 24M (brutto)</div>
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(totals.sumTermGross)}
            </div>
          </div>
        </div>

        {oneTimeTotal > 0 && (
          <div className="pt-3 border-t border-border/30">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Einmalkosten</span>
              <span className="text-sm font-semibold text-foreground">{formatCurrency(oneTimeTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Dealer KPIs - Dark Panel */}
      {viewMode === "dealer" && (
        <div className="bg-panel-dark text-panel-dark-foreground rounded-xl p-4 space-y-3">
          <div className="text-xs uppercase tracking-wider text-panel-dark-muted font-medium mb-3">
            Händler-Kalkulation
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-panel-dark-muted">Provision</div>
              <div className="text-xl font-bold text-panel-dark-foreground">
                {formatCurrency(dealer.provisionAfter)}
              </div>
            </div>
            <div>
              <div className="text-xs text-panel-dark-muted">Marge</div>
              <div className={`text-xl font-bold ${dealer.margin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatCurrency(dealer.margin)}
              </div>
            </div>
          </div>

          {dealer.hardwareEkNet > 0 && (
            <div className="pt-3 border-t border-panel-dark-muted/30 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-panel-dark-muted">Hardware EK</span>
                <span className="text-panel-dark-foreground">−{formatCurrency(dealer.hardwareEkNet)}</span>
              </div>
              {dealer.deductions > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-panel-dark-muted">Abzüge</span>
                  <span className="text-panel-dark-foreground">−{formatCurrency(dealer.deductions)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
