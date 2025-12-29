// ============================================
// Wizard Restore Dialog - Phase 5 Offline-Sync
// ============================================

import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
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
import { RotateCcw, Trash2 } from "lucide-react";

interface WizardRestoreDialogProps {
  open: boolean;
  savedAt: Date | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export function WizardRestoreDialog({
  open,
  savedAt,
  onRestore,
  onDiscard,
}: WizardRestoreDialogProps) {
  const timeAgo = savedAt
    ? formatDistanceToNow(savedAt, { addSuffix: true, locale: de })
    : "";

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            Entwurf gefunden
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Du hast einen ungespeicherten Entwurf von {timeAgo}.
            </p>
            <p className="text-muted-foreground">
              Möchtest du diesen Entwurf wiederherstellen oder verwerfen?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Verwerfen
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRestore} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Wiederherstellen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
