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
import { useToast } from "@/hooks/use-toast";
import type { OfferOptionState } from "@/margenkalkulator/engine/types";
import {
  saveTemplate,
  loadFolders,
  type PersonalTemplate,
} from "@/margenkalkulator/storage/bundles";

interface SaveTemplateButtonProps {
  config: OfferOptionState;
}

export function SaveTemplateButton({ config }: SaveTemplateButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<string | undefined>(undefined);

  const folders = loadFolders();

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Name erforderlich",
        description: "Bitte gib einen Namen für das Template ein.",
        variant: "destructive",
      });
      return;
    }

    const template: PersonalTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      folderId: folderId === "none" ? undefined : folderId,
      config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTemplate(template);

    toast({
      title: "Template gespeichert",
      description: `"${name}" wurde erfolgreich gespeichert.`,
    });

    setOpen(false);
    setName("");
    setFolderId(undefined);
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
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
