import { useNavigate } from "react-router-dom";
import { Calculator, Package, ArrowRight, Sparkles, Grid3X3, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MainLayout } from "@/components/MainLayout";
import { TICKER_ITEMS } from "@/margenkalkulator/data/news";

const Home = () => {
  const navigate = useNavigate();

  const tickerText = TICKER_ITEMS.join("   •   ");

  return (
    <MainLayout>
      {/* News Ticker */}
      <div className="w-full bg-primary text-primary-foreground py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap inline-block">
          <span className="text-sm font-medium px-4">
            {tickerText}   •   {tickerText}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-6 shadow-elevated">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Sales<span className="text-primary">Cockpit</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
            Konfiguriere individuelle Angebote oder wähle aus vorgefertigten Business-Bundles
          </p>
        </div>

        {/* Option Cards with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Individual Configuration */}
          <Card 
            className="group cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-elevated hover:scale-[1.02] bg-gradient-to-br from-card to-card/95 overflow-hidden relative"
            onClick={() => navigate("/calculator")}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardContent className="p-8 relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 group-hover:from-primary/30 group-hover:to-primary/15 transition-all shadow-soft">
                  <Calculator className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Individuelle Konfiguration
                </h2>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  Hardware, Tarif und Festnetz frei kombinieren – volle Kontrolle über jedes Detail
                </p>
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                  <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">Wizard</span>
                  <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">Flexibel</span>
                  <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">KI-Berater</span>
                </div>
                <div className="inline-flex items-center text-primary font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                  Wizard starten
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Corporate Bundles */}
          <Card 
            className="group cursor-pointer border-2 border-transparent hover:border-accent-foreground/20 transition-all duration-300 hover:shadow-elevated hover:scale-[1.02] bg-gradient-to-br from-card to-card/95 overflow-hidden relative"
            onClick={() => navigate("/bundles")}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/50 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardContent className="p-8 relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-6 group-hover:from-accent/80 group-hover:to-accent/50 transition-all shadow-soft">
                  <Grid3X3 className="h-8 w-8 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Vorgefertigte Bundles
                </h2>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  Corporate Campaigns und persönliche Templates – schnell und einheitlich kalkulieren
                </p>
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                  <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">Kampagnen</span>
                  <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">Templates</span>
                  <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">Quick-Start</span>
                </div>
                <div className="inline-flex items-center text-primary font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                  Bundles ansehen
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Footer */}
        <div className="mt-16 w-full max-w-4xl">
          <div className="grid grid-cols-3 gap-4 p-6 bg-card/50 rounded-2xl border border-border/50 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-foreground">System Online</span>
              <span className="text-xs text-muted-foreground">Alle Dienste aktiv</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">7 Bundles</span>
              <span className="text-xs text-muted-foreground">Corporate Campaigns</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-foreground">Tarife aktuell</span>
              <span className="text-xs text-muted-foreground">Stand: Q1 2025</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
