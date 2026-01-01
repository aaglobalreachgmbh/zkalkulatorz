// ============================================
// AverageMarginWidget - Dashboard Widget
// Shows average margin trends
// ============================================

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCloudOffers } from "../../hooks/useCloudOffers";
import { formatCurrency, formatPercent } from "../../lib/formatters";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export function AverageMarginWidget() {
  const navigate = useNavigate();
  const { offers, isLoading } = useCloudOffers();

  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = offers.filter(o => new Date(o.created_at) >= oneWeekAgo);
    const lastWeek = offers.filter(o => 
      new Date(o.created_at) >= twoWeeksAgo && new Date(o.created_at) < oneWeekAgo
    );
    const thisMonth = offers.filter(o => new Date(o.created_at) >= oneMonthAgo);

    const getAvgMargin = (list: typeof offers) => {
      if (list.length === 0) return 0;
      // Estimate margin from avgMonthly (rough: 10% of revenue over 24 months)
      const total = list.reduce((sum, o) => {
        const avgMonthly = o.preview?.avgMonthly ?? 0;
        const quantity = o.config?.mobile?.quantity ?? 1;
        return sum + (avgMonthly * 0.1 * quantity * 24);
      }, 0);
      return total / list.length;
    };

    const thisWeekAvg = getAvgMargin(thisWeek);
    const lastWeekAvg = getAvgMargin(lastWeek);
    const thisMonthAvg = getAvgMargin(thisMonth);

    const weekChange = lastWeekAvg > 0 
      ? ((thisWeekAvg - lastWeekAvg) / Math.abs(lastWeekAvg)) * 100 
      : 0;

    return {
      thisWeek: thisWeekAvg,
      thisMonth: thisMonthAvg,
      weekChange,
      offerCount: thisWeek.length,
    };
  }, [offers]);

  const TrendIcon = stats.weekChange > 0 ? TrendingUp : stats.weekChange < 0 ? TrendingDown : Minus;
  const trendColor = stats.weekChange > 0 ? "text-emerald-600" : stats.weekChange < 0 ? "text-red-600" : "text-muted-foreground";

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-24" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate("/reporting")}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Ø Marge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{formatCurrency(stats.thisWeek)}</span>
          {stats.weekChange !== 0 && (
            <div className={`flex items-center gap-0.5 text-sm ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span>{formatPercent(stats.weekChange)}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Diese Woche ({stats.offerCount} Angebote)
        </p>
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
          Monat: {formatCurrency(stats.thisMonth)}
        </div>
      </CardContent>
    </Card>
  );
}
