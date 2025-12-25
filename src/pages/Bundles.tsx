import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  FileText, 
  User, 
  Building2, 
  Building,
  ArrowRight,
  Star,
  Folder,
  Plus,
  Newspaper
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/MainLayout";
import { 
  DEMO_BUNDLES, 
  loadTemplates, 
  loadFolders,
  type Sector, 
  type CorporateBundle,
  SECTOR_LABELS 
} from "@/margenkalkulator/storage/bundles";

const SECTOR_ICON_MAP = {
  private: User,
  business: Building2,
  enterprise: Building,
};

const Bundles = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"campaigns" | "templates">("campaigns");
  const [selectedSector, setSelectedSector] = useState<Sector>("business");
  
  const templates = useMemo(() => loadTemplates(), []);
  const folders = useMemo(() => loadFolders(), []);

  const filteredBundles = useMemo(() => 
    DEMO_BUNDLES.filter((b) => b.sector === selectedSector),
    [selectedSector]
  );

  const handleSelectBundle = (bundle: CorporateBundle) => {
    // Navigate to calculator with pre-filled config
    navigate("/calculator", { state: { bundleConfig: bundle.config } });
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Bundle Selector
          </h1>
          <p className="text-muted-foreground">
            Wähle vorkonfigurierte Angebote oder nutze deine persönlichen Templates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Bundles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "campaigns" | "templates")}>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="campaigns" className="gap-2">
                  <Package className="h-4 w-4" />
                  Corporate Campaigns
                </TabsTrigger>
                <TabsTrigger value="templates" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Meine Templates
                </TabsTrigger>
              </TabsList>

              {/* Campaigns Tab */}
              <TabsContent value="campaigns" className="mt-6 space-y-6">
                {/* Sector Switcher */}
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(SECTOR_LABELS) as Sector[]).map((sector) => {
                    const Icon = SECTOR_ICON_MAP[sector];
                    const isActive = selectedSector === sector;
                    return (
                      <Button
                        key={sector}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSector(sector)}
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {SECTOR_LABELS[sector]}
                      </Button>
                    );
                  })}
                </div>

                {/* Bundles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBundles.map((bundle) => (
                    <Card 
                      key={bundle.id}
                      className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200"
                      onClick={() => handleSelectBundle(bundle)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base font-semibold">
                            {bundle.name}
                          </CardTitle>
                          {bundle.featured && (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {bundle.description}
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {bundle.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 gap-1 transition-all">
                          Konfiguration öffnen
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredBundles.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Bundles für diesen Sektor verfügbar</p>
                  </div>
                )}
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates" className="mt-6 space-y-6">
                {/* Folders */}
                {folders.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Ordner</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {folders.map((folder) => (
                        <Card 
                          key={folder.id}
                          className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                        >
                          <CardContent className="p-4 flex items-center gap-3">
                            <Folder className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium truncate">{folder.name}</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Templates */}
                {templates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <Card 
                        key={template.id}
                        className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200"
                        onClick={() => navigate("/calculator", { state: { templateConfig: template.config } })}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-semibold">
                            {template.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            Erstellt: {new Date(template.createdAt).toLocaleDateString("de-DE")}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 gap-1 transition-all">
                            Template laden
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">Noch keine Templates erstellt</p>
                    <Button variant="outline" onClick={() => navigate("/calculator")} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Neues Template erstellen
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: News Feed */}
          <div className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  Salesworld News
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <NewsItem 
                  title="Provisions-Booster Q1"
                  description="Prime XL Neuverträge +75€ Extra-Provision"
                  date="Heute"
                  type="promo"
                />
                <NewsItem 
                  title="iPhone 16 Pro verfügbar"
                  description="Alle Farben wieder lieferbar, Lieferzeit 2-3 Tage"
                  date="Gestern"
                  type="stock"
                />
                <NewsItem 
                  title="GigaKombi Update"
                  description="Neue Konvergenz-Regeln ab Februar 2025"
                  date="20.12.2024"
                  type="info"
                />
                <NewsItem 
                  title="Schulung: Prime Tarife"
                  description="Online-Webinar am 08.01.2025, 14:00 Uhr"
                  date="18.12.2024"
                  type="training"
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Schnellaktionen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => navigate("/calculator")}
                >
                  <Plus className="h-4 w-4" />
                  Neue Konfiguration
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => navigate("/offers")}
                >
                  <FileText className="h-4 w-4" />
                  Meine Angebote
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

// News Item Component
interface NewsItemProps {
  title: string;
  description: string;
  date: string;
  type: "promo" | "stock" | "info" | "training";
}

const NewsItem = ({ title, description, date, type }: NewsItemProps) => {
  const typeColors = {
    promo: "bg-green-500/10 text-green-700 dark:text-green-400",
    stock: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    info: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    training: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  };

  const typeLabels = {
    promo: "Aktion",
    stock: "Lager",
    info: "Info",
    training: "Schulung",
  };

  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <Badge variant="secondary" className={`text-xs ${typeColors[type]}`}>
          {typeLabels[type]}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{description}</p>
      <span className="text-xs text-muted-foreground/70">{date}</span>
    </div>
  );
};

export default Bundles;
