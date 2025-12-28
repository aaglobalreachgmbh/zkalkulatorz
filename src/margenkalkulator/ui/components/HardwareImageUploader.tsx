import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { useHardwareImages } from "../../hooks/useHardwareImages";
import {
  getStoredHardwareCatalog,
  businessCatalog2025_09,
  type HardwareItemRow,
} from "@/margenkalkulator";
import { cn } from "@/lib/utils";

/**
 * Component for uploading and managing hardware product images
 * - Grid view of all hardware devices with upload slots
 * - Drag & drop support for images
 * - Preview and delete functionality
 */
export function HardwareImageUploader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  
  const {
    imageMap,
    isLoading,
    uploadImage,
    isUploading,
    deleteImage,
    isDeleting,
  } = useHardwareImages();

  // Get hardware items from storage or default catalog
  const hardwareItems = useMemo((): HardwareItemRow[] => {
    const stored = getStoredHardwareCatalog();
    if (stored.length > 0) {
      return stored.filter(h => h.id !== "no_hardware" && h.active !== false);
    }
    return (businessCatalog2025_09.hardwareCatalog ?? [])
      .filter(h => h.id !== "no_hardware")
      .map(h => ({
        id: h.id,
        brand: h.brand,
        model: h.model,
        category: h.category,
        ek_net: h.ekNet,
        sort_order: h.sortOrder ?? 999,
        active: true,
      }));
  }, []);

  // Filter by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return hardwareItems;
    const q = searchQuery.toLowerCase();
    return hardwareItems.filter(
      h =>
        h.brand.toLowerCase().includes(q) ||
        h.model.toLowerCase().includes(q) ||
        h.id.toLowerCase().includes(q)
    );
  }, [hardwareItems, searchQuery]);

  // Group by brand
  const itemsByBrand = useMemo(() => {
    const grouped = new Map<string, HardwareItemRow[]>();
    filteredItems
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
      .forEach(item => {
        const brand = item.brand || "Sonstige";
        if (!grouped.has(brand)) grouped.set(brand, []);
        grouped.get(brand)!.push(item);
      });
    return grouped;
  }, [filteredItems]);

  // Stats
  const stats = useMemo(() => {
    const total = hardwareItems.length;
    const withImage = hardwareItems.filter(h => imageMap.has(h.id)).length;
    return { total, withImage, missing: total - withImage };
  }, [hardwareItems, imageMap]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (hardwareId: string, file: File) => {
      setUploadingId(hardwareId);
      try {
        await new Promise<void>((resolve, reject) => {
          uploadImage(
            { hardwareId, file },
            {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            }
          );
        });
      } finally {
        setUploadingId(null);
      }
    },
    [uploadImage]
  );

  // Handle file input change
  const handleInputChange = useCallback(
    (hardwareId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(hardwareId, file);
      }
      // Reset input
      e.target.value = "";
    },
    [handleFileUpload]
  );

  // Handle drag & drop
  const handleDrop = useCallback(
    (hardwareId: string) => (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleFileUpload(hardwareId, file);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Geräte gesamt</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.withImage}</p>
              <p className="text-xs text-muted-foreground">Mit Bild</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.missing}</p>
              <p className="text-xs text-muted-foreground">Ohne Bild</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Nach Gerät suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hardware Grid by Brand */}
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-6">
          {Array.from(itemsByBrand.entries()).map(([brand, items]) => (
            <div key={brand}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background/95 backdrop-blur py-1">
                {brand}
                <Badge variant="secondary" className="ml-2">
                  {items.filter(i => imageMap.has(i.id)).length}/{items.length}
                </Badge>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((item) => {
                  const hasImage = imageMap.has(item.id);
                  const imageUrl = imageMap.get(item.id);
                  const isCurrentlyUploading = uploadingId === item.id && isUploading;

                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        "relative group overflow-hidden transition-all",
                        hasImage
                          ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20"
                          : "border-dashed hover:border-primary/50"
                      )}
                      onDrop={handleDrop(item.id)}
                      onDragOver={handleDragOver}
                    >
                      <CardContent className="p-3">
                        {/* Image Area */}
                        <div className="aspect-square rounded-lg bg-muted/50 mb-2 relative overflow-hidden">
                          {hasImage && imageUrl ? (
                            <>
                              <img
                                src={imageUrl}
                                alt={item.model}
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />
                              {/* Delete overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteImage(item.id)}
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Entfernen
                                </Button>
                              </div>
                            </>
                          ) : isCurrentlyUploading ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="animate-pulse text-center">
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground animate-bounce" />
                                <p className="text-xs text-muted-foreground mt-2">Wird hochgeladen...</p>
                              </div>
                            </div>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground mt-2">
                                Bild hochladen
                              </span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleInputChange(item.id)}
                              />
                            </label>
                          )}
                        </div>

                        {/* Device Info */}
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium truncate" title={item.model}>
                            {item.model.replace(item.brand, "").trim() || item.model}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.id}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Geräte gefunden</p>
              <p className="text-sm">Versuche einen anderen Suchbegriff</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Help Text */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Hinweise</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>• Erlaubte Formate: JPEG, PNG, WebP (max. 1 MB)</p>
          <p>• Empfohlene Größe: 400x400 Pixel (quadratisch)</p>
          <p>• Bilder können per Drag & Drop auf die Karten gezogen werden</p>
          <p>• Die Bilder werden automatisch für alle Hardware-Komponenten verwendet</p>
        </CardContent>
      </Card>
    </div>
  );
}
