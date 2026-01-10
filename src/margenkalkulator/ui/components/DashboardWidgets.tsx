// ============================================
// Dashboard Widgets - Clean, Modern Design
// Minimalistisches Layout mit dezenten Akzenten
// ============================================

import { Mail, TrendingUp, BarChart3, Loader2, Rocket } from "lucide-react";
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
    <section className="w-full max-w-5xl mx-auto mb-6">
      {/* Section Label */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
        Überblick
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Widget 1: Gesendete Angebote */}
        <button 
          className="bg-card border border-border/50 rounded-xl p-5 text-left hover:border-border hover:shadow-sm transition-all group"
          onClick={() => navigate("/offers")}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Angebote
            </span>
            <div className="w-9 h-9 bg-primary/8 rounded-lg flex items-center justify-center group-hover:bg-primary/12 transition-colors">
              <Mail className="w-4.5 h-4.5 text-primary" />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : sentOffersLast30Days === 0 ? (
            <EmptyStateCard
              icon={Rocket}
              title="Dein Umsatz wartet"
              description="Starte deinen ersten Deal!"
              action={{ label: "Kalkulator", href: "/calculator" }}
              variant="primary"
              compact
            />
          ) : (
            <>
              <div className="text-3xl font-bold text-foreground mb-0.5">
                {sentOffersLast30Days}
              </div>
              <p className="text-xs text-muted-foreground">
                Letzte 30 Tage
              </p>
            </>
          )}
        </button>

        {/* Widget 2: Umsatz-Potenzial */}
        <button 
          className="bg-card border border-border/50 rounded-xl p-5 text-left hover:border-border hover:shadow-sm transition-all group"
          onClick={() => navigate("/reporting")}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Potenzial
            </span>
            <div className="w-9 h-9 bg-success/8 rounded-lg flex items-center justify-center group-hover:bg-success/12 transition-colors">
              <TrendingUp className="w-4.5 h-4.5 text-success" />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : monthlyRevenuePotential === 0 ? (
            <EmptyStateCard
              icon={TrendingUp}
              title="Potenzial entdecken"
              description="Versende ein Angebot."
              variant="success"
              compact
            />
          ) : (
            <>
              <div className="text-3xl font-bold text-foreground mb-0.5">
                {formatCurrency(monthlyRevenuePotential)}
              </div>
              <p className="text-xs text-muted-foreground">
                Monatlich
              </p>
            </>
          )}
        </button>

        {/* Widget 3: Top Tarife */}
        <button 
          className="bg-card border border-border/50 rounded-xl p-5 text-left hover:border-border hover:shadow-sm transition-all group"
          onClick={() => navigate("/reporting")}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Top Tarife
            </span>
            <div className="w-9 h-9 bg-amber-500/8 rounded-lg flex items-center justify-center group-hover:bg-amber-500/12 transition-colors">
              <BarChart3 className="w-4.5 h-4.5 text-amber-500" />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : topTariffs.length === 0 ? (
            <EmptyStateCard
              icon={BarChart3}
              title="Deine Bestseller"
              description="Erscheinen hier bald."
              variant="muted"
              compact
            />
          ) : (
            <div className="space-y-2">
              {topTariffs.map((tariff, index) => (
                <div key={tariff.tariffName} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-5 h-5 rounded flex items-center justify-center text-xs font-semibold",
                      index === 0 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                    <span className="text-sm text-foreground truncate max-w-[100px]">
                      {tariff.tariffName}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {tariff.count}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </button>
      </div>
    </section>
  );
}
