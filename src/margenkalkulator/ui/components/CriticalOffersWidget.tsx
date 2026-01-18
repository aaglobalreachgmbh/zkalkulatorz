// ============================================
// CriticalOffersWidget - Dashboard Widget
// Shows offers with critical/warning margins
// ============================================

import { AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCloudOffers } from "../../hooks/useCloudOffers";
import { getProfitabilityStatus } from "../../lib/formatters";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export function CriticalOffersWidget() {
  const navigate = useNavigate();
  const { offers, isLoading } = useCloudOffers();

  const stats = useMemo(() => {
    let critical = 0;
    let warning = 0;

    offers.forEach(offer => {
      // Estimate margin from avgMonthly
      const avgMonthly = offer.preview?.avgMonthly ?? 0;
      const quantity = offer.config?.mobile?.quantity ?? 1;
      const estimatedMargin = avgMonthly * 0.1 * quantity * 24;
      const marginPerContract = estimatedMargin / quantity;
      const status = getProfitabilityStatus(marginPerContract);

      if (status === "critical") critical++;
      else if (status === "warning") warning++;
    });

    return { critical, warning };
  }, [offers]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-28" />
        </CardHeader>
        <CardContent>
          <div className="h-16 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const hasIssues = stats.critical > 0 || stats.warning > 0;

  return (
    <Card className={hasIssues ? "border-amber-500/50" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Kritische Angebote
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasIssues ? (
          <div className="space-y-3">
            <div className="flex gap-4">
              {stats.critical > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-600">{stats.critical}</p>
                    <p className="text-xs text-muted-foreground">Negativ</p>
                  </div>
                </div>
              )}
              {stats.warning > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-600">{stats.warning}</p>
                    <p className="text-xs text-muted-foreground">Warning</p>
                  </div>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2"
              onClick={() => navigate("/offers?status=critical")}
            >
              Jetzt optimieren
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-emerald-600 font-medium">✓ Alle Angebote profitabel</p>
            <p className="text-xs text-muted-foreground mt-1">Keine Optimierung nötig</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
