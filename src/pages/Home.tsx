import { useNavigate } from "react-router-dom";
import { Calculator, ArrowRight, Zap, CheckCircle, TrendingUp, Key } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";

const Home = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="bg-background min-h-full flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card shrink-0">
          <div className="px-6 py-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Margen<span className="text-primary">Kalkulator</span>
              </h1>
              <p className="text-xs text-muted-foreground">Professional Edition</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center px-6 py-10">
          {/* Headline */}
          <div className="text-center mb-10 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
              Wie möchten Sie{" "}
              <span className="text-primary italic">kalkulieren</span>?
            </h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
              Wählen Sie zwischen der detaillierten Einzelkonfiguration oder unseren
              optimierten Best-Practice Lösungen für Geschäftskunden.
            </p>
          </div>

          {/* Option Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto w-full mb-12">
            {/* Individual Configuration Card (White) */}
            <div
              onClick={() => navigate("/calculator")}
              className="group relative bg-card rounded-2xl border border-border p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-primary/20 animate-fade-in min-h-[320px] flex flex-col"
            >
              {/* Icon in gray circle */}
              <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mb-6">
                <Key className="w-7 h-7 text-muted-foreground" />
              </div>

              {/* Decorative SVG - top right */}
              <div className="absolute top-8 right-8 opacity-20">
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
                <ul className="space-y-2 mb-6 flex-1">
                  <li className="flex items-center gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Freie Hardware-Wahl
                  </li>
                  <li className="flex items-center gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Detaillierte Tarif-Optionen
                  </li>
                  <li className="flex items-center gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
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
              className="group relative bg-panel-dark rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-xl animate-fade-in overflow-hidden min-h-[320px] flex flex-col"
            >
              {/* NEU Badge */}
              <div className="absolute top-6 right-6">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
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
              <div className="w-14 h-14 bg-panel-dark-foreground/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-panel-dark-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    className="flex flex-col items-center justify-center gap-2 px-5 py-3 bg-panel-dark-foreground/5 rounded-xl border border-panel-dark-foreground/20 hover:bg-panel-dark-foreground/10 transition-colors min-w-[90px]"
                  >
                    <Zap className="w-5 h-5 text-panel-dark-foreground" />
                    <span className="text-xs font-semibold text-panel-dark-foreground tracking-wide">START-UP</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate("/bundles"); }}
                    className="flex flex-col items-center justify-center gap-2 px-5 py-3 bg-panel-dark-foreground/5 rounded-xl border border-panel-dark-foreground/20 hover:bg-panel-dark-foreground/10 transition-colors min-w-[90px]"
                  >
                    <CheckCircle className="w-5 h-5 text-panel-dark-foreground" />
                    <span className="text-xs font-semibold text-panel-dark-foreground tracking-wide">PROFI</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate("/bundles"); }}
                    className="flex flex-col items-center justify-center gap-2 px-5 py-3 bg-panel-dark-foreground/5 rounded-xl border border-panel-dark-foreground/20 hover:bg-panel-dark-foreground/10 transition-colors min-w-[90px]"
                  >
                    <TrendingUp className="w-5 h-5 text-panel-dark-foreground" />
                    <span className="text-xs font-semibold text-panel-dark-foreground tracking-wide">EXECUTIVE</span>
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
        <footer className="border-t border-border py-6 shrink-0">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Aktueller Systemstatus
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full" />
                <span className="text-muted-foreground">API Verbunden</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full" />
                <span className="text-muted-foreground">Katalog: v24.10.1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full" />
                <span className="text-muted-foreground">AI Engine: Ready</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
};

export default Home;