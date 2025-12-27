// ============================================
// Draft Manager Component
// Load & Delete Saved Drafts
// ============================================

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderOpen, Trash2, Clock, Smartphone, Signal, Loader2 } from "lucide-react";
import type { OfferOptionState } from "../../engine/types";
import { useDrafts } from "../../hooks/useDrafts";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface DraftManagerProps {
  onLoadDraft: (config: OfferOptionState) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export function DraftManager({
  onLoadDraft,
  variant = "outline",
  size = "sm",
}: DraftManagerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { drafts, isLoading, deleteDraft, isDeleting } = useDrafts();
  
  const handleLoad = (draft: { name: string; config: OfferOptionState }) => {
    onLoadDraft(draft.config);
    toast({
      title: "Entwurf geladen",
      description: `"${draft.name}" wurde wiederhergestellt.`,
    });
    setOpen(false);
  };
  
  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteDraft(id);
      toast({
        title: "Entwurf gelöscht",
        description: `"${name}" wurde entfernt.`,
      });
    } catch {
      // Error handled by hook
    }
  };
  
  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Laden</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gespeicherte Entwürfe</DialogTitle>
          <DialogDescription>
            Wählen Sie einen Entwurf zum Laden aus.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Laden...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Keine gespeicherten Entwürfe</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <button
                    onClick={() => handleLoad(draft)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium text-foreground">{draft.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        {draft.preview.hardware}
                      </span>
                      <span className="flex items-center gap-1">
                        <Signal className="w-3 h-3" />
                        {draft.preview.tariff}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(draft.updatedAt)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-primary">
                      {draft.preview.avgMonthly.toFixed(2)} € /mtl.
                      {draft.preview.quantity > 1 && (
                        <span className="text-muted-foreground"> (×{draft.preview.quantity})</span>
                      )}
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(draft.id, draft.name);
                    }}
                    disabled={isDeleting}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
