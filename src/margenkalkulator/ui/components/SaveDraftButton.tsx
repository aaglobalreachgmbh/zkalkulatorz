// ============================================
// Save Draft Button Component
// ============================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Save } from "lucide-react";
import type { OfferOptionState } from "../../engine/types";
import { useDrafts } from "../../hooks/useDrafts";
import { useToast } from "@/hooks/use-toast";

interface SaveDraftButtonProps {
  config: OfferOptionState;
  avgMonthly: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export function SaveDraftButton({
  config,
  avgMonthly,
  variant = "outline",
  size = "sm",
}: SaveDraftButtonProps) {
  const { toast } = useToast();
  const { createDraft, isCreating } = useDrafts();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  
  // Generate default name
  const defaultName = () => {
    const parts: string[] = [];
    if (config.hardware.name && config.hardware.ekNet > 0) {
      parts.push(config.hardware.name);
    }
    if (config.mobile.tariffId) {
      parts.push(config.mobile.tariffId.replace(/_/g, " "));
    }
    return parts.join(" + ") || `Entwurf ${new Date().toLocaleDateString("de-DE")}`;
  };
  
  const handleSave = async () => {
    if (!name.trim()) return;
    
    try {
      await createDraft(name.trim(), config, avgMonthly);
      toast({
        title: "Entwurf gespeichert",
        description: `"${name.trim()}" wurde gespeichert.`,
      });
      setOpen(false);
      setName("");
    } catch {
      toast({
        title: "Fehler",
        description: "Speichern fehlgeschlagen.",
        variant: "destructive",
      });
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setName(defaultName());
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Speichern</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entwurf speichern</DialogTitle>
          <DialogDescription>
            Speichern Sie dieses Angebot als Entwurf zum späteren Laden.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Name des Entwurfs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isCreating}>
            {isCreating ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
