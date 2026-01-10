// ============================================
// Revenue Forecast Widget
// Shows Q+1 revenue prediction
// ============================================

import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useRevenueForecast } from "@/margenkalkulator/hooks/useRevenueForecast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { formatCurrency } from "../../lib/formatters";

function formatQuarter(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

export function RevenueForecastWidget() {
  const { user } = useAuth();
  const {
    currentQuarterRevenue,
    currentQuarterOffers,
    nextQuarterForecast,
    nextQuarterStart,
    conversionRate,
    avgDealValue,
    pipelineValue,
    confidence,
    isLoading,
  } = useRevenueForecast();

  if (!user) return null;

  // Calculate trend
  const trend = currentQuarterRevenue > 0
    ? ((nextQuarterForecast - currentQuarterRevenue) / currentQuarterRevenue) * 100
    : 0;

  const confidenceColors = {
    high: "bg-green-500/10 text-green-600 border-green-500/30",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    low: "bg-muted text-muted-foreground border-border",
  };

  const confidenceLabels = {
    high: "Hohe Konfidenz",
    medium: "Mittlere Konfidenz",
    low: "Geringe Konfidenz",
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-card to-purple-500/5 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Umsatz-Prognose</CardTitle>
              <p className="text-xs text-muted-foreground">{formatQuarter(nextQuarterStart)}</p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className={confidenceColors[confidence]}>
                  {confidenceLabels[confidence]}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Basiert auf {currentQuarterOffers} Angeboten dieses Quartals, 
                  einer Konversionsrate von {conversionRate.toFixed(0)}% und 
                  einem Ø Dealwert von {formatCurrency(avgDealValue)}/Monat.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Main Forecast */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(nextQuarterForecast)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {trend > 5 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : trend < -5 ? (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={`text-sm font-medium ${
                    trend > 5 ? "text-green-600" : trend < -5 ? "text-red-600" : "text-muted-foreground"
                  }`}>
                    {trend > 0 ? "+" : ""}{trend.toFixed(0)}% vs. aktuelles Quartal
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Pipeline Value */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Pipeline-Wert</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(pipelineValue)}
                </p>
                <p className="text-xs text-muted-foreground">/Monat (offen)</p>
              </div>

              {/* Conversion Rate */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Konversionsrate</p>
                <p className="text-lg font-semibold text-foreground">
                  {conversionRate.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">der Angebote</p>
              </div>
            </div>

            {/* Current Quarter Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Aktuelles Quartal</span>
                <span className="font-medium">{formatCurrency(currentQuarterRevenue)}</span>
              </div>
              <Progress 
                value={nextQuarterForecast > 0 ? (currentQuarterRevenue / nextQuarterForecast) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground text-center">
                {currentQuarterOffers} Angebote erstellt
              </p>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Prognose basiert auf Pipeline-Wert, historischer Konversionsrate und 
                aktuellem Quartalstrend. Mehr Daten = höhere Genauigkeit.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
