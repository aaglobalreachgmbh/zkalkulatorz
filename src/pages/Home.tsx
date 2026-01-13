import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap, CheckCircle, TrendingUp, Key, LogIn } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePOSMode } from "@/contexts/POSModeContext";
import { Button } from "@/components/ui/button";
import { ConfigurableDashboard } from "@/margenkalkulator/ui/components/ConfigurableDashboard";

const Home = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { isPOSMode } = usePOSMode();

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
        <main className="flex-1 flex flex-col justify-center px-4 lg:px-6 py-6">

          {/* Configurable Dashboard - All widgets including headline and quick actions */}
          <div className="max-w-5xl mx-auto w-full mb-6">
            <ConfigurableDashboard />
          </div>

          {/* Option Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto w-full mb-6 items-stretch">
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

              </ul>

              <div className="flex gap-3 mt-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/calculator?demo=true");
                  }}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-medium text-sm transition-colors py-2"
                >
                  Demo laden
                </button>
                <button className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all ml-auto">
                  Konfigurator starten
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
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

        {/* System Status Footer */ }
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
      </div >
    </MainLayout >
  );
};

export default Home;
