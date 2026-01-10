/**
 * Hook für Besuchsfotos
 * 
 * Verwaltet Foto-Uploads für Besuchsberichte.
 * Unterstützt Offline-Speicherung als Base64.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { offlineStorage } from "@/lib/offlineStorage";
import { toast } from "sonner";

export interface VisitPhoto {
  id: string;
  visit_report_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export interface UploadPhotoInput {
  visitReportId: string;
  file: File;
  caption?: string;
}

export interface PendingPhoto {
  id: string;
  visitId: string;
  base64: string;
  caption?: string;
  createdAt: string;
}

export function useVisitPhotos() {
  const queryClient = useQueryClient();
  const { identity } = useIdentity();
  const { userId } = identity;
  const { isOnline } = useNetworkStatus();

  // Foto hochladen
  const uploadPhoto = useMutation({
    mutationFn: async ({ visitReportId, file, caption }: UploadPhotoInput) => {
      if (!userId) throw new Error("Nicht authentifiziert");

      // Offline: Als Base64 speichern
      if (!isOnline) {
        const base64 = await fileToBase64(file);
        await offlineStorage.addPendingPhoto(visitReportId, base64, caption);
        return { offline: true, id: crypto.randomUUID() };
      }

      // Online: In Storage hochladen
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${userId}/${visitReportId}/${crypto.randomUUID()}.${fileExt}`;

      // 1. Datei in Storage hochladen
      const { error: uploadError } = await supabase.storage
        .from("visit-photos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Eintrag in visit_photos erstellen
      const { data, error: dbError } = await supabase
        .from("visit_photos")
        .insert({
          visit_report_id: visitReportId,
          storage_path: fileName,
          caption: caption || null,
        })
        .select("id")
        .single();

      if (dbError) {
        // Rollback: Datei löschen wenn DB-Insert fehlschlägt
        await supabase.storage.from("visit-photos").remove([fileName]);
        throw dbError;
      }

      return { offline: false, id: data.id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["visit-report", variables.visitReportId] 
      });
      toast.success("Foto hochgeladen");
    },
    onError: (error) => {
      console.error("[useVisitPhotos] Upload error:", error);
      toast.error("Fehler beim Hochladen des Fotos");
    },
  });

  // Foto löschen
  const deletePhoto = useMutation({
    mutationFn: async ({ 
      photoId, 
      storagePath,
      visitReportId,
    }: { 
      photoId: string; 
      storagePath: string;
      visitReportId: string;
    }) => {
      // 1. Aus Storage löschen
      const { error: storageError } = await supabase.storage
        .from("visit-photos")
        .remove([storagePath]);

      if (storageError) {
        console.warn("[useVisitPhotos] Storage delete failed:", storageError);
      }

      // 2. Aus DB löschen
      const { error: dbError } = await supabase
        .from("visit_photos")
        .delete()
        .eq("id", photoId);

      if (dbError) throw dbError;

      return visitReportId;
    },
    onSuccess: (visitReportId) => {
      queryClient.invalidateQueries({ queryKey: ["visit-report", visitReportId] });
      toast.success("Foto gelöscht");
    },
    onError: (error) => {
      console.error("[useVisitPhotos] Delete error:", error);
      toast.error("Fehler beim Löschen des Fotos");
    },
  });

  // Foto-URL abrufen
  const getPhotoUrl = (storagePath: string): string => {
    const { data } = supabase.storage
      .from("visit-photos")
      .getPublicUrl(storagePath);

    return data.publicUrl;
  };

  // Signed URL für private Bilder
  const getSignedPhotoUrl = async (storagePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("visit-photos")
      .createSignedUrl(storagePath, 3600); // 1 Stunde gültig

    if (error) {
      console.error("[useVisitPhotos] Signed URL error:", error);
      return null;
    }

    return data.signedUrl;
  };

  // Kamera-Capture (für Mobile)
  const captureFromCamera = async (): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment"; // Rückkamera bevorzugen

      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0] || null;
        resolve(file);
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  };

  // Bild aus Galerie auswählen
  const selectFromGallery = async (): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = false;

      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0] || null;
        resolve(file);
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  };

  return {
    uploadPhoto,
    deletePhoto,
    getPhotoUrl,
    getSignedPhotoUrl,
    captureFromCamera,
    selectFromGallery,
    isOnline,
  };
}

// Helper: File zu Base64 konvertieren
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
