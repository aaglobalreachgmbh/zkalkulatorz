/**
 * Zeigt Fotos eines Besuchsberichts in einem Grid an
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, X, ZoomIn } from "lucide-react";
import { useVisitPhotos, type VisitPhoto } from "@/hooks/useVisitPhotos";
import { useVisitReports } from "@/hooks/useVisitReports";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface VisitPhotoGridProps {
  reportId: string;
  editable?: boolean;
}

export function VisitPhotoGrid({ reportId, editable = true }: VisitPhotoGridProps) {
  const { useReport } = useVisitReports();
  const { data: report, isLoading } = useReport(reportId);
  const { deletePhoto, getSignedPhotoUrl } = useVisitPhotos();

  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<VisitPhoto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const photos = report?.photos || [];

  // Load signed URLs for photos
  useEffect(() => {
    const loadUrls = async () => {
      const urls: Record<string, string> = {};
      for (const photo of photos) {
        const url = await getSignedPhotoUrl(photo.storage_path);
        if (url) {
          urls[photo.id] = url;
        }
      }
      setPhotoUrls(urls);
    };

    if (photos.length > 0) {
      loadUrls();
    }
  }, [photos]);

  const handleDelete = async (photo: VisitPhoto) => {
    if (!confirm("Foto wirklich löschen?")) return;

    setDeletingId(photo.id);
    try {
      await deletePhoto.mutateAsync({
        photoId: photo.id,
        storagePath: photo.storage_path,
        visitReportId: reportId,
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Keine Fotos vorhanden
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square group">
            {photoUrls[photo.id] ? (
              <img
                src={photoUrls[photo.id]}
                alt={photo.caption || "Besuchsfoto"}
                className="w-full h-full object-cover rounded-lg cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedPhoto(photo)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              {editable && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(photo)}
                  disabled={deletingId === photo.id}
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Caption */}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg truncate">
                {photo.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {selectedPhoto?.caption || "Besuchsfoto"}
          </DialogTitle>
          {selectedPhoto && photoUrls[selectedPhoto.id] && (
            <div className="relative">
              <img
                src={photoUrls[selectedPhoto.id]}
                alt={selectedPhoto.caption || "Besuchsfoto"}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              {selectedPhoto.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3">
                  {selectedPhoto.caption}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
