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
  ChevronLeft
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
import { TICKER_ITEMS, MOCK_NEWS, NEWS_TYPE_CONFIG, type NewsItem as NewsItemType } from "@/margenkalkulator/data/news";

const SECTOR_ICON_MAP = {
  private: User,
  business: Building2,
  enterprise: Building,
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
      {/* News Ticker */}
      <div className="bg-primary text-primary-foreground overflow-hidden whitespace-nowrap">
        <div className="animate-marquee inline-block py-2 text-sm font-medium">
          {TICKER_ITEMS.map((item, i) => (
            <span key={i} className="mx-8">{item}</span>
          ))}
          {/* Duplicate for seamless loop */}
          {TICKER_ITEMS.map((item, i) => (
            <span key={`dup-${i}`} className="mx-8">{item}</span>
          ))}
        </div>
      </div>
      
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header with Gradient */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-soft">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Bundle Selector
            </h1>
          </div>
          <p className="text-muted-foreground ml-13">
            Wähle vorkonfigurierte Angebote oder nutze deine persönlichen Templates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Bundles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "campaigns" | "templates")}>
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50">
                <TabsTrigger value="campaigns" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Package className="h-4 w-4" />
                  Corporate Campaigns
                </TabsTrigger>
                <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="h-4 w-4" />
                  Meine Templates
                </TabsTrigger>
              </TabsList>

              {/* Campaigns Tab */}
              <TabsContent value="campaigns" className="mt-6 space-y-6">
                {/* Sector Switcher - Enhanced Design */}
                <div className="p-4 bg-card rounded-xl border border-border shadow-soft">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">Zielgruppe</span>
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
                          className={`gap-2 transition-all ${isActive ? "shadow-md" : "hover:bg-muted"}`}
                        >
                          <Icon className="h-4 w-4" />
                          {SECTOR_LABELS[sector]}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Bundles Grid - Enhanced Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBundles.map((bundle) => (
                    <Card 
                      key={bundle.id}
                      className="group cursor-pointer hover:shadow-elevated hover:border-primary/30 transition-all duration-300 hover:scale-[1.01] overflow-hidden relative"
                      onClick={() => handleSelectBundle(bundle)}
                    >
                      {/* Featured indicator */}
                      {bundle.featured && (
                        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                          <div className="absolute top-2 right-[-20px] bg-gradient-to-r from-amber-500 to-amber-400 text-white text-xs font-bold px-6 py-0.5 transform rotate-45 shadow-sm">
                            TOP
                          </div>
                        </div>
                      )}
                      
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
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="text-xs bg-gradient-to-r from-secondary to-secondary/80"
                            >
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
                  <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Bundles für diesen Sektor verfügbar</p>
                  </div>
                )}
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates" className="mt-6 space-y-6">
                {/* Folder Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentFolderId && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCurrentFolderId(undefined)}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Zurück
                      </Button>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {currentFolder ? currentFolder.name : "Alle Templates"}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setNewFolderDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Neuer Ordner
                  </Button>
                </div>

                {/* Folders (only show at root) */}
                {!currentFolderId && folders.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Ordner</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {folders.map((folder) => (
                        <Card 
                          key={folder.id}
                          className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div 
                              className="flex items-center gap-3 flex-1 min-w-0"
                              onClick={() => setCurrentFolderId(folder.id)}
                            >
                              <FolderOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium truncate">{folder.name}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openRenameFolderDialog(folder)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Umbenennen
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteFolder(folder)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Templates */}
                {currentTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentTemplates.map((template) => (
                      <Card 
                        key={template.id}
                        className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1" onClick={() => handleSelectTemplate(template)}>
                              <CardTitle className="text-base font-semibold">
                                {template.name}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                Erstellt: {new Date(template.createdAt).toLocaleDateString("de-DE")}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplizieren
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <FolderInput className="h-4 w-4 mr-2" />
                                    Verschieben
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuItem 
                                      onClick={() => handleMoveTemplate(template, undefined)}
                                      disabled={!template.folderId}
                                    >
                                      <Folder className="h-4 w-4 mr-2" />
                                      Root
                                    </DropdownMenuItem>
                                    {folders.map((folder) => (
                                      <DropdownMenuItem 
                                        key={folder.id}
                                        onClick={() => handleMoveTemplate(template, folder.id)}
                                        disabled={template.folderId === folder.id}
                                      >
                                        <FolderOpen className="h-4 w-4 mr-2" />
                                        {folder.name}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteTemplate(template)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0" onClick={() => handleSelectTemplate(template)}>
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
                    <p className="mb-4">
                      {currentFolderId ? "Keine Templates in diesem Ordner" : "Noch keine Templates erstellt"}
                    </p>
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
                {MOCK_NEWS.map((news) => (
                  <NewsItem key={news.id} {...news} />
                ))}
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
    </MainLayout>
  );
};

// News Item Component
const NewsItem = ({ title, description, date, type }: NewsItemType) => {
  const config = NEWS_TYPE_CONFIG[type];

  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <Badge variant="secondary" className={`text-xs ${config.color}`}>
          {config.label}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{description}</p>
      <span className="text-xs text-muted-foreground/70">{date}</span>
    </div>
  );
};

export default Bundles;
