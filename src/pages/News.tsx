/**
 * News & Aktionen Page
 * 
 * Separate page for SalesWorld News and promotional bundles
 */

import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Search,
  Megaphone,
  Newspaper,
  Gift,
  Calendar,
  RefreshCw,
  Pin,
} from "lucide-react";

import { useNews, NEWS_TYPE_CONFIG, type NewsType } from "@/margenkalkulator/hooks/useNews";
import { usePromoBundles, type Sector } from "@/margenkalkulator/hooks/usePromoBundles";
import { NewsCard } from "@/margenkalkulator/ui/components/NewsCard";
import { PromoBundleCard } from "@/margenkalkulator/ui/components/PromoBundleCard";
import { MOCK_NEWS, TICKER_ITEMS } from "@/margenkalkulator/data/news";

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
    <div className="py-4">
      <Link 
        to="/" 
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
      >
        <ArrowLeft className="h-3 w-3" />
        ZURÜCK ZUM START
      </Link>
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">
          News & <span className="text-primary">Aktionen</span>
        </h1>
      </div>
      <p className="text-muted-foreground mt-1">
        Aktuelle Neuigkeiten und Sonderaktionen für Ihren Vertriebserfolg
      </p>
    </div>
  );
}

interface SectorFilterProps {
  activeSector: Sector | "all";
  onSectorChange: (sector: Sector | "all") => void;
}

function SectorFilter({ activeSector, onSectorChange }: SectorFilterProps) {
  const sectors: Array<{ id: Sector | "all"; label: string }> = [
    { id: "all", label: "Alle" },
    { id: "private", label: "Privat" },
    { id: "business", label: "Gewerbe" },
    { id: "enterprise", label: "Konzern" },
  ];

  return (
    <div className="flex gap-2">
      {sectors.map((sector) => (
        <Button
          key={sector.id}
          variant={activeSector === sector.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSectorChange(sector.id)}
        >
          {sector.label}
        </Button>
      ))}
    </div>
  );
}

interface NewsFilterProps {
  activeType: NewsType | "all";
  onTypeChange: (type: NewsType | "all") => void;
}

function NewsFilter({ activeType, onTypeChange }: NewsFilterProps) {
  const types: Array<{ id: NewsType | "all"; label: string }> = [
    { id: "all", label: "Alle" },
    { id: "alert", label: "Alerts" },
    { id: "info", label: "Info" },
    { id: "training", label: "Schulungen" },
    { id: "promo", label: "Aktionen" },
    { id: "stock", label: "Lager" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <Button
          key={type.id}
          variant={activeType === type.id ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange(type.id)}
        >
          {type.label}
        </Button>
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function News() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("news");
  const [activeSector, setActiveSector] = useState<Sector | "all">("all");
  const [activeNewsType, setActiveNewsType] = useState<NewsType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch news from database
  const { news: dbNews, isLoading: isLoadingNews } = useNews();

  // Fetch promo bundles
  const { bundles: promoBundles, isLoading: isLoadingPromos } = usePromoBundles({
    sector: activeSector === "all" ? undefined : activeSector,
  });

  // Combine DB news with mock news for now (until DB is populated)
  const allNews = useMemo(() => {
    if (dbNews.length > 0) {
      return dbNews;
    }
    // Fallback to mock data
    return MOCK_NEWS.map((item) => ({
      id: item.id,
      tenant_id: "",
      title: item.title,
      description: item.description,
      content: null,
      type: item.type,
      is_pinned: item.id === "1",
      valid_from: null,
      valid_until: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }, [dbNews]);

  // Filter news
  const filteredNews = useMemo(() => {
    let result = [...allNews];

    // Filter by type
    if (activeNewsType !== "all") {
      result = result.filter((n) => n.type === activeNewsType);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.description?.toLowerCase().includes(query)
      );
    }

    // Sort: pinned first, then by date
    result.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [allNews, activeNewsType, searchQuery]);

  // Filter promo bundles by search
  const filteredPromos = useMemo(() => {
    if (!searchQuery.trim()) return promoBundles;

    const query = searchQuery.toLowerCase();
    return promoBundles.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query)
    );
  }, [promoBundles, searchQuery]);

  const handleBundleSelect = (bundleId: string) => {
    const bundle = promoBundles.find((b) => b.id === bundleId);
    if (bundle) {
      navigate("/calculator", { state: { bundleConfig: bundle.config } });
    }
  };

  const pinnedNews = filteredNews.filter((n) => n.is_pinned);
  const regularNews = filteredNews.filter((n) => !n.is_pinned);

  return (
    <MainLayout>
      <div className="min-h-full bg-background -mx-4 md:-mx-6 -mt-4 md:-mt-6">
        {/* Ticker Bar */}
        <TickerBar />

        {/* Main Content */}
        <div className="w-full px-4 md:px-6 py-4">
          <PageHeader />

          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="news" className="gap-2">
                <Newspaper className="h-4 w-4" />
                News
              </TabsTrigger>
              <TabsTrigger value="promos" className="gap-2">
                <Gift className="h-4 w-4" />
                Aktionen
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2">
                <Calendar className="h-4 w-4" />
                Termine
              </TabsTrigger>
            </TabsList>

            {/* News Tab */}
            <TabsContent value="news" className="space-y-6">
              <NewsFilter activeType={activeNewsType} onTypeChange={setActiveNewsType} />

              {isLoadingNews ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Lade News...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pinned News */}
                  {pinnedNews.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Pin className="h-4 w-4 text-primary" />
                        <h2 className="font-semibold text-sm uppercase tracking-wide">
                          Angepinnt
                        </h2>
                      </div>
                      <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border">
                        {pinnedNews.map((news) => (
                          <NewsCard key={news.id} news={news} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regular News */}
                  {regularNews.length > 0 ? (
                    <div>
                      <h2 className="font-semibold text-sm uppercase tracking-wide mb-3">
                        Aktuell
                      </h2>
                      <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border">
                        {regularNews.map((news) => (
                          <NewsCard key={news.id} news={news} />
                        ))}
                      </div>
                    </div>
                  ) : pinnedNews.length === 0 ? (
                    <div className="text-center py-16 bg-muted/20 rounded-xl">
                      <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Keine News gefunden</p>
                      <p className="text-sm text-muted-foreground">
                        Passe deine Filter an oder versuche einen anderen Suchbegriff
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </TabsContent>

            {/* Promos Tab */}
            <TabsContent value="promos" className="space-y-6">
              <SectorFilter activeSector={activeSector} onSectorChange={setActiveSector} />

              {isLoadingPromos ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Lade Aktionen...</p>
                </div>
              ) : filteredPromos.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPromos.map((bundle) => (
                    <PromoBundleCard
                      key={bundle.id}
                      bundle={bundle}
                      onSelect={() => handleBundleSelect(bundle.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/20 rounded-xl">
                  <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Keine Aktionspakete verfügbar</p>
                  <p className="text-sm text-muted-foreground">
                    Aktuell gibt es keine aktiven Sonderaktionen
                    {activeSector !== "all" && " für diesen Bereich"}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6">
              <div className="text-center py-16 bg-muted/20 rounded-xl">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Termine & Schulungen</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Kommende Termine werden hier angezeigt
                </p>
                <Button variant="outline" asChild>
                  <Link to="/calendar">Zum Kalender</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
