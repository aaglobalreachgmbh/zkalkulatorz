import { useState } from "react";
import { Package, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { OfferOptionState } from "@/margenkalkulator/engine/types";
import { useCorporateBundles, SECTOR_LABELS, type Sector } from "@/margenkalkulator/hooks/useCorporateBundles";

interface SaveBundleButtonProps {
  config: OfferOptionState;
}

export function SaveBundleButton({ config }: SaveBundleButtonProps) {
  
  const { createBundleAsync, isCreating } = useCorporateBundles();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sector, setSector] = useState<Sector>("business");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name erforderlich", { description: "Bitte gib einen Namen für das Paket ein." });
      return;
    }

    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await createBundleAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        sector,
        tags: tagArray,
        featured,
        config,
      });

      toast.success("Paket gespeichert", { description: `"${name}" wurde erfolgreich als Paket angelegt.` });
      setOpen(false);
      resetForm();
    } catch {
      toast.error("Fehler", { description: "Paket konnte nicht gespeichert werden." });
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSector("business");
    setTags("");
    setFeatured(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Als Paket</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Als Paket speichern</DialogTitle>
          <DialogDescription>
            Speichere die aktuelle Konfiguration als wiederverwendbares Paket für dein Team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="bundle-name">Paket-Name *</Label>
            <Input
              id="bundle-name"
              placeholder="z.B. Starter-Paket GK"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Sector */}
          <div className="space-y-2">
            <Label htmlFor="sector-select">Kundensegment</Label>
            <Select value={sector} onValueChange={(v) => setSector(v as Sector)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SECTOR_LABELS) as Sector[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SECTOR_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="bundle-description">Beschreibung (optional)</Label>
            <Textarea
              id="bundle-description"
              placeholder="Kurze Beschreibung des Pakets..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="bundle-tags">Tags (optional, kommagetrennt)</Label>
            <Input
              id="bundle-tags"
              placeholder="z.B. Premium, Team, KMU"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* Featured */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="featured-toggle">Als Featured markieren</Label>
              <p className="text-xs text-muted-foreground">
                Wird prominent auf der Bundles-Seite angezeigt
              </p>
            </div>
            <Switch
              id="featured-toggle"
              checked={featured}
              onCheckedChange={setFeatured}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isCreating} className="gap-2">
            <Save className="h-4 w-4" />
            {isCreating ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
