import { useNavigate } from "react-router-dom";
import { Calculator, Package, ArrowRight, Sparkles, Grid3X3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MainLayout } from "@/components/MainLayout";

const Home = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            SalesCockpit
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Konfiguriere individuelle Angebote oder wähle aus vorgefertigten Business-Bundles
          </p>
        </div>

        {/* Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Individual Configuration */}
          <Card 
            className="group cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-card"
            onClick={() => navigate("/calculator")}
          >
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Calculator className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Individuelle Konfiguration
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Hardware, Tarif und Festnetz frei kombinieren – volle Kontrolle über jedes Detail
                </p>
                <div className="inline-flex items-center text-primary font-medium text-sm group-hover:gap-2 gap-1 transition-all">
                  Wizard starten
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Corporate Bundles */}
          <Card 
            className="group cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-card"
            onClick={() => navigate("/bundles")}
          >
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-5 group-hover:bg-accent/80 transition-colors">
                  <Grid3X3 className="h-7 w-7 text-accent-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Vorgefertigte Bundles
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Corporate Campaigns und persönliche Templates – schnell und einheitlich kalkulieren
                </p>
                <div className="inline-flex items-center text-primary font-medium text-sm group-hover:gap-2 gap-1 transition-all">
                  Bundles ansehen
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>12 aktive Campaigns</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span>Alle Tarife aktuell</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
