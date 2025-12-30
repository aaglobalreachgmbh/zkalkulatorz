// ============================================
// Dashboard Widgets Component
// ============================================

import { Mail, TrendingUp, BarChart3, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardWidgets } from "@/margenkalkulator/hooks/useDashboardWidgets";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DashboardWidgets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    sentOffersLast30Days, 
    monthlyRevenuePotential, 
    topTariffs, 
    isLoading 
  } = useDashboardWidgets();

  // Don't show widgets for unauthenticated users
  if (!user) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mx-auto mb-8">
      {/* Widget 1: Gesendete Angebote */}
      <Card 
        className="bg-card border-border hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate("/offers")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Gesendete Angebote
          </CardTitle>
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-4 h-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Lädt...</span>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-foreground">
                {sentOffersLast30Days}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Letzte 30 Tage
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Widget 2: Umsatz-Potenzial */}
      <Card 
        className="bg-card border-border hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate("/reporting")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Umsatz-Potenzial
          </CardTitle>
          <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Lädt...</span>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(monthlyRevenuePotential)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Monatliches Potenzial (offene Angebote)
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Widget 3: Top 3 Tarife */}
      <Card 
        className="bg-card border-border hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate("/reporting")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Tarife
          </CardTitle>
          <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Lädt...</span>
            </div>
          ) : topTariffs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Daten vorhanden
            </p>
          ) : (
            <div className="space-y-2">
              {topTariffs.map((tariff, index) => (
                <div key={tariff.tariffName} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`w-5 h-5 p-0 flex items-center justify-center text-xs ${
                        index === 0 ? 'bg-primary/10 text-primary border-primary/30' :
                        index === 1 ? 'bg-muted text-muted-foreground' :
                        'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                      {tariff.tariffName}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {tariff.count}×
                  </span>
                </div>
              ))}
            </div>
          )}
          {topTariffs.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Letzte 90 Tage
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
