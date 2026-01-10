/**
 * Admin News Management Page
 * 
 * Allows admins to create, edit, and manage news items and promo bundles
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Newspaper,
  Gift,
  Trash2,
  Edit,
  Pin,
  Eye,
  EyeOff,
} from "lucide-react";

import { useNews, NEWS_TYPE_CONFIG, type NewsType, type NewsItem } from "@/margenkalkulator/hooks/useNews";
import { NewsCard } from "@/margenkalkulator/ui/components/NewsCard";

// ============================================
// Create/Edit News Dialog
// ============================================

interface NewsDialogProps {
  news?: NewsItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    title: string;
    description?: string;
    content?: string;
    type: NewsType;
    is_pinned: boolean;
    valid_from?: string;
    valid_until?: string;
  }) => void;
  isSaving: boolean;
}

function NewsDialog({ news, open, onOpenChange, onSave, isSaving }: NewsDialogProps) {
  const [title, setTitle] = useState(news?.title || "");
  const [description, setDescription] = useState(news?.description || "");
  const [content, setContent] = useState(news?.content || "");
  const [type, setType] = useState<NewsType>(news?.type || "info");
  const [isPinned, setIsPinned] = useState(news?.is_pinned || false);
  const [validFrom, setValidFrom] = useState(news?.valid_from || "");
  const [validUntil, setValidUntil] = useState(news?.valid_until || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description: description || undefined,
      content: content || undefined,
      type,
      is_pinned: isPinned,
      valid_from: validFrom || undefined,
      valid_until: validUntil || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{news ? "News bearbeiten" : "Neue News erstellen"}</DialogTitle>
          <DialogDescription>
            {news ? "Änderungen werden sofort sichtbar." : "Die News wird sofort für alle Mitarbeiter sichtbar."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Neue Provisions-Aktion"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Kurzbeschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wird in der Übersicht angezeigt..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Ausführlicher Inhalt (optional)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detaillierte Informationen..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Typ</Label>
              <Select value={type} onValueChange={(v) => setType(v as NewsType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NEWS_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className={config.color}>{config.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex items-end">
              <div className="flex items-center gap-2 h-10">
                <Switch
                  id="pinned"
                  checked={isPinned}
                  onCheckedChange={setIsPinned}
                />
                <Label htmlFor="pinned" className="flex items-center gap-1">
                  <Pin className="h-3.5 w-3.5" />
                  Anpinnen
                </Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Gültig ab</Label>
              <Input
                id="validFrom"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Gültig bis</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSaving || !title.trim()}>
              {isSaving ? "Speichere..." : news ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Main Component
// ============================================

export default function AdminNews() {
  const [activeTab, setActiveTab] = useState<string>("news");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | undefined>();

  const {
    news,
    isLoading,
    createNews,
    createNewsAsync,
    isCreating,
    updateNews,
    isUpdating,
    deleteNews,
    isDeleting,
    togglePinned,
  } = useNews({ includeExpired: true });

  const handleCreateNews = async (data: Parameters<typeof createNewsAsync>[0]) => {
    try {
      await createNewsAsync(data);
      setDialogOpen(false);
      setEditingNews(undefined);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleEditNews = (newsItem: NewsItem) => {
    setEditingNews(newsItem);
    setDialogOpen(true);
  };

  const handleDeleteNews = (id: string) => {
    if (window.confirm("Möchtest du diese News wirklich löschen?")) {
      deleteNews(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingNews(undefined);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-full">
        {/* Header */}
        <div className="py-4 mb-6">
          <Link
            to="/admin"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="h-3 w-3" />
            ZURÜCK ZUR ADMIN-ÜBERSICHT
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Newspaper className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">News verwalten</h1>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Neue News
            </Button>
          </div>
          <p className="text-muted-foreground mt-1">
            Erstelle und verwalte News für alle Mitarbeiter
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="news" className="gap-2">
              <Newspaper className="h-4 w-4" />
              News-Einträge
            </TabsTrigger>
            <TabsTrigger value="promos" className="gap-2">
              <Gift className="h-4 w-4" />
              Aktionspakete
            </TabsTrigger>
          </TabsList>

          {/* News Tab */}
          <TabsContent value="news" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Lade News...
              </div>
            ) : news.length > 0 ? (
              <div className="space-y-3">
                {news.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 bg-background border rounded-lg"
                  >
                    <div className="flex-1">
                      <NewsCard news={item} compact />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePinned(item.id, !item.is_pinned)}
                        className={item.is_pinned ? "text-primary" : "text-muted-foreground"}
                      >
                        <Pin className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditNews(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNews(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/20 rounded-xl">
                <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-2">Noch keine News erstellt</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Erstelle deine erste News für das Team
                </p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Erste News erstellen
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Promo Bundles Tab */}
          <TabsContent value="promos" className="mt-6">
            <div className="text-center py-16 bg-muted/20 rounded-xl">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">Aktionspakete verwalten</p>
              <p className="text-sm text-muted-foreground mb-4">
                Aktionspakete können in der Paket-Verwaltung erstellt und als Promo markiert werden
              </p>
              <Button variant="outline" asChild>
                <Link to="/bundles">Zur Paket-Verwaltung</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <NewsDialog
          news={editingNews}
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          onSave={handleCreateNews}
          isSaving={isCreating || isUpdating}
        />
      </div>
    </MainLayout>
  );
}
