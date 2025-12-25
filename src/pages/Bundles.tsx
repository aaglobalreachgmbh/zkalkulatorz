import { useState, useMemo, useCallback } from "react";
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
  FolderOpen,
  Plus,
  Newspaper,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  FolderInput,
  ChevronLeft,
  Search,
  Bell,
  Calculator,
  Target,
  ArrowLeft,
  Download,
  Calendar,
  Home as HomeIcon,
  Signal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { MainLayout } from "@/components/MainLayout";
import { useToast } from "@/hooks/use-toast";
import { 
  DEMO_BUNDLES, 
  loadTemplates, 
  loadFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  deleteTemplate,
  duplicateTemplate,
  moveTemplate,
  getTemplatesInFolder,
  type Sector, 
  type CorporateBundle,
  type PersonalTemplate,
  type TemplateFolder,
  SECTOR_LABELS 
} from "@/margenkalkulator/storage/bundles";
import { TICKER_ITEMS, MOCK_NEWS, NEWS_TYPE_CONFIG, STRATEGIC_FOCUS, QUICK_TOOLS, type NewsItem as NewsItemType } from "@/margenkalkulator/data/news";

const SECTOR_ICON_MAP = {
  private: User,
  business: Building2,
  enterprise: Building,
};

// News Item Component matching screenshot
const NewsItem = ({ title, description, date, time, type }: NewsItemType) => {
  const config = NEWS_TYPE_CONFIG[type];
  return (
    <div className="border-l-4 border-primary/20 hover:border-primary transition-colors">
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${config.bgColor}`}>
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {time ? `${date}, ${time}` : date}
          </span>
        </div>
        <h4 className="font-semibold text-foreground text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        <button className="text-xs font-medium text-foreground hover:text-primary flex items-center gap-1 transition-colors">
          Mehr lesen <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const Bundles = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"campaigns" | "templates">("campaigns");
  const [selectedSector, setSelectedSector] = useState<Sector>("business");
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Folder navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  
  // Dialogs
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<TemplateFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  
  // Load data with refresh
  const templates = useMemo(() => loadTemplates(), [refreshKey]);
  const folders = useMemo(() => loadFolders(), [refreshKey]);

  const filteredBundles = useMemo(() => 
    DEMO_BUNDLES.filter((b) => b.sector === selectedSector),
    [selectedSector]
  );
  
  // Current folder templates
  const currentTemplates = useMemo(() => 
    getTemplatesInFolder(currentFolderId),
    [currentFolderId, refreshKey]
  );
  
  const currentFolder = useMemo(() =>
    currentFolderId ? folders.find(f => f.id === currentFolderId) : null,
    [currentFolderId, folders]
  );

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const handleSelectBundle = (bundle: CorporateBundle) => {
    navigate("/calculator", { state: { bundleConfig: bundle.config } });
  };
  
  const handleSelectTemplate = (template: PersonalTemplate) => {
    navigate("/calculator", { state: { templateConfig: template.config } });
  };

  // Folder Actions
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim());
    toast({ title: "Ordner erstellt", description: `"${newFolderName}" wurde erstellt.` });
    setNewFolderName("");
    setNewFolderDialogOpen(false);
    refresh();
  };
  
  const handleRenameFolder = () => {
    if (!folderToRename || !newFolderName.trim()) return;
    renameFolder(folderToRename.id, newFolderName.trim());
    toast({ title: "Ordner umbenannt", description: `Ordner wurde in "${newFolderName}" umbenannt.` });
    setNewFolderName("");
    setRenameFolderDialogOpen(false);
    setFolderToRename(null);
    refresh();
  };
  
  const handleDeleteFolder = (folder: TemplateFolder) => {
    deleteFolder(folder.id);
    toast({ title: "Ordner gelöscht", description: `"${folder.name}" wurde gelöscht.` });
    if (currentFolderId === folder.id) setCurrentFolderId(undefined);
    refresh();
  };
  
  const openRenameFolderDialog = (folder: TemplateFolder) => {
    setFolderToRename(folder);
    setNewFolderName(folder.name);
    setRenameFolderDialogOpen(true);
  };

  // Template Actions
  const handleDeleteTemplate = (template: PersonalTemplate) => {
    deleteTemplate(template.id);
    toast({ title: "Template gelöscht", description: `"${template.name}" wurde gelöscht.` });
    refresh();
  };
  
  const handleDuplicateTemplate = (template: PersonalTemplate) => {
    const duplicate = duplicateTemplate(template.id);
    if (duplicate) {
      toast({ title: "Template dupliziert", description: `"${duplicate.name}" wurde erstellt.` });
      refresh();
    }
  };
  
  const handleMoveTemplate = (template: PersonalTemplate, targetFolderId: string | undefined) => {
    moveTemplate(template.id, targetFolderId);
    const targetName = targetFolderId 
      ? folders.find(f => f.id === targetFolderId)?.name 
      : "Root";
    toast({ title: "Template verschoben", description: `Nach "${targetName}" verschoben.` });
    refresh();
  };

  return (
    <MainLayout>
      <div className="min-h-full bg-background">
        {/* Dark Ticker Bar */}
        <div className="bg-panel-dark text-panel-dark-foreground overflow-hidden">
          <div className="flex items-center">
            <div className="bg-primary px-3 py-1.5 flex items-center gap-1 shrink-0">
              <span className="text-xs font-bold text-primary-foreground">📢 SALES PUSH</span>
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
      
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 animate-fade-in">
          {/* Sub Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <button 
                onClick={() => navigate("/")}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-1 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                ZURÜCK ZUM START
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  Sales <span className="text-primary">Cockpit</span>
                </h1>
                <Badge variant="secondary" className="text-xs">v2.4.0</Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Suche..." 
                  className="pl-9 w-48 h-9 bg-muted/50 border-0"
                />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
              </Button>
              <div className="w-10 h-10 bg-panel-dark rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-panel-dark-foreground" />
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-6">
            {/* Left Column: Bundles */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Tabs */}
              <div className="flex items-center gap-8 border-b border-border">
                <button
                  onClick={() => setActiveTab("campaigns")}
                  className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "campaigns" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Zentrale Kampagnen
                </button>
                <button
                  onClick={() => setActiveTab("templates")}
                  className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "templates" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Meine Vorlagen
                </button>
              </div>

              {activeTab === "campaigns" && (
                <div className="space-y-6">
                  {/* Sector Switcher */}
                  <div className="flex w-full p-1 bg-muted/50 rounded-lg">
                    {(Object.keys(SECTOR_LABELS) as Sector[]).map((sector) => {
                      const Icon = SECTOR_ICON_MAP[sector];
                      const isActive = selectedSector === sector;
                      const labels: Record<Sector, string> = {
                        private: "Privat",
                        business: "Gewerbe",
                        enterprise: "Konzern",
                      };
                      return (
                        <button
                          key={sector}
                          onClick={() => setSelectedSector(sector)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                            isActive 
                              ? "bg-card shadow-sm text-foreground" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden sm:inline">{labels[sector]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Strategic Focus Box */}
                  <div className="p-4 border border-border rounded-xl bg-card">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground tracking-wide mb-1">
                          STRATEGISCHER FOKUS
                        </p>
                        <h3 className="font-semibold text-primary mb-1">{STRATEGIC_FOCUS.title}</h3>
                        <p className="text-sm text-muted-foreground">{STRATEGIC_FOCUS.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Deals Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                        Top Deals: {selectedSector === "business" ? "Gewerbe" : selectedSector === "enterprise" ? "Konzern" : "Privat"}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredBundles.slice(0, 2).map((bundle, idx) => (
                        <div
                          key={bundle.id}
                          onClick={() => handleSelectBundle(bundle)}
                          className="group cursor-pointer"
                        >
                          {/* Color bar on top */}
                          <div className={`h-1 rounded-t-xl ${idx === 0 ? "bg-amber-400" : "bg-primary"}`} />
                          
                          <Card className="rounded-t-none border-t-0 hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base font-semibold">
                                  {bundle.name}
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px] font-bold">
                                  {idx === 0 ? "PREISSIEGER" : "BESTSELLER"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {bundle.description}
                              </p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Hardware preview */}
                              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
                                  <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{bundle.config.hardware?.name || "SIM Only"}</p>
                                  <p className="text-xs text-muted-foreground">Hardware</p>
                                </div>
                              </div>
                              
                              {/* Tariff preview */}
                              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                                  <Signal className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {bundle.config.mobile?.tariffId?.replace("_", " ") || "Tarif"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Tarif</p>
                                </div>
                              </div>

                              <button className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 pt-2 transition-colors group-hover:text-primary">
                                Sofort übernehmen <ArrowRight className="w-4 h-4" />
                              </button>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "templates" && (
                <div className="space-y-6">
                  {/* Sector Switcher for templates */}
                  <div className="flex w-full p-1 bg-muted/50 rounded-lg">
                    {(["private", "business", "enterprise"] as Sector[]).map((sector) => {
                      const Icon = SECTOR_ICON_MAP[sector];
                      const labels: Record<Sector, string> = {
                        private: "Privat",
                        business: "Gewerbe",
                        enterprise: "Konzern",
                      };
                      return (
                        <button
                          key={sector}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden sm:inline">{labels[sector]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Folder Navigation */}
                  <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                      <HomeIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Root</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FolderInput className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FolderOpen className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => setNewFolderDialogOpen(true)}
                        className="h-8 gap-2 bg-primary text-primary-foreground"
                      >
                        <Plus className="w-4 h-4" />
                        Neues Bundle
                      </Button>
                    </div>
                  </div>

                  {/* Folders */}
                  {folders.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {folders.map((folder) => (
                        <Card 
                          key={folder.id}
                          className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                          onClick={() => setCurrentFolderId(folder.id)}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Folder className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{folder.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {getTemplatesInFolder(folder.id).length} Elemente
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(folder);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Templates */}
                  {currentTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentTemplates.map((template) => (
                        <Card 
                          key={template.id}
                          className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all"
                          onClick={() => handleSelectTemplate(template)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">
                              {template.name}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              Erstellt: {new Date(template.createdAt).toLocaleDateString("de-DE")}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <button className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors group-hover:text-primary">
                              Template laden <ArrowRight className="w-4 h-4" />
                            </button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : folders.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-4">Noch keine Templates erstellt</p>
                      <Button variant="outline" onClick={() => navigate("/calculator")} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Neues Template erstellen
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: News Feed */}
            <aside className="xl:w-80 shrink-0 space-y-6">
              {/* News Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold">Salesworld News</h3>
                  </div>
                  <button className="text-xs text-primary font-medium hover:underline">
                    Alle anzeigen
                  </button>
                </div>
                <div className="space-y-4">
                  {MOCK_NEWS.slice(0, 3).map((news) => (
                    <Card key={news.id} className="overflow-hidden">
                      <NewsItem {...news} />
                    </Card>
                  ))}
                </div>
              </div>

              {/* Quick Tools */}
              <Card className="bg-panel-dark text-panel-dark-foreground overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Quick Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-12 text-panel-dark-foreground hover:bg-panel-dark-foreground/10"
                  >
                    <FileText className="w-5 h-5" />
                    Provisions-Tabelle (PDF)
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-12 text-panel-dark-foreground hover:bg-panel-dark-foreground/10"
                  >
                    <Download className="w-5 h-5" />
                    Marketing-Material
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-12 text-panel-dark-foreground hover:bg-panel-dark-foreground/10"
                  >
                    <Calendar className="w-5 h-5" />
                    Schulungstermine
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>

        {/* Create Folder Dialog */}
        <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuer Ordner</DialogTitle>
              <DialogDescription>
                Erstelle einen neuen Ordner für deine Templates.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Ordnername"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Folder Dialog */}
        <Dialog open={renameFolderDialogOpen} onOpenChange={setRenameFolderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ordner umbenennen</DialogTitle>
              <DialogDescription>
                Gib einen neuen Namen für den Ordner ein.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Neuer Name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameFolderDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleRenameFolder} disabled={!newFolderName.trim()}>
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Bundles;