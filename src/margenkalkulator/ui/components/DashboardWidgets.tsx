// ============================================
// Dashboard Widgets - Sales Cockpit Style
// Elegante Cards mit Akzent-Borders und großen Zahlen
// ============================================

import { Mail, TrendingUp, BarChart3, Loader2, Rocket, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardWidgets } from "@/margenkalkulator/hooks/useDashboardWidgets";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { EmptyStateCard } from "./EmptyStateCard";
import { formatCurrency } from "../../lib/formatters";
import { cn } from "@/lib/utils";

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
    <section className="w-full max-w-5xl mx-auto mb-8">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Überblick
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Widget 1: Gesendete Angebote */}
        <Card 
          className="relative overflow-hidden border-0 bg-card shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => navigate("/offers")}
        >
          {/* Left Accent Border */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Gesendete Angebote
              </span>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <Mail className="w-6 h-6 text-primary" />
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Lädt...</span>
              </div>
            ) : sentOffersLast30Days === 0 ? (
              <EmptyStateCard
                icon={Rocket}
                title="Dein Umsatz wartet"
                description="Starte jetzt deinen ersten Deal!"
                action={{ label: "Zum Kalkulator", href: "/calculator" }}
                variant="primary"
                compact
              />
            ) : (
              <>
                <div className="text-4xl font-bold text-foreground mb-1">
                  {sentOffersLast30Days}
                </div>
                <p className="text-sm text-muted-foreground">
                  Letzte 30 Tage
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Widget 2: Umsatz-Potenzial */}
        <Card 
          className="relative overflow-hidden border-0 bg-card shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => navigate("/reporting")}
        >
          {/* Left Accent Border */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-success" />
          
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Umsatz-Potenzial
              </span>
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center group-hover:bg-success/15 transition-colors">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Lädt...</span>
              </div>
            ) : monthlyRevenuePotential === 0 ? (
              <EmptyStateCard
                icon={TrendingUp}
                title="Potenzial entdecken"
                description="Versende dein erstes Angebot."
                variant="success"
                compact
              />
            ) : (
              <>
                <div className="text-4xl font-bold text-foreground mb-1">
                  {formatCurrency(monthlyRevenuePotential)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Monatliches Potenzial
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Widget 3: Top 3 Tarife */}
        <Card 
          className="relative overflow-hidden border-0 bg-card shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => navigate("/reporting")}
        >
          {/* Left Accent Border */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
          
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Top Tarife
              </span>
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-500/15 transition-colors">
                <BarChart3 className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Lädt...</span>
              </div>
            ) : topTariffs.length === 0 ? (
              <EmptyStateCard
                icon={BarChart3}
                title="Deine Bestseller"
                description="Hier erscheinen deine meistverkauften Tarife."
                variant="muted"
                compact
              />
            ) : (
              <>
                <div className="space-y-2.5">
                  {topTariffs.map((tariff, index) => (
                    <div key={tariff.tariffName} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={cn(
                          "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                          index === 0 
                            ? "bg-primary/10 text-primary" 
                            : index === 1 
                              ? "bg-muted text-muted-foreground" 
                              : "bg-muted/50 text-muted-foreground"
                        )}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground truncate max-w-[130px]">
                          {tariff.tariffName}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {tariff.count}×
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                  Letzte 90 Tage
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
