import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap, CheckCircle, TrendingUp, Key, UserPlus, Search, FileText, Bell, LogIn, LayoutGrid } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { useVVLCounts } from "@/margenkalkulator/hooks/useCustomerContracts";
import { useAuth } from "@/hooks/useAuth";
import { usePOSMode } from "@/contexts/POSModeContext";
import { Button } from "@/components/ui/button";
import { DashboardWidgets } from "@/margenkalkulator/ui/components/DashboardWidgets";
import { RecentActivityFeed } from "@/margenkalkulator/ui/components/RecentActivityFeed";
import { RevenueForecastWidget } from "@/margenkalkulator/ui/components/RevenueForecastWidget";
import { FollowupReminders } from "@/margenkalkulator/ui/components/FollowupReminders";
import { WelcomeWidget } from "@/margenkalkulator/ui/components/WelcomeWidget";
import { TodayTasksWidget } from "@/margenkalkulator/ui/components/TodayTasksWidget";
import { AverageMarginWidget } from "@/margenkalkulator/ui/components/AverageMarginWidget";
import { ProvisionSourcesWidget } from "@/margenkalkulator/ui/components/ProvisionSourcesWidget";
import { DiscountUsageWidget } from "@/margenkalkulator/ui/components/DiscountUsageWidget";
import { CriticalOffersWidget } from "@/margenkalkulator/ui/components/CriticalOffersWidget";
import { cn } from "@/lib/utils";

const Home = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { isPOSMode } = usePOSMode();
  const vvlCounts = useVVLCounts();
  
  // Badge shows critical (< 30 days) count
  const urgentVVLCount = vvlCounts.critical;

  return (
    <MainLayout>
      <div className="bg-background min-h-full flex flex-col">
        {/* Login Banner for unauthenticated users */}
        {!isLoading && !user && (
          <div className="bg-primary/10 border-b border-primary/20 py-3 px-4">
            <div className="container mx-auto flex items-center justify-between">
              <p className="text-sm text-foreground">
                <span className="font-medium">Willkommen!</span> Melden Sie sich an, um alle Funktionen zu nutzen.
              </p>
              <Button
                onClick={() => navigate("/auth")}
                size="sm"
                className="gap-2"
              >
                <LogIn className="w-4 h-4" />
                Anmelden
              </Button>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center px-4 lg:px-6 py-8">
          
          {/* PRIORITY 1: Welcome Widget - Prominently at the very top for new users */}
          {user && <WelcomeWidget />}

          {/* Headline */}
          <div className="text-center mb-8 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Wie möchten Sie{" "}
              <span className="text-primary italic">kalkulieren</span>?
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              Wählen Sie zwischen der detaillierten Einzelkonfiguration oder unseren
              optimierten Best-Practice Lösungen für Geschäftskunden.
            </p>
          </div>

          {/* Quickstart Icons - Enhanced */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10 animate-fade-in">
            <button
              onClick={() => navigate("/customers?action=new")}
              className="group flex flex-col items-center gap-3 p-6 bg-card border-0 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <UserPlus className="w-7 h-7 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Neuer Kunde</span>
            </button>

            <button
              onClick={() => navigate("/customers")}
              className="group flex flex-col items-center gap-3 p-6 bg-card border-0 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <Search className="w-7 h-7 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Kundensuche</span>
            </button>

            <button
              onClick={() => navigate("/calculator")}
              className="group flex flex-col items-center gap-3 p-6 bg-card border-0 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Neues Angebot</span>
            </button>

            <button
              onClick={() => navigate("/contracts")}
              className="group relative flex flex-col items-center gap-3 p-6 bg-card border-0 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <div className="relative w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-500/15 transition-colors">
                <Bell className="w-7 h-7 text-amber-500" />
                {/* VVL Badge */}
                {urgentVVLCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {urgentVVLCount > 9 ? '9+' : urgentVVLCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-foreground">VVL-Liste</span>
            </button>
          </div>

          {/* Today Tasks Widget - Replaces DailyDeltaWidget with real tasks */}
          {user && <TodayTasksWidget />}

          {/* Dashboard Widgets */}
          <DashboardWidgets />

          {/* Margen-Analytics Widgets - only for logged in users */}
          {user && (
            <section className={cn(
              "max-w-5xl mx-auto w-full mb-8",
              isPOSMode && "mb-4"
            )}>
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-4">
                <LayoutGrid className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Margen-Analytics
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AverageMarginWidget />
                <ProvisionSourcesWidget />
                <DiscountUsageWidget />
                <CriticalOffersWidget />
              </div>
            </section>
          )}

          {/* Revenue Forecast & Followup Reminders - only for logged in users */}
          {user && (
            <div className={cn(
              "grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl mx-auto mb-8 w-full",
              isPOSMode && "gap-3 mb-4"
            )}>
              <RevenueForecastWidget />
              <FollowupReminders />
            </div>
          )}

          {/* Recent Activity Feed - only for logged in users */}
          {user && (
            <div className={cn(
              "max-w-5xl mx-auto w-full mb-8",
              isPOSMode && "mb-4"
            )}>
              <RecentActivityFeed limit={8} compact={isPOSMode} />
            </div>
          )}

          {/* Option Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto w-full mb-8 items-stretch">
            {/* Individual Configuration Card (White) */}
            <div
              onClick={() => navigate("/calculator")}
              className="group relative bg-card rounded-2xl border-0 p-7 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl animate-fade-in min-h-[300px] flex flex-col"
            >
              {/* Icon in colored box */}
              <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6">
                <Key className="w-8 h-8 text-muted-foreground" />
              </div>

              {/* Decorative SVG - top right */}
              <div className="absolute top-8 right-8 opacity-15">
                <svg width="140" height="60" viewBox="0 0 140 60" fill="none">
                  <circle cx="30" cy="30" r="20" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
                  <line x1="50" y1="30" x2="90" y2="30" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
                  <circle cx="110" cy="30" r="15" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
                </svg>
              </div>

              <div className="flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Individuelle Konfiguration
                </h3>
                <p className="text-muted-foreground mb-6">
                  Der klassische Weg: Konfigurieren Sie Hardware, Mobilfunk-Tarife und Festnetz-Optionen Schritt für Schritt nach spezifischen Kundenanforderungen.
                </p>

                {/* Bullet Points */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  <li className="flex items-center gap-2.5 text-sm text-foreground">
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    Freie Hardware-Wahl
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-foreground">
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    Detaillierte Tarif-Optionen
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-foreground">
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    Manuelle Rabattierung
                  </li>
                </ul>

                <button className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all mt-auto">
                  Konfigurator starten
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bundles Card (Dark) */}
            <div
              onClick={() => navigate("/bundles")}
              className="group relative bg-panel-dark rounded-2xl p-7 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl animate-fade-in overflow-hidden min-h-[300px] flex flex-col"
            >
              {/* NEU Badge */}
              <div className="absolute top-6 right-6">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                  NEU
                </span>
              </div>

              {/* Decorative SVG - top right */}
              <div className="absolute top-16 right-8 opacity-15">
                <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                  <circle cx="20" cy="40" r="8" stroke="currentColor" strokeWidth="1.5" className="text-panel-dark-foreground" />
                  <line x1="28" y1="40" x2="55" y2="40" stroke="currentColor" strokeWidth="1.5" className="text-panel-dark-foreground" />
                  <circle cx="65" cy="40" r="12" stroke="currentColor" strokeWidth="1.5" className="text-panel-dark-foreground" />
                  <line x1="77" y1="35" x2="100" y2="20" stroke="currentColor" strokeWidth="1.5" className="text-panel-dark-foreground" />
                  <circle cx="105" cy="15" r="6" stroke="currentColor" strokeWidth="1.5" className="text-panel-dark-foreground" />
                </svg>
              </div>

              {/* Icon */}
              <div className="w-16 h-16 bg-panel-dark-foreground/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-panel-dark-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>

              <div className="flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-panel-dark-foreground mb-3">
                  Vorgefertigte Bundles
                </h3>
                <p className="text-panel-dark-muted mb-6">
                  Zeit sparen mit Best-Practice Paketen. Optimierte Kombinationen aus Hardware und Tarif für typische Kundenprofile (Start-up, SME, Enterprise).
                </p>

                {/* Quick Select Buttons */}
                <div className="flex gap-3 mb-6 flex-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate("/bundles"); }}
                    className="flex flex-col items-center justify-center gap-2 px-5 py-3.5 bg-panel-dark-foreground/5 rounded-xl border border-panel-dark-foreground/20 hover:bg-panel-dark-foreground/10 transition-colors min-w-[95px]"
                  >
                    <Zap className="w-5 h-5 text-panel-dark-foreground" />
                    <span className="text-xs font-bold text-panel-dark-foreground tracking-wide">START-UP</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate("/bundles"); }}
                    className="flex flex-col items-center justify-center gap-2 px-5 py-3.5 bg-panel-dark-foreground/5 rounded-xl border border-panel-dark-foreground/20 hover:bg-panel-dark-foreground/10 transition-colors min-w-[95px]"
                  >
                    <CheckCircle className="w-5 h-5 text-panel-dark-foreground" />
                    <span className="text-xs font-bold text-panel-dark-foreground tracking-wide">PROFI</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate("/bundles"); }}
                    className="flex flex-col items-center justify-center gap-2 px-5 py-3.5 bg-panel-dark-foreground/5 rounded-xl border border-panel-dark-foreground/20 hover:bg-panel-dark-foreground/10 transition-colors min-w-[95px]"
                  >
                    <TrendingUp className="w-5 h-5 text-panel-dark-foreground" />
                    <span className="text-xs font-bold text-panel-dark-foreground tracking-wide">EXECUTIVE</span>
                  </button>
                </div>

                <button className="inline-flex items-center gap-2 text-panel-dark-foreground font-semibold text-sm group-hover:gap-3 transition-all mt-auto">
                  Bundles anzeigen
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* System Status Footer */}
        <footer className="border-t border-border py-5 shrink-0 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Aktueller Systemstatus
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse-dot" />
                  <span className="text-muted-foreground">API Verbunden</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse-dot" />
                  <span className="text-muted-foreground">Katalog: v24.10.1</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse-dot" />
                  <span className="text-muted-foreground">AI Engine: Ready</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
};

export default Home;
