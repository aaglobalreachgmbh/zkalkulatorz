// ============================================
// Logo Upload Component for Tenant Branding
// ============================================

import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  currentLogoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

export function LogoUpload({ currentLogoUrl, onLogoChange, disabled }: LogoUploadProps) {
  const { identity } = useIdentity();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Nur PNG, JPG oder SVG Dateien sind erlaubt";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Datei ist zu groß (max. 2MB)";
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
      const fileName = `${identity.tenantId}/logo-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (currentLogoUrl) {
        const oldPath = currentLogoUrl.split("/tenant-logos/")[1];
        if (oldPath) {
          await supabase.storage.from("tenant-logos").remove([oldPath]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from("tenant-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("tenant-logos")
        .getPublicUrl(fileName);

      onLogoChange(urlData.publicUrl);
      toast.success("Logo hochgeladen");
    } catch (err) {
      console.error("[LogoUpload] Upload error:", err);
      toast.error("Fehler beim Hochladen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [currentLogoUrl, identity.tenantId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const deleteLogo = async () => {
    if (!currentLogoUrl) return;

    setIsUploading(true);
    try {
      const path = currentLogoUrl.split("/tenant-logos/")[1];
      if (path) {
        await supabase.storage.from("tenant-logos").remove([path]);
      }
      onLogoChange(null);
      toast.success("Logo entfernt");
    } catch (err) {
      console.error("[LogoUpload] Delete error:", err);
      toast.error("Fehler beim Löschen");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Firmenlogo</label>
      
      {currentLogoUrl ? (
        <Card className="p-4 flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            <img 
              src={currentLogoUrl} 
              alt="Logo" 
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Logo hochgeladen</p>
            <p className="text-xs text-muted-foreground">Klicke auf Löschen zum Entfernen</p>
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={deleteLogo}
            disabled={disabled || isUploading}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </Button>
        </Card>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Logo hochladen</p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG oder SVG • Max. 2MB
                </p>
              </div>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileSelect}
                disabled={disabled}
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  disabled={disabled}
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Datei auswählen
                  </span>
                </Button>
              </label>
            </>
          )}
        </div>
      )}
    </div>
  );
}
