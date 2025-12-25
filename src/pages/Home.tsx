import { useNavigate } from "react-router-dom";
import { Calculator, ArrowRight, Zap, TrendingUp, BarChart3, Key, Link2 } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";

const Home = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-4 flex items-center gap-3">
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
        <main className="container mx-auto px-6 py-16">
          {/* Headline */}
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Wie möchten Sie{" "}
              <span className="text-primary italic">kalkulieren</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Wählen Sie zwischen der detaillierten Einzelkonfiguration oder unseren
              optimierten Best-Practice Lösungen für Geschäftskunden.
            </p>
          </div>

          {/* Option Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
            {/* Individual Configuration Card (White) */}
            <div
              onClick={() => navigate("/calculator")}
              className="group relative bg-card rounded-2xl border border-border p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-primary/20 animate-fade-in"
            >
              {/* Decorative Icons */}
              <div className="absolute top-8 right-8 flex items-center gap-2 opacity-20">
                <Key className="w-10 h-10 text-muted-foreground" />
                <div className="w-12 h-0.5 bg-muted-foreground rounded" />
                <Link2 className="w-8 h-8 text-muted-foreground" />
              </div>

              <div className="relative">
                <h3 className="text-2xl font-bold text-foreground mb-3 mt-8">
                  Individuelle Konfiguration
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Der klassische Weg: Konfigurieren Sie Hardware, Mobilfunk-Tarife und Festnetz-Optionen Schritt für Schritt nach spezifischen Kundenanforderungen.
                </p>

                {/* Bullet Points */}
                <ul className="space-y-2 mb-8">
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

                <button className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                  Konfigurator starten
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bundles Card (Dark) */}
            <div
              onClick={() => navigate("/bundles")}
              className="group relative bg-panel-dark rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-xl animate-fade-in overflow-hidden"
            >
              {/* NEU Badge */}
              <div className="absolute top-6 right-6">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  NEU
                </span>
              </div>

              {/* Decorative background pattern */}
              <div className="absolute top-4 right-20 opacity-10">
                <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                  <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="1" className="text-panel-dark-foreground" />
                  <line x1="28" y1="20" x2="50" y2="20" stroke="currentColor" strokeWidth="1" className="text-panel-dark-foreground" />
                  <circle cx="58" cy="20" r="4" stroke="currentColor" strokeWidth="1" className="text-panel-dark-foreground" />
                  <line x1="62" y1="20" x2="80" y2="40" stroke="currentColor" strokeWidth="1" className="text-panel-dark-foreground" />
                  <circle cx="85" cy="45" r="6" stroke="currentColor" strokeWidth="1" className="text-panel-dark-foreground" />
                </svg>
              </div>

              <div className="relative">
                {/* Icon */}
                <div className="w-12 h-12 bg-panel-dark-foreground/10 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-panel-dark-foreground" />
                </div>

                <h3 className="text-2xl font-bold text-panel-dark-foreground mb-3">
                  Vorgefertigte Bundles
                </h3>
                <p className="text-panel-dark-muted mb-8 max-w-sm">
                  Zeit sparen mit Best-Practice Paketen. Optimierte Kombinationen aus Hardware und Tarif für typische Kundenprofile (Start-up, SME, Enterprise).
                </p>

                {/* Quick Select Buttons */}
                <div className="flex gap-3 mb-8">
                  <button className="flex flex-col items-center gap-1 px-4 py-3 bg-panel-dark-foreground/5 rounded-lg border border-panel-dark-foreground/10 hover:bg-panel-dark-foreground/10 transition-colors">
                    <Zap className="w-5 h-5 text-panel-dark-foreground" />
                    <span className="text-xs font-medium text-panel-dark-foreground">START-UP</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 px-4 py-3 bg-panel-dark-foreground/5 rounded-lg border border-panel-dark-foreground/10 hover:bg-panel-dark-foreground/10 transition-colors">
                    <BarChart3 className="w-5 h-5 text-panel-dark-foreground" />
                    <span className="text-xs font-medium text-panel-dark-foreground">PROFI</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 px-4 py-3 bg-panel-dark-foreground/5 rounded-lg border border-panel-dark-foreground/10 hover:bg-panel-dark-foreground/10 transition-colors">
                    <TrendingUp className="w-5 h-5 text-panel-dark-foreground" />
                    <span className="text-xs font-medium text-panel-dark-foreground">EXECUTIVE</span>
                  </button>
                </div>

                <button className="inline-flex items-center gap-2 text-panel-dark-foreground font-semibold text-sm group-hover:gap-3 transition-all">
                  Bundles anzeigen
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* System Status Footer */}
          <div className="border-t border-border pt-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                Aktueller Systemstatus
              </p>
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-dot" />
                  <span className="text-muted-foreground">API Verbunden</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-dot" />
                  <span className="text-muted-foreground">Katalog: v24.10.1</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-dot" />
                  <span className="text-muted-foreground">AI Engine: Ready</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export default Home;