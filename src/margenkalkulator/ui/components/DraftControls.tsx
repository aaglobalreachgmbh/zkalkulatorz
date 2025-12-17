import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Save, RotateCcw, Clock, ChevronDown } from "lucide-react";

interface DraftControlsProps {
  hasDraft: boolean;
  lastSaved: Date | null;
  onLoadDraft: () => void;
  onResetDraft: () => void;
  autoSaveEnabled: boolean;
  onAutoSaveToggle: (enabled: boolean) => void;
}

export function DraftControls({
  hasDraft,
  lastSaved,
  onLoadDraft,
  onResetDraft,
  autoSaveEnabled,
  onAutoSaveToggle,
}: DraftControlsProps) {
  const [showResetDialog, setShowResetDialog] = useState(false);

  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "gerade eben";
    if (minutes === 1) return "vor 1 Minute";
    if (minutes < 60) return `vor ${minutes} Minuten`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "vor 1 Stunde";
    if (hours < 24) return `vor ${hours} Stunden`;

    return date.toLocaleDateString("de-DE");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Entwurf</span>
            {lastSaved && (
              <span className="text-xs text-muted-foreground hidden md:inline">
                ({formatLastSaved(lastSaved)})
              </span>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {autoSaveEnabled && lastSaved && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Gespeichert: {formatLastSaved(lastSaved)}
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onAutoSaveToggle(!autoSaveEnabled)}
          >
            {autoSaveEnabled ? "✓ " : ""}Auto-Speichern
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLoadDraft} disabled={!hasDraft}>
            Letzten Entwurf laden
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowResetDialog(true)}
            disabled={!hasDraft}
            className="text-destructive focus:text-destructive"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Entwurf zurücksetzen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Entwurf zurücksetzen?</AlertDialogTitle>
            <AlertDialogDescription>
              Alle gespeicherten Daten werden gelöscht. Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onResetDraft();
                setShowResetDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Zurücksetzen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
