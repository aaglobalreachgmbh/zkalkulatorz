import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HardwareImage {
  id: string;
  hardware_id: string;
  image_url: string;
  thumbnail_url: string | null;
  uploaded_by: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

interface UploadImageParams {
  hardwareId: string;
  file: File;
}

/**
 * Hook for managing hardware images
 * - Loads all hardware images from database
 * - Uploads new images to Supabase Storage
 * - Deletes images
 */
export function useHardwareImages() {
  const queryClient = useQueryClient();

  // Query all hardware images
  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ["hardware-images"],
    queryFn: async (): Promise<HardwareImage[]> => {
      const { data, error } = await supabase
        .from("hardware_images")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ hardwareId, file }: UploadImageParams) => {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Nur JPEG, PNG oder WebP erlaubt");
      }

      // Validate file size (max 1MB)
      if (file.size > 1024 * 1024) {
        throw new Error("Maximale Dateigröße: 1 MB");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${hardwareId}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("hardware-images")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("hardware-images")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      // Upsert into hardware_images table
      const { error: dbError } = await supabase
        .from("hardware_images")
        .upsert({
          hardware_id: hardwareId,
          image_url: imageUrl,
          tenant_id: "tenant_default",
        }, {
          onConflict: "hardware_id",
        });

      if (dbError) throw dbError;

      return { hardwareId, imageUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardware-images"] });
      toast.success("Bild hochgeladen");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Upload fehlgeschlagen");
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (hardwareId: string) => {
      // Get the image record first
      const { data: imageRecord } = await supabase
        .from("hardware_images")
        .select("image_url")
        .eq("hardware_id", hardwareId)
        .maybeSingle();

      if (imageRecord?.image_url) {
        // Extract file path from URL
        const url = new URL(imageRecord.image_url);
        const pathParts = url.pathname.split("/");
        const filePath = pathParts.slice(pathParts.indexOf("hardware-images") + 1).join("/");

        if (filePath) {
          // Delete from storage
          await supabase.storage.from("hardware-images").remove([filePath]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from("hardware_images")
        .delete()
        .eq("hardware_id", hardwareId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardware-images"] });
      toast.success("Bild gelöscht");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Löschen fehlgeschlagen");
    },
  });

  // Helper to get image URL for a hardware ID
  const getImageUrl = (hardwareId: string): string | null => {
    const image = images.find(img => img.hardware_id === hardwareId);
    return image?.image_url || null;
  };

  // Map of hardware_id -> image_url for quick lookup
  const imageMap = new Map(images.map(img => [img.hardware_id, img.image_url]));

  return {
    images,
    imageMap,
    isLoading,
    error,
    getImageUrl,
    uploadImage: uploadMutation.mutate,
    uploadImageAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteImage: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
