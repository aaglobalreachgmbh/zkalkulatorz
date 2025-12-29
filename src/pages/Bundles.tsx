/**
 * Sales Cockpit - Bundles Page
 * 
 * Zeigt vorkonfigurierte Bundles und persönliche Templates.
 * Layout basiert auf Screenshot-Referenzen.
 */

import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Star,
  User,
  Building2,
  Building,
  ArrowLeft,
  Search,
  Bell,
  Target,
  ArrowRight,
  FileText,
  Download,
  Calendar,
  BarChart3,
  Megaphone,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";

import { 
  DEMO_BUNDLES, 
  type Sector, 
  type CorporateBundle as LocalCorporateBundle,
} from "@/margenkalkulator/storage/bundles";
import { 
  useCorporateBundles, 
  SECTOR_LABELS, 
  type CorporateBundle as CloudCorporateBundle,
  type Sector as CloudSector,
} from "@/margenkalkulator/hooks/useCorporateBundles";
import { 
  TICKER_ITEMS, 
  MOCK_NEWS, 
  NEWS_TYPE_CONFIG, 
  STRATEGIC_FOCUS,
  QUICK_TOOLS,
  type NewsItem,
} from "@/margenkalkulator/data/news";
import { useAuth } from "@/hooks/useAuth";

// ============================================
// Types
// ============================================

type TabType = "campaigns" | "myBundles" | "templates";

const SECTOR_DISPLAY: Record<Sector, { label: string; icon: typeof User }> = {
  private: { label: "Privat", icon: User },
  business: { label: "Gewerbe", icon: Building2 },
  enterprise: { label: "Konzern", icon: Building },
};

// Demo bundle badges based on tags
const getBundleBadge = (bundle: LocalCorporateBundle | CloudCorporateBundle): { label: string; color: string } | null => {
  if (bundle.tags.includes("Einsteiger") || bundle.tags.includes("Günstig")) {
    return { label: "PREISSIEGER", color: "border-orange-400" };
  }
  if (bundle.tags.includes("Premium") || bundle.tags.includes("KMU")) {
    return { label: "BESTSELLER", color: "border-primary" };
  }
  return null;
};

// ============================================
// Sub-Components
// ============================================

function TickerBar() {
  return (
    <div className="bg-slate-900 text-white overflow-hidden">
      <div className="flex items-center">
        <div className="bg-primary px-3 py-1.5 flex items-center gap-1.5 shrink-0">
          <Megaphone className="h-3.5 w-3.5 text-primary-foreground" />
          <span className="text-xs font-bold text-primary-foreground">SALES PUSH</span>
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap py-1.5">
          <div className="animate-marquee inline-block text-sm">
            {TICKER_ITEMS.map((item, i) => (
              <span key={i} className="mx-8">{item}</span>
            ))}
            {TICKER_ITEMS.map((item, i) => (
              <span key={`dup-${i}`} className="mx-8">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <Link 
          to="/" 
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
        >
          <ArrowLeft className="h-3 w-3" />
          ZURÜCK ZUM START
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            Sales <span className="text-primary">Cockpit</span>
          </h1>
          <Badge variant="outline" className="text-xs font-normal">
            v2.4.0
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Suche..." 
            className="pl-9 w-48 bg-background"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
        </Button>
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

interface TabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex items-center gap-6 border-b border-border">
      <button
        onClick={() => onTabChange("campaigns")}
        className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
          activeTab === "campaigns"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <Package className="h-4 w-4" />
        <span className="font-medium">Zentrale Kampagnen</span>
      </button>
      <button
        onClick={() => onTabChange("myBundles")}
        className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
          activeTab === "myBundles"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <Plus className="h-4 w-4" />
        <span className="font-medium">Meine Pakete</span>
      </button>
      <button
        onClick={() => onTabChange("templates")}
        className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
          activeTab === "templates"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <Star className="h-4 w-4" />
        <span className="font-medium">Meine Vorlagen</span>
      </button>
    </div>
  );
}

interface SectorSwitcherProps {
  activeSector: Sector;
  onSectorChange: (sector: Sector) => void;
}

function SectorSwitcher({ activeSector, onSectorChange }: SectorSwitcherProps) {
  const sectors: Sector[] = ["private", "business", "enterprise"];
  
  return (
    <div className="flex rounded-lg border border-border bg-muted/30 p-1">
      {sectors.map((sector) => {
        const { label, icon: Icon } = SECTOR_DISPLAY[sector];
        const isActive = activeSector === sector;
        
        return (
          <button
            key={sector}
            onClick={() => onSectorChange(sector)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function StrategicFocusCard() {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
      <div className="flex gap-4">
        <div className="shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">
            STRATEGISCHER FOKUS
          </p>
          <h3 className="text-lg font-semibold text-primary mb-1">
            {STRATEGIC_FOCUS.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {STRATEGIC_FOCUS.description}
          </p>
        </div>
      </div>
    </div>
  );
}

interface BundleCardProps {
  bundle: LocalCorporateBundle | CloudCorporateBundle;
  badgeInfo: { label: string; color: string } | null;
  onClick: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

function BundleCard({ bundle, badgeInfo, onClick, onDelete, showDelete }: BundleCardProps) {
  // Extract display info from config
  const hardwareName = bundle.config.hardware?.name || "SIM Only";
  const tariffId = bundle.config.mobile?.tariffId || "PRIME_S";
  const tariffLabel = tariffId.replace("_", " ");
  
  return (
    <div 
      className={`bg-background border rounded-xl overflow-hidden hover:shadow-md transition-shadow ${
        badgeInfo ? `border-t-4 ${badgeInfo.color}` : "border-border"
      }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg">{bundle.name}</h3>
          <div className="flex items-center gap-2">
            {badgeInfo && (
              <Badge variant="outline" className="text-xs shrink-0">
                {badgeInfo.label}
              </Badge>
            )}
            {showDelete && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground mb-5">
          {bundle.description}
        </p>
        
        {/* Hardware Row */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg mb-2">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            📱
          </div>
          <div>
            <p className="font-medium text-sm">{hardwareName}</p>
            <p className="text-xs text-muted-foreground">Hardware</p>
          </div>
        </div>
        
        {/* Tariff Row */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Business {tariffLabel}</p>
            <p className="text-xs text-muted-foreground">Tarif</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <button 
        onClick={onClick}
        className="w-full px-5 py-3 border-t border-border text-sm text-muted-foreground hover:text-primary hover:bg-muted/20 transition-colors flex items-center justify-between group"
      >
        Sofort übernehmen
        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}

interface NewsCardProps {
  news: NewsItem;
}

function NewsCard({ news }: NewsCardProps) {
  const typeConfig = NEWS_TYPE_CONFIG[news.type];
  
  return (
    <div className="p-4 border-l-2 border-primary/20 hover:border-primary transition-colors">
      <div className="flex items-start justify-between mb-2">
        <Badge className={`${typeConfig.bgColor} text-xs font-medium`}>
          {typeConfig.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {news.time ? `${news.date}, ${news.time}` : news.date}
        </span>
      </div>
      <h4 className="font-semibold text-sm mb-1">{news.title}</h4>
      <p className="text-sm text-muted-foreground mb-2">{news.description}</p>
      <button className="text-sm text-foreground hover:text-primary inline-flex items-center gap-1 transition-colors">
        Mehr lesen <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function QuickToolsCard() {
  const icons: Record<string, typeof FileText> = {
    FileText,
    Download,
    Calendar,
  };
  
  return (
    <div className="bg-slate-900 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Quick Tools</h3>
      <div className="space-y-2">
        {QUICK_TOOLS.map((tool) => {
          const Icon = icons[tool.icon] || FileText;
          return (
            <button
              key={tool.id}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm transition-colors"
            >
              <Icon className="h-4 w-4 text-slate-400" />
              {tool.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function Bundles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("campaigns");
  const [activeSector, setActiveSector] = useState<Sector>("business");

  // Cloud bundles (user-created)
  const { 
    bundles: cloudBundles, 
    isLoading: isLoadingCloudBundles, 
    deleteBundle,
    isDeleting 
  } = useCorporateBundles({ includeInactive: true });

  // Filter demo bundles by sector
  const filteredBundles = useMemo(() => {
    return DEMO_BUNDLES.filter((b) => b.sector === activeSector);
  }, [activeSector]);

  // Filter cloud bundles by sector  
  const filteredCloudBundles = useMemo(() => {
    return cloudBundles.filter((b) => b.sector === activeSector);
  }, [cloudBundles, activeSector]);

  // Get featured bundles (max 2)
  const featuredBundles = useMemo(() => {
    const featured = filteredBundles.filter((b) => b.featured);
    return featured.length > 0 ? featured.slice(0, 2) : filteredBundles.slice(0, 2);
  }, [filteredBundles]);

  const handleBundleClick = (bundle: LocalCorporateBundle | CloudCorporateBundle) => {
    // Navigate to calculator with bundle config
    navigate("/calculator", { state: { bundleConfig: bundle.config } });
  };

  const handleDeleteBundle = (bundleId: string) => {
    if (window.confirm("Möchtest du dieses Paket wirklich löschen?")) {
      deleteBundle(bundleId);
    }
  };

  return (
    <MainLayout>
      {/* Outer container - uses negative margin to escape MainLayout padding for full-width ticker */}
      <div className="min-h-full bg-background -mx-4 md:-mx-6 -mt-4 md:-mt-6">
        {/* Ticker Bar - Full Width */}
        <TickerBar />

        {/* Main Content - full available width */}
        <div className="w-full px-4 md:px-6 py-4">
          {/* Header */}
          <PageHeader />

          {/* Tabs */}
          <div className="mb-6">
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Two Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Main Content */}
            <div className="flex-1 min-w-0 space-y-6">
              {activeTab === "campaigns" && (
                <>
                  {/* Sector Switcher */}
                  <SectorSwitcher 
                    activeSector={activeSector} 
                    onSectorChange={setActiveSector} 
                  />

                  {/* Strategic Focus */}
                  <StrategicFocusCard />

                  {/* Top Deals Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="h-4 w-4 text-amber-500" />
                      <h2 className="font-semibold text-sm uppercase tracking-wide">
                        Top Deals: {SECTOR_DISPLAY[activeSector].label}
                      </h2>
                    </div>

                    {featuredBundles.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {featuredBundles.map((bundle) => (
                          <BundleCard
                            key={bundle.id}
                            bundle={bundle}
                            badgeInfo={getBundleBadge(bundle)}
                            onClick={() => handleBundleClick(bundle)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Keine Bundles für diesen Sektor verfügbar</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === "myBundles" && (
                <>
                  {/* Sector Switcher */}
                  <SectorSwitcher 
                    activeSector={activeSector} 
                    onSectorChange={setActiveSector} 
                  />

                  {/* My Bundles Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <h2 className="font-semibold text-sm uppercase tracking-wide">
                          Meine Pakete: {SECTOR_DISPLAY[activeSector].label}
                        </h2>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/calculator")}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Neues Paket
                      </Button>
                    </div>

                    {isLoadingCloudBundles ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                        <p>Pakete werden geladen...</p>
                      </div>
                    ) : filteredCloudBundles.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {filteredCloudBundles.map((bundle) => (
                          <BundleCard
                            key={bundle.id}
                            bundle={bundle}
                            badgeInfo={getBundleBadge(bundle)}
                            onClick={() => handleBundleClick(bundle)}
                            onDelete={() => handleDeleteBundle(bundle.id)}
                            showDelete={true}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium mb-2">Keine eigenen Pakete vorhanden</p>
                        <p className="text-sm mb-4">
                          Erstelle Pakete im Kalkulator mit "Als Paket speichern"
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => navigate("/calculator")}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Zum Kalkulator
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === "templates" && (
                <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-2">Keine Vorlagen vorhanden</p>
                  <p className="text-sm">
                    Erstelle Vorlagen im Kalkulator mit "Als Vorlage speichern"
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Sidebar */}
            <aside className="w-full lg:w-80 shrink-0 space-y-6">
              {/* News Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    <h2 className="font-semibold">Salesworld News</h2>
                  </div>
                  <button className="text-sm text-primary hover:underline">
                    Alle anzeigen
                  </button>
                </div>

                <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border">
                  {MOCK_NEWS.slice(0, 3).map((news) => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              </div>

              {/* Quick Tools */}
              <QuickToolsCard />
            </aside>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
