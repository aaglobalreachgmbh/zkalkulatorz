// ============================================
// Custom Page Editor Component
// Modal for creating/editing custom PDF pages
// ============================================

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { FileText, Image, FileCheck, Plus, Upload, X } from "lucide-react";
import type { CustomPageConfig } from "../../pdf/templates/types";

type PageType = CustomPageConfig["type"];
type PagePosition = CustomPageConfig["position"];

interface PageTypeOption {
  type: PageType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PAGE_TYPES: PageTypeOption[] = [
  {
    type: "text",
    label: "Text",
    description: "Freitext mit Überschrift",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    type: "image",
    label: "Bild",
    description: "Vollbild-Grafik",
    icon: <Image className="w-5 h-5" />,
  },
  {
    type: "attachment",
    label: "Anhang",
    description: "AGB, Datenschutz, etc.",
    icon: <FileCheck className="w-5 h-5" />,
  },
];

interface PositionOption {
  value: PagePosition;
  label: string;
}

const POSITIONS: PositionOption[] = [
  { value: "before-summary", label: "Vor der Zusammenfassung" },
  { value: "after-summary", label: "Nach der Zusammenfassung" },
  { value: "before-contact", label: "Vor der Kontaktseite" },
  { value: "after-contact", label: "Nach der Kontaktseite" },
];

interface CustomPageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (page: CustomPageConfig) => void;
  editingPage?: CustomPageConfig | null;
}

export function CustomPageEditor({
  open,
  onOpenChange,
  onSave,
  editingPage,
}: CustomPageEditorProps) {
  const [pageType, setPageType] = useState<PageType>(editingPage?.type || "text");
  const [title, setTitle] = useState(editingPage?.title || "");
  const [content, setContent] = useState(editingPage?.content || "");
  const [imageUrl, setImageUrl] = useState(editingPage?.imageUrl || "");
  const [position, setPosition] = useState<PagePosition>(editingPage?.position || "after-contact");
  const [imagePreview, setImagePreview] = useState<string | null>(editingPage?.imageUrl || null);

  // Reset form when dialog opens
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen && !editingPage) {
      setPageType("text");
      setTitle("");
      setContent("");
      setImageUrl("");
      setPosition("after-contact");
      setImagePreview(null);
    } else if (newOpen && editingPage) {
      setPageType(editingPage.type);
      setTitle(editingPage.title);
      setContent(editingPage.content || "");
      setImageUrl(editingPage.imageUrl || "");
      setPosition(editingPage.position);
      setImagePreview(editingPage.imageUrl || null);
    }
    onOpenChange(newOpen);
  }, [editingPage, onOpenChange]);

  // Handle image file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageUrl(dataUrl);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Handle save
  const handleSave = () => {
    const newPage: CustomPageConfig = {
      id: editingPage?.id || `custom-${Date.now()}`,
      type: pageType,
      title: title.trim(),
      content: pageType === "text" ? content : undefined,
      imageUrl: pageType === "image" ? imageUrl : undefined,
      position,
    };

    onSave(newPage);
    onOpenChange(false);
  };

  // Validate form
  const isValid = () => {
    if (!title.trim()) return false;
    if (pageType === "text" && !content.trim()) return false;
    if (pageType === "image" && !imageUrl) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {editingPage ? "Seite bearbeiten" : "Eigene Seite hinzufügen"}
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie eine individuelle Seite für Ihr PDF-Angebot.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Page Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Seitentyp</Label>
            <div className="grid grid-cols-3 gap-2">
              {PAGE_TYPES.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setPageType(option.type)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                    "hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20",
                    pageType === option.type
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-md",
                    pageType === option.type ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {option.icon}
                  </div>
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="page-title" className="text-sm font-medium">
              Titel {pageType !== "image" && <span className="text-muted-foreground">(wird als Überschrift angezeigt)</span>}
            </Label>
            <Input
              id="page-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                pageType === "text" 
                  ? "z.B. Allgemeine Geschäftsbedingungen"
                  : pageType === "image"
                    ? "z.B. Firmenlogo-Seite"
                    : "z.B. Datenschutzhinweise"
              }
            />
          </div>

          {/* Content based on type */}
          {pageType === "text" && (
            <div className="space-y-2">
              <Label htmlFor="page-content" className="text-sm font-medium">
                Inhalt
              </Label>
              <Textarea
                id="page-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Geben Sie hier den Text ein..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Unterstützt Absätze. Doppelter Zeilenumbruch für neuen Absatz.
              </p>
            </div>
          )}

          {pageType === "image" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Bild</Label>
              
              {imagePreview ? (
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-40 object-contain rounded-lg border bg-muted/50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl("");
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/30 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Bild auswählen oder hierher ziehen
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    PNG, JPG bis 5 MB
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {pageType === "attachment" && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground">
                Anhang-Seiten werden mit dem angegebenen Titel und einem Platzhaltertext generiert. 
                Für vollständige Dokumente empfehlen wir den "Text"-Typ.
              </p>
            </div>
          )}

          {/* Position Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Position im PDF</Label>
            <RadioGroup value={position} onValueChange={(v) => setPosition(v as PagePosition)}>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map((pos) => (
                  <div
                    key={pos.value}
                    className={cn(
                      "flex items-center space-x-2 p-2.5 rounded-lg border cursor-pointer transition-colors",
                      position === pos.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                    onClick={() => setPosition(pos.value)}
                  >
                    <RadioGroupItem value={pos.value} id={pos.value} />
                    <Label htmlFor={pos.value} className="text-xs cursor-pointer flex-1">
                      {pos.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={!isValid()} className="gap-2">
            <Plus className="w-4 h-4" />
            {editingPage ? "Speichern" : "Seite hinzufügen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
