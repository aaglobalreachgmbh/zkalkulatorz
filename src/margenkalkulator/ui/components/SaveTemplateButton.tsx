import { useState } from "react";
import { FileText, FolderOpen, Save } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { OfferOptionState } from "@/margenkalkulator/engine/types";
import { useTemplates } from "@/margenkalkulator/hooks/useTemplates";

interface SaveTemplateButtonProps {
  config: OfferOptionState;
}

export function SaveTemplateButton({ config }: SaveTemplateButtonProps) {
  
  const { folders, createTemplate, isCreatingTemplate } = useTemplates();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<string | undefined>(undefined);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name erforderlich", { description: "Bitte gib einen Namen für das Template ein." });
      return;
    }

    try {
      await createTemplate(name.trim(), config, folderId === "none" ? undefined : folderId);
      toast.success("Template gespeichert", { description: `"${name}" wurde erfolgreich gespeichert.` });
      setOpen(false);
      setName("");
      setFolderId(undefined);
    } catch {
      toast.error("Fehler", { description: "Template konnte nicht gespeichert werden." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Als Template</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Als Template speichern</DialogTitle>
          <DialogDescription>
            Speichere die aktuelle Konfiguration als wiederverwendbares Template.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template-Name</Label>
            <Input
              id="template-name"
              placeholder="z.B. Mein Standard-Angebot"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="folder-select">Ordner (optional)</Label>
            <Select value={folderId || "none"} onValueChange={(v) => setFolderId(v === "none" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Kein Ordner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Kein Ordner
                  </span>
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <span className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      {folder.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isCreatingTemplate} className="gap-2">
            <Save className="h-4 w-4" />
            {isCreatingTemplate ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
